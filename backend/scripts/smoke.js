// Smoke test end-to-end : login -> patient -> session -> mesures -> analyse -> alerte.
// Usage : node scripts/smoke.js  (le serveur doit tourner sur BASE_URL)

const BASE = process.env.BASE_URL || "http://localhost:3000";
const API = `${BASE}/api/v1`;

let token = "";
let pass = 0;
let fail = 0;

async function call(method, path, body, auth = true) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      "content-type": "application/json",
      ...(auth && token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = text;
  }
  return { status: res.status, json };
}

function check(name, cond, detail) {
  if (cond) {
    pass++;
    console.log(`  OK  ${name}`);
  } else {
    fail++;
    console.log(`  XX  ${name} ${detail ? "-> " + JSON.stringify(detail) : ""}`);
  }
}

async function main() {
  console.log(`HealthMesh smoke test sur ${BASE}\n`);

  const health = await call("GET", "/../health", null, false).catch(() => null);
  const h = await fetch(`${BASE}/health`).then((r) => r.json());
  check("GET /health", h.status === "ok", h);

  // Login agent.
  const login = await call("POST", "/auth/login", { code: "CM-001", password: "Demo2026!" }, false);
  check("POST /auth/login (agent)", login.status === 200 && !!login.json.access_token, login.json);
  token = login.json.access_token;

  // Login specialiste (par email).
  const loginSpec = await call("POST", "/auth/login", { code: "spec@healthmesh.org", password: "Demo2026!" }, false);
  check("POST /auth/login (specialiste via email)", loginSpec.status === 200, loginSpec.json);

  // Liste patients.
  const patients = await call("GET", "/patients?limit=5");
  check("GET /patients", patients.status === 200 && Array.isArray(patients.json.items), patients.json);
  const patientId = patients.json.items?.[0]?.id;

  // Creer un patient.
  const newPatient = await call("POST", "/patients", { nom: "Test", prenom: "Smoke", sexe: "M" });
  check("POST /patients", newPatient.status === 201 && !!newPatient.json.id, newPatient.json);

  // Demarrer session de triage.
  const session = await call("POST", "/triage/sessions", { patient_id: newPatient.json.id, symptomes: ["essoufflement"] });
  check("POST /triage/sessions", session.status === 201 && !!session.json.id, session.json);
  const sessionId = session.json.id;

  // Pousser des mesures critiques (SpO2 bas -> ROUGE).
  const mesures = await call("POST", `/triage/sessions/${sessionId}/mesures`, {
    mesures: [
      { capteur_type: "SpO2", valeur: 85 },
      { capteur_type: "FC", valeur: 148 },
      { capteur_type: "TEMP", valeur: 38.2 },
      { capteur_type: "FR", valeur: 28 },
    ],
  });
  check("POST /triage/sessions/:id/mesures", mesures.status === 201 && mesures.json.inserted === 4, mesures.json);

  // Analyse IA -> doit retourner ROUGE.
  const analyze = await call("POST", `/triage/sessions/${sessionId}/analyze`);
  check("POST /triage/sessions/:id/analyze (=> ROUGE)", analyze.status === 200 && analyze.json.niveau === "ROUGE", analyze.json);

  // Alerte creee et visible cote specialiste.
  token = loginSpec.json.access_token;
  const alertes = await call("GET", "/alertes");
  check("GET /alertes (specialiste)", alertes.status === 200 && alertes.json.items.length > 0, alertes.json);

  const alerteId = alertes.json.items?.find((a) => a.sessionId === sessionId)?.id || alertes.json.items?.[0]?.id;
  if (alerteId) {
    const pec = await call("PUT", `/alertes/${alerteId}/prendre-en-charge`);
    check("PUT /alertes/:id/prendre-en-charge", pec.status === 200 && pec.json.statut === "en_cours", pec.json);

    const resolve = await call("PUT", `/alertes/${alerteId}/resoudre`, { notes: "Test resolu" });
    check("PUT /alertes/:id/resoudre", resolve.status === 200 && resolve.json.statut === "resolue", resolve.json);
  }

  // Rapports.
  const activity = await call("GET", "/reports/activity");
  check("GET /reports/activity", activity.status === 200 && typeof activity.json.total === "number", activity.json);

  // Simulateur (agent token).
  token = login.json.access_token;
  const scenarios = await call("GET", "/simulator/scenarios");
  check("GET /simulator/scenarios", scenarios.status === 200 && scenarios.json.scenarios.length === 5, scenarios.json);

  console.log(`\nResultat : ${pass} OK, ${fail} echecs`);
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error("Erreur smoke test:", e.message);
  process.exit(1);
});
