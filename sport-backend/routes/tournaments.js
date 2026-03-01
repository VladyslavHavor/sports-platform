const express = require("express");
const router = express.Router();
const pool = require("../db");

// GET /tournaments  -> list leagues
router.get("/", async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT tournament_id, name, country
      FROM tournaments
      ORDER BY country NULLS LAST, name ASC;
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /tournaments/:id/standings
router.get("/:id/standings", async (req, res) => {
  try {
    const tournamentId = Number(req.params.id);

    const { rows } = await pool.query(
      `
      WITH match_rows AS (
        SELECT
          m.tournament_id,
          m.home_team_id AS team_id,
          COALESCE(m.score_home,0)::int AS goals_for,
          COALESCE(m.score_away,0)::int AS goals_against
        FROM matches m
        WHERE m.tournament_id = $1 AND m.status = 'finished'

        UNION ALL

        SELECT
          m.tournament_id,
          m.away_team_id AS team_id,
          COALESCE(m.score_away,0)::int AS goals_for,
          COALESCE(m.score_home,0)::int AS goals_against
        FROM matches m
        WHERE m.tournament_id = $1 AND m.status = 'finished'
      )
      SELECT
        r.team_id,
        tm.name AS team_name,
        COUNT(*)::int AS played,
        SUM(CASE WHEN r.goals_for > r.goals_against THEN 1 ELSE 0 END)::int AS wins,
        SUM(CASE WHEN r.goals_for = r.goals_against THEN 1 ELSE 0 END)::int AS draws,
        SUM(CASE WHEN r.goals_for < r.goals_against THEN 1 ELSE 0 END)::int AS losses,
        SUM(r.goals_for)::int AS goals_for,
        SUM(r.goals_against)::int AS goals_against,
        (SUM(r.goals_for) - SUM(r.goals_against))::int AS goal_diff,
        (SUM(
          CASE
            WHEN r.goals_for > r.goals_against THEN 3
            WHEN r.goals_for = r.goals_against THEN 1
            ELSE 0
          END
        ))::int AS points
      FROM match_rows r
      JOIN teams tm ON tm.team_id = r.team_id
      GROUP BY r.team_id, tm.name
      ORDER BY points DESC, goal_diff DESC, goals_for DESC, team_name ASC;
      `,
      [tournamentId]
    );

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;