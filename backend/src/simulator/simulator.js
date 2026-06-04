import { prisma } from "../db.js";
import { config } from "../config.js";
import { PATIENT_PROFILES, SCENARIOS, generateMeasure } from "./profiles.js";
import { enregistrerMesures } from "../modules/triage.routes.js";
import { analyserTriage, mesuresToVitals } from "../ia/triage-engine.js";
import { creerEtDiffuserAlerte, diffuserMajAlerte } from "../modules/alerting.js";
import { realtime } from "../realtime.js";

// Sessions de simulation actives, indexees par session_id.
const running = new Map();

async function tick(state) {
  state.tick += 1;
  const profile = state.profile;
  const capteurs = Object.keys(PATIENT_PROFILES[profile] || {});
  const mesures = capteurs
    .map((c) => {
      const valeur = generateMeasure(profile, c, state.tick);
      return valeur == null ? null : { capteur_type: c, valeur, source: "simulation" };
    })
    .filter(Boolean);

  if (mesures.length === 0) return;

  const session = await prisma.sessionTriage.findUnique({ where: { id: state.sessionId } });
  if (!session) return stop(state.sessionId);

  await enregistrerMesures(session, mesures);

  // Analyse a chaque tick pour reagir en temps reel.
  // mesuresToVitals attend des objets {capteurType}; le simulateur produit {capteur_type}.
  const vitals = mesuresToVitals(mesures.map((m) => ({ capteurType: m.capteur_type, valeur: m.valeur })));
  vitals.symptomes = session.symptomes;
  const result = await analyserTriage(vitals);

  await prisma.sessionTriage.update({
    where: { id: session.id },
    data: { niveauTriage: result.niveau, scoreIa: result.score_confiance, recommandation: result.recommandation, signesCritiques: result.signes_critiques },
  });

  realtime.toSession(session.id, "triage:resultat", {
    session_id: session.id,
    niveau: result.niveau,
    score: result.score_confiance,
    recommandation: result.recommandation,
  });

  if (result.niveau === "ROUGE" || result.niveau === "ORANGE") {
    await creerEtDiffuserAlerte({
      session,
      niveau: result.niveau,
      signes: result.signes_critiques,
      valeurCritique: vitals,
      typeAlerte: result.signes_critiques[0],
    });
  } else if (result.niveau === "VERT" && state.lastNiveau && state.lastNiveau !== "VERT") {
    // Retour a la normale : resoudre l'alerte active (scenario resolution).
    const active = await prisma.alerte.findFirst({ where: { sessionId: session.id, statut: { in: ["active", "en_cours"] } } });
    if (active) {
      const resolved = await prisma.alerte.update({
        where: { id: active.id },
        data: { statut: "resolue", resolueAt: new Date(), notesResolution: "Constantes revenues a la normale (simulateur)" },
      });
      await diffuserMajAlerte(resolved);
    }
  }
  state.lastNiveau = result.niveau;
}

export function startSimulation({ sessionId, profile, intervalMs, autoStopS }) {
  if (running.has(sessionId)) stop(sessionId);
  const state = {
    sessionId,
    profile: profile in PATIENT_PROFILES ? profile : "normal",
    tick: 0,
    lastNiveau: null,
    intervalMs: intervalMs || config.simulator.defaultIntervalMs,
  };
  state.timer = setInterval(() => tick(state).catch(() => {}), state.intervalMs);
  if (autoStopS) {
    state.stopTimer = setTimeout(() => stop(sessionId), autoStopS * 1000);
  }
  running.set(sessionId, state);
  // Premier tick immediat.
  tick(state).catch(() => {});
  return { session_id: sessionId, profile: state.profile, interval_ms: state.intervalMs };
}

export function startScenario({ sessionId, scenarioName, intervalMs }) {
  const sc = SCENARIOS[scenarioName];
  if (!sc) throw new Error(`Scenario inconnu : ${scenarioName}`);
  return startSimulation({ sessionId, profile: sc.profile, intervalMs, autoStopS: sc.duree_s });
}

export function stop(sessionId) {
  const state = running.get(sessionId);
  if (state) {
    clearInterval(state.timer);
    if (state.stopTimer) clearTimeout(state.stopTimer);
    running.delete(sessionId);
  }
  return { stopped: !!state };
}

export async function injectValue({ sessionId, capteur, valeur }) {
  const session = await prisma.sessionTriage.findUnique({ where: { id: sessionId } });
  if (!session) throw new Error("Session introuvable");
  await enregistrerMesures(session, [{ capteur_type: capteur, valeur: Number(valeur), source: "simulation" }]);
  return { injected: true };
}

export function status() {
  return Array.from(running.values()).map((s) => ({
    session_id: s.sessionId,
    profile: s.profile,
    tick: s.tick,
    dernier_niveau: s.lastNiveau,
    interval_ms: s.intervalMs,
  }));
}

export function stopAll() {
  for (const id of running.keys()) stop(id);
}
