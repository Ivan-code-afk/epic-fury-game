// Сущности: игрок, напарник, враги, снаряды, предметы, эффекты
(function () {
  const C = G.CONFIG;
  const overlap = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  const cx = e => e.x + e.w / 2, cy = e => e.y + e.h / 2;
  G.overlap = overlap;

  function drawSprite(ctx, img, x, y, flip) {
    x = Math.round(x); y = Math.round(y);
    if (flip) { ctx.save(); ctx.translate(x + img.width, y); ctx.scale(-1, 1); ctx.drawImage(img, 0, 0); ctx.restore(); }
    else ctx.drawImage(img, x, y);
  }
  G.drawSprite = drawSprite;

  // ============ ИГРОК ============
  G.Player = function (x, y) {
    Object.assign(this, {
      kind: 'player', x: x + 3, y: y - 2, w: 10, h: 18, vx: 0, vy: 0, facing: 1,
      onGround: false, coyote: 0, hp: C.player.hp, invuln: 0, weapon: 'rifle',
      ammo: { rifle: Infinity, mg: 0, stinger: 0 }, grenades: 3, fireCd: 0, rage: 0,
      anim: 0, crouch: false, aimUp: false, dead: false, deadT: 0, checkpoint: { x: x, y: y - 2 },
    });
  };
  G.Player.prototype = {
    update(dt, g) {
      const I = G.Input, L = g.level;
      if (this.dead) {
        this.deadT -= dt; this.vy += C.GRAVITY * dt; this.y += this.vy * dt;
        if (this.deadT <= 0) g.respawn();
        return;
      }
      this.invuln = Math.max(0, this.invuln - dt);
      this.rage = Math.max(0, this.rage - dt);
      this.fireCd -= dt;

      this.crouch = I.down('down') && this.onGround;
      this.aimUp = I.down('up');
      this.aimDown = !this.onGround && I.down('down') && !this.aimUp;
      let move = 0;
      if (!this.crouch) { if (I.down('left')) move -= 1; if (I.down('right')) move += 1; }
      if (move) this.facing = move;
      const speed = C.player.speed * (this.rage ? 1.2 : 1);
      this.vx = move * speed;

      if (this.onGround) this.coyote = 0.09; else this.coyote -= dt;
      if (I.pressed('jump')) {
        if (I.down('down') && this.onGround && this.standingOnPlatform(L)) {
          this.dropThrough = 0.25; this.y += 2;
        } else if (this.coyote > 0) {
          this.vy = -C.player.jump; this.coyote = 0; G.Audio.play('jump');
        }
      }
      if (!I.down('jump') && this.vy < -120) this.vy += C.GRAVITY * dt * 1.2; // короткий прыжок
      this.dropThrough = Math.max(0, (this.dropThrough || 0) - dt);

      this.vy = Math.min(this.vy + C.GRAVITY * dt, 520);
      const oldH = this.h;
      this.h = this.crouch ? 13 : 18;
      this.y += oldH - this.h;
      const r = L.move(this, dt);
      this.onGround = r.ground;

      if (move && this.onGround) this.anim += dt * 10; else if (!move) this.anim = 0;

      // Стрельба
      if (I.down('fire') && this.fireCd <= 0) this.shoot(g);
      if (I.pressed('grenade') && this.grenades > 0) {
        this.grenades--;
        g.bullets.push(new G.Grenade(cx(this), this.y + 4, this.facing * 150 + this.vx * 0.4, -220, 'player'));
      }
      // Смерть
      if (L.inWater(this) || this.y > L.pxH + 40) this.die(g);
      if (this.onGround && !L.inWater(this) && this.x > this.checkpoint.x + 160) this.checkpoint = { x: this.x, y: this.y - 4 };
    },
    standingOnPlatform(L) {
      const T = C.TILE;
      return L.at(Math.floor(cx(this) / T), Math.floor((this.y + this.h + 1) / T)) === '=';
    },
    shoot(g) {
      let w = C.weapons[this.weapon];
      if (this.weapon !== 'rifle' && this.ammo[this.weapon] <= 0) { this.weapon = 'rifle'; w = C.weapons.rifle; }
      this.fireCd = w.rate * (this.rage ? 0.4 : 1);
      if (this.weapon !== 'rifle') this.ammo[this.weapon]--;
      let ang = this.aimUp ? -Math.PI / 2 : this.aimDown ? Math.PI / 2 : (this.facing > 0 ? 0 : Math.PI);
      ang += (Math.random() - 0.5) * w.spread * 2;
      const mx = this.aimUp || this.aimDown ? cx(this) + this.facing * 2 : cx(this) + this.facing * 9;
      const my = this.aimUp ? this.y - 4 : this.aimDown ? this.y + this.h + 2 : this.y + (this.crouch ? 5 : 8);
      if (w.homing) {
        g.bullets.push(new G.Rocket(mx, my, ang, 'player'));
        G.Audio.play('rocket');
      } else {
        const b = new G.Bullet(mx, my, Math.cos(ang) * w.speed, Math.sin(ang) * w.speed, 'player', w.dmg);
        if (this.rage) b.color = '#ff4040';
        g.bullets.push(b);
        G.Audio.play(this.weapon === 'mg' ? 'mg' : 'shoot');
        g.particles.push(new G.Particle(mx, my, 0, 0, 0.05, '#fff6a0', 3, 0));
      }
    },
    hurt(g, dmg) {
      if (this.invuln > 0 || this.dead || g.state !== 'play') return;
      this.hp -= dmg; this.invuln = C.player.invuln; G.Audio.play('hurt'); g.shake = 4;
      if (this.hp <= 0) this.die(g);
    },
    die(g) {
      if (this.dead) return;
      this.dead = true; this.deadT = 1.4; this.vy = -200; this.hp = 0;
      G.Audio.play('fail'); g.onPlayerDeath();
    },
    draw(ctx, camX, g) {
      if (this.invuln > 0 && Math.floor(this.invuln * 20) % 2) return;
      const set = this.rage ? G.SPR.rambo : G.SPR.hero;
      let f = this.crouch ? 'crouch' : !this.onGround ? 'jump' : this.vx ? Math.floor(this.anim) % 4 : 0;
      const suffix = this.aimUp && !this.crouch ? '_up' : this.aimDown && f === 'jump' ? '_down' : '';
      const img = set[f + suffix] || set[f];
      const yoff = this.crouch ? this.h - 20 : -2;
      drawSprite(ctx, img, this.x - camX - 4, this.y + yoff, this.facing < 0);
    },
  };

  // ============ НАПАРНИК (ИИ) ============
  // type: 'president' | 'mossad'
  G.Ally = function (type, x, y, barks) {
    Object.assign(this, {
      kind: 'ally', type, x, y: y - 6, w: 12, h: type === 'president' ? 22 : 18, vx: 0, vy: 0, facing: 1,
      onGround: false, fireCd: 1, anim: 0, hits: 0, rambo: 0, barkT: 4, bubble: null, barks: barks || [],
    });
  };
  G.Ally.prototype = {
    update(dt, g) {
      const p = g.player, L = g.level;
      this.fireCd -= dt; this.rambo = Math.max(0, this.rambo - dt);
      if (this.bubble) { this.bubble.t -= dt; if (this.bubble.t <= 0) this.bubble = null; }
      // Реплики
      this.barkT -= dt;
      if (this.barkT <= 0 && this.barks.length) {
        this.say(this.barks[Math.floor(Math.random() * this.barks.length)]);
        this.barkT = 9 + Math.random() * 8;
      }
      // Следование за игроком
      const lead = this.type === 'mossad' ? 34 : -30;     // агент Моссада держится ВПЕРЕДИ
      const tx = p.x + lead * p.facing;
      const dx = tx - this.x;
      const spd = this.type === 'president' ? 80 : 110;
      this.vx = Math.abs(dx) > 10 ? Math.sign(dx) * spd * (this.rambo ? 1.3 : 1) : 0;
      if (this.vx) this.facing = Math.sign(this.vx);
      this.vy = Math.min(this.vy + C.GRAVITY * dt, 520);
      const r = L.move(this, dt);
      if (r.ground) this.onGround = true; else if (this.vy > 30) this.onGround = false;
      if (this.onGround && (r.wall || p.y < this.y - 30) && Math.abs(dx) > 14) { this.vy = -340; this.onGround = false; }
      if (this.vx && this.onGround) this.anim += dt * 9;
      // Отстал или упал — «телепорт» к игроку
      if (Math.abs(p.x - this.x) > 260 || this.y > L.pxH || L.inWater(this)) {
        this.x = p.x - 20 * p.facing; this.y = p.y - 40; this.vy = 0;
        if (this.type === 'mossad') this.say('Already here.');
      }
      // Стрельба по ближайшему врагу
      let best = null, bd = 210;
      for (const e of g.entities) {
        if (!e.enemy || e.dead || e.hidden) continue;
        if (e.kind === 'truck' && !(e.isLauncher && e.marked)) continue; // по мирным не стреляет
        const d = Math.hypot(cx(e) - cx(this), cy(e) - cy(this));
        if (d < bd) { bd = d; best = e; }
      }
      if (best) {
        this.facing = Math.sign(cx(best) - cx(this)) || this.facing;
        if (this.fireCd <= 0) {
          const ang = Math.atan2(cy(best) - (this.y + 10), cx(best) - cx(this));
          const b = new G.Bullet(cx(this) + this.facing * 8, this.y + 10, Math.cos(ang) * 300, Math.sin(ang) * 300, 'player', 1);
          b.color = this.type === 'president' ? '#ffd23f' : '#9ff';
          g.bullets.push(b);
          G.Audio.play('shoot');
          this.fireCd = this.type === 'president' ? (this.rambo ? 0.12 : 0.7) : 0.35;
        }
      }
      // Агент Ави подсвечивает спрятанные пусковые рядом
      if (this.type === 'mossad') {
        for (const e of g.entities) if (e.isLauncher && !e.marked && Math.abs(cx(e) - cx(this)) < 90) {
          e.marked = true; this.say(G.pick(['Target marked.', 'That truck is a launcher.', 'Was here yesterday. It\'s this one.']));
        }
      }
    },
    hit(g) {
      // Напарник бессмертен, но реагирует
      this.hits++;
      if (this.type === 'president' && this.hits % 6 === 0 && !this.rambo) {
        this.rambo = 12;
        this.say('TIE ON THE HEAD! RAMBO MODE!');
        G.Audio.play('alarm');
        g.floatText(cx(this), this.y - 20, 'RAMBO MODE', '#ff4040');
      } else if (Math.random() < 0.25) {
        this.say(this.type === 'president' ? G.pick(['Ow! Not fair!', 'That was a fake bullet!', 'I\'m going to sue!']) : G.pick(['Just a scratch.', 'Beseder.']));
      }
    },
    say(text) { this.bubble = { text, t: 3 }; },
    draw(ctx, camX) {
      let img, f = !this.onGround ? 'jump' : this.vx ? Math.floor(this.anim) % 4 : 0;
      if (this.type === 'president') img = (this.rambo ? G.SPR.presidentRambo : G.SPR.president)[f];
      else img = G.SPR.mossad[f];
      drawSprite(ctx, img, this.x - camX - 4, this.y + this.h - img.height, this.facing < 0);
    },
    drawBubble(ctx, camX) {
      if (!this.bubble) return;
      G.bubble(ctx, cx(this) - camX, this.y - 6, this.bubble.text);
    },
  };

  // ============ ВРАГИ ============
  function Enemy(props) { Object.assign(this, { enemy: true, vx: 0, vy: 0, dead: false, flash: 0 }, props); }
  Enemy.prototype.damage = function (g, dmg) {
    if (this.dead) return;
    this.hp -= dmg; this.flash = 0.08; G.Audio.play('hit');
    if (this.hp <= 0) this.kill(g);
  };
  Enemy.prototype.kill = function (g) {
    this.dead = true; g.score += this.score || 100;
    const s = this.score || 100;
    g.floatText(cx(this), this.y, (s > 0 ? '+' : '') + s, s > 0 ? '#fff' : '#ff6060');
    this.onKill && this.onKill(g);
  };

  // Солдат КСИР
  G.Soldier = function (x, y) {
    Enemy.call(this, { kind: 'soldier', x: x + 3, y: y - 2, w: 10, h: 18, hp: 3, facing: -1, home: x, fireCd: 1 + Math.random(), anim: 0, score: 100, deadT: 0.6 });
  };
  G.Soldier.prototype = Object.create(Enemy.prototype);
  Object.assign(G.Soldier.prototype, {
    update(dt, g) {
      this.flash -= dt;
      if (this.dead) { this.deadT -= dt; this.vy += C.GRAVITY * dt; this.y += this.vy * dt; this.x -= this.facing * 30 * dt; if (this.deadT <= 0) this.remove = true; return; }
      const p = g.player, dx = cx(p) - cx(this), dy = cy(p) - cy(this);
      const sees = Math.abs(dx) < 200 && Math.abs(dy) < 50 && !p.dead;
      if (sees) {
        this.facing = Math.sign(dx) || -1; this.vx = 0;
        this.fireCd -= dt;
        if (this.fireCd <= 0) {
          if (this.rpg) {
            this.fireCd = 2.6 + Math.random();
            g.bullets.push(new G.EnemyRocket(cx(this) + this.facing * 10, this.y + 7, this.facing));
            G.Audio.play('rocket');
          } else {
            this.fireCd = 1.3 + Math.random() * 0.6;
            g.bullets.push(new G.Bullet(cx(this) + this.facing * 9, this.y + 8, this.facing * 140, 0, 'enemy', 1));
          }
        }
      } else {
        this.vx = this.facing * 28;
        if (Math.abs(this.x - this.home) > 48) { this.facing = Math.sign(this.home - this.x); }
      }
      this.vy = Math.min(this.vy + C.GRAVITY * dt, 520);
      const r = g.level.move(this, dt);
      if (r.wall) this.facing *= -1;
      // не падать с обрыва
      const ahead = this.x + (this.facing > 0 ? this.w + 2 : -2);
      if (r.ground && !g.level.solidAt(ahead, this.y + this.h + 4) && g.level.at(Math.floor(ahead / 16), Math.floor((this.y + this.h + 4) / 16)) !== '=') { this.facing *= -1; this.vx = 0; }
      this.anim += Math.abs(this.vx) * dt * 0.3;
    },
    onKill() { this.vy = -150; G.Audio.play('hurt'); },
    draw(ctx, camX, g) {
      const f = this.dead ? 'jump' : this.vx ? Math.floor(this.anim) % 4 : 0;
      let img = (this.rpg ? G.SPR.rpg : G.SPR.irgc)[f];
      if (this.flash > 0) img = G.tintCache(img, '#fff');
      if (g.thermal) img = G.SPR.hot.irgc;
      if (this.dead) ctx.globalAlpha = Math.max(0, this.deadT / 0.6);
      drawSprite(ctx, img, this.x - camX - 4, this.y - 2, this.facing < 0);
      ctx.globalAlpha = 1;
    },
  });

  // Пулемётчик за мешками
  G.Turret = function (x, y) {
    Enemy.call(this, { kind: 'turret', x: x - 3, y: y - 2, w: 22, h: 18, hp: 6, fireCd: 2, burst: 0, score: 200 });
  };
  G.Turret.prototype = Object.create(Enemy.prototype);
  Object.assign(G.Turret.prototype, {
    update(dt, g) {
      this.flash -= dt;
      if (this.dead) { g.explode(cx(this), cy(this), 18, 'none'); this.remove = true; return; }
      const p = g.player;
      if (Math.abs(cx(p) - cx(this)) > 260 || p.dead) return;
      this.facing = Math.sign(cx(p) - cx(this)) || -1;
      this.fireCd -= dt;
      if (this.fireCd <= 0) {
        if (this.burst <= 0) this.burst = 3;
        this.burst--; this.fireCd = this.burst > 0 ? 0.15 : 2.2;
        const ang = Math.atan2(cy(p) - (this.y + 8), cx(p) - cx(this));
        g.bullets.push(new G.Bullet(cx(this), this.y + 8, Math.cos(ang) * 160, Math.sin(ang) * 160, 'enemy', 1));
      }
    },
    draw(ctx, camX, g) {
      let img = g.thermal ? G.SPR.hot.turret : G.SPR.turret;
      if (this.flash > 0) img = G.tintCache(img, '#fff');
      drawSprite(ctx, img, this.x - camX, this.y, this.facing > 0);
    },
  });

  // Дрон «Шахед»
  G.Drone = function (x, y, speed) {
    Enemy.call(this, { kind: 'drone', flying: true, x, y, w: 22, h: 10, hp: 2, baseY: y, t: Math.random() * 6, speed: speed || 60, score: 150, diving: false });
  };
  G.Drone.prototype = Object.create(Enemy.prototype);
  Object.assign(G.Drone.prototype, {
    update(dt, g) {
      this.flash -= dt; this.t += dt;
      if (this.dead) { g.explode(cx(this), cy(this), 16, 'none'); this.remove = true; return; }
      if (this.dormant) { if (Math.abs(cx(g.player) - cx(this)) < 300) this.dormant = false; else return; }
      const target = g.base && !g.base.dead ? g.base : g.player;
      const dx = cx(target) - cx(this);
      if (!this.diving && Math.abs(dx) < 70) this.diving = true;
      if (this.diving) {
        const ang = Math.atan2(cy(target) - cy(this), dx);
        this.x += Math.cos(ang) * this.speed * 1.8 * dt; this.y += Math.sin(ang) * this.speed * 1.8 * dt;
      } else {
        this.x += Math.sign(dx) * this.speed * dt;
        this.y = this.baseY + Math.sin(this.t * 2) * 6;
      }
      if (Math.floor(this.t * 4) !== Math.floor((this.t - dt) * 4) && Math.random() < 0.15) G.Audio.play('buzz');
      if (overlap(this, target)) {
        this.dead = true; this.remove = true;
        g.explode(cx(this), cy(this), 26, 'enemy', 2);
        if (target === g.base) g.base.damage(g, 3);
      }
      if (this.x > 0 && this.x < g.level.pxW - 30 && g.level.solidAt(cx(this), cy(this))) { this.dead = true; this.remove = true; g.explode(cx(this), cy(this), 20, 'enemy', 1); }
    },
    draw(ctx, camX, g) {
      let img = G.SPR.shahed[Math.floor(this.t * 20) % 2];
      if (g.thermal) img = G.SPR.hot.shahed;
      else if (this.flash > 0) img = G.tintCache(img, '#fff');
      const flip = this.diving ? false : (g.base && !g.base.dead ? cx(g.base) : cx(g.player)) > cx(this);
      drawSprite(ctx, img, this.x - camX - 2, this.y - 1, flip);
    },
  });

  // Грузовик: пусковая (isLauncher) или мирный фургон
  G.Truck = function (x, y, isLauncher, variant) {
    Enemy.call(this, {
      kind: 'truck', x: x, y: y - 8, w: 44, h: 24, hp: isLauncher ? 12 : 6, isLauncher, variant: variant || 0,
      score: isLauncher ? 1000 : -300, revealed: false, marked: false, enemy: true, flip: Math.random() < 0.5,
    });
  };
  G.Truck.prototype = Object.create(Enemy.prototype);
  Object.assign(G.Truck.prototype, {
    update(dt, g) {
      this.flash -= dt;
      if (this.dead) {
        g.explode(cx(this), cy(this), this.isLauncher ? 40 : 22, 'none');
        if (!this.isLauncher) {
          for (let i = 0; i < 20; i++) g.particles.push(new G.Particle(cx(this), cy(this), (Math.random() - 0.5) * 220, -Math.random() * 260, 1.2, Math.random() < 0.5 ? '#3a8a2a' : '#e04040', 4, 1));
          g.civilianHit();
        } else g.launcherDestroyed(this);
        this.remove = true;
      }
    },
    draw(ctx, camX, g) {
      let img;
      if (g.thermal) img = this.isLauncher ? G.SPR.hot.truckHot : G.SPR.hot.truckCold;
      else img = [G.SPR.truck, G.SPR.truck2, G.SPR.truck3][this.variant % 3];
      if (this.flash > 0) img = G.tintCache(img, '#fff');
      drawSprite(ctx, img, this.x - camX, this.y, this.flip);
      if (this.marked && !g.thermal) {
        const bx = cx(this) - camX, by = this.y - 10 + Math.sin(g.time * 6) * 2;
        ctx.fillStyle = '#ff3030'; ctx.beginPath(); ctx.moveTo(bx - 5, by - 6); ctx.lineTo(bx + 5, by - 6); ctx.lineTo(bx, by); ctx.fill();
      }
    },
  });

  // База (миссии обороны)
  G.Base = function (x, y, hp) {
    Object.assign(this, { kind: 'base', x: x, y: y - 32, w: 48, h: 48, hp: hp || 20, maxHp: hp || 20, dead: false, flash: 0 });
  };
  G.Base.prototype = {
    update(dt) { this.flash -= dt; },
    damage(g, d) {
      this.hp -= d; this.flash = 0.15; g.shake = 5;
      if (this.hp <= 0 && !this.dead) { this.dead = true; g.explode(cx(this), cy(this), 50, 'none'); g.failMission('The base was destroyed!'); }
    },
    draw(ctx, camX) {
      const x = Math.round(this.x - camX), y = this.y;
      ctx.fillStyle = this.flash > 0 ? '#fff' : '#7d8288'; ctx.fillRect(x, y + 12, 48, 36);
      ctx.fillStyle = '#5d6268'; ctx.fillRect(x - 2, y + 10, 52, 4);
      ctx.fillStyle = '#222'; ctx.fillRect(x + 18, y + 30, 12, 18);
      ctx.fillStyle = '#9ad0f0'; ctx.fillRect(x + 5, y + 20, 8, 6); ctx.fillRect(x + 35, y + 20, 8, 6);
      ctx.fillStyle = '#ccc'; ctx.fillRect(x + 40, y - 14, 2, 26);   // флагшток
      ctx.drawImage(G.SPR.items.flag, 0, 0, 16, 11, x + 42, y - 14, 16, 11);
      // антенна радара
      ctx.strokeStyle = '#aaa'; ctx.beginPath(); ctx.arc(x + 10, y + 8, 6, Math.PI, 0); ctx.stroke();
    },
  };

  // Катер КСИР: ходит по воде между палубами и стреляет
  G.Speedboat = function (x, y) {
    Enemy.call(this, { kind: 'boat', x, y: 0, w: 34, h: 14, hp: 5, facing: -1, fireCd: 1.5, burst: 0, score: 300, t: 0 });
    this.y = G.Speedboat.waterY - 12;
  };
  G.Speedboat.waterY = 11 * 16;
  G.Speedboat.prototype = Object.create(Enemy.prototype);
  Object.assign(G.Speedboat.prototype, {
    update(dt, g) {
      this.flash -= dt; this.t += dt;
      if (this.dead) { g.explode(cx(this), cy(this), 26, 'none'); this.remove = true; return; }
      const L = g.level, nx = this.x + this.facing * 40 * dt;
      const front = this.facing > 0 ? nx + this.w + 2 : nx - 2;
      if (L.solidAt(front, this.y + 10) || front < 0 || front > L.pxW) this.facing *= -1; else this.x = nx;
      this.y = G.Speedboat.waterY - 12 + Math.sin(this.t * 3) * 1.5;
      if (Math.random() < 0.3) g.particles.push(new G.Particle(this.facing > 0 ? this.x : this.x + this.w, this.y + 14, -this.facing * 30, -20, 0.4, '#e8f4ff', 2, 0.5));
      const p = g.player;
      if (p.dead || Math.abs(cx(p) - cx(this)) > 230) return;
      this.fireCd -= dt;
      if (this.fireCd <= 0) {
        if (this.burst <= 0) this.burst = 2;
        this.burst--; this.fireCd = this.burst > 0 ? 0.18 : 1.7;
        const gx = this.facing < 0 ? this.x + 3 : this.x + this.w - 3;
        const ang = Math.atan2(cy(p) - (this.y + 6), cx(p) - gx);
        g.bullets.push(new G.Bullet(gx, this.y + 6, Math.cos(ang) * 150, Math.sin(ang) * 150, 'enemy', 1));
      }
    },
    draw(ctx, camX, g) {
      let img = G.SPR.speedboat;
      if (this.flash > 0) img = G.tintCache(img, '#fff');
      drawSprite(ctx, img, this.x - camX - 1, this.y - 4, this.facing > 0);
    },
  });

  // Морская мина: качается на воде и выпрыгивает
  G.Mine = function (x, y) {
    Enemy.call(this, { kind: 'mine', x: x + 2, y: 0, w: 12, h: 12, hp: 1, vy: 0, jumpT: 1 + Math.random() * 2, score: 50, t: Math.random() * 6 });
    this.surface = G.Speedboat.waterY - 8; this.y = this.surface;
  };
  G.Mine.prototype = Object.create(Enemy.prototype);
  Object.assign(G.Mine.prototype, {
    update(dt, g) {
      this.t += dt;
      if (this.dead) { g.explode(cx(this), cy(this), 26, 'player', 4); this.remove = true; return; }
      if (this.y >= this.surface && this.vy >= 0) {
        this.y = this.surface + Math.sin(this.t * 3) * 1.5; this.vy = 0;
        this.jumpT -= dt;
        if (this.jumpT <= 0 && Math.abs(cx(g.player) - cx(this)) < 160) { this.vy = -300 - Math.random() * 80; this.jumpT = 2 + Math.random() * 1.5; G.Audio.play('jump'); }
      } else { this.vy += C.GRAVITY * 0.8 * dt; this.y += this.vy * dt; }
      if (!g.player.dead && overlap(this, g.player)) {
        this.dead = true; this.remove = true; g.explode(cx(this), cy(this), 22, 'enemy', 2);
      }
    },
    draw(ctx, camX) { ctx.drawImage(G.SPR.mine, Math.round(this.x - camX - 1), Math.round(this.y - 1)); },
  });

  // БОСС: будка сборщика пошлины. Урон проходит, только когда окно открыто.
  G.TollBooth = function (x, y) {
    Enemy.call(this, {
      kind: 'boss', boss: true, x: x - 40, y: y + 16 - 72, w: 56, h: 72, hp: 80, maxHp: 80, active: false,
      open: false, cycleT: 2, billCd: 1.5, droneCd: 6, phase: 0, price: 2, deathT: 0, score: 5000,
    });
  };
  G.TollBooth.prototype = Object.create(Enemy.prototype);
  Object.assign(G.TollBooth.prototype, {
    damage(g, dmg) {
      if (this.dead || !this.active) return;
      if (!this.open) {
        G.Audio.play('hit');
        if (Math.random() < 0.15) g.floatText(cx(this), this.y + 20, 'CLOSED', '#aaa');
        return;
      }
      this.hp -= dmg; this.flash = 0.08; G.Audio.play('hit');
      const phase = Math.floor((1 - this.hp / this.maxHp) * 4);
      if (phase > this.phase && this.hp > 0) { this.phase = phase; g.bossPhase(this, phase); }
      if (this.hp <= 0) { this.dead = true; this.deathT = 2.2; g.score += this.score; }
    },
    update(dt, g) {
      this.flash -= dt;
      const p = g.player;
      if (this.dead) {
        this.deathT -= dt;
        if (Math.random() < 0.2) g.explode(this.x + Math.random() * this.w, this.y + Math.random() * this.h, 20, 'none');
        for (let i = 0; i < 2; i++) g.particles.push(new G.Particle(this.x + Math.random() * this.w, this.y + 20, (Math.random() - 0.5) * 160, -100 - Math.random() * 160, 2, Math.random() < 0.5 ? '#6aa84f' : '#b6d7a8', 3, 0.25));
        if (this.deathT <= 0) { this.remove = true; g.bossDefeated(this); }
        return;
      }
      if (!this.active) {
        if (Math.abs(cx(p) - cx(this)) < 230) { this.active = true; g.bossIntro(this); }
        return;
      }
      // окно открывается и закрывается
      this.cycleT -= dt;
      if (this.cycleT <= 0) { this.open = !this.open; this.cycleT = this.open ? 2.6 : 1.6 - this.phase * 0.2; }
      const rage = 1 + this.phase * 0.3;
      // счета-купюры по дуге
      this.billCd -= dt * rage;
      if (this.billCd <= 0 && !p.dead) {
        this.billCd = 1.4;
        const n = this.phase >= 2 ? 3 : 1;
        for (let i = 0; i < n; i++) {
          const sx = this.x + 14, sy = this.y + 30, t = 0.9 + i * 0.18;
          const b = new G.Bullet(sx, sy, (cx(p) - sx) / t, 0, 'enemy', 1);
          b.grav = 600; b.vy = (cy(p) - sy) / t - 0.5 * b.grav * t; b.bill = true; b.life = 3;
          g.bullets.push(b);
        }
      }
      // вызывает дроны
      this.droneCd -= dt;
      if (this.droneCd <= 0) {
        this.droneCd = Math.max(3.5, 8 - this.phase * 1.5);
        g.entities.push(new G.Drone(this.x + 20, this.y - 10, 55 + this.phase * 8));
      }
    },
    draw(ctx, camX, g) {
      const x = Math.round(this.x - camX), y = Math.round(this.y), fl = this.flash > 0;
      // шлагбаум
      ctx.fillStyle = '#555'; ctx.fillRect(x - 4, y + 44, 6, 28);
      for (let i = 0; i < 10; i++) { ctx.fillStyle = i % 2 ? '#fff' : '#d22'; ctx.fillRect(x - 64 + i * 6, y + 44, 6, 4); }
      // основание и кабина
      ctx.fillStyle = fl ? '#fff' : '#8d9196'; ctx.fillRect(x, y + 52, 56, 20);
      ctx.fillStyle = fl ? '#fff' : '#e8e4d8'; ctx.fillRect(x + 4, y + 16, 48, 38);
      ctx.fillStyle = '#b8b4a8'; ctx.fillRect(x + 4, y + 50, 48, 2);
      for (let i = 0; i < 8; i++) { ctx.fillStyle = i % 2 ? '#fff' : '#d22'; ctx.fillRect(x + i * 7, y + 10, 7, 6); } // крыша
      // вывеска с ценой
      ctx.fillStyle = '#1a2a1a'; ctx.fillRect(x - 6, y - 4, 68, 13);
      G.text(ctx, 'TOLL $' + this.price + ',000,000', x + 28, y - 2, { size: 7, align: 'center', color: '#ffd23f', shadow: false });
      // окно
      const wx = x + 10, wy = y + 22;
      if (this.open || this.dead) {
        ctx.fillStyle = '#2a3a1a'; ctx.fillRect(wx, wy, 26, 22);
        const pt = G.SPR.portrait.toll_normal[Math.floor(g.time * 6) % 2];
        ctx.drawImage(pt, 6, 4, 28, 28, wx + 2, wy + 1, 22, 22);
      } else {
        ctx.fillStyle = '#9aa0a6'; ctx.fillRect(wx, wy, 26, 22);
        for (let i = 0; i < 6; i++) { ctx.fillStyle = '#7a8086'; ctx.fillRect(wx, wy + 2 + i * 4, 26, 1); }
        G.text(ctx, 'CLOSED', wx + 13, wy + 8, { size: 6, align: 'center', color: '#d22', shadow: false });
      }
      ctx.fillStyle = '#444'; ctx.fillRect(wx - 1, wy - 1, 28, 1); ctx.fillRect(wx - 1, wy + 22, 28, 1);
      // касса
      ctx.fillStyle = '#333'; ctx.fillRect(x + 40, y + 34, 10, 10); ctx.fillStyle = '#6f6'; ctx.fillRect(x + 41, y + 35, 8, 3);
    },
  });

  // Открытая пусковая установка (миссия «Остров Ларак»): бронированная, лучше всего — HIMARS
  G.SiteLauncher = function (x, y) {
    Enemy.call(this, { kind: 'launcher', isLauncher: true, x: x - 14, y: y + 16 - 28, w: 44, h: 28, hp: 24, score: 1500, t: Math.random() * 3 });
  };
  G.SiteLauncher.prototype = Object.create(Enemy.prototype);
  Object.assign(G.SiteLauncher.prototype, {
    update(dt, g) {
      this.flash -= dt; this.t += dt;
      if (this.dead) { g.explode(cx(this), cy(this), 42, 'none'); g.launcherDestroyed(this); this.remove = true; return; }
      if (Math.random() < 0.15) g.particles.push(new G.Particle(this.x + 12, this.y + 14, (Math.random() - 0.5) * 10, -25, 1, '#ddd', 3, -0.08));
    },
    draw(ctx, camX) {
      let img = G.SPR.launcher;
      if (this.flash > 0) img = G.tintCache(img, '#fff');
      ctx.drawImage(img, Math.round(this.x - camX), Math.round(this.y));
    },
  });

  // Ракета РПГ (вражеская)
  G.EnemyRocket = function (x, y, dir) {
    Object.assign(this, { x, y, vx: dir * 60, dir, life: 3, owner: 'enemy' });
  };
  G.EnemyRocket.prototype = {
    update(dt, g) {
      this.vx += this.dir * 160 * dt; this.x += this.vx * dt; this.life -= dt;
      if (Math.random() < 0.6) g.particles.push(new G.Particle(this.x - this.dir * 5, this.y, 0, 0, 0.4, '#aaa', 3, -0.1));
      const p = g.player;
      const hitP = !p.dead && overlap({ x: this.x - 3, y: this.y - 2, w: 6, h: 4 }, p);
      if (this.life <= 0 || hitP || g.level.solidAt(this.x, this.y)) { this.remove = true; g.explode(this.x, this.y, 18, 'enemy', 2); }
    },
    draw(ctx, camX) {
      const x = Math.round(this.x - camX), y = Math.round(this.y);
      ctx.fillStyle = '#4a5a2a'; ctx.fillRect(x - 5, y - 1, 8, 3);
      ctx.fillStyle = '#8a3a1a'; ctx.fillRect(this.dir > 0 ? x + 3 : x - 7, y - 2, 4, 5);
      ctx.fillStyle = '#ffb030'; ctx.fillRect(this.dir > 0 ? x - 7 : x + 3, y, 2, 1);
    },
  };

  // Ракета HIMARS: падает с неба на отмеченную точку
  G.HimarsRocket = function (x, delay) {
    Object.assign(this, { x, y: -40, vy: 520, delay: delay || 0, owner: 'player' });
  };
  G.HimarsRocket.prototype = {
    update(dt, g) {
      if (this.delay > 0) { this.delay -= dt; return; }
      this.y += this.vy * dt;
      g.particles.push(new G.Particle(this.x + (Math.random() - 0.5) * 2, this.y - 8, 0, -10, 0.5, '#ccc', 3, -0.05));
      if (this.y > 0 && (g.level.solidAt(this.x, this.y) || this.y > g.level.pxH)) {
        this.remove = true; g.explode(this.x, this.y, 42, 'player', 15); g.shake = 10;
      }
    },
    draw(ctx, camX) {
      if (this.delay > 0) return;
      const x = Math.round(this.x - camX), y = Math.round(this.y);
      ctx.fillStyle = '#e8e8e8'; ctx.fillRect(x - 2, y - 14, 4, 12);
      ctx.fillStyle = '#c22'; ctx.fillRect(x - 2, y - 2, 4, 3);
      ctx.fillStyle = '#ffb030'; ctx.fillRect(x - 1, y - 18, 2, 4);
    },
  };

  // ============ СНАРЯДЫ ============
  G.Bullet = function (x, y, vx, vy, owner, dmg) {
    Object.assign(this, { x, y, vx, vy, owner, dmg, life: 1.4, w: 3, h: 2, color: owner === 'enemy' ? '#ff9a3a' : '#fff6a0' });
  };
  G.Bullet.prototype = {
    update(dt, g) {
      if (this.grav) this.vy += this.grav * dt;
      this.x += this.vx * dt; this.y += this.vy * dt; this.life -= dt;
      if (this.life <= 0) return this.remove = true;
      if (g.level.solidAt(this.x, this.y)) {
        const r = g.level.damageTile(this.x, this.y, this.dmg);
        if (r === 'broken') g.explode(this.x, this.y, 8, 'none');
        g.particles.push(new G.Particle(this.x, this.y, -this.vx * 0.1, -40, 0.2, '#ddd', 2, 1));
        return this.remove = true;
      }
      g.bulletHits(this);
    },
    draw(ctx, camX) {
      if (this.bill) { ctx.drawImage(G.SPR.bill, Math.round(this.x - camX) - 5, Math.round(this.y) - 2); return; }
      ctx.fillStyle = this.color;
      if (Math.abs(this.vy) > Math.abs(this.vx)) ctx.fillRect(Math.round(this.x - camX) - 1, Math.round(this.y) - 2, 2, 4);
      else ctx.fillRect(Math.round(this.x - camX) - 2, Math.round(this.y) - 1, 4, 2);
    },
  };

  G.Rocket = function (x, y, ang, owner) {
    Object.assign(this, { x, y, ang, owner, dmg: C.weapons.stinger.dmg, life: 3, w: 4, h: 4, speed: C.weapons.stinger.speed, rocket: true });
  };
  G.Rocket.prototype = {
    update(dt, g) {
      this.life -= dt;
      // самонаведение на летающие цели
      let best = null, bd = 260;
      for (const e of g.entities) if (e.flying && !e.dead) { const d = Math.hypot(cx(e) - this.x, cy(e) - this.y); if (d < bd) { bd = d; best = e; } }
      if (best) {
        const want = Math.atan2(cy(best) - this.y, cx(best) - this.x);
        let da = want - this.ang; while (da > Math.PI) da -= 2 * Math.PI; while (da < -Math.PI) da += 2 * Math.PI;
        this.ang += Math.max(-4 * dt, Math.min(4 * dt, da));
      }
      this.speed = Math.min(320, this.speed + 300 * dt);
      this.x += Math.cos(this.ang) * this.speed * dt; this.y += Math.sin(this.ang) * this.speed * dt;
      if (Math.random() < 0.7) g.particles.push(new G.Particle(this.x, this.y, 0, 0, 0.4, '#bbb', 3, -0.1));
      if (this.life <= 0 || g.level.solidAt(this.x, this.y)) { this.remove = true; g.explode(this.x, this.y, 20, this.owner, this.dmg); return; }
      for (const e of g.entities) if (e.enemy && !e.dead && !e.hidden && overlap({ x: this.x - 2, y: this.y - 2, w: 4, h: 4 }, e)) {
        this.remove = true; g.explode(this.x, this.y, 20, this.owner, this.dmg); return;
      }
    },
    draw(ctx, camX) {
      ctx.save(); ctx.translate(Math.round(this.x - camX), Math.round(this.y)); ctx.rotate(this.ang);
      ctx.fillStyle = '#ddd'; ctx.fillRect(-5, -1, 8, 3); ctx.fillStyle = '#c22'; ctx.fillRect(3, -1, 2, 3); ctx.fillStyle = '#ffb030'; ctx.fillRect(-7, -1, 2, 3);
      ctx.restore();
    },
  };

  G.Grenade = function (x, y, vx, vy, owner) {
    Object.assign(this, { x, y, vx, vy, owner, life: 1.1, w: 4, h: 4 });
  };
  G.Grenade.prototype = {
    update(dt, g) {
      this.vy += C.GRAVITY * dt; this.life -= dt;
      const nx = this.x + this.vx * dt, ny = this.y + this.vy * dt;
      if (g.level.solidAt(nx, this.y)) this.vx *= -0.4; else this.x = nx;
      if (g.level.solidAt(this.x, ny)) { this.vy *= -0.35; this.vx *= 0.7; } else this.y = ny;
      let hitEnemy = false;
      for (const e of g.entities) if (e.enemy && !e.dead && !e.hidden && overlap({ x: this.x - 2, y: this.y - 2, w: 4, h: 4 }, e)) hitEnemy = true;
      if (this.life <= 0 || hitEnemy) { this.remove = true; g.explode(this.x, this.y, 36, this.owner, 6); }
    },
    draw(ctx, camX) {
      ctx.fillStyle = '#3d4f2a'; ctx.fillRect(Math.round(this.x - camX) - 2, Math.round(this.y) - 2, 4, 4);
      ctx.fillStyle = '#999'; ctx.fillRect(Math.round(this.x - camX) - 1, Math.round(this.y) - 3, 2, 1);
    },
  };

  // ============ ПРЕДМЕТЫ ============
  G.Pickup = function (type, x, y) {
    const img = { H: 'health', M: 'mg', N: 'stinger', G: 'grenades', Y: 'tie', R: 'radio' }[type];
    Object.assign(this, { kind: 'pickup', type, img, x: x + 2, y: y + 2, w: 12, h: 12, t: Math.random() * 6 });
  };
  G.Pickup.prototype = {
    update(dt, g) {
      this.t += dt;
      const p = g.player;
      if (p.dead || !overlap(this, p)) return;
      this.remove = true; G.Audio.play('pickup');
      const msg = {
        H: () => { p.hp = Math.min(C.player.hp, p.hp + 2); return 'MEDKIT'; },
        M: () => { p.weapon = 'mg'; p.ammo.mg += C.weapons.mg.ammo; return 'M249!'; },
        N: () => { p.weapon = 'stinger'; p.ammo.stinger += C.weapons.stinger.ammo; return 'STINGER!'; },
        G: () => { p.grenades += 3; return '+3 GRENADES'; },
        Y: () => { p.rage = C.tieRage.duration; g.presidentBark('rage'); return 'TIE OF FURY!'; },
        R: () => { g.strikes = (g.strikes || 0) + 2; return 'HIMARS +2'; },
      }[this.type]();
      g.floatText(cx(this), this.y - 6, msg, '#ffd23f');
    },
    draw(ctx, camX) {
      const img = G.SPR.items[this.img];
      ctx.drawImage(img, Math.round(this.x - camX + (12 - img.width) / 2), Math.round(this.y + Math.sin(this.t * 4) * 2 + (12 - img.height) / 2));
    },
  };

  G.ExitFlag = function (x, y) { Object.assign(this, { kind: 'exit', x, y: y - 16, w: 16, h: 32 }); };
  G.ExitFlag.prototype = {
    update(dt, g) { if (!g.player.dead && overlap(this, g.player)) g.reachExit(); },
    draw(ctx, camX) { ctx.drawImage(G.SPR.items.flag, Math.round(this.x - camX), this.y); },
  };

  // ============ ЭФФЕКТЫ ============
  G.Particle = function (x, y, vx, vy, life, color, size, grav) {
    Object.assign(this, { x, y, vx, vy, life, max: life, color, size, grav: grav ?? 1 });
  };
  G.Particle.prototype = {
    update(dt) { this.vy += C.GRAVITY * this.grav * dt * 0.5; this.x += this.vx * dt; this.y += this.vy * dt; this.life -= dt; if (this.life <= 0) this.remove = true; },
    draw(ctx, camX) {
      ctx.globalAlpha = Math.max(0, Math.min(1, this.life / this.max * 1.5));
      ctx.fillStyle = this.color;
      const s = this.size;
      ctx.fillRect(Math.round(this.x - camX - s / 2), Math.round(this.y - s / 2), s, s);
      ctx.globalAlpha = 1;
    },
  };

  // Кэш однотонных копий
  const tc = new Map();
  G.tintCache = function (img, col) {
    let m = tc.get(img); if (!m) tc.set(img, m = {});
    return m[col] || (m[col] = G.tint(img, col));
  };
  G.pick = arr => arr[Math.floor(Math.random() * arr.length)];
})();
