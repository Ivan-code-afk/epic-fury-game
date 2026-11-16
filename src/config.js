// Глобальные настройки игры. Имена персонажей и тексты меняются здесь.
window.G = window.G || {};

G.CONFIG = {
  title: 'CONQUER IRAN',
  version: '0.9 beta',
  subtitle: 'OPERATION EPIC FURY',
  W: 384,          // внутреннее разрешение
  H: 216,
  TILE: 16,
  GRAVITY: 950,

  // Персонажи. Имена и портреты — вымышленные заглушки, замените на свои.
  cast: {
    president: { name: 'PRESIDENT GOLD', color: '#ffd23f' },
    hero:      { name: 'SGT. STEEL',    color: '#9fe870' },
    mossad:    { name: 'AGENT AVI',     color: '#7ec8ff' },
    hq:        { name: 'CENTCOM HQ',    color: '#cccccc' },
    toll:      { name: 'TOLL COLLECTOR', color: '#d4af37' },
  },

  player: {
    hp: 5, lives: 3, speed: 95, jump: 330, invuln: 1.2,
  },

  weapons: {
    rifle:   { name: 'M4',      rate: 0.16, dmg: 1, speed: 330, spread: 0,    ammo: Infinity },
    mg:      { name: 'M249',    rate: 0.07, dmg: 1, speed: 340, spread: 0.08, ammo: 200 },
    dronegun: { name: 'GUN', rate: 0.12, dmg: 1, speed: 360, spread: 0.03, ammo: Infinity },
    stinger: { name: 'STINGER', rate: 0.55, dmg: 5, speed: 170, spread: 0,    ammo: 12, homing: true },
  },

  tieRage: { duration: 10 }, // «Галстук ярости» — бонус скорострельности

  // Уровни сложности. heat — темп огня врагов, time — множитель таймеров миссий.
  difficulty: {
    easy:   { name: 'EASY',   heat: 0.65, hp: 7, lives: 5, enemyHp: 0.8, time: 1.3 },
    normal: { name: 'NORMAL', heat: 1.0,  hp: 5, lives: 3, enemyHp: 1.0, time: 1.0 },
    hard:   { name: 'HARD',   heat: 1.35, hp: 4, lives: 2, enemyHp: 1.3, time: 0.8 },
  },
};
