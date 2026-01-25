import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../lib/api";
import { useAuth } from "../lib/AuthContext";

function SimpleBarChart({ data, label, color = "#3b82f6" }) {
  if (!data || data.length === 0) return <div className="muted">No data</div>;
  
  const maxValue = Math.max(...data.map((d) => d.count));
  
  return (
    <div className="chart-container">
      <div className="chart-bars">
        {data.map((item, idx) => (
          <div key={idx} className="chart-bar-wrapper">
            <div className="chart-bar" style={{ height: `${(item.count / maxValue) * 100}%`, backgroundColor: color }}>
              <span className="chart-value">{item.count}</span>
            </div>
            <div className="chart-label">{item.date || item.status}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatCard({ title, value, subtitle, icon, color }) {
  return (
    <div className="stat-card-admin" style={{ borderTop: `4px solid ${color}` }}>
      <div className="stat-card-header">
        <div className="stat-card-icon" style={{ backgroundColor: `${color}20`, color }}>
          {icon}
        </div>
        <div className="stat-card-content">
          <div className="stat-card-title">{title}</div>
          <div className="stat-card-value">{value}</div>
          {subtitle && <div className="stat-card-subtitle">{subtitle}</div>}
        </div>
      </div>
    </div>
  );
}

export function AdminPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [flagged, setFlagged] = useState({ posts: [], comments: [] });
  const [logs, setLogs] = useState([]);
  const [err, setErr] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && user.role !== "admin") {
      navigate("/");
      return;
    }
    if (!user) {
      navigate("/admin/login");
      return;
    }
    load();
  }, [user, navigate]);

  async function load() {
    setErr("");
    setNotice("");
    setLoading(true);
    try {
      const [s, f, l] = await Promise.all([
        apiFetch("/api/admin/stats"),
        apiFetch("/api/admin/flagged"),
        apiFetch("/api/admin/logs"),
      ]);
      setStats(s);
      setFlagged(f);
      setLogs(l.logs || []);
    } catch (e) {
      setErr(e.message || "Failed to load admin data");
    } finally {
      setLoading(false);
    }
  }

  async function act(targetType, targetId, action) {
    setErr("");
    setNotice("");
    try {
      await apiFetch("/api/admin/moderate", { method: "POST", body: { targetType, targetId, action } });
      setNotice("Updated.");
      await load();
    } catch (e) {
      setErr(e.message || "Action failed");
    }
  }

  if (!user || user.role !== "admin") {
    return null; // Will redirect
  }

  if (loading) {
    return (
      <div className="card">
        <h2>Admin Dashboard</h2>
        <div className="muted">Loading...</div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h1>Admin Dashboard</h1>
        <p className="muted">Manage your platform and view statistics</p>
      </div>

      {notice ? <div className="notice">{notice}</div> : null}
      {err ? <div className="error">{err}</div> : null}

      {/* Statistics Cards */}
      {stats && (
        <div className="stats-grid">
          <StatCard
            title="Total Users"
            value={stats.totals.users}
            subtitle={`${stats.recent.users} new this week`}
            icon="👥"
            color="#3b82f6"
          />
          <StatCard
            title="Total Posts"
            value={stats.totals.posts}
            subtitle={`${stats.recent.posts} new this week`}
            icon="📝"
            color="#10b981"
          />
          <StatCard
            title="Total Comments"
            value={stats.totals.comments}
            subtitle={`${stats.recent.comments} new this week`}
            icon="💬"
            color="#8b5cf6"
          />
          <StatCard
            title="Admins"
            value={stats.totals.admins}
            subtitle="Administrators"
            icon="👑"
            color="#f59e0b"
          />
        </div>
      )}

      {/* Moderation Stats */}
      {stats && (
        <div className="stats-grid">
          <StatCard
            title="Flagged Posts"
            value={stats.moderation.flaggedPosts}
            subtitle="Pending review"
            icon="🚩"
            color="#ef4444"
          />
          <StatCard
            title="Flagged Comments"
            value={stats.moderation.flaggedComments}
            subtitle="Pending review"
            icon="🚩"
            color="#ef4444"
          />
          <StatCard
            title="Visible Posts"
            value={stats.moderation.visiblePosts}
            subtitle="Active posts"
            icon="✅"
            color="#10b981"
          />
          <StatCard
            title="Removed Posts"
            value={stats.moderation.removedPosts}
            subtitle="Deleted content"
            icon="🗑️"
            color="#6b7280"
          />
        </div>
      )}

      {/* Charts */}
      {stats && (
        <div className="charts-grid">
          <div className="card">
            <h3>Posts Created (Last 30 Days)</h3>
            <SimpleBarChart data={stats.charts.postsByDay} label="Posts" color="#3b82f6" />
          </div>
          <div className="card">
            <h3>New Users (Last 30 Days)</h3>
            <SimpleBarChart data={stats.charts.usersByDay} label="Users" color="#10b981" />
          </div>
          <div className="card">
            <h3>Posts by Status</h3>
            <SimpleBarChart data={stats.charts.postsByStatus} label="Status" color="#8b5cf6" />
          </div>
        </div>
      )}

      {/* Flagged Content */}
      <div className="card">
        <h3>🚩 Flagged Posts</h3>
        {(flagged.posts || []).length ? (
          flagged.posts.map((p) => (
            <div key={p.id} className="admin-item">
              <div className="admin-main">
                <div>
                  <b>{p.author.username}</b> <span className="muted">({p.author.email})</span>
                </div>
                {p.text ? <div className="admin-text">{p.text}</div> : null}
                {p.imageUrl ? (
                  <a href={p.imageUrl} target="_blank" rel="noreferrer">
                    View image
                  </a>
                ) : null}
                <details>
                  <summary>Moderation details</summary>
                  <pre className="pre">{JSON.stringify(p.moderation || {}, null, 2)}</pre>
                </details>
              </div>
              <div className="admin-actions">
                <button className="btn danger" onClick={() => act("post", p.id, "remove")}>
                  Remove
                </button>
                <button className="btn secondary" onClick={() => act("post", p.id, "restore")}>
                  Restore
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="muted">No flagged posts.</div>
        )}
      </div>

      <div className="card">
        <h3>🚩 Flagged Comments</h3>
        {(flagged.comments || []).length ? (
          flagged.comments.map((c) => (
            <div key={c.id} className="admin-item">
              <div className="admin-main">
                <div>
                  <b>{c.author.username}</b> <span className="muted">({c.author.email})</span>
                </div>
                <div className="admin-text">{c.text}</div>
                <div className="muted">postId: {c.postId}</div>
                <details>
                  <summary>Moderation details</summary>
                  <pre className="pre">{JSON.stringify(c.moderation || {}, null, 2)}</pre>
                </details>
              </div>
              <div className="admin-actions">
                <button className="btn danger" onClick={() => act("comment", c.id, "remove")}>
                  Remove
                </button>
                <button className="btn secondary" onClick={() => act("comment", c.id, "restore")}>
                  Restore
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="muted">No flagged comments.</div>
        )}
      </div>

      <div className="card">
        <h3>📋 Moderation Logs</h3>
        {(logs || []).length ? (
          <div className="logs">
            {logs.map((l) => (
              <div key={l.id} className="log">
                <div>
                  <b>{l.action.toUpperCase()}</b> <span className="muted">{l.targetType}</span> <code>{l.targetId}</code>
                  {l.flagged ? <span className="pill">flagged</span> : null}
                </div>
                <div className="muted">{new Date(l.createdAt).toLocaleString()}</div>
                {l.inputSummary ? <div className="muted">input: {l.inputSummary}</div> : null}
              </div>
            ))}
          </div>
        ) : (
          <div className="muted">No logs yet.</div>
        )}
      </div>
    </div>
  );
}
