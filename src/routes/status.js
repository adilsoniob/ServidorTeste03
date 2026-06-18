/**
 * Status do WhatsApp (sem autenticação para permitir monitoramento público,
 * mas exige conexão válida do Client para retornar connected=true).
 */

import { Router } from "express";

export const statusRouter = Router();

statusRouter.get("/", (req, res) => {
  const whatsapp = req.app.locals.whatsapp;
  if (!whatsapp) {
    return res.json({
      connected: false,
      status: "offline",
      qr: null,
      message: "WhatsApp não inicializado.",
      lastSendAt: null,
      lastError: null,
      reconnectAttempts: 0,
    });
  }
  const status = whatsapp.getStatus();
  res.json({
    connected: status.state === "connected",
    status: status.state,
    qr: status.qr || null,
    message: status.message || "",
    lastSendAt: status.lastSendAt || null,
    lastError: status.lastError || null,
    reconnectAttempts: status.reconnectAttempts || 0,
  });
});
