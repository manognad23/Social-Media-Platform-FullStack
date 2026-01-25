import { useNavigate } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";

export function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="home-page">
      <div className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">
            Welcome to <span className="gradient-text">Spotmies</span>
          </h1>
          <p className="hero-subtitle">
            Share your thoughts, connect with others, and discover amazing content
          </p>
          
          {user ? (
            <div className="hero-actions">
              <button className="btn btn-primary-large" onClick={() => navigate("/feed")}>
                Go to Feed
              </button>
              <button className="btn btn-secondary-large" onClick={() => navigate("/profile")}>
                View Profile
              </button>
            </div>
          ) : (
            <div className="hero-actions">
              <button className="btn btn-primary-large" onClick={() => navigate("/register")}>
                Get Started
              </button>
              <button className="btn btn-secondary-large" onClick={() => navigate("/login")}>
                Sign In
              </button>
            </div>
          )}
        </div>
        
        <div className="floating-shapes">
          <div className="shape shape-1"></div>
          <div className="shape shape-2"></div>
          <div className="shape shape-3"></div>
          <div className="shape shape-4"></div>
          <div className="shape shape-5"></div>
        </div>
      </div>

      <div className="features-section">
        <h2 className="section-title">Why Choose Spotmies?</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">🛡️</div>
            <h3>AI-Powered Moderation</h3>
            <p>Advanced AI automatically detects and moderates hate speech, spam, and sensitive content to keep our community safe.</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">📸</div>
            <h3>Share Images</h3>
            <p>Upload and share your favorite moments with high-quality image support powered by Cloudinary.</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">💬</div>
            <h3>Engage & Connect</h3>
            <p>Comment on posts, interact with others, and build meaningful connections in a safe environment.</p>
          </div>
          
          
        </div>
      </div>

      {user && (
        <div className="quick-stats">
          <div className="stat-card">
            <div className="stat-number">Ready</div>
            <div className="stat-label">Start Sharing!</div>
          </div>
        </div>
      )}
    </div>
  );
}
