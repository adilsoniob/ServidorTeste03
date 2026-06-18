/**
 * Desconecta o WhatsApp manualmente.
 */

import { Router } from "express";

export const disconnectRouter = Router();

disconnectRouter.get("/", async (req, res) => {
  const whatsapp = req.app.locals.whatsapp;
  if (!whatsapp) {
    return res.status(503).json({ success: false, error: "WhatsApp não inicializado." });
  }
  try {
    await whatsapp.disconnect();
    res.json({ success: true, message: "WhatsApp desconectado com sucesso." });
  } catch (err) {
    res.status(502).json({ success: false, error: err.message });
  }
});
