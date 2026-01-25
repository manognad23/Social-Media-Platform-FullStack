import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { login } from "../lib/auth";
import { useAuth } from "../lib/AuthContext";

export function LoginPage() {
  const nav = useNavigate();
  const { updateUser } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      const data = await login(email, password);
      updateUser(data.user);
      nav("/feed");
    } catch (e2) {
      setErr(e2.message || "Login failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card">
      <h2>Login</h2>
      <form className="form" onSubmit={onSubmit}>
        <label>
          Email
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
        </label>
        <label>
          Password
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        {err ? <div className="error">{err}</div> : null}
        <button className="btn" disabled={busy}>
          {busy ? "Signing in..." : "Sign in"}
        </button>
      </form>
      <div className="muted">
        No account? <Link to="/register">Register</Link>
      </div>
    </div>
  );
}

