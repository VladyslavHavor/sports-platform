import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { t } from "../i18n";

export default function RegisterPage() {
  const { doRegister, lang } = useAuth();
  const nav = useNavigate();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [err, setErr] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  async function onSubmit(e) {
    e.preventDefault();
    try {
      setErr("");
      setFieldErrors({});
      await doRegister(username, email, password);
      nav("/");
    } catch (e) {
      const data = e?.response?.data;
      if (data?.errors) setFieldErrors(data.errors);
      setErr(data?.error || e.message);
    }
  }

  return (
    <div className="authWrapper">
      <div className="authCard authCardWide">
        <h1 className="authTitle">{t(lang, "register")}</h1>

        {err && <div className="authError">{err}</div>}

        <form className="authForm" onSubmit={onSubmit}>
          <div className="inputGroup">
            <label>Username</label>
            <input
              className={fieldErrors.username ? "inputError" : ""}
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                if (fieldErrors.username) {
                  setFieldErrors((prev) => ({ ...prev, username: "" }));
                }
              }}
              placeholder="yourname"
              autoComplete="username"
            />
            {fieldErrors.username ? (
              <div className="fieldError">{fieldErrors.username}</div>
            ) : null}
          </div>

          <div className="inputGroup">
            <label>Email</label>
            <input
              className={fieldErrors.email ? "inputError" : ""}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (fieldErrors.email) {
                  setFieldErrors((prev) => ({ ...prev, email: "" }));
                }
              }}
              placeholder="you@example.com"
              autoComplete="email"
            />
            {fieldErrors.email ? (
              <div className="fieldError">{fieldErrors.email}</div>
            ) : null}
          </div>

          <div className="inputGroup">
            <label>Password</label>
            <input
              type="password"
              className={fieldErrors.password ? "inputError" : ""}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (fieldErrors.password) {
                  setFieldErrors((prev) => ({ ...prev, password: "" }));
                }
              }}
              placeholder="••••••••"
              autoComplete="new-password"
            />
            {fieldErrors.password ? (
              <div className="fieldError">{fieldErrors.password}</div>
            ) : null}
          </div>

          <div className="authActions">
            <button className="btnPrimary" type="submit">
              {t(lang, "register")}
            </button>

            <Link className="btnGhost" to="/login">
              {t(lang, "login")}
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}