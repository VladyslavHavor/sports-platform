import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getStandings } from "../api";
import { teamName } from "../teamTranslations";
import { useAuth } from "../auth/AuthContext";

export default function StandingsPage({ tournaments = [] }) {
  const { id } = useParams();

  const [season, setSeason] = useState(2025);
  const [standings, setStandings] = useState([]);
  const [error, setError] = useState("");
const { lang } = useAuth();
  const tournament = useMemo(() => {
    return tournaments.find((t) => Number(t.tournament_id) === Number(id));
  }, [tournaments, id]);

  const sportName = String(tournament?.sport_name || "").toLowerCase();

  const columns = useMemo(() => {
    if (sportName === "tennis") {
      return {
        team: "Player",
        gf: "SF",
        ga: "SA",
        gd: "SD",
        points: "Pts",
        showDraws: false,
      };
    }

    if (["basketball", "hockey", "volleyball", "esports"].includes(sportName)) {
      return {
        team: "Team",
        gf: "PF",
        ga: "PA",
        gd: "PD",
        points: "Pts",
        showDraws: false,
      };
    }

    return {
      team: "Team",
      gf: "GF",
      ga: "GA",
      gd: "GD",
      points: "Pts",
      showDraws: true,
    };
  }, [sportName]);

  useEffect(() => {
    (async () => {
      try {
        setError("");
        setStandings([]);

        const data = await getStandings(id, season);
        setStandings(data);
      } catch (err) {
        console.error(err);
        setError(err?.response?.data?.error || err.message);
      }
    })();
  }, [id, season]);

  return (
    <div className="container standingsPage">
      <div className="header">
        <div className="brand"></div>

        <Link className="standingsBackBtn" to="/">
          <span className="backArrow">←</span>
          <span>Повернутися назад</span>
        </Link>
      </div>

      <div className="card">
        <div className="pageHead">
          <div>
            <h1>Турнірна таблиця</h1>
            <p className="muted">
              {tournament?.name ? `${tournament.name}  ` : ""}

            </p>
          </div>
        </div>

        <div className="seasonSelectRow">
          <div className="field" style={{ width: 260 }}>
            <div className="label">Сезон</div>

            <select
              className="select"
              value={season}
              onChange={(e) => setSeason(Number(e.target.value))}
            >
              <option value={2025}>2025/2026</option>
              <option value={2024}>2024/2025</option>
              <option value={2023}>2023/2024</option>
            </select>
          </div>
        </div>

        {error && <div className="error">{error}</div>}

        {!error && standings.length === 0 && (
          <div className="emptyStandings">
            <p className="muted">Даних для цього сезону поки немає.</p>
          </div>
        )}

        {standings.length > 0 && (
          <div className="tableWrap" style={{ marginTop: 14 }}>
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>{columns.team}</th>
                  <th>P</th>
                  <th>W</th>
                  {columns.showDraws && <th>D</th>}
                  <th>L</th>
                  <th>{columns.gf}</th>
                  <th>{columns.ga}</th>
                  <th>{columns.gd}</th>
                  <th>{columns.points}</th>
                </tr>
              </thead>

              <tbody>
                {standings.map((team, index) => (
                  <tr key={team.team_id}>
                    <td>{index + 1}</td>
<td style={{ fontWeight: 800 }}>
  <Link
    to={`/teams/${team.team_id}`}
    className="standingsTeamLink"
  >
    {teamName(team.team_name, lang)}
  </Link>
</td>                    <td>{team.played}</td>
                    <td>{team.wins}</td>
                    {columns.showDraws && <td>{team.draws}</td>}
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