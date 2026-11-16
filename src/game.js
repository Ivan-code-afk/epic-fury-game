// Главный цикл, состояния, HUD, логика миссий
(function () {
  const C = G.CONFIG, W = C.W, H = C.H, T = C.TILE;
  const canvas = document.getElementById('screen');
  const ctx = canvas.getContext('2d');
  let scale = 1;

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    scale = Math.max(1, Math.floor(Math.min(innerWidth * dpr / W, innerHeight * dpr / H)));
    // если целый масштаб слишком мелкий — дробный, чтобы заполнить экран телефона
    const fit = Math.min(innerWidth * dpr / W, innerHeight * dpr / H);
    if (fit - scale > 0.5) scale = fit;
    canvas.width = Math.round(W * scale); canvas.height = Math.round(H * scale);
    canvas.style.width = canvas.width / dpr + 'px'; canvas.style.height = canvas.height / dpr + 'px';
  }
  addEventListener('resize', resize); resize();

  let save = {};
  try { save = JSON.parse(localStorage.getItem('epicfury_save') || '{}'); } catch (e) {}
  function persist() { try { localStorage.setItem('epicfury_save', JSON.stringify(save)); } catch (e) {} }

  const g = G.game = {
    state: 'title', time: 0, sel: 0, score: 0, shake: 0, radioQ: [], radioCur: null, texts: [],

    // ---------- ЗАПУСК МИССИИ ----------
    startMission(i) {
      const m = G.MISSIONS[i];
      this.missionIdx = i; this.mission = m;
      this.level = G.Level.fromSpec(m.level);
      this.entities = []; this.bullets = []; this.particles = []; this.texts = [];
      this.player = null; this.ally = null; this.base = null;
      this.score = 0; this.lives = C.player.lives; this.thermal = false;
      this.firedTriggers = {}; this.radioQ = []; this.radioCur = null;
      this.timer = m.objective.time || 0;
      this.launchersLeft = 0; this.pending = null; this.waveIdx = -1; this.waveBreak = 2; this.spawnQ = [];
      let k = 0;
      for (const s of this.level.spawns) {
        switch (s.type) {
          case 'P': this.player = new G.Player(s.x, s.y); break;
          case 'A': if (m.ally) this.ally = new G.Ally(m.ally, s.x, s.y, m.allyBarks); break;
          case 'S': this.entities.push(new G.Soldier(s.x, s.y)); break;
          case 'T': this.entities.push(new G.Turret(s.x, s.y)); break;
          case 'L': this.entities.push(new G.Truck(s.x, s.y, true, 0)); this.launchersLeft++; break;
          case 'K': this.entities.push(new G.Truck(s.x, s.y, false, ++k)); break;
          case 'D': this.entities.push(new G.Drone(s.x, s.y, 50)); break;
          case 'X': this.base = new G.Base(s.x, s.y, m.objective.baseHp); break;
          case 'E': this.entities.push(new G.ExitFlag(s.x, s.y)); break;
          default: if ('HMNGY'.includes(s.type)) this.entities.push(new G.Pickup(s.type, s.x, s.y));
        }
      }
      if (!this.player) this.player = new G.Player(32, 100);
      this.player.ammo.stinger = 0;
      this.camX = 0;
      this.state = 'briefing';
      G.Audio.startMusic();
      G.Dialog.start(m.intro, () => { this.state = 'play'; });
    },

    respawn() {
      const p = this.player, cp = p.checkpoint;
      if (this.lives < 0) return;
      Object.assign(p, { dead: false, hp: C.player.hp, x: cp.x, y: cp.y - 20, vx: 0, vy: 0, invuln: 2 });
      // если чекпоинт над водой/пропастью — откатываемся
      let tries = 0;
      while (tries++ < 40 && !this.level.solidAt(p.x + 5, 200) && !this.level.solidAt(p.x + 5, 180)) p.x -= T;
    },
    onPlayerDeath() {
      this.lives--;
      if (this.lives < 0) this.pending = { t: 0.9, fn: () => this.failMission('Sgt. Steel has fallen.') };
      else this.radio(G.pick(G.PRESIDENT_BARKS.death));
    },
    failMission(reason) {
      if (this.state !== 'play') return;
      this.state = 'fail'; this.failReason = reason; G.Audio.stopMusic(); G.Audio.play('fail');
    },
    winMission() {
      if (this.state !== 'play') return;
      this.state = 'outro'; G.Audio.play('win');
      const m = this.mission;
      const best = save[m.id] || 0;
      if (this.score > best) { save[m.id] = this.score; persist(); }
      G.Dialog.start(m.outro, () => { this.state = 'win'; G.Audio.stopMusic(); });
    },
    reachExit() { if (this.mission.objective.type === 'reach') this.winMission(); },
    launcherDestroyed() {
      this.launchersLeft--; this.shake = 8;
      this.radio(G.pick(G.PRESIDENT_BARKS.launcher));
      if (this.launchersLeft <= 0) this.pending = { t: 1.2, fn: () => this.winMission() };
    },
    civilianHit() { this.radio(G.pick(G.PRESIDENT_BARKS.civilian)); },
    presidentBark(kind) { const l = G.PRESIDENT_BARKS[kind]; if (l) this.radio(G.pick(l)); },

    radio(line) { if (line) this.radioQ.push({ who: line[0], text: line[1], mood: line[2] || 'normal', t: 3.8 }); },
    floatText(x, y, text, color) { this.texts.push({ x, y, text, color, t: 1.1 }); },

    explode(x, y, r, owner, dmg) {
      G.Audio.play('explode'); this.shake = Math.max(this.shake, r / 6);
      for (let i = 0; i < r * 1.2; i++) {
        const a = Math.random() * 6.28, s = Math.random() * r * 5;
        const col = G.pick(['#fff3a0', '#ffb030', '#ff6a20', '#d03010', '#555']);
        this.particles.push(new G.Particle(x, y, Math.cos(a) * s, Math.sin(a) * s - 40, 0.3 + Math.random() * 0.5, col, 2 + Math.floor(Math.random() * 4), 0.3));
      }
      for (let i = 0; i < 6; i++) this.particles.push(new G.Particle(x + (Math.random() - .5) * r, y, (Math.random() - .5) * 30, -30 - Math.random() * 40, 1.2, '#444', 6, -0.05));
      if (owner === 'player') {
        for (const e of this.entities) if (e.enemy && !e.dead && !e.hidden) {
          const d = Math.hypot(e.x + e.w / 2 - x, e.y + e.h / 2 - y);
          if (d < r + Math.max(e.w, e.h) / 2) e.damage(this, dmg || 3);
        }
        for (let tx = -2; tx <= 2; tx++) for (let ty = -2; ty <= 2; ty++) {
          const px = x + tx * T, py = y + ty * T;
          if (Math.hypot(px - x, py - y) < r) this.level.damageTile(px, py, 4);
        }
      } else if (owner === 'enemy') {
        const p = this.player;
        if (Math.hypot(p.x + 5 - x, p.y + 9 - y) < r + 6) p.hurt(this, dmg || 1);
        if (this.ally && Math.hypot(this.ally.x - x, this.ally.y - y) < r + 6) this.ally.hit(this);
      }
    },

    bulletHits(b) {
      const box = { x: b.x - 2, y: b.y - 2, w: 4, h: 4 };
      if (b.owner === 'player') {
        for (const e of this.entities) if (e.enemy && !e.dead && !e.hidden && G.overlap(box, e)) { e.damage(this, b.dmg); b.remove = true; return; }
      } else {
        const p = this.player;
        if (!p.dead && G.overlap(box, p)) { p.hurt(this, b.dmg); b.remove = true; return; }
        if (this.ally && G.overlap(box, this.ally)) { this.ally.hit(this); b.remove = true; }
      }
    },

    // ---------- ВОЛНЫ (оборона) ----------
    updateWaves(dt) {
      const o = this.mission.objective;
      const alive = this.entities.some(e => e.enemy && !e.dead);
      if (this.spawnQ.length) {
        this.spawnQ[0].t -= dt;
        if (this.spawnQ[0].t <= 0) {
          const s = this.spawnQ.shift();
          if (s.type === 'drone') this.entities.push(new G.Drone(this.level.pxW + 10, 24 + Math.random() * 90, s.speed));
          else this.entities.push(new G.Soldier(this.level.pxW - 40, 9 * T));
        }
        return;
      }
      if (alive) return;
      if (this.waveIdx >= o.waves.length - 1) { this.winMission(); return; }
      this.waveBreak -= dt;
      if (this.waveBreak > 0) return;
      this.waveIdx++; this.waveBreak = 4;
      const w = o.waves[this.waveIdx];
      this.radio(this.mission.waveRadio && this.mission.waveRadio[this.waveIdx]);
      G.Audio.play('alarm');
      for (let i = 0; i < w.drones; i++) this.spawnQ.push({ type: 'drone', t: i === 0 ? 1 : w.interval, speed: w.speed + Math.random() * 15 });
      for (let i = 0; i < (w.soldiers || 0); i++) this.spawnQ.splice(Math.min(this.spawnQ.length, i * 2 + 1), 0, { type: 'soldier', t: 0.5 });
      if (w.pickups) for (const ch of w.pickups) this.entities.push(new G.Pickup(ch, (8 + Math.floor(Math.random() * 30)) * T, 2 * T));
    },

    // ---------- КАДР ----------
    update(dt) {
      const I = G.Input;
      this.time += dt;
      if (I.pressed('mute')) G.Audio.toggleMute();

      if (this.state === 'title') {
        if (I.pressed('start') || I.pressed('fire') || I.pressed('jump') || I.pressed('tap')) { this.state = 'select'; G.Audio.play('select'); }
        return;
      }
      if (this.state === 'select') return this.updateSelect();
      if (this.state === 'briefing' || this.state === 'outro') { G.Dialog.update(dt); return; }
      if (this.state === 'win' || this.state === 'fail') {
        if (I.pressed('start') || I.pressed('fire') || I.pressed('tap')) {
          if (this.state === 'fail') this.startMission(this.missionIdx);
          else { this.state = 'select'; this.sel = this.nextPlayable(this.missionIdx); }
        }
        if (I.pressed('grenade')) this.state = 'select';
        return;
      }
      if (this.state === 'pause') {
        if (I.pressed('start') || I.pressed('tap')) this.state = 'play';
        if (I.pressed('grenade')) { this.state = 'select'; G.Audio.stopMusic(); }
        return;
      }
      // --- play ---
      if (I.pressed('start')) { this.state = 'pause'; return; }
      const o = this.mission.objective;
      if (I.pressed('special') && o.type === 'launchers') { this.thermal = !this.thermal; G.Audio.play('blip'); }

      this.player.update(dt, this);
      if (this.ally) this.ally.update(dt, this);
      if (this.base) this.base.update(dt, this);
      for (const e of this.entities) e.update(dt, this);
      for (const b of this.bullets) b.update(dt, this);
      for (const p of this.particles) p.update(dt, this);
      this.entities = this.entities.filter(e => !e.remove);
      this.bullets = this.bullets.filter(b => !b.remove);
      this.particles = this.particles.filter(p => !p.remove);
      if (this.particles.length > 600) this.particles.splice(0, this.particles.length - 600);
      this.texts.forEach(t => { t.t -= dt; t.y -= 20 * dt; });
      this.texts = this.texts.filter(t => t.t > 0);

      // Триггеры по колонкам
      const col = Math.floor(this.player.x / T);
      (this.mission.triggers || []).forEach((tr, i) => {
        if (!this.firedTriggers[i] && col >= tr.col) { this.firedTriggers[i] = true; this.radio(tr.radio); }
      });
      // Цели
      if (o.type === 'defend') this.updateWaves(dt);
      if (this.pending) { this.pending.t -= dt; if (this.pending.t <= 0) { const f = this.pending.fn; this.pending = null; f(); } }
      if (o.type === 'launchers' && this.state === 'play' && this.launchersLeft > 0) {
        this.timer -= dt;
        if (this.timer <= 10 && Math.floor(this.timer) !== Math.floor(this.timer + dt)) G.Audio.play('alarm');
        if (this.timer <= 0) this.failMission('Missile launched! Too late.');
      }
      // Рация
      if (!this.radioCur && this.radioQ.length) this.radioCur = this.radioQ.shift();
      if (this.radioCur) { this.radioCur.t -= dt; if (this.radioCur.t <= 0) this.radioCur = null; }

      // Камера
      const target = Math.max(0, Math.min(this.level.pxW - W, this.player.x - W * 0.4));
      this.camX += (target - this.camX) * Math.min(1, dt * 8);
      this.shake = Math.max(0, this.shake - dt * 20);
    },

    nextPlayable(from) {
      for (let i = from + 1; i < G.MISSIONS.length; i++) if (G.MISSIONS[i].playable) return i;
      return from;
    },

    updateSelect() {
      const I = G.Input, n = G.MISSIONS.length;
      if (I.pressed('down')) { this.sel = (this.sel + 1) % n; G.Audio.play('blip'); }
      if (I.pressed('up')) { this.sel = (this.sel + n - 1) % n; G.Audio.play('blip'); }
      if (I.tapPos) {
        const i = Math.floor((I.tapPos.y - 34) / 13);
        if (i >= 0 && i < n) {
          if (i === this.sel && G.MISSIONS[i].playable) { G.Audio.play('select'); return this.startMission(i); }
          this.sel = i; G.Audio.play('blip');
        }
        return;
      }
      if ((I.pressed('start') || I.pressed('fire') || I.pressed('jump')) && G.MISSIONS[this.sel].playable) {
        G.Audio.play('select'); this.startMission(this.sel);
      }
    },

    // ---------- ОТРИСОВКА ----------
    draw() {
      ctx.setTransform(scale, 0, 0, scale, 0, 0);
      ctx.imageSmoothingEnabled = false;
      if (this.state === 'title') return this.drawTitle();
      if (this.state === 'select') return this.drawSelect();
      this.drawWorld();
      this.drawHUD();
      if (this.state === 'briefing' || this.state === 'outro') {
        if (this.state === 'briefing') {
          ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fillRect(0, 0, W, H);
          G.text(ctx, 'MISSION ' + (this.missionIdx + 1), W / 2, 34, { size: 9, align: 'center', color: '#ffd23f' });
          G.text(ctx, this.mission.title, W / 2, 48, { size: 15, align: 'center' });
          G.text(ctx, this.mission.subtitle, W / 2, 70, { size: 8, align: 'center', color: '#ccc' });
        }
        G.Dialog.draw(ctx);
      }
      if (this.state === 'pause') this.overlay('PAUSED', ['ENTER — resume', 'C — quit to menu', 'M — sound on/off']);
      if (this.state === 'win') this.overlay('MISSION ACCOMPLISHED', ['Score: ' + this.score, 'Best: ' + (save[this.mission.id] || 0), '', 'ENTER — continue'], '#9fe870');
      if (this.state === 'fail') this.overlay('MISSION FAILED', [this.failReason || '', '', 'ENTER — retry', 'C — mission select'], '#ff5050');
    },

    drawWorld() {
      const sx = this.shake ? (Math.random() - 0.5) * this.shake : 0, sy = this.shake ? (Math.random() - 0.5) * this.shake : 0;
      const camX = Math.round(this.camX);
      G.Backgrounds.draw(ctx, this.mission.theme, camX, this.time);
      ctx.save(); ctx.translate(Math.round(sx), Math.round(sy));
      this.level.draw(ctx, camX);
      ctx.fillStyle = '#20160c'; ctx.fillRect(0, this.level.pxH, W, H - this.level.pxH + 10);
      if (this.thermal) { ctx.fillStyle = 'rgba(0,8,40,.78)'; ctx.fillRect(-10, -10, W + 20, H + 20); }
      if (this.base) this.base.draw(ctx, camX, this);
      for (const e of this.entities) if (e.kind === 'truck') e.draw(ctx, camX, this);
      for (const e of this.entities) if (e.kind !== 'truck') e.draw(ctx, camX, this);
      if (this.ally) this.ally.draw(ctx, camX, this);
      this.player.draw(ctx, camX, this);
      for (const b of this.bullets) b.draw(ctx, camX, this);
      for (const p of this.particles) p.draw(ctx, camX, this);
      for (const t of this.texts) G.text(ctx, t.text, Math.round(t.x - camX), Math.round(t.y), { size: 7, align: 'center', color: t.color });
      if (this.ally) this.ally.drawBubble(ctx, camX);
      ctx.restore();
      if (this.thermal) {
        G.text(ctx, '◉ THERMAL', W - 6, H - 14, { size: 7, align: 'right', color: '#ff8a20' });
        ctx.fillStyle = 'rgba(255,255,255,.04)';
        for (let y = (this.time * 40) % 4; y < H; y += 4) ctx.fillRect(0, y, W, 1);
      }
    },

    drawHUD() {
      const p = this.player, o = this.mission.objective;
      ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.fillRect(0, 0, W, 14);
      for (let i = 0; i < C.player.hp; i++) {
        ctx.fillStyle = i < p.hp ? '#e02020' : '#4a2020'; ctx.fillRect(4 + i * 9, 4, 7, 6);
      }
      G.text(ctx, '×' + Math.max(0, this.lives), 52, 3, { size: 8 });
      const w = C.weapons[p.weapon];
      G.text(ctx, w.name + (p.weapon !== 'rifle' ? ' ' + p.ammo[p.weapon] : ''), 74, 3, { size: 8, color: '#ffd23f' });
      G.text(ctx, 'GRN ' + p.grenades, 140, 3, { size: 8, color: '#9fe870' });
      if (p.rage > 0) G.text(ctx, 'FURY ' + Math.ceil(p.rage), 180, 3, { size: 8, color: '#ff4040' });
      let obj = '';
      if (o.type === 'reach') obj = 'REACH THE FLAG →';
      if (o.type === 'defend') {
        obj = 'WAVE ' + Math.max(1, this.waveIdx + 1) + '/' + o.waves.length;
        if (this.base) {
          ctx.fillStyle = '#333'; ctx.fillRect(W - 70, 16, 64, 4);
          ctx.fillStyle = '#4ad04a'; ctx.fillRect(W - 70, 16, 64 * Math.max(0, this.base.hp / this.base.maxHp), 4);
          G.text(ctx, 'BASE', W - 74, 14, { size: 7, align: 'right' });
        }
      }
      if (o.type === 'launchers') {
        const t = Math.max(0, Math.ceil(this.timer));
        const mm = Math.floor(t / 60), ss = String(t % 60).padStart(2, '0');
        obj = 'LAUNCHERS ' + this.launchersLeft + '  ⏱ ' + mm + ':' + ss;
        if (!this.thermal && this.time % 6 < 3 && this.state === 'play') G.text(ctx, 'V — thermal vision', W - 6, 16, { size: 7, align: 'right', color: '#ff8a20' });
      }
      const urgent = o.type === 'launchers' && this.timer < 30 && Math.floor(this.time * 4) % 2;
      G.text(ctx, obj, W - 6, 3, { size: 8, align: 'right', color: urgent ? '#ff4040' : '#fff' });
      G.text(ctx, (this.score < 0 ? '-' : '') + String(Math.abs(this.score)).padStart(6, '0'), W / 2 + 40, 3, { size: 8, align: 'center', color: this.score < 0 ? '#ff6060' : '#ccc' });

      // Рация
      const r = this.radioCur;
      if (r && this.state === 'play') {
        const bw = 250, bx = (W - bw) / 2, by = 22;
        const lines = G.wrap(ctx, r.text, bw - 34, 7);
        const bh = Math.max(28, lines.length * 8 + 14);
        ctx.fillStyle = 'rgba(0,0,20,.85)'; ctx.fillRect(bx, by, bw, bh);
        ctx.fillStyle = r.mood === 'rambo' ? '#e02020' : '#ffd23f'; ctx.fillRect(bx, by, bw, 1);
        const pt = (G.SPR.portrait[r.who + '_' + r.mood] || G.SPR.portrait[r.who + '_normal'])[Math.floor(this.time * 8) % 2];
        ctx.drawImage(pt, bx + 3, by + 3, 22, 22);
        const cast = C.cast[r.who] || { name: r.who, color: '#fff' };
        G.text(ctx, cast.name, bx + 29, by + 3, { size: 7, color: cast.color });
        lines.forEach((l, i) => G.text(ctx, l, bx + 29, by + 12 + i * 8, { size: 7 }));
      }
    },

    overlay(title, lines, color) {
      ctx.fillStyle = 'rgba(0,0,0,.7)'; ctx.fillRect(0, 0, W, H);
      G.text(ctx, title, W / 2, 60, { size: 16, align: 'center', color: color || '#ffd23f' });
      lines.forEach((l, i) => G.text(ctx, l, W / 2, 92 + i * 12, { size: 8, align: 'center' }));
    },

    drawTitle() {
      G.Backgrounds.draw(ctx, 'desert', this.time * 30, this.time);
      ctx.fillStyle = '#b3824f'; ctx.fillRect(0, 160, W, 56);
      // пролетающие дроны
      for (let i = 0; i < 3; i++) {
        const x = W + 40 - ((this.time * 50 + i * 150) % (W + 120));
        ctx.drawImage(G.SPR.shahed[Math.floor(this.time * 20) % 2], Math.round(x), 30 + i * 22);
      }
      const f = Math.floor(this.time * 10) % 4;
      G.drawSprite(ctx, G.SPR.hero[f], 90, 140, false);
      G.drawSprite(ctx, G.SPR.president[f], 60, 136, false);
      G.drawSprite(ctx, G.SPR.mossad[f], 120, 140, false);
      ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(0, 26, W, 62);
      G.text(ctx, C.title, W / 2, 30, { size: 30, align: 'center', color: '#ffd23f', shadowColor: '#8a2010' });
      G.text(ctx, C.subtitle, W / 2, 68, { size: 9, align: 'center' });
      if (Math.floor(this.time * 2) % 2) G.text(ctx, G.Input.isTouch ? 'TAP TO START' : 'PRESS ENTER', W / 2, 110, { size: 10, align: 'center' });
      G.text(ctx, 'Satire. All characters are fictional.', W / 2, H - 12, { size: 7, align: 'center', color: '#ddd' });
    },

    drawSelect() {
      ctx.fillStyle = '#0b1020'; ctx.fillRect(0, 0, W, H);
      G.text(ctx, 'SELECT MISSION', W / 2, 10, { size: 12, align: 'center', color: '#ffd23f' });
      G.MISSIONS.forEach((m, i) => {
        const y = 34 + i * 13, on = i === this.sel;
        if (on) { ctx.fillStyle = 'rgba(255,210,63,.18)'; ctx.fillRect(10, y - 2, W - 20, 12); }
        const col = m.playable ? (on ? '#ffd23f' : '#fff') : '#666';
        G.text(ctx, String(i + 1).padStart(2, ' ') + '. ' + m.title, 16, y, { size: 8, color: col });
        const tag = !m.playable ? 'COMING SOON' : m.ally === 'president' ? '★ WITH THE PRESIDENT' : m.ally === 'mossad' ? '★ WITH MOSSAD' : (save[m.id] ? 'BEST ' + save[m.id] : '');
        G.text(ctx, tag, W - 16, y, { size: 7, align: 'right', color: m.playable ? '#9fe870' : '#555' });
      });
      const m = G.MISSIONS[this.sel];
      G.text(ctx, m.subtitle, W / 2, H - 14, { size: 7, align: 'center', color: '#aaa' });
    },
  };

  // ---------- ЦИКЛ ----------
  let last = performance.now();
  function frame(now) {
    const dt = Math.max(0, Math.min(1 / 30, (now - last) / 1000)); last = now;
    try { g.update(dt); g.draw(); } catch (e) { console.error(e); }
    G.Input.endFrame();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
