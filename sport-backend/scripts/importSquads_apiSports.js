require("dotenv").config();
const pool = require("../db");
const { getSquad } = require("../src/integrations/apiSports/footballClient");
const { upsertPlayer } = require("../src/services/upsertPlayers");

(async () => {
  try {
    const sportId = 1;
    const source = process.env.DATA_SOURCE || "api_sports";

    const teamsRes = await pool.query(
      `SELECT team_id, name, external_id
       FROM teams
       WHERE sport_id=$1 AND source=$2
       ORDER BY name`,
      [sportId, source]
    );

    let total = 0;

    for (const t of teamsRes.rows) {
      console.log(`\n==> ${t.name} (api team=${t.external_id})`);

      const data = await getSquad(t.external_id);
      const squad = data.response?.[0]?.players || [];

      console.log(`Squad players: ${squad.length}`);

      for (const pl of squad) {
        await upsertPlayer({
          sportId,
          teamId: t.team_id,
          source,
          externalId: pl.id,
          fullName: pl.name,
          position: pl.position || null,
          nationality: pl.nationality || null,
          age: pl.age || null,
          photoUrl: pl.photo || null,
        });
        total++;
      }
    }

    console.log("\n✅ Total players imported:", total);
    process.exit(0);
  } catch (e) {
    console.error("Import error:", e.response?.data || e.message);
    process.exit(1);
  }
})();