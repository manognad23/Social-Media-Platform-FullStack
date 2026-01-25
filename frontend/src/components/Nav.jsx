import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";

export function Nav() {
  const nav = useNavigate();
  const { user, clearSession } = useAuth();

  return (
    <div className="nav">
      <div className="nav-left">
        <Link className="brand" to="/">
          Spotmies
        </Link>
        <Link to="/feed">Feed</Link>
        {user ? <Link to="/profile">Profile</Link> : null}
        {user?.role === "admin" ? (
          <Link to="/admin">Admin</Link>
        ) : (
          <Link to="/admin/login" style={{ fontSize: "0.875rem", color: "#9ca3af" }}>
            Admin
          </Link>
        )}
      </div>
      <div className="nav-right">
        {user ? (
          <>
            {user.avatarUrl ? (
              <Link to="/profile">
                <img src={user.avatarUrl} alt={user.username} className="nav-avatar" />
              </Link>
            ) : (
              <Link to="/profile" className="nav-avatar-placeholder">
                {user.username?.slice(0, 1)?.toUpperCase() || "U"}
              </Link>
            )}
            <span className="muted">Signed in as</span> <b>{user.username}</b>
            <button
              className="btn secondary"
              onClick={() => {
                clearSession();
                nav("/login");
              }}
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </div>
    </div>
  );
}

