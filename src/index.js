import http from "node:http";
import { Server as SocketIOServer } from "socket.io";

import { config } from "./config.js";
import { log } from "./logger.js";
import { createApp } from "./app.js";
import { WhatsAppService } from "./services/whatsapp.js";
import { Storage } from "./services/storage.js";
import { closeDb } from "./services/queue.js";

if (!config.apiKey) {
  log.error("WHATSAPP_API_KEY não configurada. Saindo.");
  process.exit(1);
}

const storage = new Storage();
const whatsapp = new WhatsAppService(null, storage);
const app = createApp(whatsapp);
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: { origin: config.corsOrigin === "*" ? true : config.corsOrigin.split(",").map((s) => s.trim()), methods: ["GET", "POST"] },
  pingTimeout: 30000,
  pingInterval: 25000,
});

// Compartilha o io com o serviço para emitir eventos de QR/conexão
whatsapp.io = io;

server.listen(config.port, () => {
  log.info("WhatsApp Server iniciado", {
    port: config.port,
    qrPage: `http://localhost:${config.port}/`,
    painel: `http://localhost:${config.port}/admin`,
    health: `http://localhost:${config.port}/health`,
  });
});

whatsapp.initializeAll();

// Graceful shutdown
let shuttingDown = false;
async function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  log.info(`Sinal ${signal} recebido, encerrando...`);
  
  // Stop accepting new connections
  server.close(() => log.info("HTTP server fechado"));
  
  // Drain queue workers (wait for in-flight messages)
  log.info("Aguardando finalização dos workers da fila...");
  await whatsapp.drainAllQueues();
  
  // Destroy WhatsApp clients
  whatsapp.destroy();
  
  // Close database
  closeDb();
  
  // Force exit after 15s
  setTimeout(() => {
    log.warn("Shutdown timeout atingido, forçando saída");
    process.exit(0);
  }, 15000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("unhandledRejection", (r) => log.error("unhandledRejection", { reason: String(r) }));
process.on("uncaughtException", (e) => log.error("uncaughtException", { error: e.message }));
