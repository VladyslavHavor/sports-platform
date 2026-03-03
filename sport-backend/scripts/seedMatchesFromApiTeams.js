// scripts/seedMatchesWeeklyPerLeague.js
require("dotenv").config();
const pool = require("../db");

const SOURCE = "seed";

// які ліги/турніри засідити (твої tournament_id з БД)
const TOURNAMENT_IDS = [5, 8, 7, 6, 4, 9]; 
// 5 EPL, 8 Ligue 1, 7 Bundesliga, 6 Serie A, 4 La Liga, 9 UPL (з твого скріну)

const ONLY_API_TEAMS = true; // беремо тільки teams.source='api_sports'

// календар на тиждень (локальний час сервера)
const WEEK_TEMPLATE = [
  { dayOffset: 4, hour: 20, minute: 30, count: 1 }, // Пт (від понеділка) -> 1 матч
  { dayOffset: 5, hour: 16, minute: 0,  count: 2 }, // Сб -> 2 матчі
  { dayOffset: 5, hour: 18, minute: 30, count: 2 }, // Сб -> 2 матчі (разом 4)
  { dayOffset: 6, hour: 16, minute: 0,  count: 2 }, // Нд -> 2
  { dayOffset: 6, hour: 18, minute: 30, count: 2 }, // Нд -> 2 (разом 4)
  { dayOffset: 0, hour: 20, minute: 30, count: 1 }, // Пн -> 1 матч
];

// скільки тижнів наперед генеруємо
const WEEKS_AHEAD = 12;

// щоб в таблиці були якісь “finished” матчі для standings,
// можна зробити N тижнів у минулому з рахунком
const WEEKS_IN_PAST_WITH_SCORES = 2; // 0 = не робити минулі
const SCORE_MAX = 4;

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Понеділок 00:00 поточного тижня (локально)
function startOfWeekMonday(d = new Date()) {
  const x = new Date(d);
  const day = x.getDay(); // 0 Sun .. 6 Sat
  const diffToMonday = (day === 0 ? -6 : 1 - day);
  x.setDate(x.getDate() + diffToMonday);
  x.setHours(0, 0, 0, 0);
  return x;
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function setTime(date, hour, minute) {
  const d = new Date(date);
  d.setHours(hour, minute, 0, 0);
  return d;
}

function iso(date) {
  return new Date(date).toISOString();
}

/**
 * Round-robin “circle method”.
 * Повертає масив турів, де кожен тур — список пар {home, away}.
 * Працює і для парної, і для непарної кількості команд (додає bye=null).
 */
function buildRoundRobin(teamIds) {
  const ids = [...teamIds];

  // якщо непарна кількість — додаємо bye
  if (ids.length % 2 === 1) ids.push(null);

  const n = ids.length;
  const rounds = n - 1;
  const half = n / 2;

  let left = ids.slice(0, half);
  let right = ids.slice(half).reverse();

  const schedule = [];

  for (let r = 0; r < rounds; r++) {
    const pairs = [];

    for (let i = 0; i < half; i++) {
      const a = left[i];
      const b = right[i];
      if (a == null || b == null) continue;

      // щоб не було постійно одні вдома — трішки чергуємо
      const home = r % 2 === 0 ? a : b;
      const away = r % 2 === 0 ? b : a;

      pairs.push({ home, away });
    }

    schedule.push(pairs);

    // rotate (fix first of left)
    const fixed = left[0];
    const movedFromLeft = left.pop();
    const movedFromRight = right.shift();

    left = [fixed, movedFromRight, ...left.slice(1)];
    right = [...right, movedFromLeft];
  }

  return schedule; // тури
}

async function seedTournament(tournamentId) {
  console.log(`\n=== TOURNAMENT ${tournamentId} seed START ===`);

  // 1) дістаємо команди
  const teamsRes = await pool.query(
    `
    SELECT team_id
    FROM teams
    WHERE tournament_id = $1
      ${ONLY_API_TEAMS ? "AND source='api_sports'" : ""}
    ORDER BY team_id
    `,
    [tournamentId]
  );

  const teamIds = teamsRes.rows.map(r => r.team_id);
  console.log("Teams found:", teamIds.length);

  if (teamIds.length < 2) {
    console.log("Not enough teams. Skipping.");
    return;
  }

  // 2) чистимо тільки майбутні seed-матчі (API не чіпаємо)
  await pool.query(
    `
    DELETE FROM events
    WHERE match_id IN (
      SELECT match_id
      FROM matches
      WHERE tournament_id=$1
        AND source=$2
        AND match_date >= NOW()
    );
    `,
    [tournamentId, SOURCE]
  );

  await pool.query(
    `
    DELETE FROM matches
    WHERE tournament_id=$1
      AND source=$2
      AND match_date >= NOW();
    `,
    [tournamentId, SOURCE]
  );
  console.log("Future seed matches deleted (kept past).");

  // 3) генеруємо тури round-robin
  const rounds = buildRoundRobin(teamIds);
  // для “як в реалі” (home/away 2 кола) — просто дублюємо з реверсом
  const doubleRounds = [
    ...rounds,
    ...rounds.map(pairs => pairs.map(p => ({ home: p.away, away: p.home }))),
  ];

  // 4) розкидаємо матчі по тижнях
  // будемо брати послідовно тур за туром: 1 тур = 1 тиждень
  const baseMonday = startOfWeekMonday(new Date());

  let inserted = 0;
  let totalWeeks = WEEKS_IN_PAST_WITH_SCORES + WEEKS_AHEAD;

  // починаємо з минулих тижнів (щоб були finished) + потім наперед
  // weekIndex = -WEEKS_IN_PAST_WITH_SCORES ... +WEEKS_AHEAD-1
  for (let wi = -WEEKS_IN_PAST_WITH_SCORES; wi < WEEKS_AHEAD; wi++) {
    const roundIndex = (wi + WEEKS_IN_PAST_WITH_SCORES) % doubleRounds.length;
    const pairs = doubleRounds[roundIndex]; // матчі цього тижня/туру

    // будуємо список слотів на цей тиждень
    const weekMonday = addDays(baseMonday, wi * 7);

    const slots = [];
    for (const block of WEEK_TEMPLATE) {
      for (let i = 0; i < block.count; i++) {
        const d = setTime(addDays(weekMonday, block.dayOffset), block.hour, block.minute + i * 15);
        slots.push(d);
      }
    }

    // якщо пар більше ніж слотів (наприклад ліга з 24 командами), доб’ємо слотами в неділю
    while (slots.length < pairs.length) {
      const extra = setTime(addDays(weekMonday, 6), 21, (slots.length - pairs.length) * 5);
      slots.push(extra);
    }

    // вставляємо матчі
    for (let i = 0; i < pairs.length; i++) {
      const { home, away } = pairs[i];
      const matchDate = slots[i];

      const isPastWeek = matchDate < new Date(); // finished
      const scoreHome = isPastWeek ? randInt(0, SCORE_MAX) : null;
      const scoreAway = isPastWeek ? randInt(0, SCORE_MAX) : null;

      const externalId = `seed_${tournamentId}_w${wi}_r${roundIndex}_m${i}_${home}_${away}`;

      await pool.query(
        `
        INSERT INTO matches
          (match_date, home_team_id, away_team_id, tournament_id, duration_minutes,
           score_home, score_away, source, external_id)
        VALUES
          ($1,$2,$3,$4,$5,$6,$7,$8,$9)
        ON CONFLICT (source, external_id)
        DO UPDATE SET
          match_date = EXCLUDED.match_date,
          home_team_id = EXCLUDED.home_team_id,
          away_team_id = EXCLUDED.away_team_id,
          tournament_id = EXCLUDED.tournament_id,
          duration_minutes = EXCLUDED.duration_minutes,
          score_home = EXCLUDED.score_home,
          score_away = EXCLUDED.score_away
        `,
        [iso(matchDate), home, away, tournamentId, 90, scoreHome, scoreAway, SOURCE, externalId]
      );

      inserted++;
    }
  }

  console.log(`✅ TOURNAMENT ${tournamentId}: inserted/updated matches = ${inserted}`);
}

async function main() {
  console.log("=== seedMatchesWeeklyPerLeague START ===");
  console.log("Tournaments:", TOURNAMENT_IDS.join(", "));

  for (const tid of TOURNAMENT_IDS) {
    await seedTournament(tid);
  }

  console.log("\nDone.");
  process.exit(0);
}

main().catch((e) => {
  console.error("Seed error:", e);
  process.exit(1);
});