import { apiFetch, setToken as persistToken } from "./api";

export function loadSession() {
  const token = localStorage.getItem("token") || "";
  const userRaw = localStorage.getItem("user") || "";
  const user = userRaw ? JSON.parse(userRaw) : null;
  return { token, user };
}

export function saveSession({ token, user }) {
  persistToken(token);
  localStorage.setItem("user", JSON.stringify(user || null));
}

export function clearSession() {
  persistToken("");
  localStorage.removeItem("user");
}

export async function login(email, password) {
  const data = await apiFetch("/api/auth/login", { method: "POST", body: { email, password } });
  saveSession(data);
  return data;
}

export async function register(username, email, password) {
  const data = await apiFetch("/api/auth/register", { method: "POST", body: { username, email, password } });
  saveSession(data);
  return data;
}

export async function fetchMe() {
  const data = await apiFetch("/api/me");
  // backend returns { user }
  const session = loadSession();
  saveSession({ token: session.token, user: data.user });
  return data.user;
}

