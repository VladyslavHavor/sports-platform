const express = require("express");
const router = express.Router();
const pool = require("../db");

router.get("/:id", async (req, res) => {
  try {
    const teamId = Number(req.params.id);

    const teamRes = await pool.query(
  `
  SELECT
    t.team_id,
    t.name,
    tr.name AS tournament,
    t.logo,
    t.country
  FROM teams t
  LEFT JOIN tournaments tr
    ON tr.tournament_id = t.tournament_id
  WHERE t.team_id = $1
  `,
  [teamId]
);

    if (!teamRes.rows.length) {
      return res.status(404).json({ error: "Team not found" });
    }

    const matchesRes = await pool.query(
      `
      SELECT
        m.match_id,
        m.match_date,
        th.name AS home_team,
        ta.name AS away_team,
        COALESCE(m.score_home, 0) AS score_home,
        COALESCE(m.score_away, 0) AS score_away,
        m.home_team_id,
        m.away_team_id
      FROM matches m
      JOIN teams th ON th.team_id = m.home_team_id
      JOIN teams ta ON ta.team_id = m.away_team_id
      WHERE m.home_team_id = $1
         OR m.away_team_id = $1
      ORDER BY m.match_date DESC
      LIMIT 10
      `,
      [teamId]
    );

    let wins = 0;
    let draws = 0;
    let losses = 0;
    let goalsFor = 0;
    let goalsAgainst = 0;

    matchesRes.rows.forEach((m) => {
  const isHome = Number(m.home_team_id) === teamId;

  const gf = isHome ? Number(m.score_home || 0) : Number(m.score_away || 0);
  const ga = isHome ? Number(m.score_away || 0) : Number(m.score_home || 0);

  goalsFor += gf;
  goalsAgainst += ga;

  if (gf > ga) wins++;
  else if (gf === ga) draws++;
  else losses++;
});

    res.json({
      team: teamRes.rows[0],
      stats: {
        matches: matchesRes.rows.length,
        wins,
        draws,
        losses,
        goalsFor,
        goalsAgainst,
      },
      recentMatches: matchesRes.rows,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


module.exports = router;