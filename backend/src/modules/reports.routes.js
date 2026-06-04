import { prisma } from "../db.js";
import { authenticate, requireRole } from "../auth/middleware.js";

export async function reportsRoutes(app) {
  app.addHook("preHandler", authenticate);

  // GET /reports/activity — triages par niveau / statut sur une periode.
  app.get("/activity", async (req) => {
    const { from, to } = req.query;
    const where =
      from || to
        ? { debut: { ...(from ? { gte: new Date(from) } : {}), ...(to ? { lte: new Date(to) } : {}) } }
        : {};
    const [parNiveau, parStatut, total] = await Promise.all([
      prisma.sessionTriage.groupBy({ by: ["niveauTriage"], where, _count: true }),
      prisma.sessionTriage.groupBy({ by: ["statut"], where, _count: true }),
      prisma.sessionTriage.count({ where }),
    ]);
    return { total, par_niveau: parNiveau, par_statut: parStatut };
  });

  // GET /reports/activity-daily — series par jour et par niveau (14 derniers jours).
  app.get("/activity-daily", async () => {
    const rows = await prisma.$queryRaw`
      SELECT to_char(date_trunc('day', debut), 'YYYY-MM-DD') AS jour,
             niveau_triage AS niveau,
             count(*)::int AS n
      FROM sessions_triage
      WHERE debut > now() - interval '14 days'
      GROUP BY 1, 2
      ORDER BY 1`;
    const byDay = {};
    for (const r of rows) {
      byDay[r.jour] = byDay[r.jour] || { jour: r.jour, ROUGE: 0, ORANGE: 0, VERT: 0, GRIS: 0 };
      if (r.niveau) byDay[r.jour][r.niveau] = r.n;
    }
    return { items: Object.values(byDay) };
  });

  // GET /reports/vitals-trend — evolution temporelle d'un signe vital.
  app.get("/vitals-trend", async (req) => {
    const { patient_id, metric = "SpO2" } = req.query;
    if (!patient_id) return { points: [] };
    const points = await prisma.mesure.findMany({
      where: { patientId: patient_id, capteurType: metric },
      orderBy: { timestamp: "asc" },
      take: 500,
      select: { valeur: true, timestamp: true, horsNorme: true },
    });
    return { metric, points };
  });

  // GET /reports/epidemio — agregation symptomes par zone (carte de chaleur).
  app.get("/epidemio", async (req) => {
    const sessions = await prisma.sessionTriage.findMany({
      where: {},
      select: { symptomes: true, patient: { select: { zoneId: true, zone: { select: { nom: true } } } } },
      take: 2000,
    });
    const map = {};
    for (const s of sessions) {
      const zone = s.patient?.zone?.nom || "Inconnue";
      map[zone] = map[zone] || {};
      for (const sym of s.symptomes) map[zone][sym] = (map[zone][sym] || 0) + 1;
    }
    return { heatmap: map };
  });

  // GET /reports/agents-kpi — performance des agents.
  app.get("/agents-kpi", { preHandler: [requireRole("admin", "specialiste")] }, async () => {
    const grouped = await prisma.sessionTriage.groupBy({ by: ["agentId"], _count: true });
    const agents = await prisma.agent.findMany({ select: { id: true, code: true, nom: true, prenom: true } });
    const byId = Object.fromEntries(agents.map((a) => [a.id, a]));
    return {
      items: grouped.map((g) => ({
        agent: byId[g.agentId] || { id: g.agentId },
        nb_triages: g._count,
      })),
    };
  });

  // GET /reports/export — export CSV simple des sessions.
  app.get("/export", async (req, reply) => {
    const sessions = await prisma.sessionTriage.findMany({
      orderBy: { debut: "desc" },
      take: 1000,
      include: { patient: { select: { nom: true, prenom: true } } },
    });
    const header = "id,patient,niveau,score_ia,statut,debut\n";
    const rows = sessions
      .map((s) => `${s.id},"${s.patient?.nom} ${s.patient?.prenom || ""}",${s.niveauTriage || ""},${s.scoreIa ?? ""},${s.statut},${s.debut.toISOString()}`)
      .join("\n");
    reply.header("content-type", "text/csv; charset=utf-8");
    reply.header("content-disposition", 'attachment; filename="healthmesh_export.csv"');
    return header + rows;
  });
}
