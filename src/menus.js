// Меню и игровой цикл: титульный экран, главное меню, выбор миссий, «как играть»,
// пауза, итоги миссии, провал, подтверждения, финальные титры.
G.Menus = (function () {
  const C = G.CONFIG, W = C.W, H = C.H;
  const FULL = ['title', 'menu', 'select', 'howto', 'ending'];
  const OVER = ['pause', 'results', 'fail'];
  const RANKS = ['C', 'B', 'A', 'S'];
  let sel = 0, rects = [], confirmData = null, stateT = 0, endingY = 0, listScroll = 0;

  const fmtTime = t => Math.floor(t / 60) + ':' + String(Math.floor(t % 60)).padStart(2, '0');
  const confirmKey = I => I.pressed('fire') || I.pressed('jump') || I.pressed('start');

  function hasProgress(g) { return g.save.unlocked > 0 || Object.keys(g.save.best).length > 0; }
  function unlockedIdx(g) { return G.testerUnlock ? G.MISSIONS.length - 1 : Math.min(g.save.unlocked, G.MISSIONS.length - 1); }
  function diffName(g) { return C.difficulty[g.save.diff || 'normal'].name; }
  function cycleDiff(g, d) {
    const keys = Object.keys(C.difficulty), i = Math.max(0, keys.indexOf(g.save.diff || 'normal'));
    g.save.diff = keys[(i + d + keys.length) % keys.length]; g.persist(); G.Audio.play('blip');
  }
  function toggleSound(g) { g.save.mute = G.Audio.toggleMute(); g.persist(); G.Audio.play('blip'); }
  function fullscreenOK() { return !!(document.fullscreenEnabled || document.webkitFullscreenEnabled); }
  function toggleFullscreen() {
    try {
      if (document.fullscreenElement) { document.exitFullscreen(); return; }
      const el = document.documentElement;
      const p = (el.requestFullscreen || el.webkitRequestFullscreen).call(el);
      if (p && p.then) p.then(() => { try { screen.orientation.lock('landscape').catch(() => {}); } catch (e) {} }).catch(() => {});
    } catch (e) {}
  }

  function ask(g, text, yes, back) {
    confirmData = { text, yes, back: back || g.state };
    open(g, 'confirm');
  }

  function open(g, st) {
    g.state = st; sel = 0; stateT = 0; rects = [];
    if (st === 'select') { sel = g.sel != null ? Math.min(g.sel, unlockedIdx(g)) : unlockedIdx(g); }
    if (st === 'ending') endingY = H + 10;
    if (st === 'menu' || st === 'title' || st === 'select') G.Audio.stopMusic();
  }

  function items(g) {
    const last = G.MISSIONS.length - 1;
    switch (g.state) {
      case 'menu': return [
        { label: 'CONTINUE', hide: !hasProgress(g), act: () => g.startMission(unlockedIdx(g)) },
        { label: 'NEW GAME', act: () => hasProgress(g)
          ? ask(g, 'Start a new campaign? Unlocked missions will be locked again.', () => { g.save.unlocked = 0; g.persist(); g.startMission(0); })
          : g.startMission(0) },
        { label: 'MISSION SELECT', act: () => open(g, 'select') },
        { label: 'DIFFICULTY: ' + diffName(g), act: () => cycleDiff(g, 1), lr: d => cycleDiff(g, d) },
        { label: 'SOUND: ' + (g.save.mute ? 'OFF' : 'ON'), act: () => toggleSound(g), lr: () => toggleSound(g) },
        { label: 'HOW TO PLAY', act: () => open(g, 'howto') },
        { label: document.fullscreenElement ? 'EXIT FULLSCREEN' : 'FULLSCREEN', hide: !fullscreenOK(), act: toggleFullscreen },
        { label: 'RESET PROGRESS', danger: true, act: () => ask(g, 'Erase all progress, best scores and ranks?', () => { g.resetSave(); open(g, 'menu'); }) },
      ];
      case 'pause': return [
        { label: 'RESUME', act: () => { g.state = 'play'; } },
        { label: 'RESTART MISSION', act: () => g.startMission(g.missionIdx) },
        { label: 'SOUND: ' + (g.save.mute ? 'OFF' : 'ON'), act: () => toggleSound(g) },
        { label: 'MISSION SELECT', act: () => open(g, 'select') },
        { label: 'MAIN MENU', act: () => open(g, 'menu') },
      ];
      case 'results': return [
        { label: g.missionIdx < last ? 'NEXT MISSION' : 'FINAL CREDITS', act: () => g.missionIdx < last ? g.startMission(g.missionIdx + 1) : open(g, 'ending') },
        { label: 'REPLAY MISSION', act: () => g.startMission(g.missionIdx) },
        { label: 'MISSION SELECT', act: () => { g.sel = Math.min(g.missionIdx + 1, last); open(g, 'select'); } },
        { label: 'MAIN MENU', act: () => open(g, 'menu') },
      ];
      case 'fail': return [
        { label: 'RETRY', act: () => g.startMission(g.missionIdx) },
        { label: 'MISSION SELECT', act: () => open(g, 'select') },
        { label: 'MAIN MENU', act: () => open(g, 'menu') },
      ];
      case 'confirm': return [
        { label: 'YES', danger: true, act: () => { const f = confirmData.yes; confirmData = null; f(); } },
        { label: 'NO', act: () => { const b = confirmData.back; confirmData = null; open(g, b); } },
      ];
    }
    return [];
  }

  function backAction(g) {
    switch (g.state) {
      case 'pause': g.state = 'play'; break;
      case 'results': open(g, 'select'); break;
      case 'fail': open(g, 'menu'); break;
      case 'confirm': { const b = confirmData && confirmData.back; confirmData = null; open(g, b || 'menu'); break; }
      case 'select': case 'howto': case 'ending': open(g, 'menu'); break;
      case 'menu': open(g, 'title'); break;
    }
  }

  function updateList(g) {
    const I = G.Input, list = items(g).filter(it => !it.hide);
    if (!list.length) return;
    sel = Math.max(0, Math.min(sel, list.length - 1));
    if (I.pressed('down')) { sel = (sel + 1) % list.length; G.Audio.play('blip'); }
    if (I.pressed('up')) { sel = (sel + list.length - 1) % list.length; G.Audio.play('blip'); }
    if (list[sel].lr) { if (I.pressed('left')) list[sel].lr(-1); if (I.pressed('right')) list[sel].lr(1); }
    if (I.tapPos) {
      const r = rects.find(r => I.tapPos.x >= r.x && I.tapPos.x <= r.x + r.w && I.tapPos.y >= r.y && I.tapPos.y <= r.y + r.h);
      if (r && list[r.i]) { sel = r.i; G.Audio.play('select'); list[r.i].act(); }
      return;
    }
    if (confirmKey(I)) { G.Audio.play('select'); list[sel].act(); return; }
    if (I.pressed('back')) backAction(g);
  }

  function updateSelect(g) {
    const I = G.Input, n = G.MISSIONS.length, maxI = unlockedIdx(g);
    if (I.pressed('down')) { sel = (sel + 1) % n; G.Audio.play('blip'); }
    if (I.pressed('up')) { sel = (sel + n - 1) % n; G.Audio.play('blip'); }
    if (I.pressed('left')) cycleDiff(g, -1);
    if (I.pressed('right')) cycleDiff(g, 1);
    const tryStart = i => {
      if (i > maxI) { G.Audio.play('hit'); g.floatMsg = { text: 'Complete mission ' + i + ' to unlock', t: 2 }; return; }
      G.Audio.play('select'); g.sel = i; g.startMission(i);
    };
    if (I.tapPos) {
      const r = rects.find(r => I.tapPos.x >= r.x && I.tapPos.x <= r.x + r.w && I.tapPos.y >= r.y && I.tapPos.y <= r.y + r.h);
      if (!r) return;
      if (r.i === 'back') return backAction(g);
      if (r.i === 'diff') return cycleDiff(g, 1);
      if (r.i === sel) tryStart(r.i); else { sel = r.i; G.Audio.play('blip'); }
      return;
    }
    if (confirmKey(I)) tryStart(sel);
    if (I.pressed('back') || I.pressed('grenade')) backAction(g);
  }

  function update(g, dt) {
    const I = G.Input;
    stateT += dt;
    if (g.floatMsg) { g.floatMsg.t -= dt; if (g.floatMsg.t <= 0) g.floatMsg = null; }
    if (g.state === 'title') {
      if (stateT > 0.3 && (confirmKey(I) || I.pressed('tap'))) { G.Audio.play('select'); open(g, 'menu'); }
      return;
    }
    if (g.state === 'howto') { if (stateT > 0.2 && (confirmKey(I) || I.pressed('back') || I.pressed('tap'))) open(g, 'menu'); return; }
    if (g.state === 'ending') {
      endingY -= dt * 22;
      if ((stateT > 1.5 && (confirmKey(I) || I.pressed('back') || I.pressed('tap'))) || endingY < -CREDITS.length * 14 - 20) open(g, 'menu');
      return;
    }
    if (g.state === 'select') return updateSelect(g);
    if (stateT < 0.25) return;  // защита от случайного двойного нажатия
    updateList(g);
  }

  // ---------- ОТРИСОВКА ----------
  function button(ctx, label, x, y, w, on, i, danger) {
    const h = 13;
    ctx.fillStyle = on ? (danger ? 'rgba(255,80,80,.3)' : 'rgba(255,210,63,.25)') : 'rgba(255,255,255,.06)';
    ctx.fillRect(x, y, w, h);
    if (on) { ctx.fillStyle = danger ? '#ff5050' : '#ffd23f'; ctx.fillRect(x, y, 2, h); ctx.fillRect(x + w - 2, y, 2, h); }
    G.text(ctx, label, x + w / 2, y + 2, { size: 8, align: 'center', color: on ? (danger ? '#ff8080' : '#ffd23f') : danger ? '#c88' : '#fff' });
    rects.push({ x, y, w, h, i });
  }

  function drawList(g, ctx, top) {
    const list = items(g).filter(it => !it.hide);
    rects = [];
    const w = 170, x = (W - w) / 2;
    list.forEach((it, i) => button(ctx, it.label, x, top + i * 16, w, i === sel, i, it.danger));
    const hint = G.Input.isTouch ? 'Tap an option' : '↑↓ choose · Enter select · Esc back' + (list[sel] && list[sel].lr ? ' · ←→ change' : '');
    G.text(ctx, hint, W / 2, H - 11, { size: 6, align: 'center', color: '#888' });
  }

  function dim(ctx, a) { ctx.fillStyle = 'rgba(0,0,0,' + a + ')'; ctx.fillRect(0, 0, W, H); }

  function drawMenuBg(g, ctx) {
    G.Backgrounds.draw(ctx, 'desert', g.time * 20, g.time);
    ctx.fillStyle = '#b3824f'; ctx.fillRect(0, 170, W, 46);
    for (let i = 0; i < 2; i++) {
      const x = W + 40 - ((g.time * 45 + i * 210) % (W + 120));
      ctx.drawImage(G.SPR.shahed[Math.floor(g.time * 20) % 2], Math.round(x), 26 + i * 30);
    }
  }

  function draw(g, ctx) {
    const st = g.state;
    if (st === 'title') return drawTitle(g, ctx);
    if (st === 'menu' || (st === 'confirm' && confirmData && FULL.includes(confirmData.back))) {
      drawMenuBg(g, ctx); dim(ctx, 0.45);
      G.text(ctx, C.title, W / 2, 12, { size: 20, align: 'center', color: '#ffd23f', shadowColor: '#8a2010' });
      G.text(ctx, C.subtitle, W / 2, 36, { size: 7, align: 'center' });
      if (st === 'menu') drawList(g, ctx, 54);
      else drawConfirm(g, ctx);
      G.text(ctx, 'v' + C.version, W - 4, H - 10, { size: 6, align: 'right', color: '#777' });
      return;
    }
    if (st === 'select') return drawSelect(g, ctx);
    if (st === 'howto') return drawHowto(g, ctx);
    if (st === 'ending') return drawEnding(g, ctx);
  }

  // Поверх игрового мира
  function drawOverlay(g, ctx) {
    const st = g.state;
    if (st === 'pause') {
      dim(ctx, 0.65);
      G.text(ctx, 'PAUSED', W / 2, 22, { size: 16, align: 'center', color: '#ffd23f' });
      G.text(ctx, 'MISSION ' + (g.missionIdx + 1) + ': ' + g.mission.title, W / 2, 42, { size: 7, align: 'center', color: '#aaa' });
      drawList(g, ctx, 62);
    }
    if (st === 'fail') {
      dim(ctx, 0.72);
      G.text(ctx, 'MISSION FAILED', W / 2, 26, { size: 16, align: 'center', color: '#ff5050' });
      G.text(ctx, g.failReason || '', W / 2, 50, { size: 8, align: 'center' });
      drawList(g, ctx, 76);
    }
    if (st === 'results') {
      dim(ctx, 0.75);
      const r = g.result || {};
      G.text(ctx, 'MISSION ACCOMPLISHED', W / 2, 10, { size: 14, align: 'center', color: '#9fe870' });
      G.text(ctx, g.mission.title, W / 2, 28, { size: 7, align: 'center', color: '#aaa' });
      const rows = [['SCORE', r.score], ['TIME', fmtTime(r.time || 0)], ['KILLS', r.kills], ['DEATHS', r.deaths], ['HITS TAKEN', r.hits]];
      rows.forEach(([k, v], i) => {
        G.text(ctx, k, W / 2 - 80, 42 + i * 10, { size: 7, color: '#ccc' });
        G.text(ctx, String(v), W / 2 + 10, 42 + i * 10, { size: 7, align: 'right' });
      });
      const rc = { S: '#ffd23f', A: '#9fe870', B: '#7ec8ff', C: '#ccc' }[r.rank];
      G.text(ctx, 'RANK', W / 2 + 50, 42, { size: 7, align: 'center', color: '#ccc' });
      G.text(ctx, r.rank || 'C', W / 2 + 50, 52, { size: 30, align: 'center', color: rc });
      if (r.newBest && Math.floor(g.time * 3) % 2) G.text(ctx, 'NEW BEST!', W / 2 + 50, 86, { size: 7, align: 'center', color: '#ffd23f' });
      drawList(g, ctx, 98);
    }
    if (st === 'confirm') { dim(ctx, 0.7); drawConfirm(g, ctx); }
  }

  function drawConfirm(g, ctx) {
    const lines = G.wrap(ctx, confirmData ? confirmData.text : '', 260, 8);
    lines.forEach((l, i) => G.text(ctx, l, W / 2, 70 + i * 11, { size: 8, align: 'center' }));
    drawList(g, ctx, 100);
  }

  function drawTitle(g, ctx) {
    drawMenuBg(g, ctx);
    const f = Math.floor(g.time * 10) % 4;
    G.drawSprite(ctx, G.SPR.hero[f], 90, 152, false);
    G.drawSprite(ctx, G.SPR.president[f], 60, 148, false);
    G.drawSprite(ctx, G.SPR.mossad[f], 120, 152, false);
    ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(0, 26, W, 62);
    G.text(ctx, C.title, W / 2, 30, { size: 30, align: 'center', color: '#ffd23f', shadowColor: '#8a2010' });
    G.text(ctx, C.subtitle, W / 2, 68, { size: 9, align: 'center' });
    if (Math.floor(g.time * 2) % 2) G.text(ctx, G.Input.isTouch ? 'TAP TO START' : 'PRESS ENTER', W / 2, 110, { size: 10, align: 'center' });
    G.text(ctx, 'Satire. All characters are fictional.', W / 2, H - 12, { size: 7, align: 'center', color: '#ddd' });
    G.text(ctx, 'v' + C.version, W - 4, H - 10, { size: 6, align: 'right', color: '#aaa' });
  }

  function drawSelect(g, ctx) {
    rects = [];
    ctx.fillStyle = '#0b1020'; ctx.fillRect(0, 0, W, H);
    G.text(ctx, 'SELECT MISSION', W / 2, 6, { size: 12, align: 'center', color: '#ffd23f' });
    button(ctx, '◀ BACK', 6, 5, 50, false, 'back');
    const maxI = unlockedIdx(g);
    G.MISSIONS.forEach((m, i) => {
      const y = 26 + i * 13, on = i === sel, locked = i > maxI;
      if (on) { ctx.fillStyle = 'rgba(255,210,63,.18)'; ctx.fillRect(10, y - 2, W - 20, 12); }
      const col = locked ? '#555' : on ? '#ffd23f' : '#fff';
      G.text(ctx, String(i + 1).padStart(2, ' ') + '. ' + (locked ? '??????' : m.title), 16, y, { size: 8, color: col });
      let tag = '';
      if (locked) tag = 'LOCKED';
      else if (g.save.best[m.id] != null) tag = 'RANK ' + (g.save.rank[m.id] || 'C') + '   BEST ' + g.save.best[m.id];
      else if (Array.isArray(m.ally)) tag = '★ PRESIDENT + MOSSAD';
      else if (m.ally === 'president') tag = '★ WITH THE PRESIDENT';
      else if (m.ally === 'mossad') tag = '★ WITH MOSSAD';
      else tag = 'NEW';
      G.text(ctx, tag, W - 16, y, { size: 7, align: 'right', color: locked ? '#444' : tag.startsWith('RANK') ? '#7ec8ff' : '#9fe870' });
      rects.push({ x: 10, y: y - 2, w: W - 20, h: 12, i });
    });
    const m = G.MISSIONS[sel];
    const sub = g.floatMsg ? g.floatMsg.text : sel > maxI ? 'Locked. Finish the previous mission first.' : m.subtitle;
    G.text(ctx, sub, W / 2, H - 25, { size: 7, align: 'center', color: g.floatMsg ? '#ff8080' : '#aaa' });
    const d = diffName(g), dcol = { EASY: '#9fe870', NORMAL: '#ffd23f', HARD: '#ff5050' }[d];
    G.text(ctx, '◀  DIFFICULTY: ' + d + '  ▶', W / 2, H - 13, { size: 8, align: 'center', color: dcol });
    rects.push({ x: W / 2 - 90, y: H - 16, w: 180, h: 14, i: 'diff' });
    if (!G.Input.isTouch) G.text(ctx, 'Enter play · Esc back', W - 4, H - 10, { size: 5, align: 'right', color: '#666' });
  }

  function drawHowto(g, ctx) {
    ctx.fillStyle = '#0b1020'; ctx.fillRect(0, 0, W, H);
    G.text(ctx, 'HOW TO PLAY', W / 2, 8, { size: 12, align: 'center', color: '#ffd23f' });
    const touch = G.Input.isTouch;
    const rows = touch ? [
      ['◀ ▶', 'Run'], ['▲', 'Aim up (drone: fly up)'], ['▼', 'Crouch · in the air: shoot down'], ['A', 'Jump  (▼ + A: drop through platform)'],
      ['B', 'Fire'], ['G', 'Grenade (drone: bomb)'], ['V', 'Thermal vision · HIMARS · dive'], ['II', 'Pause'],
    ] : [
      ['← → / A D', 'Run'], ['↑ / W', 'Aim up (drone: fly up)'], ['↓ / S', 'Crouch · in the air: shoot down'], ['X / K / Space', 'Jump  (↓ + jump: drop through)'],
      ['Z / J', 'Fire'], ['C / L', 'Grenade (drone: bomb)'], ['V / I', 'Thermal vision · HIMARS · dive'], ['Enter / P', 'Pause · Esc: back'],
    ];
    rows.forEach(([k, v], i) => {
      G.text(ctx, k, 120, 30 + i * 14, { size: 8, align: 'right', color: '#ffd23f' });
      G.text(ctx, v, 132, 30 + i * 14, { size: 8 });
    });
    G.text(ctx, 'Pick up the red tie for TIE OF FURY: rapid fire for 10 seconds.', W / 2, 150, { size: 7, align: 'center', color: '#ff8080' });
    G.text(ctx, 'Don\'t shoot civilians: trucks of watermelons, scientists.', W / 2, 162, { size: 7, align: 'center', color: '#ccc' });
    G.text(ctx, 'Skip dialogue: ' + (touch ? 'tap SKIP' : 'Esc or C'), W / 2, 174, { size: 7, align: 'center', color: '#ccc' });
    if (Math.floor(g.time * 2) % 2) G.text(ctx, touch ? 'TAP TO GO BACK' : 'PRESS ENTER', W / 2, H - 16, { size: 8, align: 'center' });
  }

  const CREDITS = [
    ['OPERATION EPIC FURY', '#ffd23f', 14], ['CAMPAIGN COMPLETE', '#9fe870', 9], ['', '', 8],
    ['STARRING', '#aaa', 7], ['Sgt. Steel', '#fff', 8], ['President Gold', '#fff', 8], ['Agent Avi', '#fff', 8], ['CENTCOM HQ', '#fff', 8],
    ['The Toll Collector', '#fff', 8], ['The Invisible Ayatollah (not pictured)', '#fff', 8], ['', '', 8],
    ['SPECIAL THANKS', '#aaa', 7], ['Every cardboard cutout', '#fff', 8], ['The watermelon truck drivers', '#fff', 8], ['The tape recorder', '#fff', 8], ['', '', 8],
    ['Satire. All characters are fictional.', '#ccc', 7], ['', '', 8], ['THANKS FOR PLAYING!', '#ffd23f', 10],
  ];
  function drawEnding(g, ctx) {
    drawMenuBg(g, ctx); dim(ctx, 0.7);
    let y = endingY;
    for (const [t, col, size] of CREDITS) { if (t && y > -20 && y < H + 10) G.text(ctx, t, W / 2, Math.round(y), { size, align: 'center', color: col }); y += size + 7; }
    const total = Object.values(g.save.best).reduce((a, b) => a + b, 0);
    ctx.fillStyle = 'rgba(0,0,0,.85)'; ctx.fillRect(0, 0, W, 14);
    G.text(ctx, 'TOTAL BEST SCORE: ' + total, W / 2, 3, { size: 7, align: 'center', color: '#ffd23f' });
  }

  function rankFor(stats) {
    if (stats.hits === 0) return 'S';
    if (stats.deaths === 0) return 'A';
    if (stats.deaths === 1) return 'B';
    return 'C';
  }
  function betterRank(a, b) { return RANKS.indexOf(a) >= RANKS.indexOf(b || 'C') ? a : b; }

  return {
    full: st => FULL.includes(st) || (st === 'confirm' && confirmData && FULL.includes(confirmData.back)),
    handles: st => FULL.includes(st) || OVER.includes(st) || st === 'confirm',
    open, update, draw, drawOverlay, rankFor, betterRank,
    get sel() { return sel; },
  };
})();
