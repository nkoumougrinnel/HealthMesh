import { z } from "zod";
import { prisma } from "../db.js";
import { parse, notFound, badRequest } from "../utils/errors.js";
import { authenticate, requireRole } from "../auth/middleware.js";
import { diffuserMajAlerte } from "./alerting.js";

const resoudreSchema = z.object({ notes: z.string().min(1, "Notes de resolution obligatoires") });

export async function alertesRoutes(app) {
  app.addHook("preHandler", authenticate);

  // GET /alertes — actives, triees par gravite puis heure.
  app.get("/", async (req) => {
    const { statut } = req.query;
    const where = statut ? { statut } : { statut: { in: ["active", "en_cours"] } };
    const items = await prisma.alerte.findMany({
      where,
      orderBy: [{ niveau: "asc" }, { createdAt: "desc" }], // ROUGE avant ORANGE (alpha)
      include: {
        patient: { select: { id: true, nom: true, prenom: true, zoneId: true } },
        session: { select: { id: true, niveauTriage: true } },
      },
    });
    return { items };
  });

  // GET /alertes/stats — statistiques (admin).
  app.get("/stats", { preHandler: [requireRole("admin", "specialiste")] }, async () => {
    const [parNiveau, parStatut, total] = await Promise.all([
      prisma.alerte.groupBy({ by: ["niveau"], _count: true }),
      prisma.alerte.groupBy({ by: ["statut"], _count: true }),
      prisma.alerte.count(),
    ]);
    return { total, par_niveau: parNiveau, par_statut: parStatut };
  });

  // GET /alertes/:id — detail + mesures critiques.
  app.get("/:id", async (req) => {
    const alerte = await prisma.alerte.findUnique({
      where: { id: req.params.id },
      include: {
        patient: true,
        session: { include: { mesures: { where: { horsNorme: true }, orderBy: { timestamp: "desc" }, take: 20 } } },
        specialiste: { select: { code: true, nom: true, prenom: true } },
      },
    });
    if (!alerte) throw notFound("Alerte introuvable");
    return alerte;
  });

  // PUT /alertes/:id/prendre-en-charge — specialiste s'assigne.
  app.put("/:id/prendre-en-charge", { preHandler: [requireRole("specialiste", "admin")] }, async (req) => {
    const alerte = await prisma.alerte.findUnique({ where: { id: req.params.id } });
    if (!alerte) throw notFound("Alerte introuvable");
    if (alerte.statut === "resolue") throw badRequest("Alerte deja resolue");
    const updated = await prisma.alerte.update({
      where: { id: alerte.id },
      data: { statut: "en_cours", priseEnChargePar: req.agent.sub, priseEnChargeAt: new Date() },
    });
    await diffuserMajAlerte(updated);
    return updated;
  });

  // PUT /alertes/:id/resoudre — notes obligatoires.
  app.put("/:id/resoudre", { preHandler: [requireRole("specialiste", "admin")] }, async (req) => {
    const b = parse(resoudreSchema, req.body);
    const alerte = await prisma.alerte.findUnique({ where: { id: req.params.id } });
    if (!alerte) throw notFound("Alerte introuvable");
    const updated = await prisma.alerte.update({
      where: { id: alerte.id },
      data: { statut: "resolue", resolueAt: new Date(), notesResolution: b.notes, priseEnChargePar: alerte.priseEnChargePar || req.agent.sub },
    });
    await diffuserMajAlerte(updated);
    return updated;
  });
}
