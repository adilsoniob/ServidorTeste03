/**
 * Health check reflete estado REAL do WhatsApp (não só "servidor respondeu").
 * Retorna 200 se conectado, 503 caso contrário.
 */

import { Router } from "express";

export const healthRouter = Router();

healthRouter.get("/", (req, res) => {
  const whatsapp = req.app.locals.whatsapp;
  const ok = whatsapp?.isReady();
  res.status(ok ? 200 : 503).json({
    ok,
    status: whatsapp?.getStatus().state || "offline",
    message: whatsapp?.getStatus().message || "Servidor não inicializou.",
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});
