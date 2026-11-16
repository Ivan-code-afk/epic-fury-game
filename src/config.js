// Глобальные настройки игры. Имена персонажей и тексты меняются здесь.
window.G = window.G || {};

G.CONFIG = {
  title: 'CONQUER IRAN',
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
};
