import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getMatches, getFavorites, addFavorite, removeFavorite } from "../api";
import { useAuth } from "../auth/AuthContext";
import { t } from "../i18n";

export default function HomePage({ selectedSportId, selectedLeagueId }) {
  const { lang } = useAuth();
  const [matches, setMatches] = useState([]);
  const [error, setError] = useState("");

  const [status, setStatus] = useState("all");

  const [favorites, setFavorites] = useState(new Set());
  const [favError, setFavError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        setError("");

        const params = {};
        // якщо вибрана ліга — фільтруємо по лізі
        if (selectedLeagueId) params.tournamentId = selectedLeagueId;
        // якщо ліга НЕ вибрана — фільтруємо по спорту
        else if (selectedSportId) params.sportId = selectedSportId;

        if (status !== "all") params.status = status;

        const data = await getMatches(params);
        setMatches(data);

        // favorites
        try {
          const fav = await getFavorites();
          const ids = Array.isArray(fav)
            ? fav.map((x) => (typeof x === "object" ? x.team_id : x))
            : [];
          setFavorites(new Set(ids.map((x) => Number(x))));
        } catch {
          setFavorites(new Set());
        }
      } catch (e) {
        setError(e?.response?.data?.error || e.message);
      }
    })();
  }, [selectedLeagueId, selectedSportId, status]);

  const counts = useMemo(() => {
    const total = matches.length;
    const liveNow = matches.filter((m) => m.status === "live").length;
    const finished = matches.filter((m) => m.status === "finished").length;

    const todayStr = new Date().toDateString();
    const today = matches.filter(
      (m) => new Date(m.match_date).toDateString() === todayStr
    ).length;

    return { total, liveNow, today, finished };
  }, [matches]);

  async function toggleFav(teamId) {
    try {
      setFavError("");
      const id = Number(teamId);
      const next = new Set(favorites);

      if (next.has(id)) {
        await removeFavorite(id);
        next.delete(id);
      } else {
        await addFavorite(id);
        next.add(id);
      }
      setFavorites(next);
    } catch (e) {
      setFavError(e?.response?.data?.error || e.message || "Favorites error");
    }
  }

  return (
    <div className="container">
      <div className="pageHead">
        <div>
          <div className="h1">{t(lang, "dashboard")}</div>
          <div className="muted">{t(lang, "dashboardHint")}</div>
        </div>

        <Link className="btn" to="/matches">
          {t(lang, "allMatches")} →
        </Link>
      </div>

      {error && <div className="error">{error}</div>}
      {favError && <div className="error">{favError}</div>}

      {!error && matches.length === 0 && <p className="muted">{t(lang, "loading")}</p>}

      {matches.length > 0 && (
        <>
          <div className="chipsRow">
            <div className="chip">{t(lang, "total")}: {counts.total}</div>
            <div className="chip">{t(lang, "liveNow")}: {counts.liveNow}</div>
            <div className="chip">{t(lang, "today")}: {counts.today}</div>
            <div className="chip">{t(lang, "finished")}: {counts.finished}</div>
          </div>

          <div className="filtersRow">
            <div className="field" style={{ width: 240 }}>
              <div className="label">{t(lang, "status")}</div>
              <select
                className="select"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="all">{t(lang, "all")}</option>
                <option value="scheduled">{t(lang, "scheduled")}</option>
                <option value="live">{t(lang, "live")}</option>
                <option value="finished">{t(lang, "finished")}</option>
              </select>
            </div>

            <button className="btn" onClick={() => setStatus("all")}>
              {t(lang, "reset")}
            </button>
          </div>

          <div className="list">
            {matches.map((m) => (
              <div key={m.match_id} className="matchRow">
                <div className="cardRowMain">
                  <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                    <button
                      className="starBtn"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleFav(m.home_team_id);
                      }}
                      title={t(lang, "favoriteTeam")}
                    >
                      {favorites.has(Number(m.home_team_id)) ? "★" : "☆"}
                    </button>

                    <Link className="cardTitle" to={`/matches/${m.match_id}`}>
                      {m.home_team} <span style={{ opacity: 0.7 }}>{t(lang, "vs")}</span>{" "}
                      {m.away_team}
                    </Link>

                    <button
                      className="starBtn"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleFav(m.away_team_id);
                      }}
                      title={t(lang, "favoriteTeam")}
                    >
                      {favorites.has(Number(m.away_team_id)) ? "★" : "☆"}
                    </button>
                  </div>

                  <div className="meta">
                    <span>{new Date(m.match_date).toLocaleString()}</span>
                    <span className="dot">•</span>
                    <span>{m.tournament || t(lang, "noTournament")}</span>
                    <span className="dot">•</span>
                    <span className={`badge ${m.status}`}>
                      <span className="badgeDot" />
                      {t(lang, m.status)}
                    </span>

                    {m.tournament_id ? (
                      <>
                        <span className="dot">•</span>
                        <Link to={`/tournaments/${m.tournament_id}/standings`}>
                          {t(lang, "viewStandings")} →
                        </Link>
                      </>
                    ) : null}
                  </div>
                </div>

                <div className="scoreBubble">
                  {m.score_home} : {m.score_away}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}