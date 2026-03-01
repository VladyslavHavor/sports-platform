import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getStandings } from "../api";

export default function StandingsPage() {
  const { id } = useParams();
  const [standings, setStandings] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        setError("");
        const data = await getStandings(id);
        setStandings(data);
      } catch (err) {
        console.error(err);
        setError(err?.response?.data?.error || err.message);
      }
    })();
  }, [id]);

  return (
    <div className="container" style={{ paddingTop: 60 }}>
      <div className="header">
        <div className="brand">
          <span className="dot" />
          SPORTS PLATFORM
        </div>

        <Link className="btn" to="/matches">
          ← Back
        </Link>
      </div>

      <div className="card">
        <h1>Tournament Standings</h1>
        <p className="muted">Table is calculated from match results and events.</p>

        {error && <div className="error">{error}</div>}
        {!error && standings.length === 0 && <p className="muted">Loading...</p>}

        {standings.length > 0 && (
          <div className="tableWrap" style={{ marginTop: 14 }}>
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Team</th>
                  <th>P</th>
                  <th>W</th>
                  <th>D</th>
                  <th>L</th>
                  <th>GF</th>
                  <th>GA</th>
                  <th>GD</th>
                  <th>Pts</th>
                </tr>
              </thead>

              <tbody>
                {standings.map((team, index) => (
                  <tr key={team.team_id}>
                    <td>{index + 1}</td>
                    <td style={{ fontWeight: 800 }}>{team.team_name}</td>
                    <td>{team.played}</td>
                    <td>{team.wins}</td>
                    <td>{team.draws}</td>
                    <td>{team.losses}</td>
                    <td>{team.goals_for}</td>
                    <td>{team.goals_against}</td>
                    <td>{team.goal_diff}</td>
                    <td style={{ fontWeight: 900 }}>{team.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}