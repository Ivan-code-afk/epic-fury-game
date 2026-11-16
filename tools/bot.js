// Бот-тестировщик: выполняется в странице. Возвращает метрики по миссии.
window.runBot = function (idx, opts) {
  opts = opts || {};
  const g = G.game, I = G.Input, C = G.CONFIG;
  g.setDifficulty(opts.diff || 'normal');
  g.startMission(idx);
  G.Dialog.cur = null; G.Dialog.queue = []; g.state = 'play';
  const p = g.player;
  let hits = 0, hitLog = {}, t = 0, jumpHold = 0, maxX = p.x, lastProgressT = 0, lastX = p.x;
  const origHurt = p.hurt.bind(p);
  p.hurt = function (gg, dmg) {
    if (this.invuln > 0 || this.dead) return;
    hits += dmg;
    const col = Math.floor(this.x / 16 / 20) * 20; hitLog[col] = (hitLog[col] || 0) + dmg;
    this.invuln = C.player.invuln; this.hp = C.player.hp; G.Audio.play('hurt');
  };
  const keys = ['left', 'right', 'up', 'down', 'jump', 'fire', 'grenade', 'special'];
  const set = (k, v) => I._set(k, v);
  const dt = 1 / 60, limit = opts.limit || 240;
  const endX = g.level.pxW - 70;
  while (t < limit) {
    t += dt;
    if (g.state === 'talk' || g.state === 'briefing') { G.Dialog.cur = null; G.Dialog.queue = []; g.state = 'play'; }
    if (g.state !== 'play') break;
    keys.forEach(k => set(k, false));
    if (p.flyer) {
      set('right', p.x < g.camX + 140); set('fire', true);
      // держаться середины свободного неба
      let floor = 0; while (floor < 208 && !g.level.solidAt(p.x + 30, floor + 40)) floor += 4;
      const want = Math.max(40, floor - 30);
      if (p.y < want - 10) set('down', true); else if (p.y > want + 10) set('up', true);
      if (g.target && g.target.x - p.x < 200) set('special', true);
    } else if (g.mission.objective.type === 'defend') {
      // оборона: стоять в центре и стрелять по дронам вверх/вперёд
      const tx = 14 * 16;
      if (p.x < tx - 6) set('right', true); else if (p.x > tx + 6) set('left', true);
      const near = g.entities.filter(e => e.enemy && !e.dead).sort((a, b) => Math.abs(a.x - p.x) - Math.abs(b.x - p.x))[0];
      if (near) { if (near.y + near.h < p.y - 20 && Math.abs(near.x - p.x) < 60) set('up', true); else if (near.x > p.x + 20 && p.x > tx - 8) set('right', false); }
      set('fire', true);
      if (near && near.kind === 'soldier' && Math.abs(near.x - p.x) < 100 && Math.floor(t * 2) % 3 === 0) set('grenade', true);
    } else {
      set('right', true); set('fire', true);
      const L = g.level, fx = p.x + p.w + 2, footY = p.y + p.h;
      // лифт впереди: зайти, дождаться верха, выйти
      const lf = (g.lifts || []).find(l => l.x + l.w > p.x - 4 && l.x - p.x < 40 && p.y + p.h > l.top + 6);
      if (lf) {
        const onLift = p.x > lf.x + 2 && p.x + p.w < lf.x + lf.w - 2 && Math.abs(p.y + p.h - lf.y) < 4;
        if (onLift && lf.y > lf.top + 2) { set('right', false); }
        else if (!onLift && Math.abs(p.y + p.h - lf.y) > 6 && p.y + p.h > lf.top + 20) { set('right', p.x + p.w < lf.x - 2); }
        else if (!onLift) { set('right', p.x < lf.x + 6); }
      }
      const wall = L.solidAt(fx + 4, footY - 6) || L.solidAt(fx + 4, footY - 14);
      const gap = !L.solidAt(fx, footY + 6) && L.at(Math.floor(fx / 16), Math.floor((footY + 6) / 16)) !== '=' && !lf;
      const enemyAbove = g.entities.some(e => e.enemy && !e.dead && Math.abs(e.x - p.x) < 60 && e.y + e.h < p.y - 10);
      if (enemyAbove) set('up', Math.floor(t * 3) % 2 === 0);
      if (p.onGround && (wall || gap)) jumpHold = 0.35;
      if (jumpHold > 0) { set('jump', true); jumpHold -= dt; }
      if (Math.floor(t) % 7 === 0 && Math.floor((t - dt)) % 7 !== 0) set('grenade', true);
      if (g.mission.objective.special === 'himars' && Math.floor(t * 2) % 8 === 0) set('special', true);
    }
    g.update(dt);
    I.endFrame();
    if (p.x > maxX + 8) { maxX = p.x; lastProgressT = t; }
    if (!p.flyer && g.mission.objective.type !== 'defend' && t - lastProgressT > 8) break;   // застрял
    if (p.x >= endX) break;
  }
  keys.forEach(k => set(k, false));
  const cols = Math.max(1, (maxX - 32) / 16);
  return {
    base: g.base ? g.base.hp : null,
    id: g.mission.id, state: g.state, time: +t.toFixed(1), maxCol: Math.floor(maxX / 16), width: g.level.w,
    hits, perScreen: +(hits / (cols / 24)).toFixed(2), perMin: +(hits / (t / 60)).toFixed(1),
    worst: Object.entries(hitLog).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([c, h]) => c + ':' + h).join(' '),
  };
};

// Бой с боссом: телепорт к арене, бот стреляет и подпрыгивает от снарядов
window.runBoss = function (idx, opts) {
  opts = opts || {};
  const g = G.game, I = G.Input, C = G.CONFIG;
  g.setDifficulty(opts.diff || 'normal');
  g.startMission(idx);
  G.Dialog.cur = null; G.Dialog.queue = []; g.state = 'play';
  const p = g.player, bo = g.boss;
  g.entities = g.entities.filter(e => e === bo || !e.enemy || e.kind === 'bars');
  p.x = bo.x - 150; p.y = 120; p.checkpoint = { x: p.x, y: 40 };
  for (const a of g.allies) { a.x = p.x - 20; a.y = 40; }
  let hits = 0, t = 0;
  p.hurt = function () { if (this.invuln > 0) return; hits++; this.invuln = C.player.invuln; };
  const keys = ['left', 'right', 'up', 'down', 'jump', 'fire', 'grenade', 'special'];
  while (t < 180 && !(bo.dead && g.state !== 'play')) {
    t += 1 / 60;
    if (g.state === 'talk') { G.Dialog.cur = null; G.Dialog.queue = []; g.state = 'play'; }
    if (g.state !== 'play') break;
    keys.forEach(k => I._set(k, false));
    I._set('fire', true);
    const danger = g.bullets.some(b => b.owner === 'enemy' && Math.abs(b.x - p.x) < 40 && Math.abs(b.y - p.y) < 40);
    if (danger && p.onGround) I._set('jump', true);
    const holo = g.entities.find(e => e.kind === 'hologram' && !e.dead);
    if (holo && holo.x < p.x) I._set('left', true);
    else if (p.x < bo.x - 140) I._set('right', true);
    else if (p.x > bo.x - 90) I._set('left', true);
    if (Math.floor(t * 10) % 25 === 0) I._set('grenade', true);
    g.update(1 / 60); I.endFrame();
  }
  keys.forEach(k => I._set(k, false));
  return { id: g.mission.id, killed: bo.dead, time: +t.toFixed(0), hits, perMin: +(hits / (t / 60)).toFixed(1), hpLeft: bo.hp };
};
