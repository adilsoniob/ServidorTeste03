import { Router } from "express";

export function createAdminRouter(whatsapp) {
  const router = Router();
  const storage = whatsapp.storage;

  // ---- Status ----

  router.get("/api/admin/status", (_req, res) => {
    const primary = whatsapp.getStatus();
    res.json({ ...primary, accounts: whatsapp.getAccounts() });
  });

  // ---- Messages ----

  router.get("/api/admin/messages", (req, res) => {
    const limit = Math.min(parseInt(req.query.limit) || 100, 500);
    const filters = {};
    if (req.query.account !== undefined) filters.account = parseInt(req.query.account, 10);
    if (req.query.status) filters.status = req.query.status;
    if (req.query.phone) filters.phone = req.query.phone;
    if (req.query.dateFrom) filters.dateFrom = req.query.dateFrom;
    if (req.query.dateTo) filters.dateTo = req.query.dateTo;
    const messages = storage?.getMessages(limit, filters) || [];
    res.json({ success: true, messages, total: messages.length, filters });
  });

  router.get("/api/admin/messages/:phone", (req, res) => {
    const phone = req.params.phone;
    const messages = storage?.getMessagesByPhone(phone) || [];
    res.json({ success: true, messages });
  });

  // ---- Contacts ----

  router.get("/api/admin/contacts", (_req, res) => {
    const contacts = storage?.getContacts() || [];
    res.json({ success: true, contacts });
  });

  // ---- Logs ----

  router.get("/api/admin/logs", (req, res) => {
    const limit = Math.min(parseInt(req.query.limit) || 200, 1000);
    const filters = {};
    if (req.query.account !== undefined) filters.account = parseInt(req.query.account, 10);
    if (req.query.event) filters.event = req.query.event;
    if (req.query.dateFrom) filters.dateFrom = req.query.dateFrom;
    if (req.query.dateTo) filters.dateTo = req.query.dateTo;
    const logs = storage?.getLogs(limit, filters) || [];
    res.json({ success: true, logs, total: logs.length, filters });
  });

  // ---- Stats ----

  router.get("/api/admin/stats", (_req, res) => {
    const stats = storage?.getMessageStats() || {};
    res.json({ success: true, stats });
  });

  // ---- Admin HTML ----

  router.get("/admin", (_req, res) => {
    res.type("html").send(ADMIN_HTML);
  });

  return router;
}

const ADMIN_HTML = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Painel WhatsApp | Vale Sa�de</title>
<script src="https://cdn.socket.io/4.7.5/socket.io.min.js"></script>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:system-ui,-apple-system,sans-serif;background:#0f172a;color:#e2e8f0;min-height:100vh}
.layout{display:grid;grid-template-columns:280px 1fr;min-height:100vh}
.sidebar{background:#1e293b;padding:1.25rem;border-right:1px solid #334155;overflow-y:auto}
.sidebar h2{font-size:.75rem;text-transform:uppercase;letter-spacing:.05em;color:#64748b;margin:1.25rem 0 .5rem}
.sidebar h2:first-child{margin-top:0}
.sidebar .stat{display:flex;justify-content:space-between;padding:.4rem 0;font-size:.825rem;border-bottom:1px solid #334155}
.sidebar .stat:last-child{border:none}
.sidebar .stat-label{color:#94a3b8}
.sidebar .stat-value{font-weight:600}
.main{display:flex;flex-direction:column;height:100vh;overflow:hidden}
.topbar{display:flex;align-items:center;gap:.75rem;padding:.75rem 1.25rem;background:#1e293b;border-bottom:1px solid #334155}
.topbar h1{font-size:1rem;font-weight:700}
.status-dot{width:10px;height:10px;border-radius:50%;display:inline-block;flex-shrink:0}
.status-dot--connected{background:#22c55e;box-shadow:0 0 8px rgba(34,197,94,.5)}
.status-dot--awaiting_qr,.status-dot--reconnecting{background:#eab308;box-shadow:0 0 8px rgba(234,179,8,.5)}
.status-dot--offline,.status-dot--auth_failure,.status-dot--error{background:#ef4444;box-shadow:0 0 8px rgba(239,68,68,.5)}
.status-dot--starting{background:#64748b}
.content{flex:1;overflow-y:auto;padding:1.25rem;display:grid;grid-template-columns:1fr 1fr;gap:1rem;align-content:start}
.card{background:#1e293b;border-radius:.75rem;padding:1rem;border:1px solid #334155}
.card h3{font-size:.8rem;text-transform:uppercase;letter-spacing:.05em;color:#64748b;margin-bottom:.75rem}
.card-full{grid-column:1/-1}
.profile-row{display:flex;align-items:center;gap:.75rem;margin-bottom:.5rem}
.profile-pic{width:48px;height:48px;border-radius:50%;object-fit:cover;background:#334155}
.profile-info strong{font-size:.95rem}
.profile-info small{display:block;color:#94a3b8;font-size:.8rem;margin-top:2px}
.actions{display:flex;gap:.5rem;flex-wrap:wrap;margin-top:.75rem}
.btn{padding:.45rem 1rem;border-radius:.5rem;border:none;font-size:.8rem;font-weight:600;cursor:pointer;transition:opacity .15s}
.btn:hover{opacity:.85}
.btn-primary{background:#2563eb;color:#fff}
.btn-danger{background:#dc2626;color:#fff}
.btn-warning{background:#d97706;color:#fff}
.btn-outline{background:transparent;border:1px solid #475569;color:#cbd5e1}
.btn-sm{padding:.3rem .65rem;font-size:.75rem}
table{width:100%;border-collapse:collapse;font-size:.8rem}
th{text-align:left;padding:.5rem .4rem;color:#64748b;font-weight:600;font-size:.7rem;text-transform:uppercase;letter-spacing:.05em;border-bottom:1px solid #334155}
td{padding:.45rem .4rem;border-bottom:1px solid #1e293b;font-size:.8rem}
.tag{padding:.15rem .5rem;border-radius:999px;font-size:.7rem;font-weight:600}
.tag-success{background:#052e16;color:#4ade80}
.tag-warning{background:#451a03;color:#fbbf24}
.tag-error{background:#450a0a;color:#f87171}
.tag-info{background:#1e3a5f;color:#60a5fa}
.empty{color:#64748b;font-size:.8rem;padding:1rem 0;text-align:center}
.contact-item{display:flex;justify-content:space-between;align-items:center;padding:.4rem 0;border-bottom:1px solid #334155;font-size:.8rem}
.contact-item:last-child{border:none}
.contact-phone{font-weight:600;font-family:monospace}
.contact-meta{text-align:right;color:#94a3b8;font-size:.7rem}
.log-item{padding:.35rem 0;border-bottom:1px solid #1e293b;font-size:.75rem;display:flex;gap:.5rem}
.log-item:last-child{border:none}
.log-time{color:#64748b;flex-shrink:0;font-family:monospace;font-size:.7rem}
.log-event{font-weight:600;flex-shrink:0;min-width:120px}
.log-desc{color:#94a3b8}
.tabs{display:flex;gap:0;margin-bottom:1rem;border-bottom:1px solid #334155}
.tab{padding:.5rem 1rem;font-size:.8rem;font-weight:600;cursor:pointer;color:#64748b;border-bottom:2px solid transparent;transition:all .15s}
.tab:hover{color:#e2e8f0}
.tab.active{color:#60a5fa;border-bottom-color:#60a5fa}
.tab-content{display:none}
.tab-content.active{display:block}
.uptime{font-family:monospace;font-size:.8rem}
.accounts-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:.75rem}
.account-card{background:#1e293b;border-radius:.75rem;padding:.85rem;border:1px solid #334155;position:relative}
.account-card .ac-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:.5rem}
.account-card .ac-label{font-weight:700;font-size:.85rem}
.account-card .ac-status{font-size:.7rem}
.account-card .ac-info{font-size:.75rem;color:#94a3b8;line-height:1.5}
.account-card .ac-qr{text-align:center;padding:8px 0}
.account-card .ac-qr img{width:160px;height:160px;border-radius:8px;border:1px solid #334155;background:#fff;padding:6px}
.account-card .ac-qr p{font-size:.65rem;color:#94a3b8;margin-top:4px}
.account-card .ac-actions{display:flex;gap:.3rem;flex-wrap:wrap;margin-top:.5rem}
.filters{display:flex;gap:.5rem;flex-wrap:wrap;margin-bottom:.75rem;align-items:center}
.filters input,.filters select{padding:.35rem .5rem;border-radius:.4rem;border:1px solid #475569;background:#0f172a;color:#e2e8f0;font-size:.75rem}
.filters label{font-size:.75rem;color:#94a3b8}
.msg-count{font-size:.7rem;color:#64748b}
.prev-next{display:flex;gap:.4rem;margin-top:.5rem}
@media(max-width:768px){.layout{grid-template-columns:1fr}.sidebar{display:none}.content{grid-template-columns:1fr}.accounts-grid{grid-template-columns:1fr}}
</style>
</head>
<body>
<div class="layout">
  <aside class="sidebar" id="sidebar">
    <h2>Vis�o Geral</h2>
    <div class="stat"><span class="stat-label">Total Contas</span><span class="stat-value" id="sTotalAcc">0</span></div>
    <div class="stat"><span class="stat-label">Conectadas</span><span class="stat-value" id="sConnectedAcc">0</span></div>
    <div class="stat"><span class="stat-label">Total Mensagens</span><span class="stat-value" id="sMsgCount">0</span></div>
    <div class="stat"><span class="stat-label">Contatos</span><span class="stat-value" id="sContactCount">0</span></div>

    <h2>Contas</h2>
    <div id="sidebarAccounts"></div>

    <h2>A��es R�pidas</h2>
    <div style="display:flex;flex-direction:column;gap:.4rem;margin-top:.25rem">
      <button class="btn btn-primary btn-sm" onclick="connectAll()">Conectar Todas</button>
      <button class="btn btn-outline btn-sm" onclick="fetchStatus()">Atualizar</button>
    </div>
  </aside>

  <div class="main">
    <div class="topbar">
      <span class="status-dot status-dot--starting" id="topStatusDot"></span>
      <h1 id="topStatusText">Inicializando...</h1>
    </div>

    <div class="content">
      <div class="card card-full">
        <h3>Contas WhatsApp</h3>
        <div class="accounts-grid" id="accountsGrid"></div>
      </div>

      <div class="card card-full">
        <div class="tabs" id="tabs">
          <div class="tab active" data-tab="messages">Mensagens</div>
          <div class="tab" data-tab="contacts">Contatos</div>
          <div class="tab" data-tab="logs">Logs</div>
        </div>

        <div class="tab-content active" id="tabMessages">
          <div class="filters">
            <label>Conta:
              <select id="filterMsgAccount"><option value="">Todas</option></select>
            </label>
            <label>Status:
              <select id="filterMsgStatus"><option value="">Todos</option><option value="sent">Enviado</option><option value="delivered">Entregue</option><option value="received">Recebida</option><option value="read">Lida</option><option value="failed">Falhou</option></select>
            </label>
            <label>N�mero:
              <input id="filterMsgPhone" placeholder="559999999999" style="width:120px">
            </label>
            <button class="btn btn-primary btn-sm" onclick="loadMessages()">Filtrar</button>
            <span class="msg-count" id="msgCount"></span>
          </div>
          <div style="max-height:400px;overflow-y:auto">
            <table>
              <thead><tr><th>Data/Hora</th><th>N�mero</th><th>Conta</th><th>Status</th><th>Origem</th></tr></thead>
              <tbody id="messagesBody"><tr><td colspan="5" class="empty">Carregando...</td></tr></tbody>
            </table>
          </div>
        </div>

        <div class="tab-content" id="tabContacts">
          <div id="contactsBody"></div>
        </div>

        <div class="tab-content" id="tabLogs">
          <div class="filters">
            <label>Conta:
              <select id="filterLogAccount"><option value="">Todas</option></select>
            </label>
            <label>Evento:
              <input id="filterLogEvent" placeholder="evento" style="width:120px">
            </label>
            <button class="btn btn-primary btn-sm" onclick="loadLogs()">Filtrar</button>
            <span class="msg-count" id="logCount"></span>
          </div>
          <div style="max-height:400px;overflow-y:auto">
            <div id="logsBody"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

<script>
const socket = io({ transports: ["websocket", "polling"], reconnection: true });

// ---- Helpers ----

function statusDot(state) {
  return 'status-dot--' + (state || 'starting');
}

function statusLabel(state) {
  const map = { connected: "Conectado", awaiting_qr: "Aguardando QR", reconnecting: "Reconectando", starting: "Iniciando", offline: "Desconectado", auth_failure: "Falha Auth", error: "Erro" };
  return map[state] || state;
}

function statusTag(state) {
  const map = { connected: "success", awaiting_qr: "warning", reconnecting: "warning", starting: "info", offline: "error", auth_failure: "error", error: "error" };
  return 'tag-' + (map[state] || 'info');
}

// ---- Render Accounts ----

function renderAccounts(accounts) {
  const grid = document.getElementById("accountsGrid");
  if (!accounts || !accounts.length) {
    grid.innerHTML = '<div class="empty">Nenhuma conta configurada.</div>';
    return;
  }

  const connected = accounts.filter(a => a.state === "connected").length;
  document.getElementById("sTotalAcc").textContent = accounts.length;
  document.getElementById("sConnectedAcc").textContent = connected;

  // Sidebar list
  const sb = document.getElementById("sidebarAccounts");
  sb.innerHTML = accounts.map(a =>
    '<div class="stat"><span class="stat-label"><span class="status-dot ' + statusDot(a.state) + '" style="width:6px;height:6px;display:inline-block;margin-right:4px;vertical-align:middle"></span>' + a.label + '</span><span class="stat-value">' + statusLabel(a.state) + '</span></div>'
  ).join("");

  grid.innerHTML = accounts.map((a, i) => {
    const qrHtml = (a.qr && a.state === "awaiting_qr")
      ? '<div class="ac-qr"><img src="' + a.qr + '" alt="QR Code"><p>Escaneie com seu WhatsApp</p></div>'
      : '';

    const profileHtml = a.profileName
      ? '<div class="profile-info"><strong>' + escapeHtml(a.profileName) + '</strong><small>' + (a.profileNumber ? '+55 ' + a.profileNumber : '') + '</small></div>'
      : '';

    const lastConn = a.connectedAt
      ? '<div>Conectado: ' + new Date(a.connectedAt).toLocaleString("pt-BR") + '</div>'
      : '';

    const lastErr = a.lastError
      ? '<div style="color:#f87171">Erro: ' + escapeHtml(a.lastError.error || '') + '</div>'
      : '';

    return '<div class="account-card">' +
      '<div class="ac-header">' +
        '<span class="ac-label">' + a.label + '</span>' +
        '<span class="ac-status tag ' + statusTag(a.state) + '">' + statusLabel(a.state) + '</span>' +
      '</div>' +
      (profileHtml ? '<div class="profile-row">' + profileHtml + '</div>' : '') +
      '<div class="ac-info">' +
        lastConn +
        (a.disconnectedAt ? '<div>Desconectado: ' + new Date(a.disconnectedAt).toLocaleString("pt-BR") + '</div>' : '') +
        (a.lastSendAt ? '<div>�ltimo envio: ' + new Date(a.lastSendAt).toLocaleString("pt-BR") + '</div>' : '') +
        (a.reconnectAttempts ? '<div>Tentativas: ' + a.reconnectAttempts + '</div>' : '') +
        lastErr +
      '</div>' +
      qrHtml +
      '<div class="ac-actions">' +
        '<button class="btn btn-primary btn-sm" onclick="acConnect(' + i + ')">Conectar</button>' +
        '<button class="btn btn-warning btn-sm" onclick="acReconnect(' + i + ')">Reconectar</button>' +
        '<button class="btn btn-danger btn-sm" onclick="if(confirm(\'Desconectar ' + a.label + '?\'))acDisconnect(' + i + ')">Desconectar</button>' +
        '<button class="btn btn-outline btn-sm" onclick="if(confirm(\'Remover sess�o ' + a.label + '? Isso exige novo QR Code.\'))acRemove(' + i + ')">Remover</button>' +
      '</div>' +
    '</div>';
  }).join("");
}

function escapeHtml(str) {
  if (!str) return '';
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

// ---- Messages ----

async function loadMessages() {
  const params = new URLSearchParams();
  const acc = document.getElementById("filterMsgAccount").value;
  const status = document.getElementById("filterMsgStatus").value;
  const phone = document.getElementById("filterMsgPhone").value.trim();
  if (acc) params.set("account", acc);
  if (status) params.set("status", status);
  if (phone) params.set("phone", phone);
  params.set("limit", "100");

  try {
    const r = await fetch("/api/admin/messages?" + params.toString());
    const data = await r.json();
    const tbody = document.getElementById("messagesBody");
    document.getElementById("msgCount").textContent = data.total + " msg";
    if (!data.messages || !data.messages.length) {
      tbody.innerHTML = '<tr><td colspan="5" class="empty">Nenhuma mensagem.</td></tr>';
      return;
    }
    tbody.innerHTML = data.messages.map(m => {
      const sc = m.status === "sent" || m.status === "received" || m.status === "delivered" ? "success" : m.status === "failed" ? "error" : "warning";
      const sl = { sent: "Enviado", received: "Recebida", delivered: "Entregue", read: "Lida", failed: "Falhou" };
      const acName = "WhatsApp " + String((m.account !== undefined ? m.account : 0) + 1).padStart(2, "0");
      return '<tr><td>' + new Date(m.timestamp).toLocaleString("pt-BR") + '</td><td>+55 ' + m.to + '</td><td>' + acName + '</td><td><span class="tag tag-' + sc + '">' + (sl[m.status] || m.status) + '</span></td><td>' + (m.source || "api") + '</td></tr>';
    }).join("");
    document.getElementById("sMsgCount").textContent = data.total || data.messages.length;
  } catch {}
}

// ---- Contacts ----

async function loadContacts() {
  try {
    const r = await fetch("/api/admin/contacts");
    const data = await r.json();
    const el = document.getElementById("contactsBody");
    if (!data.contacts || !data.contacts.length) {
      el.innerHTML = '<div class="empty">Nenhum contato.</div>';
      return;
    }
    el.innerHTML = data.contacts.map(c => {
      const sc = c.lastStatus === "sent" || c.lastStatus === "received" || c.lastStatus === "delivered" ? "success" : c.lastStatus === "failed" ? "error" : "warning";
      const sl = { sent: "Enviado", received: "Recebida", delivered: "Entregue", read: "Lida", failed: "Falhou" };
      const acName = "WhatsApp " + String((c.account !== undefined ? c.account : 0) + 1).padStart(2, "0");
      return '<div class="contact-item"><div><div class="contact-phone">+55 ' + (c.phone || "---") + '</div><div style="color:#64748b;font-size:.7rem">' + acName + ' | ' + (c.lastSendAt ? new Date(c.lastSendAt).toLocaleString("pt-BR") : "---") + '</div></div><div class="contact-meta"><span class="tag tag-' + sc + '">' + (sl[c.lastStatus] || c.lastStatus) + '</span><div style="margin-top:4px">' + (c.count || 0) + ' msg</div></div></div>';
    }).join("");
    document.getElementById("sContactCount").textContent = data.contacts.length;
  } catch {}
}

// ---- Logs ----

async function loadLogs() {
  const params = new URLSearchParams();
  const acc = document.getElementById("filterLogAccount").value;
  const event = document.getElementById("filterLogEvent").value.trim();
  if (acc) params.set("account", acc);
  if (event) params.set("event", event);
  params.set("limit", "200");

  try {
    const r = await fetch("/api/admin/logs?" + params.toString());
    const data = await r.json();
    const el = document.getElementById("logsBody");
    document.getElementById("logCount").textContent = data.total + " logs";
    if (!data.logs || !data.logs.length) {
      el.innerHTML = '<div class="empty">Nenhum log.</div>';
      return;
    }
    el.innerHTML = data.logs.map(l => {
      const acName = "WhatsApp " + String(((l.data && l.data.account !== undefined) ? l.data.account : 0) + 1).padStart(2, "0");
      return '<div class="log-item"><span class="log-time">' + new Date(l.timestamp).toLocaleString("pt-BR") + '</span><span class="log-event" style="min-width:80px">' + acName + '</span><span class="log-event">' + (l.event || "") + '</span><span class="log-desc">' + (l.description || "") + '</span></div>';
    }).join("");
  } catch {}
}

// ---- Account Actions ----

async function acConnect(index) {
  try {
    await fetch("/api/account/" + index + "/connect", { method: "POST", headers: { Authorization: "Bearer " + (window._apiKey || "") } });
    setTimeout(fetchStatus, 1000);
  } catch {}
}

async function acReconnect(index) {
  try {
    await fetch("/api/account/" + index + "/reconnect", { method: "POST", headers: { Authorization: "Bearer " + (window._apiKey || "") } });
    setTimeout(fetchStatus, 1000);
  } catch {}
}

async function acDisconnect(index) {
  try {
    await fetch("/api/account/" + index + "/disconnect", { method: "POST", headers: { Authorization: "Bearer " + (window._apiKey || "") } });
    setTimeout(fetchStatus, 1000);
  } catch {}
}

async function acRemove(index) {
  try {
    await fetch("/api/account/" + index + "/remove", { method: "POST", headers: { Authorization: "Bearer " + (window._apiKey || "") } });
    setTimeout(fetchStatus, 1000);
  } catch {}
}

async function connectAll() {
  for (let i = 0; i < 5; i++) {
    try { await fetch("/api/account/" + i + "/connect", { method: "POST", headers: { Authorization: "Bearer " + (window._apiKey || "") } }); } catch {}
  }
  setTimeout(fetchStatus, 1000);
}

// ---- Status ----

async function fetchStatus() {
  try {
    const r = await fetch("/api/admin/status");
    const data = await r.json();
    window._lastStatus = data;

    const dot = document.getElementById("topStatusDot");
    const text = document.getElementById("topStatusText");
    const state = data.state || "starting";
    dot.className = "status-dot " + statusDot(state);
    text.textContent = data.message || data.state || "---";

    if (data.accounts) {
      renderAccounts(data.accounts);
      // Populate account filter dropdowns
      const sel1 = document.getElementById("filterMsgAccount");
      const sel2 = document.getElementById("filterLogAccount");
      const cur1 = sel1.value;
      const cur2 = sel2.value;
      sel1.innerHTML = '<option value="">Todas</option>' + data.accounts.map((a,i) => '<option value="' + i + '">' + a.label + '</option>').join("");
      sel2.innerHTML = '<option value="">Todas</option>' + data.accounts.map((a,i) => '<option value="' + i + '">' + a.label + '</option>').join("");
      sel1.value = cur1;
      sel2.value = cur2;
    }
  } catch {}
}

// ---- Tabs ----

document.querySelectorAll(".tab").forEach(tab => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach(t => t.classList.remove("active"));
    tab.classList.add("active");
    var id = tab.dataset.tab.charAt(0).toUpperCase() + tab.dataset.tab.slice(1);
    document.getElementById("tab" + id).classList.add("active");
    if (id === "Messages") loadMessages();
    if (id === "Contacts") loadContacts();
    if (id === "Logs") loadLogs();
  });
});

// ---- Socket.io events ----

socket.on("admin:status", (data) => {
  fetchStatus();
});

socket.on("admin:message", () => {
  loadMessages();
  loadContacts();
});

socket.on("connect", fetchStatus);
socket.on("connected", fetchStatus);
socket.on("disconnected", fetchStatus);
socket.on("qr", fetchStatus);

// ---- Initial load ----

fetchStatus();
loadMessages();
loadContacts();
loadLogs();
setInterval(fetchStatus, 4000);
setInterval(loadMessages, 7000);
setInterval(loadContacts, 12000);
setInterval(loadLogs, 18000);
</script>
</body>
</html>`;
