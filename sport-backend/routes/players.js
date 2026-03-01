const express = require("express");
const router = express.Router();
const pool = require("../db");

// GET /players/stats
router.get("/stats", async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        p.player_id,
        p.full_name,
        t.name AS team,
        COUNT(*) FILTER (WHERE e.type='goal') AS goals,
        COUNT(*) FILTER (WHERE e.type='assist') AS assists,
        COUNT(*) FILTER (WHERE e.type='yellow_card') AS yellow_cards,
        COUNT(*) FILTER (WHERE e.type='red_card') AS red_cards
      FROM players p
      LEFT JOIN events e ON e.player_id = p.player_id
      LEFT JOIN teams t ON t.team_id = p.team_id
      GROUP BY p.player_id, p.full_name, t.name
      ORDER BY goals DESC, assists DESC;
    `);

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;