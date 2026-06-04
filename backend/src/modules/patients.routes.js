import { z } from "zod";
import { prisma } from "../db.js";
import { parse, notFound } from "../utils/errors.js";
import { authenticate, requireRole } from "../auth/middleware.js";

const createSchema = z.object({
  nom: z.string().min(1),
  prenom: z.string().optional(),
  date_naissance: z.string().optional(),
  sexe: z.enum(["M", "F", "Autre"]).optional(),
  poids_kg: z.number().optional(),
  zone_id: z.string().optional(),
  antecedents: z.record(z.any()).optional(),
  contacts_urgence: z.array(z.any()).optional(),
});

function mapIn(b) {
  return {
    nom: b.nom,
    prenom: b.prenom,
    dateNaissance: b.date_naissance ? new Date(b.date_naissance) : undefined,
    sexe: b.sexe,
    poidsKg: b.poids_kg,
    zoneId: b.zone_id,
    antecedents: b.antecedents ?? undefined,
    contactsUrgence: b.contacts_urgence ?? undefined,
  };
}

export async function patientsRoutes(app) {
  app.addHook("preHandler", authenticate);

  // GET /patients — liste paginee + filtres.
  app.get("/", async (req) => {
    const { zone_id, q, page = "1", limit = "20" } = req.query;
    const take = Math.min(Number(limit) || 20, 100);
    const skip = (Math.max(Number(page) || 1, 1) - 1) * take;
    const where = {
      deletedAt: null,
      ...(zone_id ? { zoneId: zone_id } : {}),
      ...(q ? { OR: [{ nom: { contains: q, mode: "insensitive" } }, { prenom: { contains: q, mode: "insensitive" } }] } : {}),
    };
    const [items, total] = await Promise.all([
      prisma.patient.findMany({ where, take, skip, orderBy: { createdAt: "desc" }, include: { zone: true } }),
      prisma.patient.count({ where }),
    ]);
    return { items, total, page: Number(page), limit: take };
  });

  // GET /patients/search — recherche full-text simple (nom/prenom).
  app.get("/search", async (req) => {
    const { q = "" } = req.query;
    if (!q) return { items: [] };
    const items = await prisma.patient.findMany({
      where: {
        deletedAt: null,
        OR: [{ nom: { contains: q, mode: "insensitive" } }, { prenom: { contains: q, mode: "insensitive" } }, { id: q }],
      },
      take: 20,
    });
    return { items };
  });

  // POST /patients — creer (agent).
  app.post("/", { preHandler: [requireRole("agent", "admin")] }, async (req, reply) => {
    const b = parse(createSchema, req.body);
    const patient = await prisma.patient.create({
      data: { ...mapIn(b), agentRefId: req.agent.sub },
    });
    reply.code(201);
    return patient;
  });

  // GET /patients/:id — profil complet + dernier triage + constantes recentes.
  app.get("/:id", async (req) => {
    const patient = await prisma.patient.findFirst({
      where: { id: req.params.id, deletedAt: null },
      include: { zone: true, agentRef: { select: { code: true, nom: true, prenom: true } } },
    });
    if (!patient) throw notFound("Patient introuvable");
    const dernierTriage = await prisma.sessionTriage.findFirst({
      where: { patientId: patient.id },
      orderBy: { debut: "desc" },
    });
    const constantes = await prisma.mesure.findMany({
      where: { patientId: patient.id },
      orderBy: { timestamp: "desc" },
      take: 12,
    });
    return { ...patient, dernier_triage: dernierTriage, constantes_recentes: constantes };
  });

  // PUT /patients/:id
  app.put("/:id", { preHandler: [requireRole("agent", "admin")] }, async (req) => {
    const b = parse(createSchema.partial(), req.body);
    const existing = await prisma.patient.findFirst({ where: { id: req.params.id, deletedAt: null } });
    if (!existing) throw notFound("Patient introuvable");
    return prisma.patient.update({ where: { id: req.params.id }, data: mapIn(b) });
  });

  // DELETE /patients/:id — soft delete (RGPD).
  app.delete("/:id", { preHandler: [requireRole("admin")] }, async (req) => {
    const existing = await prisma.patient.findFirst({ where: { id: req.params.id, deletedAt: null } });
    if (!existing) throw notFound("Patient introuvable");
    await prisma.patient.update({ where: { id: req.params.id }, data: { deletedAt: new Date() } });
    return { success: true };
  });

  // GET /patients/:id/mesures — historique mesures avec filtres.
  app.get("/:id/mesures", async (req) => {
    const { from, to, type } = req.query;
    const where = {
      patientId: req.params.id,
      ...(type ? { capteurType: type } : {}),
      ...(from || to
        ? { timestamp: { ...(from ? { gte: new Date(from) } : {}), ...(to ? { lte: new Date(to) } : {}) } }
        : {}),
    };
    const items = await prisma.mesure.findMany({ where, orderBy: { timestamp: "desc" }, take: 500 });
    return { items };
  });

  // GET /patients/:id/triages
  app.get("/:id/triages", async (req) => {
    const items = await prisma.sessionTriage.findMany({
      where: { patientId: req.params.id },
      orderBy: { debut: "desc" },
    });
    return { items };
  });

  // GET /patients/:id/alertes
  app.get("/:id/alertes", async (req) => {
    const items = await prisma.alerte.findMany({
      where: { patientId: req.params.id },
      orderBy: { createdAt: "desc" },
    });
    return { items };
  });
}
