import { z } from "zod";
import { prisma } from "../db.js";
import { parse } from "../utils/errors.js";
import { authenticate } from "../auth/middleware.js";

// Gestion hors-ligne / synchronisation.
// Strategie : mesures et sessions toujours acceptees (timestamp preserve),
// patients en last-write-wins.

const pushSchema = z.object({
  entite: z.enum(["patients", "mesures", "sessions", "alertes"]),
  records: z.array(z.record(z.any())).min(1),
});

export async function syncRoutes(app) {
  app.addHook("preHandler", authenticate);

  // POST /sync/push — envoie un lot cree hors-ligne.
  app.post("/push", async (req) => {
    const b = parse(pushSchema, req.body);
    const agentId = req.agent.sub;
    const results = [];

    for (const rec of b.records) {
      const clientId = rec.client_id || rec.local_id || rec.id;
      try {
        if (b.entite === "patients") {
          const existing = rec.id ? await prisma.patient.findUnique({ where: { id: rec.id } }) : null;
          if (existing) {
            // Last-write-wins sur l'horodatage.
            const incoming = new Date(rec.updated_at || rec.created_offline_at || Date.now());
            if (incoming > existing.updatedAt) {
              await prisma.patient.update({
                where: { id: existing.id },
                data: { nom: rec.nom ?? existing.nom, prenom: rec.prenom ?? existing.prenom, poidsKg: rec.poids_kg ?? existing.poidsKg },
              });
              results.push({ client_id: clientId, status: "updated" });
            } else {
              results.push({ client_id: clientId, status: "conflict", server_version: existing });
            }
          } else {
            const created = await prisma.patient.create({
              data: { nom: rec.nom, prenom: rec.prenom, zoneId: rec.zone_id, agentRefId: agentId, sexe: rec.sexe },
            });
            results.push({ client_id: clientId, status: "created", server_id: created.id });
          }
        } else if (b.entite === "mesures") {
          // Toujours acceptees, timestamp offline preserve.
          const created = await prisma.mesure.create({
            data: {
              sessionId: rec.session_id,
              patientId: rec.patient_id,
              capteurType: rec.capteur_type,
              valeur: Number(rec.valeur),
              unite: rec.unite || "",
              source: "saisie_manuelle",
              timestamp: new Date(rec.created_offline_at || rec.timestamp || Date.now()),
            },
          });
          results.push({ client_id: clientId, status: "created", server_id: created.id });
        } else if (b.entite === "sessions") {
          const created = await prisma.sessionTriage.create({
            data: {
              patientId: rec.patient_id,
              agentId,
              symptomes: rec.symptomes || [],
              dureeSymptomes: rec.duree_symptomes,
              niveauTriage: rec.niveau_triage,
              statut: rec.statut || "complete",
              debut: new Date(rec.created_offline_at || rec.debut || Date.now()),
            },
          });
          results.push({ client_id: clientId, status: "created", server_id: created.id });
        } else {
          results.push({ client_id: clientId, status: "ignored" });
        }
      } catch (err) {
        await prisma.syncQueue.create({
          data: { agentId, entite: b.entite, clientId: String(clientId || ""), payload: rec, statut: "conflict" },
        }).catch(() => {});
        results.push({ client_id: clientId, status: "error", message: err.message });
      }
    }

    await prisma.agent.update({ where: { id: agentId }, data: { derniereSync: new Date() } });
    return { results };
  });

  // GET /sync/pull — recupere les MAJ depuis derniere_sync.
  app.get("/pull", async (req) => {
    const agent = await prisma.agent.findUnique({ where: { id: req.agent.sub } });
    const since = req.query.since ? new Date(req.query.since) : agent?.derniereSync || new Date(0);
    const [patients, sessions, alertes] = await Promise.all([
      prisma.patient.findMany({ where: { updatedAt: { gt: since }, deletedAt: null }, take: 500 }),
      prisma.sessionTriage.findMany({ where: { createdAt: { gt: since } }, take: 500 }),
      prisma.alerte.findMany({ where: { createdAt: { gt: since } }, take: 500 }),
    ]);
    return { since, patients, sessions, alertes, server_time: new Date() };
  });

  // GET /sync/status — etat de la file.
  app.get("/status", async (req) => {
    const pending = await prisma.syncQueue.count({ where: { agentId: req.agent.sub, statut: "pending" } });
    const conflicts = await prisma.syncQueue.count({ where: { agentId: req.agent.sub, statut: "conflict" } });
    return { pending, conflicts };
  });

  // POST /sync/resolve — resolution manuelle d'un conflit.
  app.post("/resolve", async (req) => {
    const { queue_id, resolution } = req.body || {};
    if (!queue_id) return { success: false, message: "queue_id requis" };
    await prisma.syncQueue.update({ where: { id: queue_id }, data: { statut: resolution === "keep_server" ? "synced" : "synced" } });
    return { success: true };
  });
}
