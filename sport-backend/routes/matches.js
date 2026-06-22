const express = require("express");
const router = express.Router();
const pool = require("../db");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");

const STATUS_CASE_SQL = `
  CASE
    WHEN NOW()::timestamp < m.match_date THEN 'scheduled'
    WHEN NOW()::timestamp < (m.match_date + (m.duration_minutes || ' minutes')::interval) THEN 'live'
    ELSE 'finished'
  END
`;

function scoreSql(teamSide) {
  const teamColumn = teamSide === "home" ? "home_team_id" : "away_team_id";
  const scoreColumn = teamSide === "home" ? "score_home" : "score_away";

  return `
    CASE
      WHEN b.status = 'scheduled' THEN NULL
      ELSE COALESCE(
        NULLIF(SUM(CASE WHEN e.type='goal' AND p.team_id=b.${teamColumn} THEN 1 ELSE 0 END), 0),
        b.${scoreColumn},
        0
      )::int
    END AS ${scoreColumn}
  `;
}

router.get("/", async (req, res) => {
  try {
    const tournamentId = req.query.tournamentId ? Number(req.query.tournamentId) : null;
    const status = req.query.status ? String(req.query.status) : null;
    const sportId = req.query.sportId ? Number(req.query.sportId) : null;
    const season = req.query.season ? Number(req.query.season) : null;
    const { rows } = await pool.query(
      `
      WITH base AS (
        SELECT
          m.match_id,
          m.match_date,
          m.season,
          m.location,
          m.duration_minutes,
          m.tournament_id,
          m.home_team_id,
          m.away_team_id,
          m.score_home,
          m.score_away,
          ${STATUS_CASE_SQL} AS status,

          th.name AS home_team,
          ta.name AS away_team,
          t.name AS tournament,
          t.sport_id
        FROM matches m
        JOIN teams th ON th.team_id = m.home_team_id
        JOIN teams ta ON ta.team_id = m.away_team_id
        LEFT JOIN tournaments t ON t.tournament_id = m.tournament_id
       WHERE
  ($1::int IS NULL OR m.tournament_id = $1)
  AND ($3::int IS NULL OR t.sport_id = $3)
  AND ($4::int IS NULL OR m.season = $4)
      )

      SELECT
        b.match_id,
        b.match_date,
        b.season,
        b.location,
        b.duration_minutes,
        b.tournament_id,
        b.home_team_id,
        b.away_team_id,
        b.status,
        b.home_team,
        b.away_team,
        b.tournament,
        b.sport_id,

        ${scoreSql("home")},
        ${scoreSql("away")}

      FROM base b
      LEFT JOIN events e ON e.match_id = b.match_id
      LEFT JOIN players p ON p.player_id = e.player_id
      WHERE
        ($2::text IS NULL OR b.status = $2)
      GROUP BY
        b.match_id,
        b.match_date,
        b.season,
        b.location,
        b.duration_minutes,
        b.tournament_id,
        b.home_team_id,
        b.away_team_id,
        b.score_home,
        b.score_away,
        b.status,
        b.home_team,
        b.away_team,
        b.tournament,
        b.sport_id
      ORDER BY b.match_date DESC;
      `,
      [tournamentId, status, sportId, season]
    );

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const matchId = Number(req.params.id);

    const { rows } = await pool.query(
      `
      SELECT
        m.match_id,
        m.match_date,
        m.season,
        m.location,
        m.duration_minutes,
        m.tournament_id,
        m.home_team_id,
        m.away_team_id,
        ${STATUS_CASE_SQL} AS status,

        th.name AS home_team,
        ta.name AS away_team,
        t.name AS tournament,
        t.sport_id,

        CASE
          WHEN ${STATUS_CASE_SQL} = 'scheduled' THEN NULL
          ELSE COALESCE(
            NULLIF(SUM(CASE WHEN e.type='goal' AND p.team_id = m.home_team_id THEN 1 ELSE 0 END), 0),
            m.score_home,
            0
          )::int
        END AS score_home,

        CASE
          WHEN ${STATUS_CASE_SQL} = 'scheduled' THEN NULL
          ELSE COALESCE(
            NULLIF(SUM(CASE WHEN e.type='goal' AND p.team_id = m.away_team_id THEN 1 ELSE 0 END), 0),
            m.score_away,
            0
          )::int
        END AS score_away

      FROM matches m
      JOIN teams th ON th.team_id = m.home_team_id
      JOIN teams ta ON ta.team_id = m.away_team_id
      LEFT JOIN tournaments t ON t.tournament_id = m.tournament_id
      LEFT JOIN events e ON e.match_id = m.match_id
      LEFT JOIN players p ON p.player_id = e.player_id
      WHERE m.match_id = $1
      GROUP BY
        m.match_id,
        m.match_date,
        m.season,
        m.location,
        m.duration_minutes,
        m.tournament_id,
        m.home_team_id,
        m.away_team_id,
        m.score_home,
        m.score_away,
        th.name,
        ta.name,
        t.name,
        t.sport_id;
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
        tm.name AS team_name,
        p.player_id,
        p.team_id
      FROM events e
      JOIN players p ON p.player_id = e.player_id
      JOIN teams tm ON tm.team_id = p.team_id
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

router.post("/:id/events", auth, admin, async (req, res) => {
  try {
    const matchId = Number(req.params.id);
    const { minute, type, team } = req.body || {};

    if (minute == null || !type || !team) {
      return res.status(400).json({
        error: "minute, type and team are required.",
      });
    }

    const allowed = new Set(["goal", "assist", "yellow_card", "red_card"]);

    if (!allowed.has(type)) {
      return res.status(400).json({ error: "Invalid event type." });
    }

    const matchRes = await pool.query(
      `
      SELECT 
  m.home_team_id,
  m.away_team_id,
  th.name AS home_team,
  ta.name AS away_team
FROM matches m
JOIN teams th ON th.team_id = m.home_team_id
JOIN teams ta ON ta.team_id = m.away_team_id
WHERE m.match_id = $1
      `,
      [matchId]
    );

    if (matchRes.rows.length === 0) {
      return res.status(404).json({ error: "Match not found" });
    }

    const match = matchRes.rows[0];

    const teamId =
      team === "home"
        ? match.home_team_id
        : team === "away"
        ? match.away_team_id
        : null;

    if (!teamId) {
      return res.status(400).json({ error: "Invalid team." });
    }

    const demoName = team === "home" ? "Home Team" : "Away Team";

    const playerRes = await pool.query(
      `
      INSERT INTO players (team_id, full_name, sport_id, source)
      VALUES ($1, $2, 1, 'demo')
      RETURNING player_id, full_name, team_id;
      `,
      [teamId, demoName]
    );

    const player = playerRes.rows[0];

    const ins = await pool.query(
      `
      INSERT INTO events (match_id, player_id, minute, type)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
      `,
      [matchId, player.player_id, Number(minute), type]
    );

    if (type === "goal") {
      const scoreColumn = team === "home" ? "score_home" : "score_away";

      await pool.query(
        `
        UPDATE matches
        SET ${scoreColumn} = COALESCE(${scoreColumn}, 0) + 1
        WHERE match_id = $1;
        `,
        [matchId]
      );
    }

    res.status(201).json({
      ...ins.rows[0],
      full_name:
        type === "goal"
          ? "Гол"
          : type === "yellow_card"
          ? "Жовта картка"
          : type === "red_card"
          ? "Червона картка"
          : "Подія",
      team_name: demoName,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/:id", auth, admin, async (req, res) => {
  try {
    const matchId = Number(req.params.id);
    const { score_home, score_away, match_date, duration_minutes } = req.body || {};

    const result = await pool.query(
      `
      UPDATE matches
      SET
        score_home = COALESCE($1, score_home),
        score_away = COALESCE($2, score_away),
        match_date = COALESCE($3, match_date),
        duration_minutes = COALESCE($4, duration_minutes)
      WHERE match_id = $5
      RETURNING *;
      `,
      [
        score_home === "" || score_home == null ? null : Number(score_home),
        score_away === "" || score_away == null ? null : Number(score_away),
        match_date || null,
        duration_minutes === "" || duration_minutes == null ? null : Number(duration_minutes),
        matchId,
      ]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: "Match not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;