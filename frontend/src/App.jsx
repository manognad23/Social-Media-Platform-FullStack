import { Navigate, Route, Routes } from "react-router-dom";
import "./App.css";
import { AuthProvider, useAuth } from "./lib/AuthContext";
import { Nav } from "./components/Nav";
import { HomePage } from "./pages/Home";
import { FeedPage } from "./pages/Feed";
import { LoginPage } from "./pages/Login";
import { RegisterPage } from "./pages/Register";
import { ProfilePage } from "./pages/Profile";
import { AdminPage } from "./pages/Admin"
;
import { AdminLoginPage } from "./pages/AdminLogin";

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="app">
        <Nav />
        <div className="container">
          <div className="muted" style={{ textAlign: "center", padding: "40px" }}>Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/feed" element={<FeedPage />} />
      <Route path="/login" element={user ? <Navigate to="/feed" /> : <LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/profile" element={user ? <ProfilePage /> : <Navigate to="/login" />} />
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <div className="app">
        <Nav />
        <div className="container">
          <AppRoutes />
        </div>
      </div>
    </AuthProvider>
  );
}
