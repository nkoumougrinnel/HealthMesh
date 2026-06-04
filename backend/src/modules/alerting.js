import { prisma } from "../db.js";
import { realtime } from "../realtime.js";
import { publish } from "../redis.js";

// Cree une alerte (si niveau ROUGE/ORANGE) et la diffuse en temps reel.
// Reutilise par l'analyse de triage et par le simulateur.
export async function creerEtDiffuserAlerte({ session, niveau, signes, valeurCritique, typeAlerte }) {
  if (niveau !== "ROUGE" && niveau !== "ORANGE") return null;

  // Eviter les doublons : une alerte active par session.
  const existante = await prisma.alerte.findFirst({
    where: { sessionId: session.id, statut: { in: ["active", "en_cours"] } },
  });

  let alerte;
  if (existante) {
    alerte = await prisma.alerte.update({
      where: { id: existante.id },
      data: { niveau, typeAlerte, valeurCritique: valeurCritique ?? existante.valeurCritique },
    });
  } else {
    alerte = await prisma.alerte.create({
      data: {
        sessionId: session.id,
        patientId: session.patientId,
        agentId: session.agentId,
        niveau,
        typeAlerte: typeAlerte || (niveau === "ROUGE" ? "CRITIQUE" : "URGENCE"),
        valeurCritique: valeurCritique ?? { signes },
        statut: "active",
      },
    });
  }

  const patient = await prisma.patient.findUnique({ where: { id: session.patientId } });
  const payload = {
    alerte,
    patient,
    session: { id: session.id, niveau_triage: niveau },
    signes_critiques: signes,
  };

  // Diffusion : specialistes + zone du patient + admin.
  realtime.toRole("specialiste", "alerte:nouvelle", payload);
  realtime.toRole("admin", "alerte:nouvelle", payload);
  if (patient?.zoneId) realtime.toZone(patient.zoneId, "alerte:nouvelle", payload);
  await publish("alertes", { type: "nouvelle", ...payload });

  return alerte;
}

export async function diffuserMajAlerte(alerte) {
  const payload = { alerte_id: alerte.id, statut: alerte.statut, specialiste: alerte.priseEnChargePar };
  realtime.toRole("specialiste", "alerte:mise_a_jour", payload);
  realtime.toRole("admin", "alerte:mise_a_jour", payload);
  realtime.toAgent(alerte.agentId, "alerte:mise_a_jour", payload);
  await publish("alertes", { type: "maj", ...payload });
}
