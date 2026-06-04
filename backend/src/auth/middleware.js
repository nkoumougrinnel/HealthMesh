import { unauthorized, forbidden } from "../utils/errors.js";

// Verifie le JWT et attache req.agent. A utiliser en preHandler.
export async function authenticate(req) {
  try {
    await req.jwtVerify();
    req.agent = req.user; // payload du token
  } catch (err) {
    throw unauthorized("Token invalide ou expire");
  }
}

// Garde RBAC. Usage : preHandler: [authenticate, requireRole("specialiste","admin")]
export function requireRole(...roles) {
  return async (req) => {
    if (!req.agent) throw unauthorized();
    if (!roles.includes(req.agent.role)) {
      throw forbidden(`Role requis : ${roles.join(" ou ")}`);
    }
  };
}
