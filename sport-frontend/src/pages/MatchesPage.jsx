import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getMatches } from "../api";

export default function MatchesPage({ selectedLeagueId }) {
  const [matches, setMatches] = useState([]);
  const [error, setError] = useState("");

  const [status, setStatus] = useState("ALL");

  useEffect(() => {
    (async () => {
      try {
        setError("");
        const params = {};
        if (selectedLeagueId) params.tournamentId = selectedLeagueId;
        if (status !== "ALL") params.status = status;

        const data = await getMatches(params);
        setMatches(data);
      } catch (e) {
        setError(e?.response?.data?.error || e.message);
      }
    })();
  }, [selectedLeagueId, status]);

  return (
    <div className="container">
      <div className="pageHead">
        <div>
          <div className="h1">Matches</div>
          <div className="muted">All matches. Filter by match status.</div>
        </div>

        <Link className="btn" to="/">
          ← Dashboard
        </Link>
      </div>

      {error && <div className="error">{error}</div>}
      {!error && matches.length === 0 && <p className="muted">Loading...</p>}

      {matches.length > 0 && (
        <>
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
              <div key={m.match_id} className="cardRow">
                <div className="cardRowMain">
                  <Link className="cardTitle" to={`/matches/${m.match_id}`}>
                    {m.home_team} <span style={{ opacity: 0.7 }}>vs</span>{" "}
                    {m.away_team}
                  </Link>

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