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
(function () {
  const g = new THREE.PlaneGeometry(300, 300, 150, 150); g.rotateX(-Math.PI / 2);
  const p = g.attributes.position, col = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) {
    const h = gh(p.getX(i), p.getZ(i)); p.setY(i, h);
    const t = Math.max(0, Math.min(1, (h + 10) / 20));
    col[i * 3] = .1 + t * .5; col[i * 3 + 1] = .02 + t * .06; col[i * 3 + 2] = .08 + t * .1;
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.computeVertexNormals();
  sc.add(new THREE.Mesh(g, new THREE.MeshPhongMaterial({ vertexColors: true, flatShading: true, shininess: 0 })));
})();

const orbG = new THREE.Group(); sc.add(orbG);
const orbGeo = new THREE.SphereGeometry(.4, 8, 8), orbMat = new THREE.MeshBasicMaterial({ color: 0xffe14d });
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

let S, E, B, G, P, aura, keys = {}, yaw = 0, run = false, pause = true, py = 0, vy = 0, grounded = true, airLeft = 0, jumpReq = false, orbA = 0, last = performance.now(), acc = 0;
let dashT = 0, dashCdT = 0, ld = { x: 0, z: 1 }, cTab = 'chars';
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

function init() {
  [...(E || []), ...(B || []), ...(G || [])].forEach(o => sc.remove(o.m));
  if (P) sc.remove(P);
  const c = CHARACTERS[currentChar];
  P = c.build(); aura = P.userData.aura; sc.add(P);
  S = { ...c.stats, max: c.stats.hp, hp: c.stats.hp, pi: 0, orbs: 0, air: 0, mag: 3, lvl: 1, xp: 0, need: 5, kills: 0, t: 0, fire: 0 };
  E = []; B = []; G = []; py = 0; vy = 0; grounded = true; airLeft = 0; jumpReq = false; dashT = 0; dashCdT = 0; orbG.clear();
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
function shoot() {
  const t = nearest(); if (!t) return; aura.scale.setScalar(1.8);
  const px = P.position, sy = px.y + 1.6, tx = t.m.position.x - px.x, tz = t.m.position.z - px.z, hd = Math.hypot(tx, tz) || 1;
  const slope = (t.m.position.y - sy) / hd, base = Math.atan2(tx, tz);
  for (let i = 0; i < S.n; i++) {
    const a = base + (i - (S.n - 1) / 2) * .22, crit = Math.random() < S.crit, m = new THREE.Mesh(bGeo, crit ? bMatC : bMat);
    if (crit) m.scale.setScalar(1.5);
    m.position.set(px.x, sy, px.z); sc.add(m);
    B.push({ m, vx: Math.sin(a) * 28, vz: Math.cos(a) * 28, vy: 28 * slope, l: 1.4, pi: S.pi, crit, hit: new Set() });
  }
}
function kill(e) {
  sc.remove(e.m); E.splice(E.indexOf(e), 1); S.kills++;
  const m = new THREE.Mesh(gGeo, gMat); m.position.set(e.m.position.x, gh(e.m.position.x, e.m.position.z) + .5, e.m.position.z); sc.add(m); G.push({ m, x: e.x });
}
function hurt(e, d) { e.hp -= d; e.m.scale.setScalar(e.s * 1.25); if (e.hp <= 0) kill(e); }

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
  ov(`<h1>${c.name}</h1><div class="sheet"><b>${c.title}</b><br>Arcana: ${c.arcana} · Persona: ${c.persona}<br><b>${c.passive[0]}</b>: ${c.passive[1]}<br><b>${c.skill[0]}</b>: ${c.skill[1]}</div>
  <p>Survive 5 minutes against the Shadows.<br>WASD (ZQSD on AZERTY): move · Space: jump · SHIFT: dash · Esc: pause<br>Drag the mouse or ← →: camera</p>
  <button data-act="start">TAKE YOUR HEART</button><button data-act="menu">BACK</button>`);
}
function compendium() {
  const tabs = [['chars', 'Characters'], ['items', 'Items / Personas'], ['enemies', 'Enemies']];
  let body = '';
  if (cTab == 'chars') body = Object.values(CHARACTERS).map(c => `<div class="entry"><b>${c.name}</b> — ${c.title}<br>Arcana: ${c.arcana} · Persona: ${c.persona}<br>${c.passive[0]}: ${c.passive[1]}<br>${c.skill[0]}: ${c.skill[1]}</div>`).join('');
  if (cTab == 'items') body = UPGRADES.map(u => `<div class="entry"><b>${u.n}</b><br>${u.d}${u.char ? ' <i>(character-specific)</i>' : ''}</div>`).join('');
  if (cTab == 'enemies') body = TY.map(t => `<div class="entry"><b>${t.name}</b><br>${t.desc}<br>HP ${t.hp} · Speed ${t.sp} · Damage ${t.d}/s</div>`).join('');
  ov(`<h1>COMPENDIUM</h1><div class="tabs">${tabs.map(t => `<button class="tab${cTab == t[0] ? ' on' : ''}" data-tab="${t[0]}">${t[1]}</button>`).join('')}</div><div class="sheet list">${body}</div><button data-act="menu">BACK</button>`);
  document.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => { cTab = b.dataset.tab; compendium(); });
}
function options() {
  ov(`<h1>OPTIONS</h1><div class="sheet"><b>Camera sensitivity</b><br><input id="sens" type="range" min="1" max="10" value="${Math.round(sens / .002)}"><br><small>Volume will come with sound.</small></div><button data-act="menu">BACK</button>`);
  $('sens').oninput = e => { sens = e.target.value * .002; try { localStorage.setItem('pbonk_sens', sens); } catch (_) {} };
}
function levelUp() {
  pause = true; const c = CHARACTERS[currentChar];
  const pool = UPGRADES.filter(u => !u.char || c.extraUpgrades.includes(u.id));
  const ch = pool.sort(() => Math.random() - .5).slice(0, 3);
  ov('<h1>LEVEL UP</h1><div class="cards">' + ch.map((u, i) => `<div class="card" data-i="${i}">${u.n}<small>${u.d}</small></div>`).join('') + '</div>');
  document.querySelectorAll('.card').forEach(el => el.onclick = () => { ch[el.dataset.i].f(S); $('ov').classList.add('off'); pause = false; last = performance.now(); });
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
let drag = 0; R.domElement.onpointerdown = e => { drag = e.clientX; };
addEventListener('pointerup', () => drag = 0);
addEventListener('pointermove', e => { if (drag) { yaw -= (e.clientX - drag) * sens; drag = e.clientX; } });
addEventListener('resize', () => { R.setSize(innerWidth, innerHeight); cam.aspect = innerWidth / innerHeight; cam.updateProjectionMatrix(); });

// ---------- Main loop ----------
function loop(now) {
  requestAnimationFrame(loop); const dt = Math.min((now - last) / 1000, .05); last = now;
  if (run && !pause) {
    if (keys.ArrowLeft) yaw += dt * 2; if (keys.ArrowRight) yaw -= dt * 2;
    S.t += dt; const px = P.position;
    const mx = (keys.KeyD ? 1 : 0) - (keys.KeyA ? 1 : 0), f = (keys.KeyW ? 1 : 0) - (keys.KeyS ? 1 : 0), c = Math.cos(yaw), s = Math.sin(yaw);
    let wx = c * mx - s * f, wz = -s * mx - c * f; const l = Math.hypot(wx, wz);
    dashCdT -= dt; if (dashT > 0) dashT -= dt;
    if (l) { wx /= l; wz /= l; ld = { x: wx, z: wz }; }
    if ((keys.ShiftLeft || keys.ShiftRight) && dashCdT <= 0) { dashT = .18; dashCdT = S.dashCd; }
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
    S.fire -= dt; if (S.fire <= 0) { shoot(); S.fire = S.cd; }
    acc += dt * (1.4 + S.t / 35); while (acc > 1 && E.length < 170) { acc--; spawn(); } acc = Math.min(acc, 3);
    aura.rotation.y += dt * 2; aura.scale.lerp(new THREE.Vector3(1, 1, 1), dt * 8);
    orbA += dt * 3; while (orbG.children.length < S.orbs) orbG.add(new THREE.Mesh(orbGeo, orbMat));
    orbG.children.forEach((o, i) => { const a = orbA + i * 6.28 / S.orbs; o.position.set(px.x + Math.cos(a) * 3, py + 1, px.z + Math.sin(a) * 3); });
    for (const e of [...E]) {
      const p = e.m.position, dx = px.x - p.x, dz = px.z - p.z, d = Math.hypot(dx, dz) || 1;
      p.x += dx / d * e.sp * dt; p.z += dz / d * e.sp * dt; e.m.rotation.y = Math.atan2(dx, dz);
      if (d > 60) { p.x = px.x - dx / d * 26; p.z = px.z - dz / d * 26; }
      p.y = gh(p.x, p.z) + .7 * e.s;
      e.m.scale.lerp(new THREE.Vector3(e.s, e.s, e.s), dt * 10);
      if (d < e.s * .9 + .6 && py < p.y + .5 * e.s && dashT <= 0) S.hp -= e.d * dt; // jump over them!
      for (let i = 0; i < orbG.children.length; i++) {
        const o = orbG.children[i].position;
        if ((o.x - p.x) ** 2 + (o.y - p.y) ** 2 + (o.z - p.z) ** 2 < (e.s * .7 + .5) ** 2 && !(e.h[i] > S.t - .4)) { e.h[i] = S.t; hurt(e, S.dmg * 1.2); }
      }
    }
    for (const b of [...B]) {
      const q = b.m.position; q.x += b.vx * dt; q.y += b.vy * dt; q.z += b.vz * dt; b.l -= dt; let dead = b.l <= 0 || q.y < gh(q.x, q.z);
      for (const e of [...E]) {
        if (dead) break; if (b.hit.has(e)) continue; const p = e.m.position;
        if ((p.x - q.x) ** 2 + (p.y - q.y) ** 2 + (p.z - q.z) ** 2 < (e.s * .8 + .3) ** 2) {
          b.hit.add(e); hurt(e, S.dmg * 1.5 * (b.crit ? 2 : 1)); if (b.pi-- <= 0) dead = true;
        }
      }
      if (dead) { sc.remove(b.m); B.splice(B.indexOf(b), 1); }
    }
    for (const g of [...G]) {
      const p = g.m.position, dx = px.x - p.x, dz = px.z - p.z, d = Math.hypot(dx, dz); g.m.rotation.y += dt * 4;
      if (d < S.mag) { p.x += dx / d * 14 * dt; p.z += dz / d * 14 * dt; }
      p.y = gh(p.x, p.z) + .5;
      if (d < .9 && Math.abs(py - p.y) < 2.5) { sc.remove(g.m); G.splice(G.indexOf(g), 1); S.xp += g.x; if (S.xp >= S.need) { S.xp -= S.need; S.lvl++; S.need = Math.round(S.need * 1.35 + 2); levelUp(); } }
    }
    const cx = px.x + Math.sin(yaw) * 13, cz = px.z + Math.cos(yaw) * 13;
    cam.position.set(cx, Math.max(py + 11, gh(clamp(cx, -BOUND, BOUND), clamp(cz, -BOUND, BOUND)) + 3), cz); cam.lookAt(px.x, py + 1.5, px.z);
    $('hp').style.width = Math.max(0, S.hp / S.max * 100) + '%';
    document.querySelector('#xp i').style.width = S.xp / S.need * 100 + '%';
    $('time').textContent = Math.floor(S.t / 60) + ':' + String(Math.floor(S.t % 60)).padStart(2, '0');
    $('info').textContent = 'LV ' + S.lvl + ' · ' + S.kills + ' ☠';
    $('dash').textContent = dashCdT <= 0 ? 'SHIFT: DASH READY' : 'DASH ' + dashCdT.toFixed(1) + ' s';
    if (S.hp <= 0) end(false); else if (S.t >= 300) end(true);
  }
  R.render(sc, cam);
}
init(); cam.position.set(0, 11, 13); cam.lookAt(0, 1.5, 0); mainMenu(); requestAnimationFrame(loop);
