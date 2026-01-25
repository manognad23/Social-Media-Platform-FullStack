import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { apiFetch } from "../lib/api";
import { useAuth } from "../lib/AuthContext";

export function AdminLoginPage() {
  const nav = useNavigate();
  const { updateUser } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [adminSecret, setAdminSecret] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      const data = await apiFetch("/api/auth/admin/login", {
        method: "POST",
        body: { email, password, adminSecret },
      });
      updateUser(data.user);
      nav("/admin");
    } catch (e2) {
      setErr(e2.message || "Admin login failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card" style={{ maxWidth: "400px", margin: "40px auto" }}>
      <h2>🔐 Admin Login</h2>
      <p className="muted" style={{ marginBottom: "20px" }}>
        This is a secure admin-only login. Only authorized administrators can access this page.
      </p>
      <form className="form" onSubmit={onSubmit}>
        <label>
          Admin Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@example.com"
            required
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        <label>
          Admin Secret
          <input
            type="password"
            value={adminSecret}
            onChange={(e) => setAdminSecret(e.target.value)}
            placeholder="Enter admin secret key"
            required
          />
          <small className="muted" style={{ fontSize: "0.75rem", marginTop: "4px", display: "block" }}>
            This secret is only known to administrators
          </small>
        </label>
        {err ? <div className="error">{err}</div> : null}
        <button className="btn" disabled={busy}>
          {busy ? "Signing in..." : "Sign in as Admin"}
        </button>
      </form>
      <div className="muted" style={{ marginTop: "20px", textAlign: "center" }}>
        <Link to="/login">Regular User Login</Link>
      </div>
    </div>
  );
}
