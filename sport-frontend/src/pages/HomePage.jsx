import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getMatches, getFavorites, addFavorite, removeFavorite } from "../api";

export default function HomePage({ selectedLeagueId }) {
  const [matches, setMatches] = useState([]);
  const [error, setError] = useState("");

  const [status, setStatus] = useState("ALL");

  const [favorites, setFavorites] = useState(new Set());
  const [favError, setFavError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        setError("");

        const params = {};
        if (selectedLeagueId) params.tournamentId = selectedLeagueId;
        if (status !== "ALL") params.status = status;

        const data = await getMatches(params);
        setMatches(data);

        // якщо користувач залогінений — підтягнемо favorites
        try {
          const fav = await getFavorites();
          setFavorites(new Set(fav));
        } catch {
          setFavorites(new Set());
        }
      } catch (e) {
        setError(e?.response?.data?.error || e.message);
      }
    })();
  }, [selectedLeagueId, status]);

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
      const next = new Set(favorites);

      if (next.has(teamId)) {
        await removeFavorite(teamId);
        next.delete(teamId);
      } else {
        await addFavorite(teamId);
        next.add(teamId);
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
          <div className="h1">Dashboard</div>
          <div className="muted">Quick overview. Filter by match status.</div>
        </div>

        <Link className="btn" to="/matches">
          All matches →
        </Link>
      </div>

      {error && <div className="error">{error}</div>}
      {favError && <div className="error">{favError}</div>}

      {!error && matches.length === 0 && <p className="muted">Loading...</p>}

      {matches.length > 0 && (
        <>
          <div className="chipsRow">
            <div className="chip">Total: {counts.total}</div>
            <div className="chip">Live now: {counts.liveNow}</div>
            <div className="chip">Today: {counts.today}</div>
            <div className="chip">Finished: {counts.finished}</div>
          </div>

          <div className="filtersRow">
            <div className="field" style={{ width: 240 }}>
              <div className="label">Status</div>
              <select
                className="select"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="ALL">All</option>
                <option value="scheduled">scheduled</option>
                <option value="live">live</option>
                <option value="finished">finished</option>
              </select>
            </div>

            <button className="btn" onClick={() => setStatus("ALL")}>
              Reset
            </button>
          </div>

          <div className="list">
            {matches.map((m) => (
              <div key={m.match_id} className="matchRow">
                <div className="cardRowMain">
                  <div
                    style={{
                      display: "flex",
                      gap: 10,
                      alignItems: "center",
                      flexWrap: "wrap",
                    }}
                  >
                    {/* ⭐ home team */}
                    <button
                      className="starBtn"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleFav(m.home_team_id);
                      }}
                      title="Favorite team"
                    >
                      {favorites.has(m.home_team_id) ? "★" : "☆"}
                    </button>

                    <Link className="cardTitle" to={`/matches/${m.match_id}`}>
                      {m.home_team} <span style={{ opacity: 0.7 }}>vs</span>{" "}
                      {m.away_team}
                    </Link>

                    {/* ⭐ away team */}
                    <button
                      className="starBtn"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleFav(m.away_team_id);
                      }}
                      title="Favorite team"
                    >
                      {favorites.has(m.away_team_id) ? "★" : "☆"}
                    </button>
                  </div>

                  <div className="meta">
                    <span>{new Date(m.match_date).toLocaleString()}</span>
                    <span className="dot">•</span>
                    <span>{m.tournament || "No tournament"}</span>
                    <span className="dot">•</span>
                    <span className={`badge ${m.status}`}>
                      <span className="badgeDot" />
                      {m.status}
                    </span>

                    {m.tournament_id ? (
                      <>
                        <span className="dot">•</span>
                        <Link to={`/tournaments/${m.tournament_id}/standings`}>
                          View standings →
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