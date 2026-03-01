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

  // старе загальне повідомлення
  const [err, setErr] = useState("");

  // ✅ NEW: помилки по полям
  const [fieldErrors, setFieldErrors] = useState({});

  return (
    <div className="content">
      <div className="card" style={{ maxWidth: 520 }}>
        <h1>{t(lang, "register")}</h1>

        {/* Загальна помилка (як було) */}
        {err && <div className="error">{err}</div>}

        <div className="field">
          <label>Username</label>
          <input
            className={fieldErrors.username ? "inputError" : ""}
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              // ✅ NEW: прибираємо помилку коли користувач вводить
              if (fieldErrors.username) {
                setFieldErrors((prev) => ({ ...prev, username: "" }));
              }
            }}
          />
          {/* ✅ NEW: текст під полем */}
          {fieldErrors.username ? (
            <div className="fieldError">{fieldErrors.username}</div>
          ) : null}
        </div>

        <div className="field" style={{ marginTop: 10 }}>
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
          />
          {fieldErrors.email ? (
            <div className="fieldError">{fieldErrors.email}</div>
          ) : null}
        </div>

        <div className="field" style={{ marginTop: 10 }}>
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
          />
          {fieldErrors.password ? (
            <div className="fieldError">{fieldErrors.password}</div>
          ) : null}
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
          <button
            className="btnPrimary btn"
            onClick={async () => {
              try {
                setErr("");
                setFieldErrors({}); // ✅ NEW: скидаємо помилки полів
                await doRegister(username, email, password);
                nav("/");
              } catch (e) {
                const data = e?.response?.data;

                // ✅ NEW: якщо бек прислав errors — показуємо їх
                if (data?.errors) {
                  setFieldErrors(data.errors);
                }

                // залишаємо загальну помилку (як було)
                setErr(data?.error || e.message);
              }
            }}
          >
            {t(lang, "register")}
          </button>

          <Link className="btn" to="/login">
            {t(lang, "login")}
          </Link>
        </div>
      </div>
    </div>
  );
}