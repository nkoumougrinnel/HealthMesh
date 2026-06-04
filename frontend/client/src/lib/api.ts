import axios from "axios";
import { io, type Socket } from "socket.io-client";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
const API_URL = `${BASE_URL}/api/v1`;

const TOKEN_KEY = "hm_access_token";
const REFRESH_KEY = "hm_refresh_token";
const AGENT_KEY = "hm_agent";
const OFFLINE_KEY = "hm_offline_token";

export type Agent = {
  id: string;
  code: string;
  nom: string;
  prenom: string;
  email?: string | null;
  role: "agent" | "specialiste" | "admin";
  region: string;
  zone_id?: string | null;
};

export const auth = {
  get token() {
    return localStorage.getItem(TOKEN_KEY) || "";
  },
  get agent(): Agent | null {
    const raw = localStorage.getItem(AGENT_KEY);
    return raw ? JSON.parse(raw) : null;
  },
  set(token: string, refresh: string, agent: Agent) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(REFRESH_KEY, refresh);
    localStorage.setItem(AGENT_KEY, JSON.stringify(agent));
  },
  clear() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(AGENT_KEY);
    localStorage.removeItem(OFFLINE_KEY);
  },
  get offlineToken() {
    return localStorage.getItem(OFFLINE_KEY) || "";
  },
  setOfflineToken(t: string) {
    localStorage.setItem(OFFLINE_KEY, t);
  },
  get isAuthenticated() {
    return !!localStorage.getItem(TOKEN_KEY);
  },
};

const http = axios.create({ baseURL: API_URL });
http.interceptors.request.use((cfg) => {
  const t = auth.token;
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});
http.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err?.response?.status === 401) {
      auth.clear();
      if (!location.pathname.includes("/login")) location.href = "/tablet/login";
    }
    return Promise.reject(err);
  }
);

export async function checkHealth(): Promise<boolean> {
  try {
    const r = await fetch(`${BASE_URL}/health`);
    const j = await r.json();
    return j.status === "ok";
  } catch {
    return false;
  }
}

export const api = {
  health: checkHealth,

  async login(code: string, password: string, zone_id?: string) {
    const { data } = await http.post("/auth/login", { code, password, zone_id });
    auth.set(data.access_token, data.refresh_token, data.agent);
    try {
      const off = await http.post("/auth/offline-token", { code, password });
      auth.setOfflineToken(off.data.offline_token);
    } catch {
      /* hors-ligne optionnel */
    }
    return data.agent as Agent;
  },
  offlineToken: (code: string, password: string) =>
    http.post("/auth/offline-token", { code, password }).then((r) => r.data),
  async logout() {
    const refresh = localStorage.getItem(REFRESH_KEY);
    try {
      await http.post("/auth/logout", { refresh_token: refresh });
    } catch {
      /* ignore */
    }
    auth.clear();
    disconnectSocket();
  },
  me: () => http.get("/auth/me").then((r) => r.data),
  specialists: () => http.get("/auth/specialists").then((r) => r.data.items as Agent[]),

  listPatients: (params?: Record<string, unknown>) => http.get("/patients", { params }).then((r) => r.data),
  searchPatients: (q: string) => http.get("/patients/search", { params: { q } }).then((r) => r.data),
  createPatient: (body: Record<string, unknown>) => http.post("/patients", body).then((r) => r.data),
  getPatient: (id: string) => http.get(`/patients/${id}`).then((r) => r.data),
  patientMesures: (id: string, params?: Record<string, unknown>) =>
    http.get(`/patients/${id}/mesures`, { params }).then((r) => r.data),
  patientTriages: (id: string) => http.get(`/patients/${id}/triages`).then((r) => r.data),

  createSession: (body: Record<string, unknown>) => http.post("/triage/sessions", body).then((r) => r.data),
  getSession: (id: string) => http.get(`/triage/sessions/${id}`).then((r) => r.data),
  pushMesures: (sessionId: string, mesures: unknown[]) =>
    http.post(`/triage/sessions/${sessionId}/mesures`, { mesures }).then((r) => r.data),
  analyze: (sessionId: string) => http.post(`/triage/sessions/${sessionId}/analyze`).then((r) => r.data),
  completeSession: (sessionId: string, body: Record<string, unknown>) =>
    http.put(`/triage/sessions/${sessionId}/complete`, body).then((r) => r.data),
  listSessions: (params?: Record<string, unknown>) => http.get("/triage/sessions", { params }).then((r) => r.data),

  listAlertes: (params?: Record<string, unknown>) => http.get("/alertes", { params }).then((r) => r.data),
  getAlerte: (id: string) => http.get(`/alertes/${id}`).then((r) => r.data),
  alerteStats: () => http.get("/alertes/stats").then((r) => r.data),
  prendreEnCharge: (id: string) => http.put(`/alertes/${id}/prendre-en-charge`).then((r) => r.data),
  resoudreAlerte: (id: string, notes: string) => http.put(`/alertes/${id}/resoudre`, { notes }).then((r) => r.data),

  scenarios: () => http.get("/simulator/scenarios").then((r) => r.data),
  startScenario: (session_id: string, scenario_name: string, interval_ms = 1500) =>
    http.post("/simulator/scenario", { session_id, scenario_name, interval_ms }).then((r) => r.data),
  stopSimulator: (session_id: string) => http.post("/simulator/stop", { session_id }).then((r) => r.data),
  simulatorStatus: () => http.get("/simulator/status").then((r) => r.data),

  listConsultations: () => http.get("/consultations").then((r) => r.data),
  consultationQueue: () => http.get("/consultations/queue").then((r) => r.data),
  createConsultation: (body: Record<string, unknown>) => http.post("/consultations", body).then((r) => r.data),
  endConsultation: (id: string) => http.put(`/consultations/${id}/end`).then((r) => r.data),
  updateConsultation: (id: string, body: Record<string, unknown>) =>
    http.put(`/consultations/${id}`, body).then((r) => r.data),

  syncStatus: () => http.get("/sync/status").then((r) => r.data),
  syncPull: (since?: string) => http.get("/sync/pull", { params: since ? { since } : {} }).then((r) => r.data),

  activity: (params?: Record<string, unknown>) => http.get("/reports/activity", { params }).then((r) => r.data),
  activityDaily: () => http.get("/reports/activity-daily").then((r) => r.data),
  vitalsTrend: (patient_id: string, metric = "SpO2") =>
    http.get("/reports/vitals-trend", { params: { patient_id, metric } }).then((r) => r.data),
  epidemio: () => http.get("/reports/epidemio").then((r) => r.data),
  agentsKpi: () => http.get("/reports/agents-kpi").then((r) => r.data),

  async downloadExport() {
    const res = await http.get("/reports/export", { responseType: "blob" });
    const url = URL.createObjectURL(res.data);
    const a = document.createElement("a");
    a.href = url;
    a.download = "healthmesh_export.csv";
    a.click();
    URL.revokeObjectURL(url);
  },
};

let socket: ReturnType<typeof io> | null = null;
export function getSocket() {
  if (!socket) {
    socket = io(BASE_URL, { auth: { token: auth.token }, path: "/socket.io" });
  }
  return socket;
}
export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}

export { BASE_URL, API_URL };
