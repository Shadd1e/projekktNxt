const BASE = process.env.NEXT_PUBLIC_API_URL || "";

function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("projekkt_token");
}
export function saveToken(token) { localStorage.setItem("projekkt_token", token); }
export function clearToken() { localStorage.removeItem("projekkt_token"); localStorage.removeItem("projekkt_user"); }
export function saveUser(user) { localStorage.setItem("projekkt_user", JSON.stringify(user)); }
export function getUser() {
  if (typeof window === "undefined") return null;
  try { return JSON.parse(localStorage.getItem("projekkt_user") || "null"); } catch { return null; }
}

async function request(path, options = {}) {
  const token   = getToken();
  const headers = { ...(options.headers || {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) };
  if (!(options.body instanceof FormData)) headers["Content-Type"] = "application/json";
  const res  = await fetch(`${BASE}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Something went wrong.");
  return data;
}

export const api = {
  register:       (body) => request("/api/auth/register",  { method: "POST", body: JSON.stringify(body) }),
  login:          (body) => request("/api/auth/login",     { method: "POST", body: JSON.stringify(body) }),
  verifyCode:     (body) => request("/api/auth/verify",    { method: "POST", body: JSON.stringify(body) }),
  logout:         ()     => request("/api/auth/logout",    { method: "POST" }),
  topupCredits:   (bundle) => request("/api/credits/topup", { method: "POST", body: JSON.stringify({ bundle }) }),
  scanDocument:   (file) => {
    const fd = new FormData(); fd.append("file", file);
    return request("/api/document/scan", { method: "POST", body: fd });
  },
  uploadDocument: (file) => {
    const fd = new FormData(); fd.append("file", file);
    return request("/api/document/upload", { method: "POST", body: fd });
  },
  getDownloadUrl: (jobId) => `${BASE}/api/document/download?jobId=${jobId}`,
};
