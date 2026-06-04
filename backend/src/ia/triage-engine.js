import { config } from "../config.js";

// ─────────────────────────────────────────────────────────────
//  TechY-Health — Moteur de triage
//  Deux modes : "rules" (deterministe, hors-ligne) et "llm".
//  Protocole : Manchester Triage System adapte (ROUGE / ORANGE / VERT).
// ─────────────────────────────────────────────────────────────

// Seuils de reference adulte (issus du cahier des charges).
export const SEUILS = {
  SpO2: { critiqueBas: 90, inquietBas: 95, normalHaut: 100, unite: "%" },
  FC: { critiqueBas: 40, basNormal: 60, hautNormal: 100, critiqueHaut: 140, unite: "bpm" },
  TA_SYS: { critiqueBas: 80, basNormal: 90, hautNormal: 140, htaSevere: 180, unite: "mmHg" },
  TA_DIA: { basNormal: 60, hautNormal: 90, unite: "mmHg" },
  TEMP: { hypothermie: 35, normalHaut: 37.5, fievre: 38.5, hyperthermie: 40, unite: "°C" },
  FR: { basNormal: 12, hautNormal: 20, tachypnee: 25, critique: 30, unite: "/min" },
};

// Convertit un tableau de mesures [{capteurType, valeur}] en objet plat.
export function mesuresToVitals(mesures) {
  const v = {};
  const map = {
    SpO2: "spo2",
    FC: "fc",
    TA_SYS: "ta_sys",
    TA_DIA: "ta_dia",
    TEMP: "temperature",
    FR: "freq_respiratoire",
  };
  for (const m of mesures) {
    const key = map[m.capteurType];
    if (key) v[key] = Number(m.valeur);
  }
  return v;
}

// Detecte les signes hors-norme (utilise aussi pour flagger les mesures).
export function detecterSignesCritiques(v) {
  const signes = [];
  if (v.spo2 != null) {
    if (v.spo2 < SEUILS.SpO2.critiqueBas) signes.push(`SpO2 critique (${v.spo2}%)`);
    else if (v.spo2 < SEUILS.SpO2.inquietBas) signes.push(`SpO2 basse (${v.spo2}%)`);
  }
  if (v.fc != null) {
    if (v.fc > SEUILS.FC.critiqueHaut) signes.push(`Tachycardie severe (${v.fc} bpm)`);
    else if (v.fc < SEUILS.FC.critiqueBas) signes.push(`Bradycardie severe (${v.fc} bpm)`);
    else if (v.fc > SEUILS.FC.hautNormal) signes.push(`Tachycardie (${v.fc} bpm)`);
    else if (v.fc < SEUILS.FC.basNormal) signes.push(`Bradycardie (${v.fc} bpm)`);
  }
  if (v.ta_sys != null) {
    if (v.ta_sys < SEUILS.TA_SYS.critiqueBas) signes.push(`Hypotension severe (${v.ta_sys} mmHg)`);
    else if (v.ta_sys < SEUILS.TA_SYS.basNormal) signes.push(`Hypotension (${v.ta_sys} mmHg)`);
    else if (v.ta_sys > SEUILS.TA_SYS.htaSevere) signes.push(`HTA severe (${v.ta_sys} mmHg)`);
    else if (v.ta_sys > SEUILS.TA_SYS.hautNormal) signes.push(`Hypertension (${v.ta_sys} mmHg)`);
  }
  if (v.temperature != null) {
    if (v.temperature > SEUILS.TEMP.hyperthermie) signes.push(`Hyperthermie (${v.temperature}°C)`);
    else if (v.temperature > SEUILS.TEMP.fievre) signes.push(`Fievre elevee (${v.temperature}°C)`);
    else if (v.temperature < SEUILS.TEMP.hypothermie) signes.push(`Hypothermie (${v.temperature}°C)`);
  }
  if (v.freq_respiratoire != null) {
    if (v.freq_respiratoire > SEUILS.FR.critique) signes.push(`Detresse respiratoire (FR ${v.freq_respiratoire}/min)`);
    else if (v.freq_respiratoire > SEUILS.FR.tachypnee) signes.push(`Tachypnee (FR ${v.freq_respiratoire}/min)`);
  }
  return signes;
}

// Verifie si une mesure isolee est hors-norme (pour le flag horsNorme).
export function mesureHorsNorme(capteurType, valeur) {
  const v = Number(valeur);
  switch (capteurType) {
    case "SpO2":
      return v < SEUILS.SpO2.inquietBas;
    case "FC":
      return v > SEUILS.FC.hautNormal || v < SEUILS.FC.basNormal;
    case "TA_SYS":
      return v > SEUILS.TA_SYS.hautNormal || v < SEUILS.TA_SYS.basNormal;
    case "TA_DIA":
      return v > SEUILS.TA_DIA.hautNormal || v < SEUILS.TA_DIA.basNormal;
    case "TEMP":
      return v > SEUILS.TEMP.normalHaut || v < SEUILS.TEMP.hypothermie;
    case "FR":
      return v > SEUILS.FR.hautNormal || v < SEUILS.FR.basNormal;
    default:
      return false;
  }
}

// Regles absolues qui surchargent tout scoring (cf. cahier des charges).
function reglesCritiques(v) {
  if (v.spo2 != null && v.spo2 < 90) return { niveau: "ROUGE", score: 0.99, raison: "SpO2 < 90%" };
  if (v.fc != null && v.fc > 140) return { niveau: "ROUGE", score: 0.99, raison: "FC > 140 bpm" };
  if (v.fc != null && v.fc < 40) return { niveau: "ROUGE", score: 0.99, raison: "FC < 40 bpm" };
  if (v.ta_sys != null && v.ta_sys < 80) return { niveau: "ROUGE", score: 0.95, raison: "TA systolique < 80 mmHg" };
  if (v.temperature != null && v.temperature > 40.5)
    return { niveau: "ROUGE", score: 0.92, raison: "Temperature > 40.5°C" };
  if (
    v.spo2 != null &&
    v.spo2 < 94 &&
    v.freq_respiratoire != null &&
    v.freq_respiratoire > 25
  )
    return { niveau: "ROUGE", score: 0.94, raison: "SpO2 < 94% + FR > 25 (detresse respiratoire)" };
  return null;
}

const DELAIS = { ROUGE: 0, ORANGE: 30, VERT: 120, GRIS: null };

function recommandation(niveau, signes, v) {
  switch (niveau) {
    case "ROUGE":
      return `URGENCE VITALE. ${signes.join(". ")}. Evacuation immediate requise — preparer le transfert et alerter le specialiste. Surveillance continue des constantes.`;
    case "ORANGE":
      return `Urgence elevee. ${signes.join(". ") || "Constantes a surveiller"}. Prise en charge sous 30 minutes, teleconsultation recommandee.`;
    case "VERT":
      return "Patient stable. Constantes dans les normes. Surveillance de routine et soins de base.";
    default:
      return "Donnees insuffisantes pour un triage fiable. Completer les mesures.";
  }
}

function actionImmediate(niveau, v) {
  if (niveau === "ROUGE") {
    if (v.spo2 != null && v.spo2 < 90) return "Administrer de l'oxygene et positionner le patient demi-assis.";
    if (v.fc != null && (v.fc > 140 || v.fc < 40)) return "Surveiller le rythme cardiaque, preparer reanimation.";
    return "Stabiliser le patient et organiser l'evacuation.";
  }
  if (niveau === "ORANGE") return "Reevaluer les constantes dans 10 minutes et contacter un specialiste.";
  if (niveau === "VERT") return "Documenter et rassurer le patient.";
  return "Prendre des mesures complementaires.";
}

// ─── Moteur a regles (deterministe, hors-ligne) ───────────────
export function triageRules(payload) {
  const v = payload;
  const signes = detecterSignesCritiques(v);
  const critique = reglesCritiques(v);

  let niveau, score;
  if (critique) {
    niveau = critique.niveau;
    score = critique.score;
    if (!signes.includes(critique.raison)) signes.unshift(critique.raison);
  } else if (signes.length === 0) {
    // Aucune mesure ou tout normal.
    const hasData = Object.keys(v).length > 0;
    niveau = hasData ? "VERT" : "GRIS";
    score = hasData ? 0.9 : 0.3;
  } else {
    // Scoring par gravite ponderee des anomalies.
    const gravite = signes.reduce((acc, s) => {
      if (/severe|critique|detresse|Hyperthermie/i.test(s)) return acc + 3;
      if (/elevee|HTA|Hypotension|Tachycardie|Bradycardie/i.test(s)) return acc + 2;
      return acc + 1;
    }, 0);
    if (gravite >= 4) {
      niveau = "ORANGE";
      score = Math.min(0.6 + gravite * 0.05, 0.9);
    } else {
      niveau = "ORANGE";
      score = 0.6 + gravite * 0.05;
    }
  }

  return {
    niveau,
    score_confiance: Number(score.toFixed(3)),
    signes_critiques: signes,
    recommandation: recommandation(niveau, signes, v),
    action_immediate: actionImmediate(niveau, v),
    transfert_requis: niveau === "ROUGE",
    delai_action_minutes: DELAIS[niveau],
    moteur: "rules",
  };
}

// ─── Moteur LLM (optionnel) ───────────────────────────────────
const PROMPT_SYSTEME = `Tu es TechY-Health, un systeme d'IA de triage medical d'urgence pour zones rurales africaines.
PROTOCOLE (Manchester adapte): ROUGE=danger de mort immediat; ORANGE=urgence sous 30min; VERT=non urgent.
SEUILS ADULTE: SpO2 normal>95 inquietant 90-95 critique<90 | FC 60-100 (tachy>100, brady<60) | TA Sys 90-140 (HTA>160, hypo<90) | Temp 36-37.5 (fievre>38.5, hyper>40).
REGLES ABSOLUES: SpO2<90 = ROUGE; FC>140 ou <40 = ROUGE; SpO2<94 + FR>25 = ROUGE; douleur thoracique + FC anormale = ORANGE min.
Retourne UNIQUEMENT ce JSON sans texte autour: {"niveau":"ROUGE|ORANGE|VERT","score_confiance":0.00,"signes_critiques":[],"recommandation":"","action_immediate":"","transfert_requis":true,"delai_action_minutes":0}`;

async function triageLLM(payload) {
  const userMsg = `Signes vitaux du patient: ${JSON.stringify(payload)}. Symptomes: ${
    (payload.symptomes || []).join(", ") || "non precises"
  }. Analyse et triage.`;

  // Anthropic Claude
  if (config.ia.anthropicKey) {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": config.ia.anthropicKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: config.ia.model,
        max_tokens: 512,
        system: PROMPT_SYSTEME,
        messages: [{ role: "user", content: userMsg }],
      }),
    });
    if (!res.ok) throw new Error(`Anthropic ${res.status}`);
    const data = await res.json();
    const text = data.content?.[0]?.text || "{}";
    return { ...parseLLMJson(text), moteur: "llm:anthropic" };
  }

  // OpenAI
  if (config.ia.openaiKey) {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${config.ia.openaiKey}`,
      },
      body: JSON.stringify({
        model: config.ia.model.includes("gpt") ? config.ia.model : "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: PROMPT_SYSTEME },
          { role: "user", content: userMsg },
        ],
      }),
    });
    if (!res.ok) throw new Error(`OpenAI ${res.status}`);
    const data = await res.json();
    const text = data.choices?.[0]?.message?.content || "{}";
    return { ...parseLLMJson(text), moteur: "llm:openai" };
  }

  throw new Error("Aucune cle LLM configuree");
}

function parseLLMJson(text) {
  const match = text.match(/\{[\s\S]*\}/);
  const json = JSON.parse(match ? match[0] : text);
  return {
    niveau: json.niveau || "GRIS",
    score_confiance: Number(json.score_confiance ?? 0.5),
    signes_critiques: json.signes_critiques || [],
    recommandation: json.recommandation || "",
    action_immediate: json.action_immediate || "",
    transfert_requis: !!json.transfert_requis,
    delai_action_minutes: json.delai_action_minutes ?? null,
  };
}

// ─── Point d'entree unique ────────────────────────────────────
export async function analyserTriage(payload) {
  if (config.ia.engine === "llm") {
    try {
      return await triageLLM(payload);
    } catch (err) {
      // Repli automatique sur le moteur a regles si le LLM echoue.
      const r = triageRules(payload);
      r.moteur = `rules (fallback: ${err.message})`;
      return r;
    }
  }
  return triageRules(payload);
}
