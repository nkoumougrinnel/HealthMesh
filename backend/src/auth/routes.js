import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { z } from "zod";
import { prisma } from "../db.js";
import { config } from "../config.js";
import { parse, unauthorized, badRequest } from "../utils/errors.js";
import { authenticate } from "./middleware.js";

const loginSchema = z.object({
  code: z.string().min(1),
  password: z.string().min(1),
  zone_id: z.string().optional(),
});

const refreshSchema = z.object({ refresh_token: z.string().min(1) });

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function publicAgent(a) {
  return {
    id: a.id,
    code: a.code,
    nom: a.nom,
    prenom: a.prenom,
    email: a.email,
    role: a.role,
    region: a.region,
    zone_id: a.zoneId,
  };
}

function signAccess(app, agent) {
  return app.jwt.sign(
    { sub: agent.id, code: agent.code, role: agent.role, zoneId: agent.zoneId },
    { expiresIn: config.jwt.accessTtl }
  );
}

async function issueRefresh(agent) {
  const raw = crypto.randomBytes(48).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 3600 * 1000);
  await prisma.refreshToken.create({
    data: { agentId: agent.id, tokenHash: hashToken(raw), expiresAt },
  });
  return raw;
}

export async function authRoutes(app) {
  // POST /auth/login — accepte le code agent OU l'email.
  app.post("/login", async (req) => {
    const { code, password } = parse(loginSchema, req.body);
    const agent = await prisma.agent.findFirst({
      where: { OR: [{ code }, { email: code }], actif: true },
    });
    if (!agent) throw unauthorized("Identifiants incorrects");
    const ok = await bcrypt.compare(password, agent.passwordHash);
    if (!ok) throw unauthorized("Identifiants incorrects");

    const access = signAccess(app, agent);
    const refresh = await issueRefresh(agent);
    await prisma.agent.update({ where: { id: agent.id }, data: { derniereSync: new Date() } });

    return {
      access_token: access,
      refresh_token: refresh,
      expires_in: config.jwt.accessTtl,
      agent: publicAgent(agent),
    };
  });

  // POST /auth/refresh — rotation du refresh token.
  app.post("/refresh", async (req) => {
    const { refresh_token } = parse(refreshSchema, req.body);
    const stored = await prisma.refreshToken.findUnique({
      where: { tokenHash: hashToken(refresh_token) },
      include: { agent: true },
    });
    if (!stored || stored.revoked || stored.expiresAt < new Date()) {
      throw unauthorized("Refresh token invalide ou expire");
    }
    // Rotation : on revoque l'ancien et on en emet un nouveau.
    await prisma.refreshToken.update({ where: { id: stored.id }, data: { revoked: true } });
    const newRefresh = await issueRefresh(stored.agent);
    return {
      access_token: signAccess(app, stored.agent),
      refresh_token: newRefresh,
      expires_in: config.jwt.accessTtl,
    };
  });

  // POST /auth/logout — revoque le refresh token.
  app.post("/logout", async (req) => {
    const body = req.body || {};
    if (body.refresh_token) {
      await prisma.refreshToken
        .updateMany({ where: { tokenHash: hashToken(body.refresh_token) }, data: { revoked: true } })
        .catch(() => {});
    }
    return { success: true };
  });

  // POST /auth/offline-token — token longue duree pour usage hors-ligne.
  app.post("/offline-token", async (req) => {
    const { code, password } = parse(
      loginSchema.pick({ code: true, password: true }),
      req.body
    );
    const agent = await prisma.agent.findFirst({
      where: { OR: [{ code }, { email: code }], actif: true },
    });
    if (!agent) throw unauthorized("Identifiants incorrects");
    if (!(await bcrypt.compare(password, agent.passwordHash))) {
      throw unauthorized("Identifiants incorrects");
    }
    const offline = app.jwt.sign(
      { sub: agent.id, code: agent.code, role: agent.role, zoneId: agent.zoneId, offline: true },
      { expiresIn: config.jwt.offlineTtl }
    );
    return { offline_token: offline, expires_in: config.jwt.offlineTtl };
  });

  // GET /auth/specialists — liste des specialistes (teleconsultation).
  app.get("/specialists", { preHandler: [authenticate] }, async () => {
    const items = await prisma.agent.findMany({
      where: { role: "specialiste", actif: true },
      select: { id: true, code: true, nom: true, prenom: true, email: true },
      orderBy: { nom: "asc" },
    });
    return { items };
  });

  // GET /auth/me — profil de l'agent connecte.
  app.get("/me", { preHandler: [authenticate] }, async (req) => {
    const agent = await prisma.agent.findUnique({ where: { id: req.agent.sub } });
    if (!agent) throw badRequest("Agent introuvable");
    return { agent: publicAgent(agent) };
  });
}
