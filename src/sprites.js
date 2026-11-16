// Процедурный пиксель-арт: все спрайты рисуются кодом в офскрин-канвасы.
// Чтобы заменить графику на свою, загрузите PNG и положите canvas/Image в G.SPR под тем же ключом.
G.SPR = {};

(function () {
  function mk(w, h, fn) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const x = c.getContext('2d');
    x.imageSmoothingEnabled = false;
    fn(x, (col, a, b, cw, ch) => { x.fillStyle = col; x.fillRect(a, b, cw, ch); });
    return c;
  }
  G.mkCanvas = mk;

  // Однотонная копия спрайта (для вспышек урона и тепловизора)
  G.tint = function (src, color) {
    return mk(src.width, src.height, x => {
      x.drawImage(src, 0, 0);
      x.globalCompositeOperation = 'source-in';
      x.fillStyle = color; x.fillRect(0, 0, src.width, src.height);
    });
  };

  // ---------- СОЛДАТЫ ----------
  const PAL = {
    hero:  { helmet: '#5b6b3a', rim: '#47552c', skin: '#e0a878', shirt: '#7a8a50', vest: '#4d5a30', pants: '#6b7546', boots: '#2b2418', gun: '#222', beard: null },
    rambo: { helmet: '#3b2a1e', rim: '#3b2a1e', skin: '#e0a878', shirt: '#7a8a50', vest: '#4d5a30', pants: '#6b7546', boots: '#2b2418', gun: '#222', beard: null, band: '#e02020' },
    irgc:  { helmet: '#3f5a3a', rim: '#2e4229', skin: '#c68a5e', shirt: '#5d7650', vest: '#3f5236', pants: '#4f6644', boots: '#1d1a14', gun: '#3a2a1a', beard: '#1a1410' },
  };

  function soldier(p, frame, aimUp) {
    return mk(18, 20, (x, r) => {
      const crouch = frame === 'crouch';
      const dy = crouch ? 5 : 0;
      // ноги
      r(p.pants, 0, 0, 0, 0);
      const L = {
        0: [[5, 14, 3, 4, 5, 18], [9, 14, 3, 4, 9, 18]],
        1: [[4, 14, 3, 4, 3, 18], [10, 14, 3, 3, 11, 17]],
        2: [[6, 14, 4, 4, 6, 18]],
        3: [[9, 14, 3, 4, 10, 18], [4, 14, 3, 3, 2, 17]],
        jump: [[5, 14, 3, 3, 4, 17], [9, 13, 3, 3, 10, 16]],
      }[frame];
      if (crouch) {
        r(p.pants, 4, 15, 9, 3); r(p.boots, 3, 18, 4, 2); r(p.boots, 10, 18, 4, 2);
      } else {
        L.forEach(l => { r(p.pants, l[0], l[1], l[2], l[3]); r(p.boots, l[4], l[5], l[2] + (l[2] === 4 ? 1 : 0), 2); });
      }
      // торс
      r(p.shirt, 5, 8 + dy, 7, 6 - (crouch ? 2 : 0));
      r(p.vest, 6, 9 + dy, 5, 4 - (crouch ? 1 : 0));
      // голова
      r(p.skin, 6, 3 + dy, 5, 5);
      r('#111', 9, 5 + dy, 1, 1);
      if (p.beard) r(p.beard, 6, 6 + dy, 5, 2);
      // шлем / бандана
      if (p.band) {
        r(p.helmet, 5, 1 + dy, 7, 3);
        r(p.band, 5, 3 + dy, 7, 1); r(p.band, 3, 3 + dy, 2, 1); r(p.band, 2, 4 + dy, 2, 1);
      } else {
        r(p.helmet, 5, 0 + dy, 7, 3); r(p.rim, 4, 3 + dy, 9, 1);
      }
      // руки и оружие
      if (aimUp === 'down') {
        r(p.shirt, 9, 9 + dy, 2, 4);
        r(p.gun, 10, 11 + dy, 2, 8); r('#555', 10, 18 + dy, 2, 1);
      } else if (aimUp) {
        r(p.shirt, 9, 6 + dy, 2, 4);
        r(p.gun, 10, 0 + dy, 2, 8); r('#555', 10, 0 + dy, 2, 1);
      } else {
        r(p.shirt, 8, 9 + dy, 3, 2); r(p.skin, 11, 10 + dy, 1, 1);
        r(p.gun, 10, 9 + dy, 7, 2); r(p.gun, 11, 11 + dy, 2, 2); r('#555', 16, 9 + dy, 1, 1);
      }
    });
  }

  const frames = [0, 1, 2, 3, 'jump', 'crouch'];
  ['hero', 'rambo', 'irgc'].forEach(k => {
    G.SPR[k] = {};
    frames.forEach(f => {
      G.SPR[k][f] = soldier(PAL[k], f, false);
      G.SPR[k][f + '_up'] = soldier(PAL[k], f, true);
    });
    G.SPR[k].jump_down = soldier(PAL[k], 'jump', 'down');
  });
  // Гранатомётчик: солдат КСИР с трубой РПГ на плече
  G.SPR.rpg = {};
  frames.forEach(f => {
    const base = G.SPR.irgc[f];
    G.SPR.rpg[f] = mk(20, 20, (x, r) => {
      x.drawImage(base, 0, 0);
      const dy = f === 'crouch' ? 5 : 0;
      r('#4a5a2a', 2, 6 + dy, 15, 3); r('#2e3a1a', 2, 6 + dy, 2, 3); r('#8a3a1a', 17, 5 + dy, 3, 5);
    });
  });

  // ---------- ДРОН «ШАХЕД» (смотрит влево) ----------
  function shahed(propPhase) {
    return mk(26, 12, (x, r) => {
      x.fillStyle = '#9aa0a6';
      x.beginPath(); x.moveTo(1, 6); x.lineTo(20, 0); x.lineTo(22, 0); x.lineTo(22, 11); x.lineTo(20, 11); x.closePath(); x.fill();
      r('#6c7278', 2, 5, 20, 2);
      r('#c33', 0, 5, 3, 2);           // боеголовка
      r('#555', 19, 0, 2, 3); r('#555', 19, 9, 2, 3); // кили
      r('#333', 22, 5, 1, 2);
      if (propPhase) r('#ddd', 24, 1, 1, 10); else r('#ddd', 23, 4, 3, 4);
    });
  }
  G.SPR.shahed = [shahed(0), shahed(1)];

  // Американский LUCAS (союзный, смотрит вправо) — для будущей миссии
  G.SPR.lucas = mk(26, 12, (x, r) => {
    x.save(); x.translate(26, 0); x.scale(-1, 1); x.drawImage(shahed(1), 0, 0); x.restore();
    r('#2b4a8a', 8, 5, 6, 2);
  });

  // ---------- ГРУЗОВИК (обычный и с пусковой внутри) ----------
  function truck(colorBody, colorTarp, hot) {
    return mk(44, 24, (x, r) => {
      r(colorTarp, 2, 6, 27, 11);           // кузов-тент
      r(shade(colorTarp, -25), 2, 15, 27, 2);
      for (let i = 5; i < 28; i += 6) r(shade(colorTarp, -15), i, 6, 1, 9);
      r(colorBody, 30, 7, 12, 10);          // кабина
      r('#9ad0f0', 34, 8, 6, 4);            // стекло
      r('#222', 0, 17, 44, 2);              // рама
      r('#ff4', 41, 13, 2, 2);              // фара
      [9, 22, 36].forEach(cx => { r('#111', cx - 3, 17, 7, 7); r('#666', cx - 1, 19, 3, 3); });
      if (hot) { r('#ffefb0', 4, 9, 23, 3); r('#ff6a00', 25, 8, 3, 5); } // ракета под тентом
    });
  }
  function shade(hex, amt) {
    const n = parseInt(hex.slice(1), 16);
    const c = v => Math.max(0, Math.min(255, v + amt));
    return '#' + [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(v => c(v).toString(16).padStart(2, '0')).join('');
  }
  G.shade = shade;
  G.SPR.truck = truck('#b8a27a', '#8a7d5a', false);
  G.SPR.truck2 = truck('#d0d0c8', '#4f6f8f', false);
  G.SPR.truck3 = truck('#c46a3a', '#7d6a4a', false);
  G.SPR.truckHot = truck('#b8a27a', '#8a7d5a', true);

  // Открытая пусковая (после раскрытия)
  G.SPR.launcher = mk(44, 28, (x, r) => {
    r('#4f5a3a', 2, 16, 40, 6); r('#222', 0, 21, 44, 2);
    [8, 20, 34].forEach(cx => { r('#111', cx - 3, 21, 7, 7); r('#666', cx - 1, 23, 3, 3); });
    x.save(); x.translate(10, 16); x.rotate(-0.6);
    r('#ddd', 0, -3, 30, 5); r('#c22', 28, -3, 4, 5); r('#888', 2, 2, 4, 2);
    x.restore();
  });

  // ---------- ТУРЕЛЬ (пулемётчик за мешками) ----------
  G.SPR.turret = mk(22, 18, (x, r) => {
    r('#c9b27a', 0, 10, 22, 8); r('#a8915c', 0, 13, 22, 1); r('#a8915c', 7, 10, 1, 8); r('#a8915c', 15, 10, 1, 8);
    r(PAL.irgc.helmet, 9, 1, 7, 3); r(PAL.irgc.skin, 10, 4, 5, 4); r(PAL.irgc.beard, 10, 7, 5, 2);
    r('#333', 0, 7, 12, 2); r('#333', 6, 9, 3, 2);
  });

  // ---------- КАТЕР КСИР (смотрит влево) ----------
  G.SPR.speedboat = mk(36, 18, (x, r) => {
    x.fillStyle = '#d8dcdf';
    x.beginPath(); x.moveTo(0, 10); x.lineTo(34, 10); x.lineTo(34, 17); x.lineTo(8, 17); x.closePath(); x.fill();
    r('#3f5a3a', 2, 13, 32, 2);
    r('#9aa0a6', 18, 6, 10, 4); r('#9ad0f0', 19, 7, 4, 2);       // рубка
    r(PAL.irgc.helmet, 9, 0, 6, 2); r(PAL.irgc.skin, 10, 2, 4, 4); r(PAL.irgc.beard, 10, 5, 4, 1); r(PAL.irgc.shirt, 9, 6, 6, 4);
    r('#333', 2, 6, 10, 2); r('#333', 6, 8, 2, 2);                // пулемёт
  });

  // ---------- УЧЁНЫЙ (мирный) ----------
  const SCI = { helmet: '#3a2a1e', rim: '#3a2a1e', skin: '#d8a070', shirt: '#eeeeee', vest: '#d8d8d8', pants: '#555a60', boots: '#222', gun: '#eeeeee', beard: '#3a2a1e' };
  G.SPR.scientist = {};
  frames.forEach(f => {
    const base = soldier(SCI, f, false);
    G.SPR.scientist[f] = mk(18, 20, (x, r) => { x.drawImage(base, 0, 0); const dy = f === 'crouch' ? 5 : 0; r('#111', 8, 4 + dy, 3, 1); r('#9ad0f0', 9, 5 + dy, 1, 1); r('#c9a050', 13, 8 + dy, 4, 5); });
  });

  // ---------- ЯЩИК «PEACEFUL ATOM» ----------
  G.SPR.atomCrate = mk(20, 18, (x, r) => {
    r('#c9a227', 0, 0, 20, 18); r('#8a6a10', 0, 0, 20, 1); r('#8a6a10', 0, 17, 20, 1); r('#8a6a10', 0, 0, 1, 18); r('#8a6a10', 19, 0, 1, 18);
    x.fillStyle = '#111'; x.beginPath(); x.arc(10, 9, 6, 0, 7); x.fill();
    x.fillStyle = '#c9a227';
    for (let i = 0; i < 3; i++) { const a = i * 2.094 + 0.52; x.beginPath(); x.moveTo(10, 9); x.arc(10, 9, 6, a, a + 1.05); x.closePath(); x.fill(); }
    x.fillStyle = '#111'; x.beginPath(); x.arc(10, 9, 1.5, 0, 7); x.fill();
  });

  // ---------- ЯДЕРНЫЙ ЗАРЯД ----------
  G.SPR.bombCore = mk(16, 16, (x, r) => {
    x.fillStyle = '#5a6068'; x.beginPath(); x.arc(8, 8, 7, 0, 7); x.fill();
    x.fillStyle = '#7a8088'; x.beginPath(); x.arc(6, 6, 3, 0, 7); x.fill();
    r('#ffd23f', 6, 7, 4, 2); r('#ffd23f', 7, 6, 2, 4); r('#333', 3, 13, 10, 2);
  });

  // ---------- ЦЕНТРИФУГА ----------
  G.SPR.centrifuge = [0, 1, 2].map(ph => mk(14, 32, (x, r) => {
    r('#9aa0a6', 1, 2, 12, 26); r('#c8ccd0', 2, 2, 3, 26); r('#6c7278', 11, 2, 2, 26);
    for (let i = 0; i < 4; i++) r('#4a5058', 1, 4 + ((i * 7 + ph * 2) % 26), 12, 1);
    r('#555', 0, 0, 14, 3); r('#555', 0, 28, 14, 4); r('#6f6', 5, 29, 4, 1);
  }));

  // ---------- РАКЕТНАЯ ТЕЛЕЖКА НА РЕЛЬСАХ ----------
  G.SPR.cart = mk(42, 18, (x, r) => {
    r('#5a5248', 1, 9, 40, 5); r('#3a342c', 1, 13, 40, 1);
    r('#e8e8e8', 3, 4, 32, 5); r('#c22', 35, 4, 5, 5); r('#999', 3, 3, 4, 7); r('#555', 14, 9, 2, 2); r('#555', 26, 9, 2, 2);
    r('#d4af37', 1, 9, 3, 2); // мигалка
    [7, 20, 33].forEach(c => { r('#111', c - 3, 13, 7, 5); r('#888', c - 1, 15, 3, 2); });
  });

  // ---------- СКЛАД РАКЕТ ----------
  G.SPR.depot = mk(52, 44, (x, r) => {
    for (let i = 0; i < 4; i++) { r('#d8d8d8', 2, 6 + i * 7, 36, 5); r('#c22', 38, 6 + i * 7, 5, 5); r('#999', 2, 5 + i * 7, 4, 7); }
    r('#6a4a2a', 0, 34, 52, 10); r('#4a3018', 0, 34, 52, 1); r('#4a3018', 17, 34, 1, 10); r('#4a3018', 34, 34, 1, 10);
    r('#c22', 42, 2, 10, 12); r('#fff', 44, 6, 6, 1); r('#fff', 44, 9, 6, 1);
  });

  // ---------- ЛАМПА В ТОННЕЛЕ ----------
  G.SPR.lamp = mk(8, 8, (x, r) => { r('#555', 3, 0, 2, 3); r('#333', 1, 3, 6, 2); r('#fff3a0', 2, 5, 4, 2); });

  // ---------- МОРСКАЯ МИНА ----------
  G.SPR.mine = mk(14, 14, (x, r) => {
    x.fillStyle = '#2a2a2a'; x.beginPath(); x.arc(7, 7, 5, 0, 7); x.fill();
    [[6, 0], [6, 12], [0, 6], [12, 6], [2, 2], [10, 2], [2, 10], [10, 10]].forEach(([a, b]) => r('#555', a, b, 2, 2));
    r('#e02020', 6, 6, 2, 2); r('#666', 4, 4, 2, 1);
  });

  // ---------- КУПЮРА (снаряд босса) ----------
  G.SPR.bill = mk(10, 5, (x, r) => { r('#6aa84f', 0, 0, 10, 5); r('#3d7a2a', 1, 1, 8, 3); r('#b6d7a8', 4, 1, 2, 3); });

  // ---------- ТАЙЛЫ ----------
  function noiseFill(x, base, alt, w, h, density) {
    x.fillStyle = base; x.fillRect(0, 0, w, h);
    x.fillStyle = alt;
    let s = 7;
    for (let i = 0; i < w * h * density; i++) {
      s = (s * 9301 + 49297) % 233280;
      const px = s % w; s = (s * 9301 + 49297) % 233280;
      x.fillRect(px, s % h, 1, 1);
    }
  }
  G.SPR.tiles = {
    sandTop: mk(16, 16, (x, r) => { noiseFill(x, '#d8b46a', '#c49c55', 16, 16, 0.12); r('#f0d088', 0, 0, 16, 3); r('#c49c55', 0, 3, 16, 1); }),
    sand: mk(16, 16, x => noiseFill(x, '#c49c55', '#a98445', 16, 16, 0.15)),
    rockTop: mk(16, 16, (x, r) => { noiseFill(x, '#8a7a6a', '#6f6152', 16, 16, 0.2); r('#a89888', 0, 0, 16, 2); }),
    rock: mk(16, 16, x => noiseFill(x, '#6f6152', '#5a4e42', 16, 16, 0.2)),
    concrete: mk(16, 16, (x, r) => { noiseFill(x, '#8d9196', '#7a7e83', 16, 16, 0.1); r('#a5a9ae', 0, 0, 16, 1); r('#6a6e73', 0, 15, 16, 1); r('#6a6e73', 15, 0, 1, 16); }),
    platform: mk(16, 16, (x, r) => { r('#6a6e73', 0, 0, 16, 4); r('#9ca0a5', 0, 0, 16, 1); r('#4a4e53', 2, 4, 2, 4); r('#4a4e53', 12, 4, 2, 4); }),
    sandbag: mk(16, 16, (x, r) => { r('#c9b27a', 0, 0, 16, 16); r('#a8915c', 0, 5, 16, 1); r('#a8915c', 0, 10, 16, 1); r('#a8915c', 7, 0, 1, 5); r('#a8915c', 3, 6, 1, 4); r('#a8915c', 11, 6, 1, 4); r('#a8915c', 8, 11, 1, 5); }),
    crate: mk(16, 16, (x, r) => { r('#9a6a3a', 0, 0, 16, 16); r('#6a4422', 0, 0, 16, 1); r('#6a4422', 0, 15, 16, 1); r('#6a4422', 0, 0, 1, 16); r('#6a4422', 15, 0, 1, 16); x.strokeStyle = '#6a4422'; x.beginPath(); x.moveTo(1, 1); x.lineTo(15, 15); x.moveTo(15, 1); x.lineTo(1, 15); x.stroke(); }),
    deckTop: mk(16, 16, (x, r) => { r('#8a929a', 0, 0, 16, 16); r('#b0b8c0', 0, 0, 16, 2); r('#e0b020', 0, 2, 8, 1); r('#222', 8, 2, 8, 1); r('#5a6066', 2, 7, 1, 1); r('#5a6066', 13, 7, 1, 1); r('#5a6066', 2, 13, 1, 1); r('#5a6066', 13, 13, 1, 1); r('#6e767e', 0, 15, 16, 1); }),
    hull: mk(16, 16, (x, r) => { r('#8a2e22', 0, 0, 16, 16); r('#6a2018', 0, 7, 16, 1); r('#a8443a', 0, 0, 16, 1); r('#5a1a12', 3, 3, 1, 1); r('#5a1a12', 12, 11, 1, 1); }),
    water: mk(16, 16, (x, r) => { r('#1f5f8b', 0, 0, 16, 16); r('#5fa8d3', 0, 0, 16, 2); r('#2f78a8', 3, 6, 5, 1); r('#2f78a8', 10, 11, 4, 1); }),
  };

  // ---------- ПРЕДМЕТЫ ----------
  G.SPR.items = {
    health: mk(12, 12, (x, r) => { r('#fff', 1, 1, 10, 10); r('#d22', 5, 2, 2, 8); r('#d22', 2, 5, 8, 2); }),
    mg: mk(14, 10, (x, r) => { r('#333', 0, 3, 14, 3); r('#333', 3, 6, 3, 4); r('#666', 8, 1, 4, 2); r('#ffd23f', 0, 0, 3, 3); }),
    stinger: mk(16, 8, (x, r) => { r('#556b2f', 0, 2, 16, 4); r('#333', 4, 6, 2, 2); r('#c22', 14, 2, 2, 4); }),
    grenades: mk(12, 12, (x, r) => { r('#3d4f2a', 2, 3, 8, 8); r('#999', 4, 0, 4, 3); r('#2a3a1c', 2, 6, 8, 1); }),
    tie: mk(10, 16, (x, r) => { r('#e02020', 3, 0, 4, 3); x.fillStyle = '#e02020'; x.beginPath(); x.moveTo(3, 3); x.lineTo(7, 3); x.lineTo(9, 13); x.lineTo(5, 16); x.lineTo(1, 13); x.fill(); r('#a01010', 4, 4, 1, 9); }),
    radio: mk(12, 14, (x, r) => { r('#3d4f2a', 1, 4, 10, 10); r('#222', 3, 6, 6, 3); r('#6f6', 3, 6, 2, 1); r('#999', 8, 0, 1, 5); r('#ffd23f', 4, 11, 4, 1); }),
    flag: mk(16, 32, (x, r) => { r('#ccc', 1, 0, 2, 32); r('#2b4a8a', 3, 1, 12, 9); r('#fff', 3, 10, 12, 1); r('#c22', 3, 3, 12, 1); r('#c22', 3, 7, 12, 1); }),
  };

  // ---------- ПОРТРЕТЫ 40x40 (вымышленные персонажи) ----------
  function portrait(kind, talk, mood) {
    return mk(40, 40, (x, r) => {
      r('#1a2a3a', 0, 0, 40, 40);
      if (kind === 'president') {
        r(mood === 'rambo' ? '#3a1010' : '#24324a', 0, 0, 40, 40);
        r('#1e2a4a', 6, 30, 28, 10);                 // пиджак
        r('#f4f4f4', 15, 30, 10, 10);                // рубашка
        r('#e02020', 18, 30, 4, 10); r('#b01010', 19, 33, 2, 7); // галстук
        r('#e8b088', 10, 9, 20, 21);                 // лицо
        r('#d49a72', 10, 26, 20, 4);                 // второй подбородок
        r('#cfd3d8', 9, 4, 22, 7); r('#e8ecef', 11, 3, 16, 3); r('#cfd3d8', 8, 8, 3, 8); r('#cfd3d8', 29, 8, 3, 8); // седые волосы
        r('#333', 14, 15, 3, 2); r('#333', 23, 15, 3, 2);   // глаза
        r('#a87050', 13, 13, 5, 1); r('#a87050', 22, 13, 5, 1); // брови
        r('#c88868', 19, 17, 2, 4);                  // нос
        if (talk) { r('#5a1a1a', 16, 23, 8, 4); r('#fff', 17, 23, 6, 1); } else r('#9a5a4a', 16, 24, 8, 2);
        if (mood === 'rambo') {
          r('#e02020', 8, 10, 24, 3); r('#e02020', 31, 11, 5, 2); r('#e02020', 33, 13, 3, 6); r('#b01010', 8, 12, 24, 1);
          r('#333', 13, 14, 5, 1); r('#333', 22, 14, 5, 1);  // нахмуренные брови
        }
        if (mood === 'happy') { r('#e8b088', 14, 15, 3, 1); r('#e8b088', 23, 15, 3, 1); }
      } else if (kind === 'hero') {
        r('#7a8a50', 6, 32, 28, 8); r('#4d5a30', 12, 32, 16, 8);
        r('#e0a878', 11, 10, 18, 22); r('#b88a60', 11, 26, 18, 6);  // щетина
        r('#5b6b3a', 9, 3, 22, 9); r('#47552c', 8, 11, 24, 2);
        r('#222', 14, 17, 4, 2); r('#222', 22, 17, 4, 2);
        r('#c8946a', 19, 19, 2, 4);
        if (talk) r('#5a1a1a', 17, 27, 6, 2); else r('#8a5a40', 17, 27, 6, 1);
      } else if (kind === 'mossad') {
        r('#222', 6, 32, 28, 8); r('#ddd', 18, 32, 4, 3);
        r('#d8a070', 11, 9, 18, 23);
        r('#2a1a10', 10, 4, 20, 8); r('#2a1a10', 10, 10, 2, 8); r('#2a1a10', 28, 10, 2, 8);
        r('#111', 12, 15, 16, 4); r('#444', 13, 15, 5, 1); r('#444', 22, 15, 5, 1); // очки
        r('#c08a5a', 19, 19, 2, 4);
        if (talk) r('#5a1a1a', 16, 26, 8, 2); else r('#8a5a40', 16, 26, 8, 1);
      } else if (kind === 'toll') {
        r('#2a3a1a', 0, 0, 40, 40);
        r('#4d6a3a', 6, 32, 28, 8); r('#d4af37', 12, 34, 3, 3); r('#d4af37', 25, 34, 3, 3);
        r('#c68a5e', 11, 11, 18, 21);
        r('#3f5a2a', 8, 4, 24, 6); r('#2a3a1a', 8, 9, 24, 3); r('#d4af37', 18, 5, 4, 3); // фуражка
        r('#222', 14, 15, 3, 2); r('#222', 23, 15, 3, 2);
        r('#1a1410', 13, 13, 5, 1); r('#1a1410', 22, 13, 5, 1);
        r('#a8704a', 19, 17, 2, 4);
        r('#1a1410', 13, 22, 14, 3); r('#1a1410', 12, 24, 3, 2); r('#1a1410', 25, 24, 3, 2); // усы
        if (talk) r('#5a1a1a', 17, 26, 6, 3); else r('#8a5a40', 17, 27, 6, 1);
      } else {
        r('#2a3a2a', 0, 0, 40, 40);
        r('#4a5a4a', 6, 32, 28, 8);
        r('#d0a070', 12, 10, 16, 22); r('#555', 10, 6, 20, 5);
        r('#333', 8, 12, 4, 8); r('#333', 28, 12, 4, 8); r('#333', 28, 20, 2, 8); r('#333', 22, 27, 8, 2); // гарнитура
        r('#222', 15, 17, 3, 2); r('#222', 22, 17, 3, 2);
        if (talk) r('#5a1a1a', 17, 26, 6, 2); else r('#8a5a40', 17, 26, 6, 1);
      }
      // рамка
      r('#000', 0, 0, 40, 1); r('#000', 0, 39, 40, 1); r('#000', 0, 0, 1, 40); r('#000', 39, 0, 1, 40);
    });
  }
  G.SPR.portrait = {};
  ['president', 'hero', 'mossad', 'hq', 'toll'].forEach(k => {
    ['normal', 'rambo', 'happy'].forEach(m => {
      G.SPR.portrait[k + '_' + m] = [portrait(k, false, m), portrait(k, true, m)];
    });
  });

  // ---------- НАПАРНИКИ (вымышленные) ----------
  // Президент Голд: седой, полный, синий костюм, длинный красный галстук.
  function presidentBody(frame, rambo) {
    return mk(20, 24, (x, r) => {
      const legs = { 0: [[5, 18], [11, 18]], 1: [[4, 18], [12, 17]], 2: [[7, 18], [9, 18]], 3: [[12, 18], [4, 17]], jump: [[5, 17], [11, 16]] }[frame];
      legs.forEach(l => { r('#1e2a4a', l[0], l[1] - 2, 4, 4); r('#111', l[0] - 1, l[1] + 2, 5, 2); });
      r('#1e2a4a', 3, 9, 14, 9);       // пиджак с животом
      r('#24325a', 15, 11, 2, 6);
      r('#f4f4f4', 8, 9, 4, 4);        // рубашка
      r('#e02020', 9, 9, 2, 10);       // длинный галстук
      r('#e8b088', 6, 2, 8, 7);        // лицо
      r('#d49a72', 6, 7, 8, 2);
      r('#333', 11, 4, 1, 1);
      if (rambo) {
        r('#cfd3d8', 5, 0, 10, 2);
        r('#e02020', 5, 2, 10, 2); r('#e02020', 2, 2, 3, 1); r('#e02020', 1, 3, 2, 2);
      } else {
        r('#cfd3d8', 5, 0, 10, 3); r('#e8ecef', 7, 0, 6, 1); r('#cfd3d8', 5, 3, 1, 3);
      }
      r('#1e2a4a', 12, 10, 4, 2);      // рука
      r('#ffd23f', 15, 9, 5, 2); r('#ffd23f', 15, 11, 2, 2); // золотой пистолет
    });
  }
  G.SPR.president = {}; G.SPR.presidentRambo = {};
  [0, 1, 2, 3, 'jump'].forEach(f => { G.SPR.president[f] = presidentBody(f, false); G.SPR.presidentRambo[f] = presidentBody(f, true); });

  // Агент Ави: чёрная футболка, тёмные очки, компактный автомат.
  const MOSSAD = { helmet: '#2a1a10', rim: '#2a1a10', skin: '#d8a070', shirt: '#222', vest: '#333', pants: '#3a3a42', boots: '#111', gun: '#111', beard: null };
  G.SPR.mossad = {};
  frames.forEach(f => {
    const base = soldier(MOSSAD, f, false);
    G.SPR.mossad[f] = mk(18, 20, (x, r) => { x.drawImage(base, 0, 0); const dy = f === 'crouch' ? 5 : 0; r('#111', 7, 5 + dy, 5, 1); });
  });

  // Тепловые силуэты
  G.SPR.hot = {
    irgc: G.tint(G.SPR.irgc[0], '#ffd080'),
    truckHot: G.tint(G.SPR.truckHot, '#ff8a20'),
    truckCold: G.tint(G.SPR.truck, '#3050a0'),
    shahed: G.tint(G.SPR.shahed[0], '#ffffff'),
    turret: G.tint(G.SPR.turret, '#ffd080'),
  };
  G.SPR.flash = {};
  ['irgc'].forEach(k => G.SPR.flash[k] = G.tint(G.SPR[k][0], '#fff'));
})();
