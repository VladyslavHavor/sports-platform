import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getFavorites } from "../api";
import { useAuth } from "../auth/AuthContext";
import { teamName } from "../teamTranslations";

export default function ProfilePage() {
  const { user, lang } = useAuth();

  const [favorites, setFavorites] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    getFavorites()
      .then((data) => setFavorites(data || []))
      .catch((e) => setError(e?.response?.data?.error || e.message));
  }, []);

  if (!user) {
    return (
      <div className="container">
        <div className="error">Щоб переглянути профіль, увійдіть в акаунт.</div>
        <Link className="standingsBackBtn" to="/login">
          Увійти
        </Link>
      </div>
    );
  }

  return (
    <div className="container profilePage">
      <Link className="standingsBackBtn" to="/">
        ← Повернутися назад
      </Link>

      <div className="profileHero">
        <div className="profileAvatar">
          {user.username?.[0]?.toUpperCase() || "U"}
        </div>

        <div>
          <h1>{user.username}</h1>
          <p className="muted">{user.email}</p>

          <div className="profileRole">
            {user.role?.toUpperCase()}
          </div>
        </div>
      </div>

      <div className="profileCard">
        <h2>Улюблені команди</h2>

        {error && <div className="error">{error}</div>}

        {!error && favorites.length === 0 && (
          <div className="muted">
            Улюблених команд поки немає.
          </div>
        )}

        <div className="favoriteTeamsList">
          {favorites.map((team) => (
            <Link
              key={team.team_id}
              to={`/teams/${team.team_id}`}
              className="favoriteTeamItem"
            >
              {team.logo && (
                <img
                  src={team.logo}
                  alt={team.name}
                  className="favoriteTeamLogo"
                />
              )}

              <div>
                <strong>{teamName(team.name || team.team_name, lang)}</strong>
                <span>{team.tournament || "Турнір не вказано"}</span>
              </div>

              <div className="favoriteArrow">→</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}