export class HttpError extends Error {
  constructor(statusCode, message, code) {
    super(message);
    this.statusCode = statusCode;
    this.code = code || "ERROR";
  }
}

export const badRequest = (msg) => new HttpError(400, msg, "BAD_REQUEST");
export const unauthorized = (msg = "Non authentifie") => new HttpError(401, msg, "UNAUTHORIZED");
export const forbidden = (msg = "Acces refuse") => new HttpError(403, msg, "FORBIDDEN");
export const notFound = (msg = "Ressource introuvable") => new HttpError(404, msg, "NOT_FOUND");
export const conflict = (msg) => new HttpError(409, msg, "CONFLICT");

// Wrapper pour valider un body avec un schema zod et lever une erreur 400 propre.
export function parse(schema, data) {
  const result = schema.safeParse(data);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("; ");
    throw badRequest(`Donnees invalides — ${issues}`);
  }
  return result.data;
}
