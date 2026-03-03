import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { t } from "../i18n";
import logo from "../assets/logo.png";
import footballIcon from "../assets/icons/football.png";
import basketballIcon from "../assets/icons/basketball.png";
import esportsIcon from "../assets/icons/esports.png";
import hockeyIcon from "../assets/icons/hockey.png";
import tennisIcon from "../assets/icons/tennis.png";
import volleyballIcon from "../assets/icons/volleyball.png";

export default function TopBar({ sports = [], selectedSportId, onSelectSport }) {
  const { user, logout, lang, setLang } = useAuth();

  function sportIcon(name) {
  const n = String(name || "").toLowerCase();

  if (n === "football") return footballIcon; 
  if (n === "basketball") return basketballIcon;
  if (n === "hockey") return hockeyIcon;
  if (n === "volleyball") return volleyballIcon;
  if (n === "esports") return esportsIcon;
  if (n === "tennis") return tennisIcon;

  return footballIcon;
}

  
  return (
    <div className="topbar">
      {/* LEFT: brand */}
      <Link to="/" className="brandLink">
        <div className="brand">
          <img src={logo} alt="Fastscore logo" className="brandLogo" />
          <span className="brandText">FASTSCORE</span>
        </div>
      </Link>

      {/* MIDDLE: sports tabs */}
      {sports?.length ? (
        <div className="sportTabs" aria-label="Sports">
          {sports.map((s) => {
            const active = Number(s.sport_id) === Number(selectedSportId);
            return (
              <button
                key={s.sport_id}
                type="button"
                className={`sportTab ${active ? "active" : ""}`}
                onClick={() => onSelectSport?.(Number(s.sport_id))}
                title={s.name}
              >
              <img
              src={sportIcon(s.name)}
              alt={s.name}
              className="sportIconImg"
              />                
              <span className="sportName">{s.name}</span>
              </button>
            );
          })}
        </div>
      ) : (
        <div style={{ flex: 1 }} />
      )}

      {/* RIGHT: actions */}
 <div className="topbarRight">
 {/* Language Switcher (NEW) */}
<div className="langWrap"> {/* (ДОДАНО) контейнер для кастомного стилізованого select */}
  <div className="langSelectBox"> {/* (ДОДАНО) обгортка для іконки + стрілки */}


    <select
      className="langSelect" /* (ДОДАНО) окремий клас для преміум-стилізації */
      value={lang}
      onChange={(e) => setLang(e.target.value)}
    >
      <option value="ua">UA — Українська</option>
      <option value="en">EN — English</option>
      <option value="de">DE — Deutsch</option>
      <option value="es">ES — Español</option>
    </select>
  
  </div>
</div>

  {user ? (
    <>
      <div className="muted" style={{ fontSize: 13 }}>
        {user.username} ({user.role})
      </div>
      <button className="btn" onClick={logout}>
        {t(lang, "logout") || "Logout"}
      </button>
    </>
  ) : (
    <>
      <Link className="btn" to="/login">
        {t(lang, "login")}
      </Link>
      <Link className="btnPrimary btn" to="/register">
        {t(lang, "register")}
      </Link>
    </>
  )}
</div>
    </div>
  );
}