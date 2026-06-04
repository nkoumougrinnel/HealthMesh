// Profils physiologiques pour le simulateur de capteurs.
// Chaque capteur : { base, drift (par tick), noise }.

export const PATIENT_PROFILES = {
  normal: {
    SpO2: { base: 98, drift: 0.0, noise: 0.4 },
    FC: { base: 72, drift: 0.2, noise: 1.5 },
    TA_SYS: { base: 120, drift: 0.0, noise: 2 },
    TA_DIA: { base: 80, drift: 0.0, noise: 1.5 },
    TEMP: { base: 36.8, drift: 0.0, noise: 0.08 },
    FR: { base: 16, drift: 0.0, noise: 0.6 },
  },
  deterioration_lente: {
    // SpO2 descend progressivement, FC monte -> ORANGE puis ROUGE.
    SpO2: { base: 97, drift: -0.4, noise: 0.3 },
    FC: { base: 82, drift: 1.2, noise: 1.5 },
    TA_SYS: { base: 118, drift: -0.5, noise: 2 },
    TA_DIA: { base: 78, drift: 0.0, noise: 1.5 },
    TEMP: { base: 37.2, drift: 0.05, noise: 0.08 },
    FR: { base: 18, drift: 0.6, noise: 0.6 },
  },
  crise_cardiaque: {
    FC: { base: 145, drift: 1.5, noise: 4 },
    TA_SYS: { base: 85, drift: -0.8, noise: 3 },
    TA_DIA: { base: 55, drift: -0.4, noise: 2 },
    SpO2: { base: 91, drift: -0.3, noise: 0.5 },
    TEMP: { base: 36.9, drift: 0.0, noise: 0.08 },
    FR: { base: 24, drift: 0.4, noise: 1 },
  },
  fievre_severe: {
    TEMP: { base: 39.8, drift: 0.03, noise: 0.1 },
    FC: { base: 110, drift: 0.4, noise: 2 },
    SpO2: { base: 95, drift: -0.1, noise: 0.3 },
    TA_SYS: { base: 110, drift: 0.0, noise: 2 },
    TA_DIA: { base: 70, drift: 0.0, noise: 1.5 },
    FR: { base: 22, drift: 0.2, noise: 0.8 },
  },
  stable_post_traitement: {
    // Retour progressif a la normale -> VERT (pour demo de resolution).
    SpO2: { base: 92, drift: 0.4, noise: 0.3 },
    FC: { base: 105, drift: -1.0, noise: 1.5 },
    TA_SYS: { base: 105, drift: 0.6, noise: 2 },
    TA_DIA: { base: 72, drift: 0.0, noise: 1.5 },
    TEMP: { base: 37.6, drift: -0.04, noise: 0.08 },
    FR: { base: 20, drift: -0.3, noise: 0.6 },
  },
};

// Scenarios preconfigures pour la demo (mappent un profil + duree).
export const SCENARIOS = {
  patient_normal: { profile: "normal", duree_s: 120, label: "Patient normal -> VERT" },
  deterioration_lente: { profile: "deterioration_lente", duree_s: 180, label: "Deterioration progressive -> ORANGE puis ROUGE" },
  crise_aigue: { profile: "crise_cardiaque", duree_s: 30, label: "Crise aigue -> ROUGE immediat" },
  fievre_palustre: { profile: "fievre_severe", duree_s: 120, label: "Fievre palustre -> ORANGE" },
  resolution_alerte: { profile: "stable_post_traitement", duree_s: 120, label: "Resolution -> retour VERT" },
};

export function generateMeasure(profile, capteur, tick) {
  const p = PATIENT_PROFILES[profile]?.[capteur];
  if (!p) return null;
  const valeur = p.base + p.drift * tick + (Math.random() - 0.5) * p.noise;
  return Math.round(valeur * 10) / 10;
}
