import { createContext, useContext, useState, useEffect } from "react";
import { loadSession, saveSession, clearSession as clearSessionStorage } from "./auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const session = loadSession();
    setUser(session.user);
    setLoading(false);
  }, []);

  const updateUser = (newUser) => {
    setUser(newUser);
    const session = loadSession();
    saveSession({ token: session.token, user: newUser });
  };

  const clearSession = () => {
    setUser(null);
    clearSessionStorage();
  };

  return (
    <AuthContext.Provider value={{ user, updateUser, clearSession, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
