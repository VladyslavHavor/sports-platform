const express = require("express");
const router = express.Router();
const pool = require("../db");

// GET /tournaments
router.get("/", async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        t.tournament_id,
        t.name,
        t.country,
        t.sport_id,
        s.name AS sport_name
      FROM tournaments t
      JOIN sports s ON s.sport_id = t.sport_id
      ORDER BY s.name ASC, t.country NULLS LAST, t.name ASC;
    `);

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /tournaments/:id/standings?season=2024
router.get("/:id/standings", async (req, res) => {
  try {
    const tournamentId = Number(req.params.id);
    const season = Number(req.query.season || 2024);

    const { rows } = await pool.query(
      `
      WITH finished_matches AS (
        SELECT
          m.match_id,
          m.tournament_id,
          m.home_team_id,
          m.away_team_id,
          COALESCE(m.score_home, 0)::int AS score_home,
          COALESCE(m.score_away, 0)::int AS score_away,
          m.match_date
        FROM matches m
        WHERE m.tournament_id = $1
          AND m.season = $2
          AND m.score_home IS NOT NULL
          AND m.score_away IS NOT NULL
      ),

      match_rows AS (
        SELECT
          fm.home_team_id AS team_id,
          1 AS played,
          CASE WHEN fm.score_home > fm.score_away THEN 1 ELSE 0 END AS wins,
          CASE WHEN fm.score_home = fm.score_away THEN 1 ELSE 0 END AS draws,
          CASE WHEN fm.score_home < fm.score_away THEN 1 ELSE 0 END AS losses,
          fm.score_home AS goals_for,
          fm.score_away AS goals_against,
          CASE
            WHEN fm.score_home > fm.score_away THEN 3
            WHEN fm.score_home = fm.score_away THEN 1
            ELSE 0
          END AS points
        FROM finished_matches fm

        UNION ALL

        SELECT
          fm.away_team_id AS team_id,
          1 AS played,
          CASE WHEN fm.score_away > fm.score_home THEN 1 ELSE 0 END AS wins,
          CASE WHEN fm.score_away = fm.score_home THEN 1 ELSE 0 END AS draws,
          CASE WHEN fm.score_away < fm.score_home THEN 1 ELSE 0 END AS losses,
          fm.score_away AS goals_for,
          fm.score_home AS goals_against,
          CASE
            WHEN fm.score_away > fm.score_home THEN 3
            WHEN fm.score_away = fm.score_home THEN 1
            ELSE 0
          END AS points
        FROM finished_matches fm
      ),

      agg AS (
        SELECT
          team_id,
          SUM(played)::int AS played,
          SUM(wins)::int AS wins,
          SUM(draws)::int AS draws,
          SUM(losses)::int AS losses,
          SUM(goals_for)::int AS goals_for,
          SUM(goals_against)::int AS goals_against,
          (SUM(goals_for) - SUM(goals_against))::int AS goal_diff,
          SUM(points)::int AS points
        FROM match_rows
        GROUP BY team_id
      ),

      season_teams AS (
        SELECT DISTINCT home_team_id AS team_id
        FROM finished_matches

        UNION

        SELECT DISTINCT away_team_id AS team_id
        FROM finished_matches
      )

      SELECT
        tm.team_id,
        tm.name AS team_name,

        COALESCE(a.played, 0) AS played,
        COALESCE(a.wins, 0) AS wins,
        COALESCE(a.draws, 0) AS draws,
        COALESCE(a.losses, 0) AS losses,
        COALESCE(a.goals_for, 0) AS goals_for,
        COALESCE(a.goals_against, 0) AS goals_against,
        COALESCE(a.goal_diff, 0) AS goal_diff,
        COALESCE(a.points, 0) AS points

      FROM season_teams st
      JOIN teams tm ON tm.team_id = st.team_id
      LEFT JOIN agg a ON a.team_id = tm.team_id

      WHERE
        CASE
          WHEN tm.sport_id = 1 THEN COALESCE(a.played, 0) >= 5
          ELSE COALESCE(a.played, 0) > 0
        END

      ORDER BY
        points DESC,
        goal_diff DESC,
        goals_for DESC,
        team_name ASC;
      `,
      [tournamentId, season]
    );

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;