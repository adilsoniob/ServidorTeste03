# WhatsApp Server (Refatorado v2.0)

Servidor WhatsApp para envio de mensagens via whatsapp-web.js. Refatorado com foco em estabilidade 24/7, segurança e simplicidade.

## Stack

- **Node.js 18+**
- **Express** (rotas HTTP)
- **Socket.IO** (eventos em tempo real para QR Code)
- **whatsapp-web.js** (integração com WhatsApp)
- **qrcode** (geração do QR Code)

## Rotas

| Método | Endpoint | Auth | Descrição |
|---|---|---|---|
| GET | `/` | não | Página do QR Code |
| GET | `/health` | não | Health check (200/503 conforme estado real) |
| GET | `/api/whatsapp/status` | não | Status do WhatsApp (conectado, QR, mensagem) |
| POST | `/api/send-message` | sim | Envia mensagem (body: `{number, message}`) |
| GET | `/api/whatsapp/reconnect` | sim | Força reconexão + novo QR |
| GET | `/api/whatsapp/disconnect` | sim | Desconecta sessão |

**Autenticação:** header `Authorization: Bearer <WHATSAPP_API_KEY>`

## Variáveis de ambiente

| Var | Padrão | Descrição |
|---|---|---|
| `PORT` | `4320` | Porta HTTP |
| `WHATSAPP_API_KEY` | (obrigatório) | Token Bearer para rotas autenticadas |
| `WHATSAPP_CLIENT_ID` | `vale-saude` | ID da sessão local |
| `SEND_TIMEOUT_MS` | `20000` | Timeout do envio de mensagem |
| `MAX_RECONNECT_ATTEMPTS` | `5` | Máximo de tentativas de reconexão |
| `RECONNECT_BASE_DELAY_MS` | `8000` | Delay base do backoff (multiplica por tentativa) |
| `DEBUG` | `false` | Ativa logs `debug` |

## Como rodar localmente

```bash
npm install
npx puppeteer browsers install chrome   # só primeira vez, baixa Chromium
WHATSAPP_API_KEY=sua-chave node src/index.js
```

Acesse `http://localhost:4320/` → QR Code aparece → escaneie com WhatsApp.

## Como fazer deploy no Railway

1. Suba o código num repo Git (ou use Railway CLI)
2. Crie um serviço Web apontando pro repo
3. Defina `WHATSAPP_API_KEY` nas variáveis de ambiente
4. O `railway.toml` já configura builder, start command e healthcheck
5. Após deploy, acesse `/health` → 503 antes de conectar, 200 depois
6. Acesse `/` → escaneie QR com WhatsApp

## O que mudou na refatoração (vs versão original)

### Arquivos novos
- `src/config.js` — config central (env vars + defaults)
- `src/logger.js` — log estruturado com ISO timestamp
- `src/routes/health.js` — health check real (reflete estado do WhatsApp)

### Arquivos reescritos
- `src/services/whatsapp.js` — serviço blindado contra sessão zumbi + auto-reconnect + timeout
- `src/routes/send-message.js` — códigos semânticos + status HTTP apropriado
- `src/routes/status.js` — expõe lastSendAt/lastError/reconnectAttempts
- `src/routes/qr-page.js` — UX melhorada + polling fallback
- `src/middleware/auth.js` — timingSafeEqual
- `src/app.js` — separação clara rotas públicas/autenticadas
- `src/index.js` — graceful shutdown robusto

### Removido
- Flag `--single-process` do Puppeteer (causava crashes)
- Fallbacks hardcoded de URL/Key
- Simulação de typing por padrão (atrasava envios)
- Bloco `change_state` sem uso prático

## Comportamento 24/7

- ✅ Auto-reconexão com backoff (até 5 tentativas)
- ✅ Graceful shutdown em SIGTERM/SIGINT
- ✅ Timeout de 20s em envios (não trava requisições)
- ✅ Verificação de número registrado antes de enviar (evita "success fantasma")
- ✅ Logs estruturados pra debug em produção

## Limites conhecidos

- `whatsapp-web.js` depende do Chromium (~200MB RAM + CPU)
- Plano free do Railway (512MB RAM) pode cair em caso de muitos envios simultâneos
- Para alto volume (>1000 msgs/dia), considere migrar para Meta Business API oficial
