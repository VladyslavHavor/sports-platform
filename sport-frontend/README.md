# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)




require("dotenv").config();
const { Pool } = require("pg");

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
});

const DURATION = 90;

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}
function iso(d) {
  return new Date(d).toISOString();
}

async function ensureTournament(client, name) {
  const found = await client.query(`SELECT tournament_id, name FROM tournaments WHERE name = $1`, [name]);
  if (found.rows.length) return found.rows[0];

  const ins = await client.query(
    `INSERT INTO tournaments (name) VALUES ($1) RETURNING tournament_id, name`,
    [name]
  );
  return ins.rows[0];
}

async function ensureTeam(client, name) {
  const found = await client.query(`SELECT team_id, name FROM teams WHERE name = $1`, [name]);
  if (found.rows.length) return found.rows[0];

  const ins = await client.query(
    `INSERT INTO teams (name) VALUES ($1) RETURNING team_id, name`,
    [name]
  );
  return ins.rows[0];
}

async function ensurePlayersForTeam(client, teamId, teamName) {
  const existing = await client.query(`SELECT player_id FROM players WHERE team_id = $1 LIMIT 1`, [teamId]);
  if (existing.rows.length) return;

  // create 8 demo players
  const names = [
    "Andrii Lys",
    "Sviatik Kozak",
    "Ivan Petrenko",
    "Taras Shevchuk",
    "Mykola Bondar",
    "Oleh Koval",
    "Danylo Hrytsenko",
    "Roman Savchuk",
  ];

  for (let i = 0; i < names.length; i++) {
    const fullName = `${names[i]} (${teamName})`;
    await client.query(
      `INSERT INTO players (full_name, team_id) VALUES ($1, $2)`,
      [fullName, teamId]
    );
  }
}

async function main() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // --- 0) Ensure base tournaments + teams exist (so seed always works)
    const laLiga = await ensureTournament(client, "La Liga");
    const ukrCup = await ensureTournament(client, "Ukrainian Cup");

    const barca = await ensureTeam(client, "FC Barcelona");
    const real = await ensureTeam(client, "Real Madrid");
    const pryk = await ensureTeam(client, "FC Prykarpattia");
    const lviv = await ensureTeam(client, "FC Lviv");

    // ensure players (so events insert always has valid player_id)
    await ensurePlayersForTeam(client, barca.team_id, barca.name);
    await ensurePlayersForTeam(client, real.team_id, real.name);
    await ensurePlayersForTeam(client, pryk.team_id, pryk.name);
    await ensurePlayersForTeam(client, lviv.team_id, lviv.name);

    // --- 1) Cleanup old seed
    await client.query(`
      DELETE FROM events
      WHERE match_id IN (SELECT match_id FROM matches WHERE location LIKE 'SEED:%');
    `);
    await client.query(`
      DELETE FROM matches
      WHERE location LIKE 'SEED:%';
    `);

    // --- 2) Load players by team
    const playersRes = await client.query(`SELECT player_id, full_name, team_id FROM players ORDER BY player_id`);
    const players = playersRes.rows;

    const playersByTeam = new Map();
    for (const p of players) {
      if (!playersByTeam.has(p.team_id)) playersByTeam.set(p.team_id, []);
      playersByTeam.get(p.team_id).push(p);
    }

    const getPlayerFromTeam = (teamId) => {
      const list = playersByTeam.get(teamId) || [];
      if (!list.length) return null;
      return pick(list);
    };

    // --- 3) Tournament -> allowed teams map (the key fix)
    const tournamentTeamsMap = new Map([
      [laLiga.tournament_id, [barca, real]],
      [ukrCup.tournament_id, [pryk, lviv]],
    ]);

    // --- 4) Dates
    const now = new Date();

    const todayDates = [2, 5, 8, 11, 14].map((h) => {
      const d = new Date(now);
      d.setHours(h, 0, 0, 0);
      return d;
    });

    const upcomingDates = Array.from({ length: 10 }, (_, i) => {
      const d = new Date(now);
      d.setDate(d.getDate() + (i + 1));
      d.setHours(18 + (i % 3), 30, 0, 0);
      return d;
    });

    const finishedDates = Array.from({ length: 10 }, (_, i) => {
      const d = new Date(now);
      d.setDate(d.getDate() - (i + 1));
      d.setHours(19 + (i % 2), 0, 0, 0);
      return d;
    });

    const allDates = [
      ...todayDates.map((d) => ({ kind: "today", date: d })),
      ...upcomingDates.map((d) => ({ kind: "upcoming", date: d })),
      ...finishedDates.map((d) => ({ kind: "finished", date: d })),
    ];

    // --- 5) Insert matches
    let inserted = 0;

    for (let idx = 0; idx < allDates.length; idx++) {
      const { kind, date } = allDates[idx];

      // pick a tournament (50/50)
      const tournament = Math.random() < 0.5 ? laLiga : ukrCup;
      const allowedTeams = tournamentTeamsMap.get(tournament.tournament_id);

      // choose two different teams only from allowed
      const [home, away] = shuffle(allowedTeams).slice(0, 2);

      const location = `SEED:${kind}:${idx + 1}`;

      const matchIns = await client.query(
        `
        INSERT INTO matches (match_date, location, duration_minutes, tournament_id, home_team_id, away_team_id)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING match_id;
        `,
        [iso(date), location, DURATION, tournament.tournament_id, home.team_id, away.team_id]
      );

      const matchId = matchIns.rows[0].match_id;
      inserted++;

      // --- Events logic
      const homePlayer = getPlayerFromTeam(home.team_id);
      const awayPlayer = getPlayerFromTeam(away.team_id);
      if (!homePlayer || !awayPlayer) continue;

      let goalsToAdd = 0;
      let cardsToAdd = 0;

      if (kind === "today") {
        goalsToAdd = Math.floor(Math.random() * 4); // 0..3
        cardsToAdd = Math.floor(Math.random() * 3); // 0..2
      } else if (kind === "finished") {
        goalsToAdd = 1 + Math.floor(Math.random() * 5); // 1..5
        cardsToAdd = 1 + Math.floor(Math.random() * 3); // 1..3
      }

      // goals (+ assists)
      for (let g = 0; g < goalsToAdd; g++) {
        const minute = 5 + Math.floor(Math.random() * (DURATION - 5));
        const scorer = Math.random() < 0.5 ? homePlayer : awayPlayer;

        await client.query(
          `INSERT INTO events (match_id, player_id, minute, type) VALUES ($1,$2,$3,'goal')`,
          [matchId, scorer.player_id, minute]
        );

        if (Math.random() < 0.5) {
          const teamPlayers = playersByTeam.get(scorer.team_id) || [];
          const assistPlayer =
            teamPlayers.length > 1 ? pick(teamPlayers.filter((p) => p.player_id !== scorer.player_id)) : null;

          if (assistPlayer) {
            await client.query(
              `INSERT INTO events (match_id, player_id, minute, type) VALUES ($1,$2,$3,'assist')`,
              [matchId, assistPlayer.player_id, minute]
            );
          }
        }
      }

      // cards
      for (let c = 0; c < cardsToAdd; c++) {
        const minute = 5 + Math.floor(Math.random() * (DURATION - 5));
        const who = Math.random() < 0.5 ? homePlayer : awayPlayer;
        const type = Math.random() < 0.75 ? "yellow_card" : "red_card";

        await client.query(
          `INSERT INTO events (match_id, player_id, minute, type) VALUES ($1,$2,$3,$4)`,
          [matchId, who.player_id, minute, type]
        );
      }
    }

    await client.query("COMMIT");
    console.log("✅ Seed completed!");
    console.log(`Inserted matches: ${inserted}`);
    console.log("Tournaments used: La Liga (Barcelona, Real) + Ukrainian Cup (Prykarpattia, Lviv)");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ Seed failed:", err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

main();