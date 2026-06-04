import { z } from "zod";
import { nanoid } from "nanoid";
import { prisma } from "../db.js";
import { parse, notFound } from "../utils/errors.js";
import { authenticate, requireRole } from "../auth/middleware.js";
import { realtime } from "../realtime.js";

const initSchema = z.object({
  session_id: z.string().optional(),
  alerte_id: z.string().optional(),
  specialiste_id: z.string().min(1),
});

export async function consultationsRoutes(app) {
  app.addHook("preHandler", authenticate);

  // POST /consultations — initier (retourne room_id WebRTC).
  app.post("/", async (req, reply) => {
    const b = parse(initSchema, req.body);
    const roomId = `room-${nanoid(10)}`;
    const consult = await prisma.consultationVideo.create({
      data: {
        sessionId: b.session_id,
        alerteId: b.alerte_id,
        agentId: req.agent.sub,
        specialisteId: b.specialiste_id,
        roomId,
        statut: "en_attente",
      },
    });

    // Resume patient pour l'invitation.
    let patientResume = null;
    if (b.session_id) {
      const s = await prisma.sessionTriage.findUnique({
        where: { id: b.session_id },
        include: { patient: { select: { nom: true, prenom: true } } },
      });
      patientResume = s ? { patient: s.patient, niveau: s.niveauTriage } : null;
    }

    realtime.toAgent(b.specialiste_id, "consultation:invitation", {
      consultation_id: consult.id,
      room_id: roomId,
      patient_resume: patientResume,
    });

    reply.code(201);
    return { ...consult, ice_servers: [{ urls: "stun:stun.l.google.com:19302" }] };
  });

  // GET /consultations — liste (toutes, recentes d'abord).
  app.get("/", async (req) => {
    const items = await prisma.consultationVideo.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        agent: { select: { code: true, nom: true, prenom: true } },
        specialiste: { select: { code: true, nom: true, prenom: true } },
      },
    });
    return { items };
  });

  // GET /consultations/queue — file d'attente (specialiste).
  app.get("/queue", { preHandler: [requireRole("specialiste", "admin")] }, async (req) => {
    const items = await prisma.consultationVideo.findMany({
      where: { statut: { in: ["en_attente", "en_cours"] }, specialisteId: req.agent.sub },
      orderBy: { createdAt: "asc" },
    });
    return { items };
  });

  // GET /consultations/:id
  app.get("/:id", async (req) => {
    const consult = await prisma.consultationVideo.findUnique({
      where: { id: req.params.id },
      include: {
        agent: { select: { code: true, nom: true, prenom: true } },
        specialiste: { select: { code: true, nom: true, prenom: true } },
      },
    });
    if (!consult) throw notFound("Consultation introuvable");
    return consult;
  });

  // PUT /consultations/:id — maj notes / diagnostic (specialiste).
  app.put("/:id", { preHandler: [requireRole("specialiste", "admin")] }, async (req) => {
    const consult = await prisma.consultationVideo.findUnique({ where: { id: req.params.id } });
    if (!consult) throw notFound("Consultation introuvable");
    const b = req.body || {};
    return prisma.consultationVideo.update({
      where: { id: consult.id },
      data: {
        notesCliniques: b.notes_cliniques ?? undefined,
        diagnostic: b.diagnostic ?? undefined,
        recommandations: b.recommandations ?? undefined,
        statut: "en_cours",
      },
    });
  });

  // PUT /consultations/:id/end — terminer + calculer duree.
  app.put("/:id/end", async (req) => {
    const consult = await prisma.consultationVideo.findUnique({ where: { id: req.params.id } });
    if (!consult) throw notFound("Consultation introuvable");
    const fin = new Date();
    const duree = Math.round((fin.getTime() - new Date(consult.debut).getTime()) / 1000);
    const updated = await prisma.consultationVideo.update({
      where: { id: consult.id },
      data: { fin, dureeSecondes: duree, statut: "terminee" },
    });
    realtime.toConsult(consult.id, "consultation:terminee", { consultation_id: consult.id });
    return updated;
  });
}
