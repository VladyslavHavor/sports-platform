import React from "react";
import { t } from "../i18n";
import { useAuth } from "../auth/AuthContext";

export default function Sidebar({ tournaments, selectedId, onSelect }) {
  const { lang } = useAuth();

  return (
    <div className="sidebar">
      <div className="sidebarTitle">{t(lang, "allLeagues")}</div>

      <button
        className={`sideItem ${selectedId === null ? "active" : ""}`}
        onClick={() => onSelect(null)}
      >
        {t(lang, "allLeagues")}
      </button>

      <div className="sideList">
        {tournaments.map((l) => (
          <button
            key={l.tournament_id}
            className={`sideItem ${selectedId === l.tournament_id ? "active" : ""}`}
            onClick={() => onSelect(l.tournament_id)}
          >
            <span className="sideDot" />
            <span>{l.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}