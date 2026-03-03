// src/services/upsertPlayers.js
const pool = require("../../db");

async function upsertPlayer({
  sportId,
  teamId,
  source,
  externalId,
  fullName,
  position,
  nationality,
  age,
  photoUrl,
}) {
  await pool.query(
    `INSERT INTO players
      (sport_id, team_id, source, external_id, full_name, position, nationality, age, photo_url)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     ON CONFLICT (source, external_id)
     DO UPDATE SET
       team_id = EXCLUDED.team_id,
       sport_id = EXCLUDED.sport_id,
       full_name = EXCLUDED.full_name,
       position = EXCLUDED.position,
       nationality = EXCLUDED.nationality,
       age = EXCLUDED.age,
       photo_url = EXCLUDED.photo_url`,
    [
      sportId,
      teamId,
      source,
      String(externalId),
      fullName,
      position,
      nationality,
      age,
      photoUrl,
    ]
  );
}

module.exports = { upsertPlayer };