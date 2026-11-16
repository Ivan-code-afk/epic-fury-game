// Текст, пузыри реплик и радио-диалоги с портретами
G.font = size => `bold ${size}px "Courier New", Courier, monospace`;

G.text = function (ctx, str, x, y, o = {}) {
  ctx.font = G.font(o.size || 8);
  ctx.textAlign = o.align || 'left';
  ctx.textBaseline = 'top';
  if (o.shadow !== false) { ctx.fillStyle = o.shadowColor || '#000'; ctx.fillText(str, x + 1, y + 1); }
  ctx.fillStyle = o.color || '#fff';
  ctx.fillText(str, x, y);
};

G.wrap = function (ctx, str, maxW, size) {
  ctx.font = G.font(size);
  const words = str.split(' '), lines = [];
  let cur = '';
  for (const w of words) {
    const t = cur ? cur + ' ' + w : w;
    if (ctx.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t;
  }
  if (cur) lines.push(cur);
  return lines;
};

G.bubble = function (ctx, x, y, str) {
  const lines = G.wrap(ctx, str, 120, 7);
  ctx.font = G.font(7);
  const w = Math.max(...lines.map(l => ctx.measureText(l).width)) + 8, h = lines.length * 8 + 5;
  const bx = Math.round(Math.max(2, Math.min(G.CONFIG.W - w - 2, x - w / 2))), by = Math.round(y - h - 6);
  ctx.fillStyle = '#fff'; ctx.fillRect(bx, by, w, h);
  ctx.fillStyle = '#000'; ctx.fillRect(bx, by, w, 1); ctx.fillRect(bx, by + h - 1, w, 1); ctx.fillRect(bx, by, 1, h); ctx.fillRect(bx + w - 1, by, 1, h);
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(x - 3, by + h - 1); ctx.lineTo(x + 3, by + h - 1); ctx.lineTo(x, by + h + 4); ctx.fill();
  lines.forEach((l, i) => G.text(ctx, l, bx + 4, by + 3 + i * 8, { size: 7, color: '#111', shadow: false }));
};

// Строка диалога: [кто, текст, настроение?]  кто: president | hero | mossad | hq
G.Dialog = {
  queue: [], cur: null, shown: 0, t: 0, onDone: null,
  get active() { return !!this.cur; },
  start(lines, onDone) {
    this.queue = (lines || []).slice(); this.onDone = onDone || null;
    this.next();
  },
  next() {
    const l = this.queue.shift();
    if (!l) { this.cur = null; const cb = this.onDone; this.onDone = null; cb && cb(); return; }
    this.cur = { who: l[0], text: l[1], mood: l[2] || 'normal' };
    this.shown = 0; this.t = 0;
    if (this.cur.mood === 'rambo') G.Audio.play('alarm');
  },
  update(dt) {
    if (!this.cur) return;
    this.t += dt;
    const before = Math.floor(this.shown);
    this.shown = Math.min(this.cur.text.length, this.shown + dt * 45);
    if (Math.floor(this.shown) !== before && Math.floor(this.shown) % 3 === 0) G.Audio.play('blip');
    const I = G.Input;
    if (I.pressed('fire') || I.pressed('jump') || I.pressed('start') || I.pressed('tap')) {
      if (this.shown < this.cur.text.length) this.shown = this.cur.text.length; else this.next();
    }
  },
  draw(ctx) {
    if (!this.cur) return;
    const W = G.CONFIG.W, H = G.CONFIG.H;
    const y = H - 62;
    ctx.fillStyle = 'rgba(0,0,20,.88)'; ctx.fillRect(4, y, W - 8, 58);
    ctx.fillStyle = '#ffd23f'; ctx.fillRect(4, y, W - 8, 1); ctx.fillRect(4, y + 57, W - 8, 1);
    const talking = this.shown < this.cur.text.length && Math.floor(this.t * 8) % 2;
    const key = this.cur.who + '_' + this.cur.mood;
    const pt = (G.SPR.portrait[key] || G.SPR.portrait[this.cur.who + '_normal'])[talking ? 1 : 0];
    ctx.drawImage(pt, 10, y + 9);
    const cast = G.CONFIG.cast[this.cur.who] || { name: this.cur.who, color: '#fff' };
    G.text(ctx, cast.name + (this.cur.mood === 'rambo' ? ' [RAMBO MODE]' : ''), 58, y + 5, { size: 8, color: cast.color });
    const lines = G.wrap(ctx, this.cur.text, W - 76, 8);
    let left = Math.floor(this.shown);
    lines.slice(0, 4).forEach((l, i) => {
      const part = l.slice(0, Math.max(0, left)); left -= l.length + 1;
      G.text(ctx, part, 58, y + 17 + i * 9, { size: 8 });
    });
    if (this.shown >= this.cur.text.length && Math.floor(this.t * 3) % 2) G.text(ctx, '▼', W - 16, y + 46, { size: 8, color: '#ffd23f' });
  },
};
