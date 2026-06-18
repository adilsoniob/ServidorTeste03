import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, "../../data");

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readJSON(filePath) {
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeJSON(filePath, data) {
  ensureDir();
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
}

export class Storage {
  constructor() {
    this.messagesPath = path.join(DATA_DIR, "messages.json");
    this.logsPath = path.join(DATA_DIR, "logs.json");
    this.sessionPath = path.join(DATA_DIR, "session.json");
    this.contactsPath = path.join(DATA_DIR, "contacts.json");
    ensureDir();
  }

  addMessage(entry) {
    const messages = readJSON(this.messagesPath) || [];
    messages.push({
      id: entry.id || `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      to: entry.to,
      account: entry.account ?? 0,
      status: entry.status || "sent",
      timestamp: entry.timestamp || new Date().toISOString(),
      source: entry.source || "api",
    });
    writeJSON(this.messagesPath, messages);
    this._updateContact(entry.to, entry.status || "sent", entry.account ?? 0);
    return messages[messages.length - 1];
  }

  updateMessageStatus(to, status, account = 0) {
    const messages = readJSON(this.messagesPath) || [];
    let changed = false;
    for (const msg of messages) {
      if (msg.to === to && (msg.account === account) && msg.status !== "failed") {
        msg.status = status;
        changed = true;
      }
    }
    if (changed) writeJSON(this.messagesPath, messages);
  }

  getMessages(limit = 100, filters = {}) {
    let messages = readJSON(this.messagesPath) || [];
    if (filters.account !== undefined) {
      messages = messages.filter((m) => m.account === filters.account);
    }
    if (filters.status) {
      messages = messages.filter((m) => m.status === filters.status);
    }
    if (filters.phone) {
      messages = messages.filter((m) => m.to === filters.phone);
    }
    if (filters.dateFrom) {
      const from = new Date(filters.dateFrom).getTime();
      messages = messages.filter((m) => new Date(m.timestamp).getTime() >= from);
    }
    if (filters.dateTo) {
      const to = new Date(filters.dateTo).getTime();
      messages = messages.filter((m) => new Date(m.timestamp).getTime() <= to);
    }
    return messages.slice(-limit).reverse();
  }

  getMessagesByPhone(phone) {
    const messages = readJSON(this.messagesPath) || [];
    return messages.filter((m) => m.to === phone).reverse();
  }

  getMessageStats() {
    const messages = readJSON(this.messagesPath) || [];
    return {
      total: messages.length,
      byStatus: messages.reduce((acc, m) => {
        acc[m.status] = (acc[m.status] || 0) + 1;
        return acc;
      }, {}),
      byAccount: messages.reduce((acc, m) => {
        const key = `account_${m.account}`;
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {}),
    };
  }

  _updateContact(phone, status, account = 0) {
    const contacts = readJSON(this.contactsPath) || {};
    const key = `${account}_${phone}`;
    const existing = contacts[key] || { phone, account, count: 0, lastStatus: "", lastSendAt: null };
    existing.count += 1;
    existing.lastStatus = status;
    existing.lastSendAt = new Date().toISOString();
    contacts[key] = existing;
    writeJSON(this.contactsPath, contacts);
  }

  getContacts() {
    const contacts = readJSON(this.contactsPath) || {};
    return Object.values(contacts).sort((a, b) => {
      if (!a.lastSendAt) return 1;
      if (!b.lastSendAt) return -1;
      return new Date(b.lastSendAt) - new Date(a.lastSendAt);
    });
  }

  saveSession(data) {
    writeJSON(this.sessionPath, {
      ...data,
      updatedAt: new Date().toISOString(),
    });
  }

  getSession() {
    return readJSON(this.sessionPath) || null;
  }

  clearSession() {
    try { fs.unlinkSync(this.sessionPath); } catch {}
  }

  addLog(event, description, data = {}) {
    const logs = readJSON(this.logsPath) || [];
    logs.push({
      event,
      description,
      data: { ...data, account: data.account ?? 0 },
      timestamp: new Date().toISOString(),
    });
    writeJSON(this.logsPath, logs);
  }

  getLogs(limit = 200, filters = {}) {
    let logs = readJSON(this.logsPath) || [];
    if (filters.account !== undefined) {
      logs = logs.filter((l) => (l.data?.account ?? 0) === filters.account);
    }
    if (filters.event) {
      logs = logs.filter((l) => l.event === filters.event);
    }
    if (filters.dateFrom) {
      const from = new Date(filters.dateFrom).getTime();
      logs = logs.filter((l) => new Date(l.timestamp).getTime() >= from);
    }
    if (filters.dateTo) {
      const to = new Date(filters.dateTo).getTime();
      logs = logs.filter((l) => new Date(l.timestamp).getTime() <= to);
    }
    return logs.slice(-limit).reverse();
  }
}
