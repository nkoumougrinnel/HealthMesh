import { Server } from "socket.io";
import { config } from "./config.js";
import { prisma } from "./db.js";

// Couche temps reel Socket.IO.
// Rooms : zone:{id}, session:{id}, consult:{id}, agent:{id}, role:{role}

let io = null;

export function getIo() {
  return io;
}

export function setupRealtime(httpServer, app) {
  io = new Server(httpServer, {
    cors: { origin: config.corsOrigin.includes("*") ? true : config.corsOrigin },
    path: "/socket.io",
  });

  // Authentification a la connexion via JWT (handshake.auth.token ou query.token).
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.query?.token ||
        (socket.handshake.headers?.authorization || "").replace(/^Bearer\s+/i, "");
      if (!token) return next(new Error("token manquant"));
      const decoded = app.jwt.verify(token);
      socket.data.agent = decoded;
      return next();
    } catch (err) {
      return next(new Error("token invalide"));
    }
  });

  io.on("connection", (socket) => {
    const agent = socket.data.agent;
    socket.join(`agent:${agent.sub}`);
    socket.join(`role:${agent.role}`);
    if (agent.zoneId) socket.join(`zone:${agent.zoneId}`);

    app.log.info(`WS connecte: agent=${agent.code} role=${agent.role}`);

    // ─── Client -> Serveur ───────────────────────────────
    socket.on("rejoindre:zone", ({ zone_id }) => {
      if (zone_id) socket.join(`zone:${zone_id}`);
    });

    socket.on("rejoindre:session", ({ session_id }) => {
      if (session_id) socket.join(`session:${session_id}`);
    });

    socket.on("rejoindre:consultation", ({ consultation_id }) => {
      if (consultation_id) socket.join(`consult:${consultation_id}`);
    });

    socket.on("capteur:ping", async ({ dispositif_id }) => {
      if (!dispositif_id) return;
      await prisma.dispositif
        .update({
          where: { id: dispositif_id },
          data: { dernierContact: new Date(), statut: "connecte" },
        })
        .catch(() => {});
    });

    socket.on("offline:annonce", ({ agent_id, nb_records_pending }) => {
      app.log.info(`Agent ${agent_id} offline, ${nb_records_pending} records en attente`);
    });

    // ─── Signaling WebRTC (relais SDP / ICE) ─────────────
    socket.on("webrtc:signal", ({ consultation_id, data }) => {
      if (consultation_id) {
        socket.to(`consult:${consultation_id}`).emit("webrtc:signal", {
          from: agent.sub,
          data,
        });
      }
    });

    socket.on("disconnect", () => {
      app.log.info(`WS deconnecte: agent=${agent.code}`);
    });
  });

  return io;
}

// ─── Helpers d'emission (utilisables depuis n'importe quel module) ─
export const realtime = {
  toZone(zoneId, event, payload) {
    io?.to(`zone:${zoneId}`).emit(event, payload);
  },
  toSession(sessionId, event, payload) {
    io?.to(`session:${sessionId}`).emit(event, payload);
  },
  toConsult(consultId, event, payload) {
    io?.to(`consult:${consultId}`).emit(event, payload);
  },
  toAgent(agentId, event, payload) {
    io?.to(`agent:${agentId}`).emit(event, payload);
  },
  toRole(role, event, payload) {
    io?.to(`role:${role}`).emit(event, payload);
  },
  toAll(event, payload) {
    io?.emit(event, payload);
  },
};
