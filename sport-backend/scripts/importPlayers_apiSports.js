// scripts/importPlayers_apiSports.js
require("dotenv").config();
const pool = require("../db");
const { getPlayers } = require("../src/integrations/apiSports/footballClient");
const { upsertPlayer } = require("../src/services/upsertPlayers");

(async () => {
  try {
    const tournamentId = 5; // EPL
    const season = 2024;
    const sportId = 1; // Football у твоїй БД
    const source = process.env.DATA_SOURCE || "api_sports";

    // беремо команди EPL
    const teamsRes = await pool.query(
      `SELECT team_id, name, external_id
       FROM teams
       WHERE sport_id=$1 AND source=$2
       ORDER BY name`,
      [sportId, source]
    );

    const teams = teamsRes.rows;
    console.log("Teams to import players for:", teams.length);

    let totalImported = 0;

    for (const t of teams) {
      if (!t.external_id) continue;

      console.log(`\n==> ${t.name} (api team=${t.external_id})`);

      // API-Sports /players віддає paging, треба пройти сторінки
      let page = 1;
      while (true) {
        const data = await getPlayers({ team: t.external_id, season, page });

        const items = data.response || [];
        const paging = data.paging || { current: page, total: page };

        for (const item of items) {
          // item.player + item.statistics[0]...
          const pl = item.player;
          const stat = item.statistics?.[0];

          await upsertPlayer({
            sportId,
            teamId: t.team_id,
            source,
            externalId: pl.id,
            fullName: pl.name,
            position: stat?.games?.position || null,
            nationality: pl.nationality || null,
            age: pl.age || null,
            photoUrl: pl.photo || null,
          });

          totalImported++;
        }

        console.log(`Page ${paging.current}/${paging.total} -> players: ${items.length}`);

        if (paging.current >= paging.total) break;
        page++;
      }
    }

    console.log("\n✅ Players imported:", totalImported);
    process.exit(0);
  } catch (err) {
    console.error("Import error:", err.message);
    process.exit(1);
  }
})();