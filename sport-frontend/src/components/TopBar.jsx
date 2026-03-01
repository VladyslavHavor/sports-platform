import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { t } from "../i18n";
import logo from "../assets/logo.png";

export default function TopBar() {
  const { user, logout, lang, setLang } = useAuth();

  return (
    <div className="topbar">
      <Link to="/" className="brandLink">
       <div className="brand">
  <img src={logo} alt="Fastscore logo" className="brandLogo" />
  <span className="brandText">FASTSCORE</span>
</div>
      </Link>

      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <button className="btn" onClick={() => setLang(lang === "ua" ? "en" : "ua")}>
          {lang.toUpperCase()}
        </button>

        {user ? (
          <>
            <div className="muted" style={{ fontSize: 13 }}>
              {user.username} ({user.role})
            </div>
            <button className="btn" onClick={logout}>
              {t(lang, "logout")}
            </button>
          </>
        ) : (
          <>
            <Link className="btn" to="/login">{t(lang, "login")}</Link>
            <Link className="btnPrimary btn" to="/register">{t(lang, "register")}</Link>
          </>
        )}
      </div>
    </div>
  );
}