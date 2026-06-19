const cfg = (obj, key, fallback) => (obj && obj[key] !== undefined ? obj[key] : fallback);

const EMOJIS = ["✅", "👍", "😊", "🎯", "📲", "🔵", "💚", "✨", "👉"];
const PONTUACAO = ["!", ".", ":)", ""];

export class StealthContent {
  constructor(opts) {
    this.enabled = cfg(opts, "enabled", false);
    this.opts = opts || {};
    this._counter = 0;
  }

  variar(texto) {
    if (!this.enabled) return texto;
    this._counter++;
    let r = (texto || "").trim();
    if (!r) return r;

    const vd = this.opts.variacao || {};
    const freq = cfg(vd, "frequencia", 2);

    if (this._counter % freq === 0) {
      const emoji = cfg(vd, "emoji", true);
      const pont = cfg(vd, "pontuacao", true);

      if (pont) {
        const p = PONTUACAO[Math.floor(Math.random() * PONTUACAO.length)];
        if (p) {
          r = r.replace(/[.!:]+$/, "") + p;
        }
      }

      if (emoji) {
        const e = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
        r = r + " " + e;
      }
    }

    return r;
  }

  reset() {
    this._counter = 0;
  }
}
