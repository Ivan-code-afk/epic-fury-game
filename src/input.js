// Ввод: клавиатура + сенсорные кнопки
G.Input = (function () {
  const map = {
    ArrowLeft: 'left', KeyA: 'left',
    ArrowRight: 'right', KeyD: 'right',
    ArrowUp: 'up', KeyW: 'up',
    ArrowDown: 'down', KeyS: 'down',
    KeyX: 'jump', KeyK: 'jump', Space: 'jump',
    KeyZ: 'fire', KeyJ: 'fire',
    KeyC: 'grenade', KeyL: 'grenade',
    KeyV: 'special', KeyI: 'special',
    Enter: 'start', KeyP: 'start', Escape: 'back', Backspace: 'back',
    KeyM: 'mute',
  };
  const down = {}, pressed = {};
  let anyPressed = false;

  function set(k, v) {
    if (v && !down[k]) { pressed[k] = true; anyPressed = true; }
    down[k] = v;
  }

  window.addEventListener('keydown', e => {
    const k = map[e.code];
    if (k) { set(k, true); e.preventDefault(); }
    G.Audio && G.Audio.unlock();
  });
  window.addEventListener('keyup', e => {
    const k = map[e.code];
    if (k) { set(k, false); e.preventDefault(); }
  });

  // Сенсорное управление
  const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const touchEl = document.getElementById('touch');
  if (isTouch && touchEl) {
    touchEl.classList.add('on');
    touchEl.querySelectorAll('.tb').forEach(btn => {
      const k = btn.dataset.k;
      const on = e => { e.preventDefault(); set(k, true); btn.classList.add('act'); G.Audio && G.Audio.unlock(); };
      const off = e => { e.preventDefault(); set(k, false); btn.classList.remove('act'); };
      btn.addEventListener('touchstart', on, { passive: false });
      btn.addEventListener('touchend', off, { passive: false });
      btn.addEventListener('touchcancel', off, { passive: false });
    });
  }
  // Подсказка «поверни телефон» (только на сенсорных устройствах)
  const rot = document.getElementById('rotate');
  if (isTouch && rot) { rot.classList.add('on'); rot.addEventListener('click', () => rot.classList.remove('on')); }

  // Тап по экрану = «старт» в меню
  window.addEventListener('pointerdown', e => {
    G.Audio && G.Audio.unlock();
    if (e.target.tagName === 'CANVAS') {
      pressed.tap = true; anyPressed = true;
      const r = e.target.getBoundingClientRect();
      api.tapPos = { x: (e.clientX - r.left) / r.width * G.CONFIG.W, y: (e.clientY - r.top) / r.height * G.CONFIG.H };
    }
  });

  const api = {
    isTouch,
    tapPos: null,
    down: k => !!down[k],
    pressed: k => !!pressed[k],
    any: () => anyPressed,
    endFrame() { for (const k in pressed) delete pressed[k]; anyPressed = false; api.tapPos = null; },
    // для тестов
    _set: set,
  };
  return api;
})();
