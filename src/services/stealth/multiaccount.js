import * as queue from "../queue.js";
import { log } from "../../logger.js";

const TRIGGER_WORDS = ["blocked", "ban", "banned", "logout", "authentication"];

export class MultiAccount {
  constructor(index) {
    this.index = index;
    this.healthy = true;
    this.blockedAt = null;
    this._onBlocked = null;
  }

  isHealthy() {
    return this.healthy;
  }

  markHealthy() {
    this.healthy = true;
    this.blockedAt = null;
  }

  isBlockEvent(reason = "", message = "") {
    const combined = (reason + " " + (message || "")).toLowerCase();
    return TRIGGER_WORDS.some((w) => combined.includes(w));
  }

  async handleBlock(reason) {
    if (!this.healthy) return;
    this.healthy = false;
    this.blockedAt = Date.now();
    log.error(`[MultiAccount ${this.index}] Conta bloqueada`, { reason });

    try {
      const count = await queue.reassignByAccount(this.index);
      log.warn(`[MultiAccount ${this.index}] ${count} mensagens reatribuídas`);
    } catch (err) {
      log.error(`[MultiAccount ${this.index}] Erro ao reatribuir fila`, { error: err.message });
    }

    if (this._onBlocked) {
      this._onBlocked(reason);
    }
  }

  onBlocked(callback) {
    this._onBlocked = callback;
  }

  getStatus() {
    return {
      index: this.index,
      healthy: this.healthy,
      blockedAt: this.blockedAt,
    };
  }
}
