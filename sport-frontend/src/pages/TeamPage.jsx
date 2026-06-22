import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getTeam } from "../api";
import { teamName } from "../teamTranslations";
import { useAuth } from "../auth/AuthContext";

export default function TeamPage() {
  const { id } = useParams();
  const { lang } = useAuth();

  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getTeam(id)
      .then(setData)
      .catch((e) => setError(e?.response?.data?.error || e.message));
  }, [id]);

  if (error) {
    return (
      <div className="container">
        <div className="error">{error}</div>
        <Link className="standingsBackBtn" to="/">
          ← Повернутися назад
        </Link>
      </div>
    );
  }

  if (!data) {
    return <div className="container muted">Loading...</div>;
  }

  const { team, stats, recentMatches } = data;
const tournamentLower = String(team.tournament || "").toLowerCase();

const isBasketball = tournamentLower.includes("nba") || tournamentLower.includes("basket");
const isHockey = tournamentLower.includes("nhl") || tournamentLower.includes("hockey");
const isTennis = tournamentLower.includes("atp") || tournamentLower.includes("tennis");
const isVolleyball = tournamentLower.includes("volley") || tournamentLower.includes("cev");
const isEsports =
  tournamentLower.includes("cs2") ||
  tournamentLower.includes("esl") ||
  tournamentLower.includes("iem") ||
  tournamentLower.includes("blast") ||
  tournamentLower.includes("pgl") ||
  tournamentLower.includes("major");

const statLabels = (() => {
  if (isBasketball) {
    return {
      scored: "Очок набрано",
      conceded: "Очок пропущено",
      diff: "Різниця очок",
      draws: null,
    };
  }

  if (isHockey) {
    return {
      scored: "Шайб закинуто",
      conceded: "Шайб пропущено",
      diff: "Різниця шайб",
      draws: null,
    };
  }

  if (isTennis) {
    return {
      scored: "Сетів виграно",
      conceded: "Сетів програно",
      diff: "Різниця сетів",
      draws: null,
    };
  }

  if (isVolleyball) {
    return {
      scored: "Сетів виграно",
      conceded: "Сетів програно",
      diff: "Різниця сетів",
      draws: null,
    };
  }

  if (isEsports) {
    return {
      scored: "Карт виграно",
      conceded: "Карт програно",
      diff: "Різниця карт",
      draws: null,
    };
  }

  return {
    scored: "Голів забито",
    conceded: "Голів пропущено",
    diff: "Різниця голів",
    draws: "Нічиїх",
  };
})();
  const form = recentMatches.slice(0, 5).map((m) => {
    const isHome = Number(m.home_team_id) === Number(team.team_id);

    const gf = isHome
      ? Number(m.score_home || 0)
      : Number(m.score_away || 0);

    const ga = isHome
      ? Number(m.score_away || 0)
      : Number(m.score_home || 0);

    if (gf > ga) return "🟢";
    if (gf === ga) return "🟡";
    return "🔴";
  });

  return (
    <div className="container teamPage">
      <Link className="standingsBackBtn" to="/">
        ← Повернутися назад
      </Link>

      <div className="teamHeroCard">
        {team.logo && (
          <img
            src={team.logo}
            alt={team.name}
            className="teamLogoBig"
          />
        )}

        <div>
          <h1>{teamName(team.name, lang)}</h1>
          <p className="muted">
            {team.tournament || "Турнір не вказано"}{" "}
            {team.country ? `• ${team.country}` : ""}
          </p>
        </div>
      </div>

      <div className="teamStatsGrid">
        <div className="teamStatBox">
          <span>Матчів</span>
          <strong>{stats.matches}</strong>
        </div>

        <div className="teamStatBox">
          <span>Перемог</span>
          <strong>{stats.wins}</strong>
        </div>

        <div className="teamStatBox">
          {statLabels.draws && (
  <div className="teamStatBox">
    <span>{statLabels.draws}</span>
    <strong>{stats.draws}</strong>
  </div>
)}
        </div>

        <div className="teamStatBox">
          <span>Поразок</span>
          <strong>{stats.losses}</strong>
        </div>

        <div className="teamStatBox">
          <span>{statLabels.scored}</span>
<strong>{stats.goalsFor}</strong>
        </div>

        <div className="teamStatBox">
       <span>{statLabels.conceded}</span>
<strong>{stats.goalsAgainst}</strong>
        </div>
      </div>

      <div className="teamFormCard">
        <span>Останні 5 матчів</span>

        <div className="teamFormDots">
          {form.length > 0
            ? form.map((x, i) => <span key={i}>{x}</span>)
            : "—"}
        </div>
      </div>

      <div className="teamMatchesCard">
        <h2>Останні матчі</h2>

        {recentMatches.length === 0 ? (
          <div className="muted">Матчів поки немає.</div>
        ) : (
          recentMatches.map((m) => (
            <Link
              key={m.match_id}
              to={`/matches/${m.match_id}`}
              className="teamMatchRow"
            >
              <span>{teamName(m.home_team, lang)}</span>
              <strong>
                {m.score_home} : {m.score_away}
              </strong>
              <span>{teamName(m.away_team, lang)}</span>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}