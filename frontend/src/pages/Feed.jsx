import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../lib/api";
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

export function FeedPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [text, setText] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  async function load() {
    setErr("");
    setLoading(true);
    try {
      const data = await apiFetch("/api/posts");
      setPosts(data.posts || []);
    } catch (e) {
      setErr(e.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const canPost = useMemo(() => Boolean(user), [user]);

  async function uploadImageIfNeeded() {
    if (!imageFile) return { imageUrl: "", imagePublicId: "" };
    const form = new FormData();
    form.append("image", imageFile);
    const data = await apiFetch("/api/uploads/image", { method: "POST", body: form, isForm: true });
    return { imageUrl: data.image.url, imagePublicId: data.image.publicId };
  }

  async function createPost(e) {
    e.preventDefault();
    if (!canPost) return;
    setBusy(true);
    setNotice("");
    setErr("");
    try {
      const { imageUrl, imagePublicId } = await uploadImageIfNeeded();
      const data = await apiFetch("/api/posts", {
        method: "POST",
        body: { text, imageUrl, imagePublicId },
      });
      if (data?.post?.status === "flagged") {
        setNotice("Your post was flagged by AI moderation and is hidden pending admin review.");
      } else {
        setNotice("Posted!");
      }
      setText("");
      setImageFile(null);
      await load();
    } catch (e2) {
      setErr(e2.message || "Failed to post");
    } finally {
      setBusy(false);
    }
  }

  async function addComment(postId, commentText, onDone) {
    setErr("");
    setNotice("");
    try {
      const data = await apiFetch(`/api/posts/${postId}/comments`, { method: "POST", body: { text: commentText } });
      if (data?.comment?.status === "flagged") {
        setNotice("Your comment was flagged by AI moderation and is hidden pending admin review.");
      } else {
        setNotice("Comment added.");
      }
      await load();
      onDone?.();
    } catch (e2) {
      setErr(e2.message || "Failed to comment");
    }
  }

  async function deletePost(postId) {
    try {
      await apiFetch(`/api/posts/${postId}`, { method: "DELETE" });
      setNotice("Post deleted.");
      await load();
    } catch (e) {
      setErr(e.message || "Failed to delete post");
    }
  }

  return (
    <div className="layout">
      <div className="col">
        <div className="card">
          <h2>Feed</h2>
          {user ? <div className="muted">Welcome, <b>{user.username}</b></div> : <div className="muted">Login to post.</div>}
          {notice ? <div className="notice">{notice}</div> : null}
          {err ? <div className="error">{err}</div> : null}
        </div>

        {user ? (
          <div className="card">
            <h3>Create post</h3>
            <form className="form" onSubmit={createPost}>
              <label>
                Text
                <textarea value={text} onChange={(e) => setText(e.target.value)} rows={4} placeholder="Share something..." />
              </label>
              <label>
                Image (optional)
                <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
              </label>
              <button className="btn" disabled={busy}>
                {busy ? "Posting..." : "Post"}
              </button>
            </form>
          </div>
        ) : null}

        {loading ? (
          <div className="muted">Loading...</div>
        ) : (
          posts.map((p) => (
            <PostCard 
              key={p.id} 
              post={p} 
              canComment={Boolean(user)} 
              onComment={addComment}
              currentUserId={user?.id}
              onDelete={deletePost}
            />
          ))
        )}
      </div>
    </div>
  );
}

function PostCard({ post, canComment, onComment, currentUserId, onDelete }) {
  const [commentText, setCommentText] = useState("");
  const isOwner = currentUserId && post.author.id === currentUserId;
  
  return (
    <div className="card post">
      <div className="post-head">
        <div className="avatar">{post.author.username?.slice(0, 1)?.toUpperCase() || "U"}</div>
        <div className="post-meta" style={{ flex: 1 }}>
          <div className="post-author">{post.author.username}</div>
          <div className="muted">{timeAgo(post.createdAt)}</div>
        </div>
        {isOwner && onDelete && (
          <button
            className="btn btn-delete-post"
            onClick={() => {
              if (confirm("Are you sure you want to delete this post?")) {
                onDelete(post.id);
              }
            }}
            title="Delete post"
          >
            🗑️
          </button>
        )}
      </div>
      {post.text ? <div className="post-text">{post.text}</div> : null}
      {post.image?.url ? (
        <a href={post.image.url} target="_blank" rel="noreferrer">
          <img className="post-img" src={post.image.url} alt="post media" />
        </a>
      ) : null}

      <div className="divider" />
      <div className="comments">
        <div className="comments-title">Comments</div>
        {(post.comments || []).length ? (
          post.comments.map((c) => (
            <div key={c.id} className="comment">
              <b>{c.author.username}:</b> {c.text}
            </div>
          ))
        ) : (
          <div className="muted">No comments yet.</div>
        )}
      </div>

      {canComment ? (
        <form
          className="comment-form"
          onSubmit={(e) => {
            e.preventDefault();
            if (!commentText.trim()) return;
            onComment(post.id, commentText, () => setCommentText(""));
          }}
        >
          <input value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Write a comment..." />
          <button className="btn secondary" type="submit">
            Send
          </button>
        </form>
      ) : (
        <div className="muted">Login to comment.</div>
      )}
    </div>
  );
}

