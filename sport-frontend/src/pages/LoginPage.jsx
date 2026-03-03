import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { login } from "../api";
import { useAuth } from "../auth/AuthContext";

export default function LoginPage() {
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      setError("");
      const data = await login({ email, password });
      localStorage.setItem("token", data.token);
      setUser(data.user);
      navigate("/");
    } catch (err) {
      setError(err?.response?.data?.error || err.message);
    }
  }

  return (
    <div className="authWrapper">
      <div className="authCard authCardWide">
        <h1 className="authTitle">Вхід</h1>

        {error && <div className="authError">{error}</div>}

        <form onSubmit={handleSubmit} className="authForm">
          <div className="inputGroup">
            <label>Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="inputGroup">
            <label>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="authActions">
            <button type="submit" className="btnPrimary">
              Вхід
            </button>

            <Link to="/register" className="btnGhost">
              Реєстрація
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}