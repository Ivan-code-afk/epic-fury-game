// Уровень: ASCII-карта -> тайлы + точки появления сущностей
//
// Тайлы:   # песок   r камень   c бетон   d палуба корабля   = платформа (запрыгнуть снизу)
//          b мешки с песком   x ящик (разрушаемый)   ~ вода (смерть)   . пусто
// Объекты: P игрок   A напарник   S солдат   T пулемётчик   L пусковая под видом грузовика
//          K обычный грузовик (мирный!)   X база (защищать)   E флаг выхода
//          H аптечка   M пулемёт M249   N Stinger   G гранаты   Y «Галстук ярости»
G.Level = function (rows) {
  const T = G.CONFIG.TILE;
  this.h = rows.length;
  this.w = Math.max(...rows.map(r => r.length));
  this.tiles = [];
  this.spawns = [];
  this.crateHp = {};
  for (let y = 0; y < this.h; y++) {
    const row = [];
    for (let x = 0; x < this.w; x++) {
      const ch = rows[y][x] || '.';
      if ('#rc=bx~d'.includes(ch)) row.push(ch);
      else {
        row.push('.');
        if (ch !== '.' && ch !== ' ') this.spawns.push({ type: ch, x: x * T, y: y * T });
      }
    }
    this.tiles.push(row);
  }
  this.pxW = this.w * T;
  this.pxH = this.h * T;
};

// Компактный формат карты (удобно редактировать руками):
//   terrain:   строка, один символ на колонку: цифра 0-9 = высота земли в тайлах,
//              '_' = вода, ' ' = пропасть
//   ground:    материал земли: '#', 'r' или 'c'
//   platforms: [[колонка, ряд, длина, символ?], ...]  ряд 0 — верх экрана, 12 — низ
//   blocks:    [[колонка, ряд, символ], ...]  например мешки 'b' или ящики 'x'
//   objects:   'P2 S20 T35 L60 H44:5'  буква+колонка, можно :ряд (иначе — на земле)
G.Level.fromSpec = function (spec) {
  const ROWS = 13, w = spec.terrain.length;
  const g = [];
  for (let y = 0; y < ROWS; y++) g.push(new Array(w).fill('.'));
  const heights = [];
  for (let x = 0; x < w; x++) {
    const ch = spec.terrain[x];
    let h = 0;
    if (ch === '_') { g[ROWS - 1][x] = '~'; g[ROWS - 2][x] = '~'; h = 0; }
    else if (ch !== ' ') {
      h = parseInt(ch, 10) || 0;
      for (let k = 0; k < h; k++) g[ROWS - 1 - k][x] = spec.ground || '#';
    }
    heights.push(h);
  }
  (spec.platforms || []).forEach(([c, r, len, ch]) => { for (let i = 0; i < len; i++) if (g[r] && c + i < w) g[r][c + i] = ch || '='; });
  (spec.blocks || []).forEach(([c, r, ch]) => { if (g[r]) g[r][c] = ch; });
  (spec.objects || '').trim().split(/\s+/).filter(Boolean).forEach(tok => {
    const m = tok.match(/^([A-Za-z])(\d+)(?::(\d+))?$/);
    if (!m) return;
    const c = +m[2];
    let r = m[3] !== undefined ? +m[3] : ROWS - 1 - (heights[c] || 0);
    // если на этом месте стоит блок — ставим выше
    while (r > 0 && g[r][c] !== '.') r--;
    g[r][c] = m[1];
  });
  return new G.Level(g.map(row => row.join('')));
};

G.Level.prototype = {
  at(tx, ty) {
    if (tx < 0 || tx >= this.w) return 'c';     // стены по краям
    if (ty < 0) return '.';
    if (ty >= this.h) return '.';
    return this.tiles[ty][tx];
  },
  isSolid(ch) { return ch === '#' || ch === 'r' || ch === 'c' || ch === 'b' || ch === 'x' || ch === 'd'; },
  solidAt(px, py) { const T = G.CONFIG.TILE; return this.isSolid(this.at(Math.floor(px / T), Math.floor(py / T))); },

  // Двигает тело e (x,y,w,h,vx,vy) с учётом тайлов. Возвращает флаги столкновений.
  move(e, dt) {
    const T = G.CONFIG.TILE;
    const res = { ground: false, wall: false, ceil: false };
    // X
    e.x += e.vx * dt;
    const y0 = Math.floor(e.y / T), y1 = Math.floor((e.y + e.h - 1) / T);
    if (e.vx > 0) {
      const tx = Math.floor((e.x + e.w) / T);
      for (let ty = y0; ty <= y1; ty++) if (this.isSolid(this.at(tx, ty))) { e.x = tx * T - e.w - 0.01; e.vx = 0; res.wall = true; break; }
    } else if (e.vx < 0) {
      const tx = Math.floor(e.x / T);
      for (let ty = y0; ty <= y1; ty++) if (this.isSolid(this.at(tx, ty))) { e.x = (tx + 1) * T + 0.01; e.vx = 0; res.wall = true; break; }
    }
    // Y
    const prevBottom = e.y + e.h;
    e.y += e.vy * dt;
    const x0 = Math.floor(e.x / T), x1 = Math.floor((e.x + e.w - 1) / T);
    if (e.vy > 0) {
      const ty = Math.floor((e.y + e.h) / T);
      for (let tx = x0; tx <= x1; tx++) {
        const ch = this.at(tx, ty);
        const oneWay = ch === '=' && prevBottom <= ty * T + 0.5 && !e.dropThrough;
        if (this.isSolid(ch) || oneWay) { e.y = ty * T - e.h; e.vy = 0; res.ground = true; break; }
      }
    } else if (e.vy < 0) {
      const ty = Math.floor(e.y / T);
      for (let tx = x0; tx <= x1; tx++) if (this.isSolid(this.at(tx, ty))) { e.y = (ty + 1) * T; e.vy = 0; res.ceil = true; break; }
    }
    return res;
  },

  inWater(e) {
    const T = G.CONFIG.TILE;
    return this.at(Math.floor((e.x + e.w / 2) / T), Math.floor((e.y + e.h - 2) / T)) === '~';
  },

  damageTile(px, py, dmg) {
    const T = G.CONFIG.TILE;
    const tx = Math.floor(px / T), ty = Math.floor(py / T);
    if (this.at(tx, ty) !== 'x') return false;
    const k = tx + ',' + ty;
    this.crateHp[k] = (this.crateHp[k] ?? 4) - dmg;
    if (this.crateHp[k] <= 0) { this.tiles[ty][tx] = '.'; return 'broken'; }
    return true;
  },

  draw(ctx, camX) {
    const T = G.CONFIG.TILE, S = G.SPR.tiles;
    const x0 = Math.max(0, Math.floor(camX / T)), x1 = Math.min(this.w - 1, Math.floor((camX + G.CONFIG.W) / T));
    for (let y = 0; y < this.h; y++) {
      for (let x = x0; x <= x1; x++) {
        const ch = this.tiles[y][x];
        if (ch === '.') continue;
        const above = y > 0 ? this.tiles[y - 1][x] : '.';
        let img;
        if (ch === '#') img = this.isSolid(above) ? S.sand : S.sandTop;
        else if (ch === 'r') img = this.isSolid(above) ? S.rock : S.rockTop;
        else if (ch === 'c') img = S.concrete;
        else if (ch === 'd') img = this.isSolid(above) ? S.hull : S.deckTop;
        else if (ch === '=') img = S.platform;
        else if (ch === 'b') img = S.sandbag;
        else if (ch === 'x') img = S.crate;
        else if (ch === '~') img = S.water;
        if (img) ctx.drawImage(img, Math.round(x * T - camX), y * T);
      }
    }
  },
};

// ---------- ФОНЫ ----------
G.Backgrounds = {
  draw(ctx, theme, camX, t) {
    const W = G.CONFIG.W, H = G.CONFIG.H;
    const th = G.Backgrounds.themes[theme] || G.Backgrounds.themes.desert;
    const g = ctx.createLinearGradient(0, 0, 0, H);
    th.sky.forEach((c, i) => g.addColorStop(i / (th.sky.length - 1), c));
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    if (th.stars) {
      ctx.fillStyle = '#fff';
      for (let i = 0; i < 60; i++) {
        const sx = ((i * 97) % W + W - (camX * 0.02) % W) % W, sy = (i * 53) % 110;
        if ((i + Math.floor(t * 2)) % 7) ctx.fillRect(sx, sy, 1, 1);
      }
    }
    if (th.sun) {
      ctx.fillStyle = th.sun;
      ctx.beginPath(); ctx.arc(300 - camX * 0.01, 50, th.night ? 10 : 18, 0, 7); ctx.fill();
    }
    // Дальний слой
    G.Backgrounds.layer(ctx, camX * 0.15, th.far, 120, 30, 11);
    // Ближний слой: город или дюны
    if (th.city) G.Backgrounds.city(ctx, camX * 0.35, th.near);
    else G.Backgrounds.layer(ctx, camX * 0.35, th.near, 150, 22, 5);
  },
  layer(ctx, off, color, base, amp, seed) {
    const W = G.CONFIG.W, H = G.CONFIG.H;
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.moveTo(0, H);
    for (let x = 0; x <= W; x += 4) {
      const wx = x + off;
      const y = base - Math.abs(Math.sin(wx * 0.011 + seed)) * amp - Math.sin(wx * 0.031 + seed * 2) * amp * 0.3;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(W, H); ctx.fill();
  },
  city(ctx, off, color) {
    const W = G.CONFIG.W, H = G.CONFIG.H;
    ctx.fillStyle = color;
    for (let i = -1; i < 20; i++) {
      const bw = 26;
      const wx = i * bw - (off % bw);
      const idx = i + Math.floor(off / bw);
      const bh = 30 + ((idx * 37) % 50);
      ctx.fillRect(wx, 150 - bh, bw - 3, bh + 70);
      if (idx % 5 === 0) { // минарет / купол
        ctx.beginPath(); ctx.arc(wx + 11, 150 - bh, 9, Math.PI, 0); ctx.fill();
      }
    }
  },
  themes: {
    desert: { sky: ['#f6b26b', '#ffd59a', '#ffe9c4'], sun: '#fff3c0', far: '#c99a6a', near: '#b3824f' },
    gulf:   { sky: ['#4a90c8', '#8cc4e8', '#d8eef8'], sun: '#fffbe0', far: '#7a9ab0', near: '#5c7f99' },
    city:   { sky: ['#e07a4a', '#f2a65a', '#f8d49a'], sun: '#ffe7b0', far: '#a46a50', near: '#7a4a3a', city: true },
    night:  { sky: ['#05070f', '#111a33', '#22305a'], sun: '#e8e8ff', far: '#1a2240', near: '#10162a', stars: true, night: true },
  },
};
