import { z } from "zod";
import { prisma } from "../db.js";
import { parse, notFound, badRequest } from "../utils/errors.js";
import { authenticate, requireRole } from "../auth/middleware.js";
import { realtime } from "../realtime.js";
import {
  analyserTriage,
  mesuresToVitals,
  mesureHorsNorme,
} from "../ia/triage-engine.js";
import { creerEtDiffuserAlerte } from "./alerting.js";

const UNITES = { SpO2: "%", FC: "bpm", TA_SYS: "mmHg", TA_DIA: "mmHg", TEMP: "°C", FR: "/min" };

const startSchema = z.object({
  patient_id: z.string().min(1),
  symptomes: z.array(z.string()).optional(),
  duree_symptomes: z.string().optional(),
});

const mesureSchema = z.object({
  capteur_type: z.enum(["SpO2", "FC", "TA_SYS", "TA_DIA", "TEMP", "FR"]),
  valeur: z.number(),
  source: z.enum(["capteur", "simulation", "saisie_manuelle"]).optional(),
  timestamp: z.string().optional(),
});

const mesuresBatchSchema = z.object({ mesures: z.array(mesureSchema).min(1) });

// Persiste un lot de mesures + flag hors-norme + broadcast live. Reutilise par le simulateur.
export async function enregistrerMesures(session, mesures) {
  const data = mesures.map((m) => ({
    sessionId: session.id,
    patientId: session.patientId,
    capteurType: m.capteur_type,
    valeur: m.valeur,
    unite: UNITES[m.capteur_type],
    horsNorme: mesureHorsNorme(m.capteur_type, m.valeur),
    source: m.source || "capteur",
    timestamp: m.timestamp ? new Date(m.timestamp) : new Date(),
  }));
  await prisma.mesure.createMany({ data });

  for (const m of data) {
    realtime.toSession(session.id, "mesure:live", {
      session_id: session.id,
      type: m.capteurType,
      valeur: m.valeur,
      unite: m.unite,
      hors_norme: m.horsNorme,
      timestamp: m.timestamp,
    });
  }
  return data;
}

export async function triageRoutes(app) {
  app.addHook("preHandler", authenticate);

  // POST /triage/sessions — demarrer une session.
  app.post("/sessions", { preHandler: [requireRole("agent", "admin")] }, async (req, reply) => {
    const b = parse(startSchema, req.body);
    const patient = await prisma.patient.findFirst({ where: { id: b.patient_id, deletedAt: null } });
    if (!patient) throw notFound("Patient introuvable");
    const session = await prisma.sessionTriage.create({
      data: {
        patientId: b.patient_id,
        agentId: req.agent.sub,
        symptomes: b.symptomes || [],
        dureeSymptomes: b.duree_symptomes,
      },
    });
    reply.code(201);
    return session;
  });

  // PUT /triage/sessions/:id — maj symptomes / statut.
  app.put("/sessions/:id", async (req) => {
    const session = await prisma.sessionTriage.findUnique({ where: { id: req.params.id } });
    if (!session) throw notFound("Session introuvable");
    const b = req.body || {};
    return prisma.sessionTriage.update({
      where: { id: session.id },
      data: {
        symptomes: b.symptomes ?? undefined,
        dureeSymptomes: b.duree_symptomes ?? undefined,
        statut: b.statut ?? undefined,
      },
    });
  });

  // POST /triage/sessions/:id/mesures — pousser mesures (batch).
  app.post("/sessions/:id/mesures", async (req, reply) => {
    const session = await prisma.sessionTriage.findUnique({ where: { id: req.params.id } });
    if (!session) throw notFound("Session introuvable");
    const b = parse(mesuresBatchSchema, req.body);
    const saved = await enregistrerMesures(session, b.mesures);
    reply.code(201);
    return { inserted: saved.length };
  });

  // POST /triage/sessions/:id/analyze — declenche l'IA + alerte eventuelle.
  app.post("/sessions/:id/analyze", async (req) => {
    const session = await prisma.sessionTriage.findUnique({ where: { id: req.params.id } });
    if (!session) throw notFound("Session introuvable");

    // Derniere valeur connue par type de capteur.
    const mesures = await prisma.mesure.findMany({
      where: { sessionId: session.id },
      orderBy: { timestamp: "desc" },
      take: 60,
    });
    if (mesures.length === 0) throw badRequest("Aucune mesure a analyser pour cette session");

    const derniere = {};
    for (const m of mesures) if (!derniere[m.capteurType]) derniere[m.capteurType] = m;
    const vitals = mesuresToVitals(Object.values(derniere));
    vitals.symptomes = session.symptomes;

    const result = await analyserTriage(vitals);

    const updated = await prisma.sessionTriage.update({
      where: { id: session.id },
      data: {
        niveauTriage: result.niveau,
        scoreIa: result.score_confiance,
        recommandation: result.recommandation,
        signesCritiques: result.signes_critiques,
      },
    });

    realtime.toSession(session.id, "triage:resultat", {
      session_id: session.id,
      niveau: result.niveau,
      score: result.score_confiance,
      recommandation: result.recommandation,
    });

    // Alerte temps reel si necessaire.
    await creerEtDiffuserAlerte({
      session: updated,
      niveau: result.niveau,
      signes: result.signes_critiques,
      valeurCritique: vitals,
      typeAlerte: result.signes_critiques[0],
    });

    return { session_id: session.id, ...result };
  });

  // PUT /triage/sessions/:id/complete — cloturer.
  app.put("/sessions/:id/complete", async (req) => {
    const session = await prisma.sessionTriage.findUnique({ where: { id: req.params.id } });
    if (!session) throw notFound("Session introuvable");
    const b = req.body || {};
    return prisma.sessionTriage.update({
      where: { id: session.id },
      data: {
        statut: "complete",
        fin: new Date(),
        niveauTriage: b.niveau_triage ?? session.niveauTriage,
        recommandation: b.recommandation ?? session.recommandation,
      },
    });
  });

  // GET /triage/sessions/:id — session + mesures + resultat.
  app.get("/sessions/:id", async (req) => {
    const session = await prisma.sessionTriage.findUnique({
      where: { id: req.params.id },
      include: {
        patient: true,
        agent: { select: { code: true, nom: true, prenom: true } },
        mesures: { orderBy: { timestamp: "desc" }, take: 200 },
        alertes: true,
      },
    });
    if (!session) throw notFound("Session introuvable");
    return session;
  });

  // GET /triage/sessions — liste filtree.
  app.get("/sessions", { preHandler: [requireRole("specialiste", "admin")] }, async (req) => {
    const { agent_id, statut, niveau, from, to } = req.query;
    const where = {
      ...(agent_id ? { agentId: agent_id } : {}),
      ...(statut ? { statut } : {}),
      ...(niveau ? { niveauTriage: niveau } : {}),
      ...(from || to
        ? { debut: { ...(from ? { gte: new Date(from) } : {}), ...(to ? { lte: new Date(to) } : {}) } }
        : {}),
    };
    const items = await prisma.sessionTriage.findMany({
      where,
      orderBy: { debut: "desc" },
      take: 100,
      include: { patient: { select: { nom: true, prenom: true } } },
    });
    return { items };
  });
}
