import Fastify from "fastify";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import rateLimit from "@fastify/rate-limit";

import { config } from "./config.js";
import { prisma, disconnectDb } from "./db.js";
import { initBus, closeBus, isRedisActive } from "./redis.js";
import { setupRealtime } from "./realtime.js";
import { HttpError } from "./utils/errors.js";

import { authRoutes } from "./auth/routes.js";
import { patientsRoutes } from "./modules/patients.routes.js";
import { triageRoutes } from "./modules/triage.routes.js";
import { alertesRoutes } from "./modules/alertes.routes.js";
import { consultationsRoutes } from "./modules/consultations.routes.js";
import { syncRoutes } from "./modules/sync.routes.js";
import { reportsRoutes } from "./modules/reports.routes.js";
import { simulatorRoutes } from "./modules/simulator.routes.js";
import { stopAll } from "./simulator/simulator.js";

async function build() {
  const app = Fastify({
    logger: {
      level: config.isProd ? "info" : "debug",
      transport: config.isProd ? undefined : { target: "pino-pretty", options: { translateTime: "HH:MM:ss", ignore: "pid,hostname" } },
    },
    trustProxy: true,
  });

  // Plugins.
  await app.register(cors, {
    origin: config.corsOrigin.includes("*") ? true : config.corsOrigin,
    credentials: true,
  });
  await app.register(jwt, { secret: config.jwt.secret });
  await app.register(rateLimit, { max: 1000, timeWindow: "1 minute" });

  // Tolere un corps JSON vide (POST/PUT sans body : ex. /analyze, /prendre-en-charge).
  app.addContentTypeParser("application/json", { parseAs: "string" }, (req, body, done) => {
    if (!body || body.trim() === "") return done(null, {});
    try {
      done(null, JSON.parse(body));
    } catch (err) {
      err.statusCode = 400;
      done(err);
    }
  });

  // Gestion d'erreurs unifiee.
  app.setErrorHandler((err, req, reply) => {
    if (err instanceof HttpError) {
      return reply.code(err.statusCode).send({ error: err.code, message: err.message });
    }
    if (err.validation || err.statusCode === 400) {
      return reply.code(400).send({ error: "BAD_REQUEST", message: err.message });
    }
    if (err.statusCode === 429) {
      return reply.code(429).send({ error: "RATE_LIMITED", message: "Trop de requetes" });
    }
    req.log.error(err);
    return reply.code(500).send({ error: "INTERNAL", message: "Erreur interne du serveur" });
  });

  // Health.
  app.get("/health", async () => ({
    status: "ok",
    service: "healthmesh-backend",
    redis: isRedisActive() ? "connected" : "memory",
    ia_engine: config.ia.engine,
    time: new Date().toISOString(),
  }));

  app.get("/", async () => ({
    name: "HealthMesh Emergency Triage API",
    version: "1.0.0",
    docs: "/api/v1 — voir README.md",
  }));

  // Routes API v1.
  const PREFIX = "/api/v1";
  await app.register(authRoutes, { prefix: `${PREFIX}/auth` });
  await app.register(patientsRoutes, { prefix: `${PREFIX}/patients` });
  await app.register(triageRoutes, { prefix: `${PREFIX}/triage` });
  await app.register(alertesRoutes, { prefix: `${PREFIX}/alertes` });
  await app.register(consultationsRoutes, { prefix: `${PREFIX}/consultations` });
  await app.register(syncRoutes, { prefix: `${PREFIX}/sync` });
  await app.register(reportsRoutes, { prefix: `${PREFIX}/reports` });
  await app.register(simulatorRoutes, { prefix: `${PREFIX}/simulator` });

  return app;
}

async function main() {
  const app = await build();
  await initBus(app.log);

  // Verifie la connexion DB au demarrage (message clair sinon).
  try {
    await prisma.$queryRaw`SELECT 1`;
    app.log.info("PostgreSQL connecte");
  } catch (err) {
    app.log.error(`Connexion DB impossible — verifiez DATABASE_URL. ${err.message}`);
  }

  await app.listen({ port: config.port, host: config.host });

  // Socket.IO sur le meme serveur HTTP.
  setupRealtime(app.server, app);
  app.log.info(`Temps reel Socket.IO actif sur /socket.io`);

  const shutdown = async (signal) => {
    app.log.info(`Arret (${signal})...`);
    stopAll();
    await app.close();
    await closeBus();
    await disconnectDb();
    process.exit(0);
  };
  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

main().catch((err) => {
  console.error("Echec demarrage:", err);
  process.exit(1);
});
