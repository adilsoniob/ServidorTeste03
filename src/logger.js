/**
 * Logger estruturado simples.
 * Cada linha tem: ISO timestamp + nível + mensagem + dados opcionais em JSON.
 */

import { config } from "./config.js";

const ts = () => new Date().toISOString();

const format = (level, message, data) => {
  const head = `${ts()} ${config.logPrefix} ${level.toUpperCase()}: ${message}`;
  if (data && Object.keys(data).length > 0) {
    try {
      return `${head} ${JSON.stringify(data)}`;
    } catch {
      return `${head} [unserializable data]`;
    }
  }
  return head;
};

export const log = {
  info: (message, data) => console.log(format("info", message, data)),
  warn: (message, data) => console.warn(format("warn", message, data)),
  error: (message, data) => console.error(format("error", message, data)),
  debug: (message, data) => {
    if (process.env.DEBUG) console.log(format("debug", message, data));
  },
};
