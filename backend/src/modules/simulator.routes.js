import { z } from "zod";
import { parse, badRequest } from "../utils/errors.js";
import { authenticate } from "../auth/middleware.js";
import { SCENARIOS } from "../simulator/profiles.js";
import * as sim from "../simulator/simulator.js";

const startSchema = z.object({
  session_id: z.string().min(1),
  profile: z.string().optional(),
  interval_ms: z.number().optional(),
});

const scenarioSchema = z.object({
  session_id: z.string().min(1),
  scenario_name: z.string().min(1),
  interval_ms: z.number().optional(),
});

const injectSchema = z.object({
  session_id: z.string().min(1),
  capteur: z.enum(["SpO2", "FC", "TA_SYS", "TA_DIA", "TEMP", "FR"]),
  valeur: z.number(),
});

export async function simulatorRoutes(app) {
  app.addHook("preHandler", authenticate);

  // GET /simulator/scenarios — liste des scenarios disponibles.
  app.get("/scenarios", async () => ({
    scenarios: Object.entries(SCENARIOS).map(([k, v]) => ({ name: k, ...v })),
  }));

  // POST /simulator/start — demarre la generation pour une session.
  app.post("/start", async (req) => {
    const b = parse(startSchema, req.body);
    return sim.startSimulation({ sessionId: b.session_id, profile: b.profile, intervalMs: b.interval_ms });
  });

  // POST /simulator/scenario — lance un scenario preconfigure.
  app.post("/scenario", async (req) => {
    const b = parse(scenarioSchema, req.body);
    try {
      return sim.startScenario({ sessionId: b.session_id, scenarioName: b.scenario_name, intervalMs: b.interval_ms });
    } catch (err) {
      throw badRequest(err.message);
    }
  });

  // POST /simulator/stop
  app.post("/stop", async (req) => {
    const sessionId = (req.body || {}).session_id;
    if (!sessionId) throw badRequest("session_id requis");
    return sim.stop(sessionId);
  });

  // PUT /simulator/inject — injecte une valeur manuelle (demo live).
  app.put("/inject", async (req) => {
    const b = parse(injectSchema, req.body);
    return sim.injectValue({ sessionId: b.session_id, capteur: b.capteur, valeur: b.valeur });
  });

  // GET /simulator/status
  app.get("/status", async () => ({ sessions: sim.status() }));
}
