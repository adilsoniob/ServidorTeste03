/**
 * Força reconexão (mata sessão e gera QR novo).
 */

import { Router } from "express";

export const reconnectRouter = Router();

reconnectRouter.get("/", async (req, res) => {
  const whatsapp = req.app.locals.whatsapp;
  if (!whatsapp) {
    return res.status(503).json({ success: false, error: "WhatsApp não inicializado." });
  }
  try {
    await whatsapp.reconnect();
    res.json({ success: true, message: "Reconexão iniciada. Escaneie o QR Code novamente." });
  } catch (err) {
    res.status(502).json({ success: false, error: err.message });
  }
});
