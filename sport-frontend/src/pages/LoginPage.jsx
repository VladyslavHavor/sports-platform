import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
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
    <div className="container">
      <h1>Login</h1>

      {error && <div className="error">{error}</div>}

      <form onSubmit={handleSubmit} className="form">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button type="submit" className="btn">
          Login
        </button>
      </form>
    </div>
  );
}