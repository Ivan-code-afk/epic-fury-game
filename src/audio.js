// Звук: синтез в духе 8/16 бит через WebAudio, без файлов
G.Audio = (function () {
  let ctx = null, master = null, muted = false, musicTimer = null, step = 0;

  function unlock() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain();
      master.gain.value = 0.35;
      master.connect(ctx.destination);
    } catch (e) { ctx = null; }
  }

  function tone(freq, dur, type = 'square', vol = 0.3, slide = 0, delay = 0) {
    if (!ctx || muted) return;
    const t = ctx.currentTime + delay;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, freq + slide), t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(master);
    o.start(t); o.stop(t + dur + 0.02);
  }

  function noise(dur, vol = 0.4, lp = 2000) {
    if (!ctx || muted) return;
    const len = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource(); src.buffer = buf;
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = lp;
    const g = ctx.createGain(); g.gain.value = vol;
    src.connect(f); f.connect(g); g.connect(master);
    src.start();
  }

  const sfx = {
    shoot()   { tone(880, 0.06, 'square', 0.12, -500); },
    mg()      { tone(700, 0.04, 'square', 0.10, -400); },
    rocket()  { noise(0.35, 0.25, 900); tone(200, 0.3, 'sawtooth', 0.1, 300); },
    jump()    { tone(300, 0.12, 'square', 0.15, 400); },
    hit()     { tone(160, 0.08, 'square', 0.2, -80); },
    hurt()    { tone(400, 0.25, 'sawtooth', 0.25, -330); },
    explode() { noise(0.6, 0.6, 700); tone(90, 0.5, 'triangle', 0.4, -60); },
    pickup()  { tone(660, 0.07, 'square', 0.2); tone(990, 0.1, 'square', 0.2, 0, 0.07); },
    tick()    { noise(0.012, 0.25, 5000); },
    blip()    { tone(1200, 0.03, 'square', 0.06); },
    alarm()   { tone(880, 0.15, 'square', 0.15); tone(660, 0.15, 'square', 0.15, 0, 0.16); },
    buzz()    { tone(110, 0.25, 'sawtooth', 0.05, 10); },
    win()     { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.18, 'square', 0.2, 0, i * 0.13)); },
    fail()    { [392, 330, 262, 196].forEach((f, i) => tone(f, 0.25, 'triangle', 0.3, 0, i * 0.2)); },
    select()  { tone(523, 0.06, 'square', 0.15); tone(784, 0.08, 'square', 0.15, 0, 0.06); },
  };

  // Простой чиптюн-марш: бас + мелодия
  const bass = [55, 55, 65.4, 55, 73.4, 55, 65.4, 49];
  const lead = [220, 0, 262, 294, 330, 0, 294, 262, 220, 0, 196, 220, 262, 0, 247, 0];
  function startMusic() {
    stopMusic();
    musicTimer = setInterval(() => {
      if (!ctx || muted) return;
      if (step % 2 === 0) tone(bass[(step / 2) % bass.length] * 2, 0.18, 'triangle', 0.22);
      const n = lead[step % lead.length];
      if (n) tone(n * 2, 0.11, 'square', 0.05);
      if (step % 4 === 2) noise(0.04, 0.12, 6000);
      step++;
    }, 140);
  }
  function stopMusic() { if (musicTimer) clearInterval(musicTimer); musicTimer = null; }

  return {
    unlock,
    play(name) { try { sfx[name] && sfx[name](); } catch (e) {} },
    startMusic, stopMusic,
    toggleMute() { muted = !muted; return muted; },
  };
})();
