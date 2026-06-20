/**
 * Configuração central do servidor.
 * Tudo que varia por ambiente fica aqui.
 *
 * IMPORTANTE: WHATSAPP_API_KEY tem dois nomes aceitos para compatibilidade:
 * - WHATSAPP_API_KEY (nome padrão/convenção)
 * - API_KEY (nome curto, comum em Railway/Render quando se tem só uma chave)
 */

export const config = {
  port: parseInt(process.env.PORT || "4320", 10),
  // Aceita ambos os nomes: WHATSAPP_API_KEY ou API_KEY (Railway)
  apiKey: process.env.WHATSAPP_API_KEY || process.env.API_KEY || "",
  clientId: process.env.WHATSAPP_CLIENT_ID || "vale-saude",
  logPrefix: process.env.LOG_PREFIX || "[whatsapp-svc]",
  // Timeout do envio de mensagem (evita travar requisições)
  sendTimeoutMs: parseInt(process.env.SEND_TIMEOUT_MS || "20000", 10),
  // Limite de tentativas de reconexão automática
  maxReconnectAttempts: parseInt(process.env.MAX_RECONNECT_ATTEMPTS || "5", 10),
  // Backoff inicial (multiplica a cada falha)
  reconnectBaseDelayMs: parseInt(process.env.RECONNECT_BASE_DELAY_MS || "8000", 10),
  // Pasta da sessão WhatsApp (suporta SESSION_FOLDER para Railway)
  // Em produção (Railway/Render), use /data para persistência via volume
  sessionFolder: process.env.SESSION_FOLDER || (process.env.NODE_ENV === "production" ? "/data/session" : "./data/session"),
  // Pasta de autenticação do whatsapp-web.js (LocalAuth)
  authFolder: process.env.AUTH_FOLDER || (process.env.NODE_ENV === "production" ? "/data/.wwebjs_auth" : "./data/.wwebjs_auth"),
  // Número máximo de contas simultâneas
  maxAccounts: parseInt(process.env.MAX_ACCOUNTS || "1", 10),
  corsOrigin: process.env.CORS_ORIGIN || "*",
  // Rate limiting para envio de mensagens (evita ban)
  rateLimit: {
    maxPerMinute: parseInt(process.env.RATE_LIMIT_MAX_PER_MINUTE || "20", 10),
  },
  // Stealth: proteção anti-bloqueio (desligado por padrão)
  stealth: {
    enabled: process.env.STEALTH_ENABLED === "true",
    variableDelay: { enabled: true, min: 4000, max: 14000 },
    randomPauses: { enabled: true, every: 5, minSec: 15, maxSec: 120 },
    businessHours: { enabled: true, start: 8, end: 21, timezone: "America/Sao_Paulo" },
    dailyLimit: { enabled: true, max: 80 },
    contactWindow: { enabled: true, hours: 24 },
    stealthPlugin: true,
    userAgentRotation: true,
    simulateTyping: { enabled: true, min: 3000, max: 7000 },
    variacao: { enabled: true, frequencia: 2, emoji: true, pontuacao: true },
  },
};
