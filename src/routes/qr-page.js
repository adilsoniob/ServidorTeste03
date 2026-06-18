/**
 * Página HTML do QR Code (acessível em /).
 * Mostra o status em tempo real via polling + socket.
 */

import { Router } from "express";

export const qrPageRouter = Router();

const HTML = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>WhatsApp Vale Saúde</title>
<script src="https://cdn.socket.io/4.7.5/socket.io.min.js"></script>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{min-height:100vh;display:flex;align-items:center;justify-content:center;font-family:system-ui,sans-serif;background:#f3fbf8;color:#172d29}
.qr-wrap{text-align:center;padding:2rem;max-width:420px}
h1{font-size:1.4rem;color:#0f302b;margin-bottom:.5rem}
p{font-size:.9rem;color:#5d746f;margin-bottom:1.5rem}
#qr{width:280px;height:280px;border-radius:1rem;border:3px solid #e5e7eb;background:#fff;padding:8px;box-shadow:0 18px 38px rgba(14,92,76,.12);display:none}
.status{margin-top:1.5rem;padding:.75rem 1rem;border-radius:12px;font-weight:700;font-size:.9rem}
.st-await{background:#fff7da;color:#9a7200}
.st-ok{background:#eafcf4;color:#06745f}
.st-off{background:#f3f4f6;color:#6b7280}
.spin{display:inline-block;width:20px;height:20px;border:3px solid #e5e7eb;border-top-color:#06745f;border-radius:50%;animation:s .8s linear infinite;margin-right:8px;vertical-align:middle}
@keyframes s{to{transform:rotate(360deg)}}
</style>
</head>
<body>
<div class="qr-wrap">
<h1>Conectar WhatsApp</h1>
<p>Escaneie o QR Code com seu celular</p>
<img id="qr" src="" alt="QR Code">
<div id="st" class="status st-off"><span class="spin"></span>Inicializando servidor...</div>
</div>
<script>
(function(){
  const st = document.getElementById("st");
  const qr = document.getElementById("qr");
  let lastQr = "";
  let pollId = null;

  function setAwait(msg) { qr.style.display = ""; st.className = "status st-await"; st.innerHTML = msg; }
  function setOk(msg)    { qr.style.display = "none"; st.className = "status st-ok"; st.innerHTML = msg; }
  function setOff(msg)   { qr.style.display = "none"; st.className = "status st-off"; st.innerHTML = msg; }

  function applyState(s) {
    if (s.status === "connected") return setOk("Conectado!");
    if (s.qr && s.qr !== lastQr) {
      lastQr = s.qr;
      qr.src = s.qr;
      return setAwait("QR Code gerado. Escaneie com seu WhatsApp.");
    }
    if (s.status === "starting" || s.status === "reconnecting") return setOff("Inicializando servidor...");
    if (s.status === "auth_failure") return setOff("Falha de autenticação. Clique em 'Gerar novo QR Code'.");
    if (s.status === "offline") return setOff("Desconectado.");
    return setOff(s.message || "Aguardando...");
  }

  function poll() {
    fetch("/api/whatsapp/status", { cache: "no-store" })
      .then(r => r.json())
      .then(applyState)
      .catch(() => setOff("Aguardando servidor..."))
      .finally(() => { pollId = setTimeout(poll, 2500); });
  }

  try {
    const sock = io({ transports: ["websocket","polling"], reconnection: true });
    sock.on("qr", d => { if (d.qrDataUrl && d.qrDataUrl !== lastQr) { lastQr = d.qrDataUrl; qr.src = d.qrDataUrl; setAwait("QR Code gerado. Escaneie com seu WhatsApp."); } });
    sock.on("connected", () => setOk("Conectado!"));
    sock.on("disconnected", () => setOff("WhatsApp desconectado."));
    sock.on("connect_error", () => { if (!pollId) poll(); });
  } catch { /* fallback para polling */ }

  poll();
})();
</script>
</body>
</html>`;

qrPageRouter.get("/", (_req, res) => {
  res.type("html").send(HTML);
});
