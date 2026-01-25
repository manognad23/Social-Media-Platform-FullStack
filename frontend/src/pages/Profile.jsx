import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api";
import { fetchMe } from "../lib/auth";
import { useAuth } from "../lib/AuthContext";

function timeAgo(iso) {
  const d = new Date(iso);
  const sec = Math.floor((Date.now() - d.getTime()) / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 48) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  return `${day}d ago`;
}

export function ProfilePage() {
  const { user: authUser, updateUser } = useAuth();
  const [user, setUser] = useState(authUser);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [username, setUsername] = useState(authUser?.username || "");
  const [bio, setBio] = useState(authUser?.bio || "");
  const [aboutMe, setAboutMe] = useState(authUser?.aboutMe || "");
  const [avatarUrl, setAvatarUrl] = useState(authUser?.avatarUrl || "");
  const [err, setErr] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (authUser) {
      setUser(authUser);
      setUsername(authUser.username || "");
      setBio(authUser.bio || "");
      setAboutMe(authUser.aboutMe || "");
      setAvatarUrl(authUser.avatarUrl || "");
    }
    loadProfile();
  }, [authUser]);

  useEffect(() => {
    if (user?.id) {
      loadPosts();
    }
  }, [user?.id]);

  async function loadProfile() {
    try {
      const u = await fetchMe();
      setUser(u);
      setUsername(u.username || "");
      setBio(u.bio || "");
      setAboutMe(u.aboutMe || "");
      setAvatarUrl(u.avatarUrl || "");
    } catch (e) {
      setErr("Please login to view your profile");
      setUser(null);
    }
  }

  async function loadPosts() {
    if (!user?.id) return;
    setLoading(true);
    try {
      const data = await apiFetch(`/api/posts/user/${user.id}`);
      setPosts(data.posts || []);
    } catch (e) {
      setErr(e.message || "Failed to load posts");
    } finally {
      setLoading(false);
    }
  }

  async function saveProfile(e) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    setNotice("");
    try {
      const data = await apiFetch("/api/me", { method: "PUT", body: { username, bio, aboutMe, avatarUrl } });
      setUser(data.user);
      updateUser(data.user);
      setNotice("Profile updated.");
      setIsEditing(false);
      await loadProfile();
    } catch (e2) {
      setErr(e2.message || "Failed to update");
    } finally {
      setBusy(false);
    }
  }

  async function deletePost(postId) {
    if (!confirm("Are you sure you want to delete this post?")) return;
    try {
      await apiFetch(`/api/posts/${postId}`, { method: "DELETE" });
      setNotice("Post deleted.");
      await loadPosts();
    } catch (e) {
      setErr(e.message || "Failed to delete post");
    }
  }

  if (!user && !loading) {
    return (
      <div className="card">
        <h2>Profile</h2>
        <div className="error">Please login to view your profile.</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="card">
        <h2>Profile</h2>
        <div className="muted">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      {/* Profile Header */}
      <div className="profile-header">
        <div className="profile-avatar-section">
          {avatarUrl ? (
            <img src={avatarUrl} alt={username} className="profile-avatar-large" />
          ) : (
            <div className="profile-avatar-large profile-avatar-placeholder">
              {username?.slice(0, 1)?.toUpperCase() || "U"}
            </div>
          )}
        </div>
        
        <div className="profile-info-section">
          <div className="profile-username-row">
            <h1 className="profile-username">{username}</h1>
            {!isEditing && (
              <button className="btn btn-edit-profile" onClick={() => setIsEditing(true)}>
                Edit Profile
              </button>
            )}
          </div>

          {!isEditing ? (
            <>
              <div className="profile-stats">
                <div className="profile-stat">
                  <span className="stat-number">{posts.length}</span>
                  <span className="stat-label">posts</span>
                </div>
              </div>

              <div className="profile-bio-section">
                <div className="profile-name">{username}</div>
                {bio && <div className="profile-bio">{bio}</div>}
                {aboutMe && <div className="profile-about">{aboutMe}</div>}
                <div className="profile-email muted">{user.email}</div>
              </div>
            </>
          ) : (
            <form className="profile-edit-form" onSubmit={saveProfile}>
              {notice ? <div className="notice">{notice}</div> : null}
              {err ? <div className="error">{err}</div> : null}
              
              <label>
                Username
                <input value={username} onChange={(e) => setUsername(e.target.value)} required />
              </label>
              
              <label>
                Bio
                <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={2} maxLength={280} />
              </label>
              
              <label>
                About Me
                <textarea value={aboutMe} onChange={(e) => setAboutMe(e.target.value)} rows={4} maxLength={1000} placeholder="Tell us about yourself..." />
              </label>
              
              <label>
                Avatar URL
                <input value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="https://..." />
              </label>
              
              <div className="profile-edit-actions">
                <button type="submit" className="btn" disabled={busy}>
                  {busy ? "Saving..." : "Save Changes"}
                </button>
                <button type="button" className="btn secondary" onClick={() => {
                  setIsEditing(false);
                  setUsername(user.username || "");
                  setBio(user.bio || "");
                  setAboutMe(user.aboutMe || "");
                  setAvatarUrl(user.avatarUrl || "");
                }}>
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Posts Grid */}
      <div className="profile-posts-section">
        <div className="profile-posts-header">
          <h2>Posts</h2>
        </div>
        
        {loading ? (
          <div className="muted" style={{ textAlign: "center", padding: "40px" }}>Loading posts...</div>
        ) : posts.length === 0 ? (
          <div className="profile-no-posts">
            <div className="no-posts-icon">📷</div>
            <div className="no-posts-text">No posts yet</div>
            <div className="muted">Share your first post to get started!</div>
          </div>
        ) : (
          <div className="profile-posts-grid">
            {posts.map((post) => (
              <div key={post.id} className="profile-post-item">
                {post.image?.url ? (
                  <img src={post.image.url} alt="Post" className="profile-post-image" />
                ) : post.text ? (
                  <div className="profile-post-text-preview">
                    <p>{post.text.length > 100 ? post.text.substring(0, 100) + "..." : post.text}</p>
                  </div>
                ) : null}
                <div className="profile-post-overlay">
                  <div className="profile-post-stats">
                    <span>💬 {post.comments?.length || 0}</span>
                  </div>
                  <button 
                    className="profile-post-delete" 
                    onClick={() => deletePost(post.id)}
                    title="Delete post"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
