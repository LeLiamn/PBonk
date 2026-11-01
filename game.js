const $ = id => document.getElementById(id);
const R = new THREE.WebGLRenderer({ antialias: true });
R.setPixelRatio(Math.min(devicePixelRatio, 2)); R.setSize(innerWidth, innerHeight); document.body.prepend(R.domElement);
const sc = new THREE.Scene(); sc.background = new THREE.Color(0x0a0306); sc.fog = new THREE.Fog(0x0a0306, 30, 85);
const cam = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, .1, 250);
sc.add(new THREE.AmbientLight(0xffffff, .45));
const dl = new THREE.DirectionalLight(0xffa0a0, .95); dl.position.set(30, 40, 12); sc.add(dl);

// ---------- Terrain (verticality) ----------
const BOUND = 140;
function gh(x, z) { // ground height at (x, z)
  const f = Math.min(1, Math.hypot(x, z) / 28); // flat spawn area
  return f * f * (3.4 * Math.sin(x * .045 + 1) * Math.cos(z * .04) + 2.4 * Math.sin(x * .09 + z * .07) + 1.6 * Math.cos(z * .11 - x * .05) + 3 * Math.sin(x * .02) * Math.sin(z * .025));
}
let terrainGeo, terrainH;
(function () {
  const g = new THREE.PlaneGeometry(300, 300, 150, 150); g.rotateX(-Math.PI / 2);
  const p = g.attributes.position; terrainH = new Float32Array(p.count);
  for (let i = 0; i < p.count; i++) { terrainH[i] = gh(p.getX(i), p.getZ(i)); p.setY(i, terrainH[i]); }
  g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(p.count * 3), 3)); g.computeVertexNormals(); terrainGeo = g;
  sc.add(new THREE.Mesh(g, new THREE.MeshPhongMaterial({ vertexColors: true, flatShading: true, shininess: 0 })));
})();
function paintTerrain(lo, hi) {
  const c = terrainGeo.attributes.color;
  for (let i = 0; i < terrainH.length; i++) { const t = Math.max(0, Math.min(1, (terrainH[i] + 10) / 20)); for (let k = 0; k < 3; k++) c.array[i * 3 + k] = lo[k] + (hi[k] - lo[k]) * t; }
  c.needsUpdate = true;
}
// Applies the current character's theme to the UI (CSS variables) and to the 3D world
function applyTheme() {
  const t = CHARACTERS[currentChar].theme, r = document.documentElement.style;
  ['accent', 'bg', 'on', 'h1c', 'font', 'fw', 'skew', 'skew2', 'rot', 'radius', 'ovbg'].forEach(k => r.setProperty('--' + k, t[k]));
  sc.background.set(t.bg); sc.fog.color.set(t.bg); dl.color.set(t.light); bMat.color.set(t.bullet); paintTerrain(t.lo, t.hi);
}


const ringGeo = new THREE.RingGeometry(.9, 1, 40); ringGeo.rotateX(-Math.PI / 2);
const boltGeo = new THREE.CylinderGeometry(.12, .12, 20, 6);
const bGeo = new THREE.SphereGeometry(.28, 8, 8), bMat = new THREE.MeshBasicMaterial({ color: 0xff3b30 }), bMatC = new THREE.MeshBasicMaterial({ color: 0xffffff });
const gGeo = new THREE.OctahedronGeometry(.25), gMat = new THREE.MeshBasicMaterial({ color: 0x4dffd2 });
const eGeo = new THREE.SphereGeometry(.7, 10, 8), eyeGeo = new THREE.BoxGeometry(.18, .08, .05), eyeMat = new THREE.MeshBasicMaterial({ color: 0xffe14d });
// Enemy types (Shadows)
const TY = [
  { name: 'Lesser Shadow', desc: 'The most common Shadow. Slow, but they never stop coming.', hp: 3, sp: 3.2, s: 1, c: 0x2a1048, d: 6, x: 1 },
  { name: 'Swift Shadow', desc: 'Fast and fragile. Appears after 0:40.', hp: 2, sp: 5.2, s: .75, c: 0x4a0a12, d: 5, x: 1 },
  { name: 'Brute Shadow', desc: 'Huge and tough. Appears after 1:50.', hp: 14, sp: 2.2, s: 1.7, c: 0x10102a, d: 12, x: 3 }
];
const TM = TY.map(t => new THREE.MeshLambertMaterial({ color: t.c, emissive: t.c }));

let S, E, B, G, FX = [], P, aura, keys = {}, yaw = 0, run = false, pause = true, py = 0, vy = 0, grounded = true, airLeft = 0, jumpReq = false, last = performance.now(), acc = 0;
let dashT = 0, dashCdT = 0, freezeT = 0, dashId = 0, wasFz = false, pitch = .7, dist = 17, ld = { x: 0, z: 1 }, cTab = 'chars';
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

function init() {
  [...(E || []), ...(B || []), ...(G || []), ...FX].forEach(o => sc.remove(o.m));
  FX = [];
  if (P) sc.remove(P);
  const c = CHARACTERS[currentChar];
  P = c.build(); aura = P.userData.aura; sc.add(P); applyTheme();
  // W = equipped Personas (weapons), A = equipped Arcana (items); max 3 each
  S = { ...c.stats, sk: c.skill[2], base: c.stats.hp, max: c.stats.hp, hp: c.stats.hp, air: 0, mag: 3, lvl: 1, xp: 0, need: 5, kills: 0, t: 0, W: [{ id: c.startPersona, l: 1, t: 0 }], A: [] };
  E = []; B = []; G = []; py = 0; vy = 0; grounded = true; airLeft = 0; jumpReq = false; dashT = 0; dashCdT = 0; freezeT = 0; wasFz = false;
  updateSlots();
}
function spawn() {
  const t = S.t, r = Math.random(), k = t > 110 && r < .12 ? 2 : (t > 40 && r < .35 ? 1 : 0), T = TY[k];
  const a = Math.random() * 6.28, m = new THREE.Mesh(eGeo, TM[k]); m.scale.setScalar(T.s);
  const L = new THREE.Mesh(eyeGeo, eyeMat), Rr = L.clone(); L.position.set(-.25, .15, .62); Rr.position.set(.25, .15, .62); m.add(L, Rr);
  const x = clamp(P.position.x + Math.cos(a) * 26, -BOUND - 5, BOUND + 5), z = clamp(P.position.z + Math.sin(a) * 26, -BOUND - 5, BOUND + 5);
  m.position.set(x, gh(x, z) + .7 * T.s, z); sc.add(m);
  E.push({ m, hp: T.hp * (1 + t / 70), sp: T.sp * (1 + t / 400), s: T.s, d: T.d, x: T.x, h: {} });
}
function nearest() {
  let b = null, bd = 900;
  for (const e of E) { const d = (e.m.position.x - P.position.x) ** 2 + (e.m.position.z - P.position.z) ** 2; if (d < bd) { bd = d; b = e; } }
  return b;
}
function kill(e) {
  sc.remove(e.m); E.splice(E.indexOf(e), 1); S.kills++;
  const m = new THREE.Mesh(gGeo, gMat); m.position.set(e.m.position.x, gh(e.m.position.x, e.m.position.z) + .5, e.m.position.z); sc.add(m); G.push({ m, x: e.x });
}
function hurt(e, d) { e.hp -= d; e.m.scale.setScalar(e.s * 1.25); if (e.hp <= 0) kill(e); }

// ---------- Personas (weapons) & Arcana (items) ----------
const mod = k => S.A.reduce((s, a) => s + (ARCANA[a.id].per[k] || 0) * a.l, 0); // total Arcana bonus for a stat
function roll(base) { const c = Math.random() < S.crit + mod('crit'); return base * S.dmg * (1 + mod('dmg')) * (c ? 2 : 1); }
function applyItems() { const m = S.base + mod('hp'), d = m - S.max; S.max = m; if (d > 0) S.hp += d; }
function addFx(m, life, r) { sc.add(m); FX.push({ m, t: 0, life, r }); }
// Behavior of each Persona (numbers are in personas.js)
const FIRE = {
  orpheus(st) { // soul notes at the nearest Shadow (aims in 3D)
    const t = nearest(); if (!t) return; aura.scale.setScalar(1.8);
    const px = P.position, sy = px.y + 1.6, tx = t.m.position.x - px.x, tz = t.m.position.z - px.z, hd = Math.hypot(tx, tz) || 1;
    const slope = (t.m.position.y - sy) / hd, base = Math.atan2(tx, tz);
    for (let i = 0; i < st.n; i++) {
      const a = base + (i - (st.n - 1) / 2) * .22, crit = Math.random() < S.crit + mod('crit'), m = new THREE.Mesh(bGeo, crit ? bMatC : bMat);
      if (crit) m.scale.setScalar(1.5);
      m.position.set(px.x, sy, px.z); sc.add(m);
      B.push({ m, vx: Math.sin(a) * 28, vz: Math.cos(a) * 28, vy: 28 * slope, l: 1.4, pi: st.pi, dmg: st.dmg * S.dmg * (1 + mod('dmg')) * (crit ? 2 : 1), hit: new Set() });
    }
  },
  arsene(st) { // curse shockwave around the player
    const px = P.position; aura.scale.setScalar(1.8);
    for (const e of [...E]) { const p = e.m.position; if ((p.x - px.x) ** 2 + (p.z - px.z) ** 2 < (st.r + e.s * .7) ** 2 && Math.abs(p.y - px.y) < 4) hurt(e, roll(st.dmg)); }
    const m = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: CHARACTERS[currentChar].theme.accent, transparent: true, side: THREE.DoubleSide }));
    m.position.set(px.x, px.y + .3, px.z); addFx(m, .35, st.r);
  },
  izanagi(st) { // lightning on random Shadows nearby
    const px = P.position; aura.scale.setScalar(1.8);
    const c = E.filter(e => (e.m.position.x - px.x) ** 2 + (e.m.position.z - px.z) ** 2 < 576).sort(() => Math.random() - .5).slice(0, st.n);
    for (const e of c) {
      const p = e.m.position, m = new THREE.Mesh(boltGeo, new THREE.MeshBasicMaterial({ color: 0xfff27a, transparent: true }));
      m.position.set(p.x, p.y + 10, p.z); addFx(m, .2, 0); hurt(e, roll(st.dmg));
    }
  }
};
function updateSlots() {
  const row = (label, list, data, cls) => label + ' ' + [0, 1, 2].map(i => list[i] ? `<span class="pill ${cls}">${data[list[i].id].name} ${list[i].l}</span>` : '<span class="pill empty">—</span>').join('');
  $('slots').innerHTML = row('PERSONAS', S.W, PERSONAS, 'p') + '<br>' + row('ARCANA &nbsp;&nbsp;&nbsp;', S.A, ARCANA, '');
}

// ---------- Screens ----------
function ov(h) {
  const o = $('ov'); o.innerHTML = '<div>' + h + '</div>'; o.classList.remove('off');
  o.querySelectorAll('[data-act]').forEach(b => b.onclick = () => ACT[b.dataset.act]());
}
const ACT = {
  play: () => charSelect(),
  compendium: () => compendium(),
  options: () => options(),
  start: () => start(),
  resume: () => { $('ov').classList.add('off'); pause = false; last = performance.now(); },
  menu: () => { run = false; pause = true; init(); cam.position.set(0, 11, 13); cam.lookAt(0, 1.5, 0); mainMenu(); }
};
function mainMenu() {
  ov(`<h1>PBONK</h1><div class="menu"><button data-act="play">PLAY</button><button data-act="compendium">COMPENDIUM</button><button data-act="options">OPTIONS</button></div>`);
}
function charSelect() {
  const c = CHARACTERS[currentChar];
  ov(`<h1>${c.name}</h1><div class="tabs">${Object.values(CHARACTERS).map(x => `<button class="tab${x.id == currentChar ? ' on' : ''}" data-char="${x.id}">${x.name}</button>`).join('')}</div>
  <div class="sheet"><b>${c.title}</b> · ${c.game}<br>Arcana: ${c.arcana} · Starting Persona: ${PERSONAS[c.startPersona].name}<br><b>${c.passive[0]}</b>: ${c.passive[1]}<br><b>${c.skill[0]}</b>: ${c.skill[1]}</div>
  <p>Survive 5 minutes against the Shadows. Equip up to 3 Personas (weapons) and 3 Arcana (items).<br>WASD (ZQSD on AZERTY): move · Space: jump · SHIFT: skill · Esc: pause<br>Drag the mouse (or arrow keys): rotate the camera · Wheel: zoom</p>
  <button data-act="start">TAKE YOUR HEART</button><button data-act="menu">BACK</button>`);
  document.querySelectorAll('[data-char]').forEach(b => b.onclick = () => { currentChar = b.dataset.char; applyTheme(); charSelect(); });
}
function compendium() {
  const tabs = [['chars', 'Characters'], ['items', 'Personas / Arcana'], ['enemies', 'Enemies']];
  let body = '';
  if (cTab == 'chars') body = Object.values(CHARACTERS).map(c => `<div class="entry"><b>${c.name}</b> — ${c.title} <i>(${c.game})</i><br>Arcana: ${c.arcana} · Starting Persona: ${PERSONAS[c.startPersona].name}<br>${c.passive[0]}: ${c.passive[1]}<br>${c.skill[0]}: ${c.skill[1]}</div>`).join('');
  if (cTab == 'items') {
    const lv = d => d.map((x, i) => `Lv ${i + 1}: ${x}`).join('<br>');
    body = '<b>PERSONAS (weapons)</b>' + Object.values(PERSONAS).map(p => `<div class="entry"><b>${p.name}</b><br>${p.desc}<br><small>${lv(p.lvDesc)}</small></div>`).join('')
      + '<br><b>ARCANA (items)</b>' + Object.values(ARCANA).map(a => `<div class="entry"><b>${a.name}</b><br>${a.d}</div>`).join('');
  }
  if (cTab == 'enemies') body = TY.map(t => `<div class="entry"><b>${t.name}</b><br>${t.desc}<br>HP ${t.hp} · Speed ${t.sp} · Damage ${t.d}/s</div>`).join('');
  ov(`<h1>COMPENDIUM</h1><div class="tabs">${tabs.map(t => `<button class="tab${cTab == t[0] ? ' on' : ''}" data-tab="${t[0]}">${t[1]}</button>`).join('')}</div><div class="sheet list">${body}</div><button data-act="menu">BACK</button>`);
  document.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => { cTab = b.dataset.tab; compendium(); });
}
function options() {
  ov(`<h1>OPTIONS</h1><div class="sheet"><b>Camera sensitivity</b><br><input id="sens" type="range" min="1" max="10" value="${Math.round(sens / .002)}"><br><small>Volume will come with sound.</small></div><button data-act="menu">BACK</button>`);
  $('sens').oninput = e => { sens = e.target.value * .002; try { localStorage.setItem('pbonk_sens', sens); } catch (_) {} };
}
function levelUp() {
  // Choices: level up an equipped item, or take a new one if a slot is free
  const o = [], add = (list, data, t) => Object.keys(data).forEach(id => {
    const x = list.find(y => y.id == id);
    if (x) { if (x.l < 5) o.push({ t, id, l: x.l + 1 }); } else if (list.length < 3) o.push({ t, id, l: 1 });
  });
  add(S.W, PERSONAS, 'W'); add(S.A, ARCANA, 'A');
  if (!o.length) { S.hp = Math.min(S.max, S.hp + S.max * .3); return; } // everything maxed: heal instead
  pause = true;
  const ch = o.sort(() => Math.random() - .5).slice(0, 3);
  const info = x => x.t == 'W' ? [PERSONAS[x.id].name, PERSONAS[x.id].lvDesc[x.l - 1], 'PERSONA'] : [ARCANA[x.id].name, ARCANA[x.id].d, 'ARCANA'];
  ov('<h1>LEVEL UP</h1><div class="cards">' + ch.map((x, i) => { const [n, d, tag] = info(x); return `<div class="card" data-i="${i}"><span class="tag">${tag} · ${x.l == 1 ? 'NEW' : 'Lv ' + (x.l - 1) + ' → ' + x.l}</span>${n}<small>${d}</small></div>`; }).join('') + '</div>');
  document.querySelectorAll('.card').forEach(el => el.onclick = () => {
    const x = ch[el.dataset.i], list = x.t == 'W' ? S.W : S.A, y = list.find(z => z.id == x.id);
    if (y) y.l = x.l; else list.push({ id: x.id, l: 1, t: 0 });
    applyItems(); updateSlots(); $('ov').classList.add('off'); pause = false; last = performance.now();
  });
}
function start() { init(); $('ov').classList.add('off'); pause = false; run = true; last = performance.now(); }
function end(win) {
  pause = true;
  ov(`<h1>${win ? 'ALL-OUT ATTACK!' : 'GAME OVER'}</h1><p>${win ? 'You survived 5 minutes.' : 'The Shadows won.'} Level ${S.lvl} · ${S.kills} Shadows defeated.</p><button data-act="start">RETRY</button><button data-act="menu">MENU</button>`);
}

// ---------- Input ----------
addEventListener('keydown', e => {
  keys[e.code] = 1; if (e.code == 'Space') { e.preventDefault(); if (!e.repeat) jumpReq = true; }
  if (e.code == 'Escape' && run && !pause && $('ov').classList.contains('off')) {
    pause = true; ov('<h1>PAUSE</h1><div class="menu"><button data-act="resume">RESUME</button><button data-act="menu">MAIN MENU</button></div>');
  }
});
addEventListener('keyup', e => keys[e.code] = 0);
let sens = .006; try { const v = parseFloat(localStorage.getItem('pbonk_sens')); if (v) sens = v; } catch (_) {}
let drag = null; R.domElement.onpointerdown = e => { drag = { x: e.clientX, y: e.clientY }; };
addEventListener('pointerup', () => drag = null);
addEventListener('pointermove', e => { if (drag) { yaw -= (e.clientX - drag.x) * sens; pitch = clamp(pitch + (e.clientY - drag.y) * sens, .12, 1.45); drag.x = e.clientX; drag.y = e.clientY; } });
addEventListener('wheel', e => { if (run && !pause) dist = clamp(dist + e.deltaY * .01, 7, 28); });
addEventListener('resize', () => { R.setSize(innerWidth, innerHeight); cam.aspect = innerWidth / innerHeight; cam.updateProjectionMatrix(); });

// ---------- Main loop ----------
function loop(now) {
  requestAnimationFrame(loop); const dt = Math.min((now - last) / 1000, .05); last = now;
  if (run && !pause) {
    if (keys.ArrowLeft) yaw += dt * 2; if (keys.ArrowRight) yaw -= dt * 2;
    if (keys.ArrowUp) pitch = clamp(pitch - dt * 1.5, .12, 1.45); if (keys.ArrowDown) pitch = clamp(pitch + dt * 1.5, .12, 1.45);
    S.t += dt; const px = P.position;
    const mx = (keys.KeyD ? 1 : 0) - (keys.KeyA ? 1 : 0), f = (keys.KeyW ? 1 : 0) - (keys.KeyS ? 1 : 0), c = Math.cos(yaw), s = Math.sin(yaw);
    let wx = c * mx - s * f, wz = -s * mx - c * f; const l = Math.hypot(wx, wz);
    dashCdT -= dt; if (dashT > 0) dashT -= dt; if (freezeT > 0) freezeT -= dt;
    if (l) { wx /= l; wz /= l; ld = { x: wx, z: wz }; }
    if ((keys.ShiftLeft || keys.ShiftRight) && dashCdT <= 0) { // character skill
      dashCdT = S.skillCd;
      if (S.sk == 'time') freezeT = S.freeze; else { dashT = S.sk == 'rush' ? .25 : .18; dashId++; }
    }
    if (dashT > 0) { px.x += ld.x * S.spd * 3.4 * dt; px.z += ld.z * S.spd * 3.4 * dt; P.rotation.y = Math.atan2(ld.x, ld.z); }
    else if (l) { // slower uphill, faster downhill
      const slope = (gh(px.x + wx * .6, px.z + wz * .6) - gh(px.x, px.z)) / .6, sp = S.spd * clamp(1 - slope * .5, .5, 1.6);
      px.x += wx * sp * dt; px.z += wz * sp * dt; P.rotation.y = Math.atan2(wx, wz);
    }
    px.x = clamp(px.x, -BOUND, BOUND); px.z = clamp(px.z, -BOUND, BOUND);
    // Jump + gravity + terrain
    if (jumpReq) { if (grounded) { vy = 11; grounded = false; } else if (airLeft > 0) { airLeft--; vy = 10; } }
    jumpReq = false; vy -= 26 * dt; py += vy * dt;
    const gy = gh(px.x, px.z);
    if (py <= gy || (grounded && vy <= 0 && py - gy < .5)) { py = gy; vy = 0; if (!grounded) airLeft = S.air; grounded = true; } else grounded = false;
    px.y = py;
    // Regen (Priestess) + Personas
    S.hp = Math.min(S.max, S.hp + mod('regen') * dt);
    for (const w of S.W) { w.t -= dt; if (w.t <= 0) { const st = PERSONAS[w.id].lv[w.l - 1]; FIRE[w.id](st); w.t = st.cd; } }
    for (const fx of [...FX]) {
      fx.t += dt; const k = Math.min(1, fx.t / fx.life); if (fx.r) fx.m.scale.setScalar(fx.r * k); fx.m.material.opacity = 1 - k;
      if (k >= 1) { sc.remove(fx.m); fx.m.material.dispose(); FX.splice(FX.indexOf(fx), 1); }
    }
    acc += dt * (1.4 + S.t / 35); while (acc > 1 && E.length < 170) { acc--; spawn(); } acc = Math.min(acc, 3);
    aura.rotation.y += dt * 2; aura.scale.lerp(new THREE.Vector3(1, 1, 1), dt * 8);
    const fz = freezeT > 0; if (fz != wasFz) { wasFz = fz; TM.forEach((m, i) => { m.color.set(fz ? 0x9fdcff : TY[i].c); m.emissive.set(fz ? 0x3a8cff : TY[i].c); }); }
    for (const e of [...E]) {
      const p = e.m.position, dx = px.x - p.x, dz = px.z - p.z, d = Math.hypot(dx, dz) || 1;
      if (!fz) { p.x += dx / d * e.sp * dt; p.z += dz / d * e.sp * dt; e.m.rotation.y = Math.atan2(dx, dz); }
      if (d > 60) { p.x = px.x - dx / d * 26; p.z = px.z - dz / d * 26; }
      p.y = gh(p.x, p.z) + .7 * e.s;
      e.m.scale.lerp(new THREE.Vector3(e.s, e.s, e.s), dt * 10);
      if (!fz && d < e.s * .9 + .6 && py < p.y + .5 * e.s && dashT <= 0) S.hp -= e.d * dt; // jump over them!
      if (S.sk == 'rush' && dashT > 0 && e.dh != dashId && d < 2.2) { e.dh = dashId; hurt(e, roll(4)); }
    }
    for (const b of [...B]) {
      const q = b.m.position; q.x += b.vx * dt; q.y += b.vy * dt; q.z += b.vz * dt; b.l -= dt; let dead = b.l <= 0 || q.y < gh(q.x, q.z);
      for (const e of [...E]) {
        if (dead) break; if (b.hit.has(e)) continue; const p = e.m.position;
        if ((p.x - q.x) ** 2 + (p.y - q.y) ** 2 + (p.z - q.z) ** 2 < (e.s * .8 + .3) ** 2) {
          b.hit.add(e); hurt(e, b.dmg); if (b.pi-- <= 0) dead = true;
        }
      }
      if (dead) { sc.remove(b.m); B.splice(B.indexOf(b), 1); }
    }
    for (const g of [...G]) {
      const p = g.m.position, dx = px.x - p.x, dz = px.z - p.z, d = Math.hypot(dx, dz); g.m.rotation.y += dt * 4;
      if (d < S.mag) { p.x += dx / d * 14 * dt; p.z += dz / d * 14 * dt; }
      p.y = gh(p.x, p.z) + .5;
      if (d < .9 && Math.abs(py - p.y) < 2.5) { sc.remove(g.m); G.splice(G.indexOf(g), 1); S.xp += g.x * (1 + mod('xp') + S.xpB); if (S.xp >= S.need) { S.xp -= S.need; S.lvl++; S.need = Math.round(S.need * 1.35 + 2); levelUp(); } }
    }
    // Orbit camera: yaw (left/right), pitch (up/down), dist (zoom)
    const cp = Math.cos(pitch), cx = px.x + Math.sin(yaw) * cp * dist, cz = px.z + Math.cos(yaw) * cp * dist;
    cam.position.set(cx, Math.max(py + 1.5 + Math.sin(pitch) * dist, gh(clamp(cx, -BOUND, BOUND), clamp(cz, -BOUND, BOUND)) + 1.5), cz); cam.lookAt(px.x, py + 1.5, px.z);
    $('hp').style.width = Math.max(0, S.hp / S.max * 100) + '%';
    document.querySelector('#xp i').style.width = S.xp / S.need * 100 + '%';
    $('time').textContent = Math.floor(S.t / 60) + ':' + String(Math.floor(S.t % 60)).padStart(2, '0');
    $('info').textContent = 'LV ' + S.lvl + ' · ' + S.kills + ' ☠';
    { const sn = CHARACTERS[currentChar].skill[0].toUpperCase(); $('dash').textContent = dashCdT <= 0 ? 'SHIFT: ' + sn + ' READY' : sn + ' ' + dashCdT.toFixed(1) + ' s'; }
    if (S.hp <= 0) end(false); else if (S.t >= 300) end(true);
  }
  R.render(sc, cam);
}
init(); cam.position.set(0, 11, 13); cam.lookAt(0, 1.5, 0); mainMenu(); requestAnimationFrame(loop);
