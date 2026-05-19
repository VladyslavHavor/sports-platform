require("dotenv").config();
const pool = require("../db");

async function ensureSport(name) {
  const existing = await pool.query(
    `SELECT sport_id FROM sports WHERE LOWER(name)=LOWER($1)`,
    [name]
  );

  if (existing.rows.length) return existing.rows[0].sport_id;

  const inserted = await pool.query(
    `INSERT INTO sports(name) VALUES($1) RETURNING sport_id`,
    [name]
  );

  return inserted.rows[0].sport_id;
}

async function createTournament(name, country, sportId) {
  const existing = await pool.query(
    `SELECT tournament_id FROM tournaments WHERE LOWER(name)=LOWER($1) LIMIT 1`,
    [name]
  );

  if (existing.rows.length) return existing.rows[0].tournament_id;

  const inserted = await pool.query(
    `INSERT INTO tournaments(name, country, sport_id)
     VALUES($1,$2,$3)
     RETURNING tournament_id`,
    [name, country, sportId]
  );

  return inserted.rows[0].tournament_id;
}

async function createTeam(name, tournamentId) {
  const tournament = await pool.query(
    `SELECT sport_id FROM tournaments WHERE tournament_id = $1`,
    [tournamentId]
  );

  const sportId = tournament.rows[0].sport_id;

  const existing = await pool.query(
    `SELECT team_id
     FROM teams
     WHERE LOWER(name)=LOWER($1)
     AND tournament_id=$2`,
    [name, tournamentId]
  );

  if (existing.rows.length) return existing.rows[0].team_id;

  const inserted = await pool.query(
    `INSERT INTO teams(name, tournament_id, sport_id)
     VALUES($1,$2,$3)
     RETURNING team_id`,
    [name, tournamentId, sportId]
  );

  return inserted.rows[0].team_id;
}

async function createMatch({
  homeTeamId,
  awayTeamId,
  tournamentId,
  date,
  homeScore,
  awayScore,
  durationMinutes = 90,
  season = 2025,
}) {
  const existing = await pool.query(
    `
    SELECT match_id
    FROM matches
    WHERE home_team_id=$1
      AND away_team_id=$2
      AND tournament_id=$3
      AND match_date=$4
    LIMIT 1
    `,
    [homeTeamId, awayTeamId, tournamentId, date]
  );

  if (existing.rows.length) return;

  await pool.query(
    `
    INSERT INTO matches(
      match_date,
      home_team_id,
      away_team_id,
      tournament_id,
      score_home,
      score_away,
      duration_minutes,
      season
    )
    VALUES($1,$2,$3,$4,$5,$6,$7,$8)
    `,
    [
      date,
      homeTeamId,
      awayTeamId,
      tournamentId,
      homeScore,
      awayScore,
      durationMinutes,
      season,
    ]
  );
}

async function seedBasketball() {
  const sportId = await ensureSport("Basketball");
  const tournamentId = await createTournament("NBA Demo League", "USA", sportId);

  const lakers = await createTeam("Lakers", tournamentId);
  const warriors = await createTeam("Warriors", tournamentId);
  const bulls = await createTeam("Chicago Bulls", tournamentId);
  const celtics = await createTeam("Boston Celtics", tournamentId);
  const heat = await createTeam("Miami Heat", tournamentId);
  const mavs = await createTeam("Dallas Mavericks", tournamentId);

  await createMatch({ homeTeamId: lakers, awayTeamId: warriors, tournamentId, date: "2026-05-10 20:00:00", homeScore: 99, awayScore: 94 });
  await createMatch({ homeTeamId: bulls, awayTeamId: celtics, tournamentId, date: "2026-05-12 18:00:00", homeScore: 88, awayScore: 91 });
  await createMatch({ homeTeamId: heat, awayTeamId: mavs, tournamentId, date: "2026-05-14 19:30:00", homeScore: 104, awayScore: 98 });
  await createMatch({ homeTeamId: warriors, awayTeamId: bulls, tournamentId, date: "2026-05-16 21:00:00", homeScore: 112, awayScore: 108 });

  await createMatch({ homeTeamId: lakers, awayTeamId: celtics, tournamentId, date: "2026-05-24 20:00:00", homeScore: null, awayScore: null });
  await createMatch({ homeTeamId: mavs, awayTeamId: warriors, tournamentId, date: "2026-05-25 19:00:00", homeScore: null, awayScore: null });
  await createMatch({ homeTeamId: heat, awayTeamId: lakers, tournamentId, date: "2026-05-27 18:30:00", homeScore: null, awayScore: null });
  await createMatch({ homeTeamId: celtics, awayTeamId: mavs, tournamentId, date: "2026-05-29 20:30:00", homeScore: null, awayScore: null });
}

async function seedHockey() {
  const sportId = await ensureSport("Hockey");
  const tournamentId = await createTournament("NHL Demo League", "Canada", sportId);

  const oilers = await createTeam("Edmonton Oilers", tournamentId);
  const leafs = await createTeam("Toronto Maple Leafs", tournamentId);
  const canadiens = await createTeam("Montreal Canadiens", tournamentId);
  const rangers = await createTeam("NY Rangers", tournamentId);
  const bruins = await createTeam("Boston Bruins", tournamentId);
  const avalanche = await createTeam("Colorado Avalanche", tournamentId);

  await createMatch({ homeTeamId: oilers, awayTeamId: leafs, tournamentId, date: "2026-05-09 19:30:00", homeScore: 4, awayScore: 3 });
  await createMatch({ homeTeamId: canadiens, awayTeamId: rangers, tournamentId, date: "2026-05-11 18:00:00", homeScore: 2, awayScore: 5 });
  await createMatch({ homeTeamId: bruins, awayTeamId: avalanche, tournamentId, date: "2026-05-13 20:00:00", homeScore: 3, awayScore: 1 });
  await createMatch({ homeTeamId: leafs, awayTeamId: canadiens, tournamentId, date: "2026-05-15 20:00:00", homeScore: 1, awayScore: 2 });

  await createMatch({ homeTeamId: rangers, awayTeamId: oilers, tournamentId, date: "2026-05-24 19:00:00", homeScore: null, awayScore: null });
  await createMatch({ homeTeamId: avalanche, awayTeamId: leafs, tournamentId, date: "2026-05-26 20:00:00", homeScore: null, awayScore: null });
  await createMatch({ homeTeamId: canadiens, awayTeamId: bruins, tournamentId, date: "2026-05-28 18:00:00", homeScore: null, awayScore: null });
}

async function seedTennis() {
  const sportId = await ensureSport("Tennis");
  const tournamentId = await createTournament("ATP Demo Tour", "World", sportId);

  const alcaraz = await createTeam("Carlos Alcaraz", tournamentId);
  const sinner = await createTeam("Jannik Sinner", tournamentId);
  const djokovic = await createTeam("Novak Djokovic", tournamentId);
  const zverev = await createTeam("Alexander Zverev", tournamentId);
  const rune = await createTeam("Holger Rune", tournamentId);
  const tsitsipas = await createTeam("Stefanos Tsitsipas", tournamentId);

  await createMatch({ homeTeamId: alcaraz, awayTeamId: zverev, tournamentId, date: "2026-05-08 14:00:00", homeScore: 2, awayScore: 1 });
  await createMatch({ homeTeamId: sinner, awayTeamId: djokovic, tournamentId, date: "2026-05-10 16:00:00", homeScore: 2, awayScore: 0 });
  await createMatch({ homeTeamId: rune, awayTeamId: tsitsipas, tournamentId, date: "2026-05-12 15:30:00", homeScore: 1, awayScore: 2 });
  await createMatch({ homeTeamId: djokovic, awayTeamId: zverev, tournamentId, date: "2026-05-14 17:00:00", homeScore: 2, awayScore: 0 });

  await createMatch({ homeTeamId: alcaraz, awayTeamId: sinner, tournamentId, date: "2026-05-24 14:00:00", homeScore: null, awayScore: null });
  await createMatch({ homeTeamId: djokovic, awayTeamId: tsitsipas, tournamentId, date: "2026-05-25 15:00:00", homeScore: null, awayScore: null });
  await createMatch({ homeTeamId: rune, awayTeamId: zverev, tournamentId, date: "2026-05-27 13:00:00", homeScore: null, awayScore: null });
}

async function seedVolleyball() {
  const sportId = await ensureSport("Volleyball");
  const tournamentId = await createTournament("Volleyball Super League", "Poland", sportId);

  const barkom = await createTeam("Barkom-Kazhany", tournamentId);
  const epicentr = await createTeam("Epicentr-Podiliany", tournamentId);
  const resovia = await createTeam("Resovia", tournamentId);
  const zaksa = await createTeam("ZAKSA", tournamentId);
  const skra = await createTeam("Skra Belchatow", tournamentId);
  const jastrzebski = await createTeam("Jastrzebski Wegiel", tournamentId);

  await createMatch({ homeTeamId: barkom, awayTeamId: epicentr, tournamentId, date: "2026-05-09 17:00:00", homeScore: 3, awayScore: 1 });
  await createMatch({ homeTeamId: resovia, awayTeamId: zaksa, tournamentId, date: "2026-05-11 18:00:00", homeScore: 2, awayScore: 3 });
  await createMatch({ homeTeamId: skra, awayTeamId: jastrzebski, tournamentId, date: "2026-05-13 19:00:00", homeScore: 1, awayScore: 3 });
  await createMatch({ homeTeamId: epicentr, awayTeamId: resovia, tournamentId, date: "2026-05-15 17:30:00", homeScore: 3, awayScore: 2 });

  await createMatch({ homeTeamId: zaksa, awayTeamId: barkom, tournamentId, date: "2026-05-24 16:00:00", homeScore: null, awayScore: null });
  await createMatch({ homeTeamId: jastrzebski, awayTeamId: epicentr, tournamentId, date: "2026-05-26 17:00:00", homeScore: null, awayScore: null });
  await createMatch({ homeTeamId: resovia, awayTeamId: skra, tournamentId, date: "2026-05-28 18:00:00", homeScore: null, awayScore: null });
}

async function seedEsports() {
  const sportId = await ensureSport("Esports");
  const tournamentId = await createTournament("CS2 Major", "Europe", sportId);

  const navi = await createTeam("NAVI", tournamentId);
  const faze = await createTeam("FaZe Clan", tournamentId);
  const g2 = await createTeam("G2 Esports", tournamentId);
  const vitality = await createTeam("Vitality", tournamentId);
  const mouz = await createTeam("MOUZ", tournamentId);
  const spirit = await createTeam("Team Spirit", tournamentId);

  await createMatch({ homeTeamId: navi, awayTeamId: faze, tournamentId, date: "2026-05-08 21:00:00", homeScore: 2, awayScore: 1 });
  await createMatch({ homeTeamId: g2, awayTeamId: vitality, tournamentId, date: "2026-05-10 20:00:00", homeScore: 1, awayScore: 2 });
  await createMatch({ homeTeamId: mouz, awayTeamId: spirit, tournamentId, date: "2026-05-12 19:00:00", homeScore: 0, awayScore: 2 });
  await createMatch({ homeTeamId: navi, awayTeamId: g2, tournamentId, date: "2026-05-14 21:00:00", homeScore: 2, awayScore: 0 });

  await createMatch({ homeTeamId: vitality, awayTeamId: faze, tournamentId, date: "2026-05-24 20:00:00", homeScore: null, awayScore: null });
  await createMatch({ homeTeamId: spirit, awayTeamId: navi, tournamentId, date: "2026-05-26 21:00:00", homeScore: null, awayScore: null });
  await createMatch({ homeTeamId: mouz, awayTeamId: g2, tournamentId, date: "2026-05-29 19:30:00", homeScore: null, awayScore: null });
}

(async () => {
  try {
    console.log("🌱 Seeding demo sports...");

    await seedBasketball();
    await seedHockey();
    await seedTennis();
    await seedVolleyball();
    await seedEsports();

    console.log("✅ Demo sports added successfully!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Seed error:", err.message);
    process.exit(1);
  }
})();