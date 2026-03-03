// src/services/upsertMatches.js
const pool = require("../../db");

async function upsertMatch({ externalId, date, homeExternalId, awayExternalId, tournamentId, durationMinutes = 90 }) {
  const source = process.env.DATA_SOURCE || "api_sports";

  const home = await pool.query(
    `SELECT team_id FROM teams WHERE source=$1 AND external_id=$2`,
    [source, String(homeExternalId)]
  );
  const away = await pool.query(
    `SELECT team_id FROM teams WHERE source=$1 AND external_id=$2`,
    [source, String(awayExternalId)]
  );

  if (home.rowCount === 0 || away.rowCount === 0) return; // команди не імпортовані

  await pool.query(
    `INSERT INTO matches (match_date, home_team_id, away_team_id, tournament_id, duration_minutes, source, external_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     ON CONFLICT (source, external_id)
     DO UPDATE SET
       match_date = EXCLUDED.match_date,
       home_team_id = EXCLUDED.home_team_id,
       away_team_id = EXCLUDED.away_team_id,
       tournament_id = EXCLUDED.tournament_id,
       duration_minutes = EXCLUDED.duration_minutes`,
    [
      date,
      home.rows[0].team_id,
      away.rows[0].team_id,
      tournamentId ?? null, // якщо в тебе матчі прив’язані до tournament_id
      durationMinutes,
      source,
      String(externalId),
    ]
  );
}

module.exports = { upsertMatch };