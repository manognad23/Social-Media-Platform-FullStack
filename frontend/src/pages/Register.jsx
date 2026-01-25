import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { register } from "../lib/auth";
import { useAuth } from "../lib/AuthContext";

export function RegisterPage() {
  const nav = useNavigate();
  const { user, updateUser } = useAuth();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) {
      nav("/feed");
    }
  }, [user, nav]);

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      const data = await register(username, email, password);
      updateUser(data.user);
      nav("/feed");
    } catch (e2) {
      setErr(e2.message || "Register failed");
    } finally {
      setBusy(false);
    }
  }

  if (user) {
    return null; // Will redirect
  }

  return (
    <div className="card">
      <h2>Create account</h2>
      <form className="form" onSubmit={onSubmit}>
        <label>
          Username
          <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="manogna" required />
        </label>
        <label>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
        </label>
        <label>
          Password
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
        </label>
        {err ? <div className="error">{err}</div> : null}
        <button className="btn" disabled={busy}>
          {busy ? "Creating..." : "Register"}
        </button>
      </form>
      <div className="muted">
        Already have an account? <Link to="/login">Login</Link>
      </div>
    </div>
  );
}

