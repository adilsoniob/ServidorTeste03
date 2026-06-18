import { timingSafeEqual } from "node:crypto";
import { config } from "../config.js";

/**
 * Compara API Key via timingSafeEqual para evitar timing-attack.
 * Espera header: Authorization: Bearer <key>
 */
export function authMiddleware(req, res, next) {
  const expected = config.apiKey;
  if (!expected) {
    // Servidor sem chave configurada não deve aceitar requisições autenticadas.
    return res.status(500).json({
      success: false,
      error: "Servidor sem WHATSAPP_API_KEY configurada.",
      code: "SERVER_NO_API_KEY",
    });
  }

  const header = req.headers.authorization || "";
  const token = header.replace(/^Bearer\s+/i, "").trim();

  if (!token) {
    return res.status(401).json({ success: false, error: "Token ausente.", code: "NO_TOKEN" });
  }
  if (token.length !== expected.length) {
    return res.status(401).json({ success: false, error: "Não autorizado.", code: "INVALID_TOKEN" });
  }

  try {
    const ok = timingSafeEqual(Buffer.from(token, "utf8"), Buffer.from(expected, "utf8"));
    if (!ok) {
      return res.status(401).json({ success: false, error: "Não autorizado.", code: "INVALID_TOKEN" });
    }
  } catch {
    return res.status(401).json({ success: false, error: "Não autorizado.", code: "INVALID_TOKEN" });
  }

  next();
}
