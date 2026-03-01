const express = require("express");
const router = express.Router();
const pool = require("../db");

/* =====================================================
   GET /matches?tournamentId=&status=
   ===================================================== */
router.get("/", async (req, res) => {
  try {
    const tournamentId = req.query.tournamentId ? Number(req.query.tournamentId) : null;
    const status = req.query.status ? String(req.query.status) : null;

    const { rows } = await pool.query(
      `
      SELECT
        m.match_id,
        m.match_date,
        m.location,
        m.duration_minutes,
        m.tournament_id,
        m.home_team_id,
        m.away_team_id,
        m.status,

        th.name AS home_team,
        ta.name AS away_team,
        t.name AS tournament,

        -- Рахуємо голи через events
        COALESCE(SUM(CASE 
          WHEN e.type='goal' AND p.team_id = m.home_team_id THEN 1 
          ELSE 0 
        END),0)::int AS score_home,

        COALESCE(SUM(CASE 
          WHEN e.type='goal' AND p.team_id = m.away_team_id THEN 1 
          ELSE 0 
        END),0)::int AS score_away

      FROM matches m
      JOIN teams th ON th.team_id = m.home_team_id
      JOIN teams ta ON ta.team_id = m.away_team_id
      LEFT JOIN tournaments t ON t.tournament_id = m.tournament_id
      LEFT JOIN events e ON e.match_id = m.match_id
      LEFT JOIN players p ON p.player_id = e.player_id
      WHERE
        ($1::int IS NULL OR m.tournament_id = $1)
        AND ($2::text IS NULL OR m.status = $2)
      GROUP BY m.match_id, th.name, ta.name, t.name
      ORDER BY m.match_date DESC;
      `,
      [tournamentId, status]
    );

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* =====================================================
   GET /matches/:id
   ===================================================== */
router.get("/:id", async (req, res) => {
  try {
    const matchId = Number(req.params.id);

    const { rows } = await pool.query(
      `
      SELECT
        m.match_id,
        m.match_date,
        m.location,
        m.duration_minutes,
        m.tournament_id,
        m.home_team_id,
        m.away_team_id,
        m.status,

        th.name AS home_team,
        ta.name AS away_team,
        t.name AS tournament,

        COALESCE(SUM(CASE 
          WHEN e.type='goal' AND p.team_id = m.home_team_id THEN 1 
          ELSE 0 
        END),0)::int AS score_home,

        COALESCE(SUM(CASE 
          WHEN e.type='goal' AND p.team_id = m.away_team_id THEN 1 
          ELSE 0 
        END),0)::int AS score_away

      FROM matches m
      JOIN teams th ON th.team_id = m.home_team_id
      JOIN teams ta ON ta.team_id = m.away_team_id
      LEFT JOIN tournaments t ON t.tournament_id = m.tournament_id
      LEFT JOIN events e ON e.match_id = m.match_id
      LEFT JOIN players p ON p.player_id = e.player_id
      WHERE m.match_id = $1
      GROUP BY m.match_id, th.name, ta.name, t.name;
      `,
      [matchId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Match not found" });
    }

    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* =====================================================
   GET /matches/:id/events
   ===================================================== */
router.get("/:id/events", async (req, res) => {
  try {
    const matchId = Number(req.params.id);

    const { rows } = await pool.query(
      `
      SELECT
        e.event_id,
        e.minute,
        e.type,
        p.full_name,
        th.name AS team_name,
        p.player_id,
        p.team_id
      FROM events e
      JOIN players p ON p.player_id = e.player_id
      JOIN teams th ON th.team_id = p.team_id
      WHERE e.match_id = $1
      ORDER BY e.minute;
      `,
      [matchId]
    );

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* =====================================================
   POST /matches/:id/events
   ===================================================== */
router.post("/:id/events", async (req, res) => {
  try {
    const matchId = Number(req.params.id);
    const { player_id, minute, type } = req.body;

    const matchRes = await pool.query(
      `SELECT match_date, duration_minutes, home_team_id, away_team_id
       FROM matches
       WHERE match_id = $1`,
      [matchId]
    );

    if (matchRes.rows.length === 0) {
      return res.status(404).json({ error: "Match not found" });
    }

    const match = matchRes.rows[0];

    // перевірка часу
    const now = new Date();
    const start = new Date(match.match_date);
    const end = new Date(start.getTime() + match.duration_minutes * 60000);

    if (now < start) {
      return res.status(400).json({ error: "Match not started yet." });
    }
    if (now > end) {
      return res.status(400).json({ error: "Match already ended." });
    }

    // гравець має належати одній з команд
    const playerCheck = await pool.query(
      `
      SELECT 1
      FROM players
      WHERE player_id = $1
      AND team_id IN ($2, $3)
      `,
      [player_id, match.home_team_id, match.away_team_id]
    );

    if (playerCheck.rows.length === 0) {
      return res.status(400).json({ error: "Player does not belong to this match teams." });
    }

    const allowed = new Set(["goal", "assist", "yellow_card", "red_card"]);
    if (!allowed.has(type)) {
      return res.status(400).json({ error: "Invalid event type." });
    }

    const { rows } = await pool.query(
      `
      INSERT INTO events (match_id, player_id, minute, type)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
      `,
      [matchId, player_id, minute, type]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;