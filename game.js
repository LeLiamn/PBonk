const $ = id => document.getElementById(id);
const R = new THREE.WebGLRenderer({ antialias: true });
R.setPixelRatio(Math.min(devicePixelRatio, 2)); R.setSize(innerWidth, innerHeight); document.body.prepend(R.domElement);
const sc = new THREE.Scene(); sc.background = new THREE.Color(0x0a0306); sc.fog = new THREE.Fog(0x0a0306, 25, 70);
const cam = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, .1, 200);
sc.add(new THREE.AmbientLight(0xffffff, .55));
const dl = new THREE.DirectionalLight(0xff9090, .8); dl.position.set(10, 20, 5); sc.add(dl);
const grid = new THREE.GridHelper(200, 50, 0xe60012, 0x4a0a12); sc.add(grid);
const floor = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.MeshBasicMaterial({ color: 0x14060a }));
floor.rotation.x = -Math.PI / 2; floor.position.y = -.02; sc.add(floor);

const orbG = new THREE.Group(); sc.add(orbG);
const orbGeo = new THREE.SphereGeometry(.4, 8, 8), orbMat = new THREE.MeshBasicMaterial({ color: 0xffe14d });
const bGeo = new THREE.SphereGeometry(.28, 8, 8), bMat = new THREE.MeshBasicMaterial({ color: 0xff3b30 }), bMatC = new THREE.MeshBasicMaterial({ color: 0xffffff });
const gGeo = new THREE.OctahedronGeometry(.25), gMat = new THREE.MeshBasicMaterial({ color: 0x4dffd2 });
const eGeo = new THREE.SphereGeometry(.7, 10, 8), eyeGeo = new THREE.BoxGeometry(.18, .08, .05), eyeMat = new THREE.MeshBasicMaterial({ color: 0xffe14d });
// Types d'ennemis (Shadows)
const TY = [{ hp: 3, sp: 3.2, s: 1, c: 0x2a1048, d: 6, x: 1 }, { hp: 2, sp: 5.2, s: .75, c: 0x4a0a12, d: 5, x: 1 }, { hp: 14, sp: 2.2, s: 1.7, c: 0x10102a, d: 12, x: 3 }];
const TM = TY.map(t => new THREE.MeshLambertMaterial({ color: t.c, emissive: t.c }));

let S, E, B, G, P, aura, keys = {}, yaw = 0, run = false, pause = true, py = 0, vy = 0, orbA = 0, last = performance.now(), acc = 0;
let dashT = 0, dashCdT = 0, ld = { x: 0, z: 1 };

function init() {
  [...(E || []), ...(B || []), ...(G || [])].forEach(o => sc.remove(o.m));
  if (P) sc.remove(P);
  const c = CHARACTERS[currentChar];
  P = c.build(); aura = P.userData.aura; sc.add(P);
  S = { ...c.stats, max: c.stats.hp, hp: c.stats.hp, pi: 0, orbs: 0, mag: 3, lvl: 1, xp: 0, need: 5, kills: 0, t: 0, fire: 0 };
  E = []; B = []; G = []; py = 0; vy = 0; dashT = 0; dashCdT = 0; orbG.clear();
}
function spawn() {
  const t = S.t, r = Math.random(), k = t > 110 && r < .12 ? 2 : (t > 40 && r < .35 ? 1 : 0), T = TY[k];
  const a = Math.random() * 6.28, m = new THREE.Mesh(eGeo, TM[k]); m.scale.setScalar(T.s);
  const L = new THREE.Mesh(eyeGeo, eyeMat), Rr = L.clone(); L.position.set(-.25, .15, .62); Rr.position.set(.25, .15, .62); m.add(L, Rr);
  m.position.set(P.position.x + Math.cos(a) * 26, .7 * T.s, P.position.z + Math.sin(a) * 26); sc.add(m);
  E.push({ m, hp: T.hp * (1 + t / 70), sp: T.sp * (1 + t / 400), s: T.s, d: T.d, x: T.x, h: {} });
}
function nearest() {
  let b = null, bd = 900;
  for (const e of E) { const d = (e.m.position.x - P.position.x) ** 2 + (e.m.position.z - P.position.z) ** 2; if (d < bd) { bd = d; b = e; } }
  return b;
}
function shoot() {
  const t = nearest(); if (!t) return; aura.scale.setScalar(1.8);
  const base = Math.atan2(t.m.position.x - P.position.x, t.m.position.z - P.position.z);
  for (let i = 0; i < S.n; i++) {
    const a = base + (i - (S.n - 1) / 2) * .22, crit = Math.random() < S.crit, m = new THREE.Mesh(bGeo, crit ? bMatC : bMat);
    if (crit) m.scale.setScalar(1.5);
    m.position.set(P.position.x, 1.6, P.position.z); sc.add(m);
    B.push({ m, vx: Math.sin(a) * 28, vz: Math.cos(a) * 28, l: 1.4, pi: S.pi, crit, hit: new Set() });
  }
}
function kill(e) {
  sc.remove(e.m); E.splice(E.indexOf(e), 1); S.kills++;
  const m = new THREE.Mesh(gGeo, gMat); m.position.set(e.m.position.x, .5, e.m.position.z); sc.add(m); G.push({ m, x: e.x });
}
function hurt(e, d) { e.hp -= d; e.m.scale.setScalar(e.s * 1.25); if (e.hp <= 0) kill(e); }

function ov(h) {
  const o = $('ov'); o.innerHTML = '<div>' + h + '</div>'; o.classList.remove('off');
  o.querySelectorAll('[data-act]').forEach(b => b.onclick = () => ACT[b.dataset.act]());
}
// Actions des boutons (data-act="...")
const ACT = {
  play: () => charSelect(),
  compendium: () => compendium(),
  options: () => options(),
  start: () => start(),
  resume: () => { $('ov').classList.add('off'); pause = false; last = performance.now(); },
  menu: () => { run = false; pause = true; init(); cam.position.set(0, 11, 13); cam.lookAt(0, 1.5, 0); mainMenu(); }
};
function levelUp() {
  pause = true; const c = CHARACTERS[currentChar];
  const pool = UPGRADES.filter(u => !u.char || c.extraUpgrades.includes(u.id));
  const ch = pool.sort(() => Math.random() - .5).slice(0, 3);
  ov('<h1>LEVEL UP</h1><div class="cards">' + ch.map((u, i) => `<div class="card" data-i="${i}">${u.n}<small>${u.d}</small></div>`).join('') + '</div>');
  document.querySelectorAll('.card').forEach(el => el.onclick = () => { ch[el.dataset.i].f(S); $('ov').classList.add('off'); pause = false; last = performance.now(); });
}
function mainMenu() {
  ov(`<h1>PBONK</h1><div class="menu"><button data-act="play">PLAY</button><button data-act="compendium">COMPENDIUM</button><button data-act="options">OPTIONS</button></div>`);
}
function charSelect() {
  const c = CHARACTERS[currentChar];
  ov(`<h1>${c.name}</h1><div class="sheet"><b>${c.title}</b><br>Arcane : ${c.arcana} · Persona : ${c.persona}<br><b>${c.passive[0]}</b> : ${c.passive[1]}<br><b>${c.skill[0]}</b> : ${c.skill[1]}</div>
  <p>Survis 5 minutes face aux Shadows.<br>ZQSD / WASD : bouger · Espace : sauter · MAJ : dash · Échap : pause<br>Souris (glisser) ou ← → : caméra</p>
  <button data-act="start">TAKE YOUR HEART</button><button data-act="menu">RETOUR</button>`);
}
function compendium() {
  ov(`<h1>COMPENDIUM</h1><p>Ici seront listés les personnages, les Shadows et les Arcanes découverts.</p>
  <div class="sheet"><b>Personnages</b><br>${Object.values(CHARACTERS).map(c => c.name + ' — ' + c.title).join('<br>')}<br><br><b>Shadows</b><br>??? · ??? · ???</div>
  <button data-act="menu">RETOUR</button>`);
}
function options() {
  ov(`<h1>OPTIONS</h1><div class="sheet"><b>Sensibilité de la caméra</b><br><input id="sens" type="range" min="1" max="10" value="${Math.round(sens / .002)}"><br><small>Le volume arrivera avec le son.</small></div><button data-act="menu">RETOUR</button>`);
  $('sens').oninput = e => { sens = e.target.value * .002; try { localStorage.setItem('pbonk_sens', sens); } catch (_) {} };
}
function start() { init(); $('ov').classList.add('off'); pause = false; run = true; last = performance.now(); }
function end(win) {
  pause = true;
  ov(`<h1>${win ? 'ALL-OUT ATTACK !' : 'GAME OVER'}</h1><p>${win ? 'Tu as survécu 5 minutes.' : 'Les Shadows ont gagné.'} Niveau ${S.lvl} · ${S.kills} Shadows vaincues.</p><button data-act="start">RÉESSAYER</button><button data-act="menu">MENU</button>`);
}

addEventListener('keydown', e => {
  keys[e.code] = 1; if (e.code == 'Space') e.preventDefault();
  if (e.code == 'Escape' && run && !pause && $('ov').classList.contains('off')) {
    pause = true; ov('<h1>PAUSE</h1><div class="menu"><button data-act="resume">REPRENDRE</button><button data-act="menu">MENU PRINCIPAL</button></div>');
  }
});
addEventListener('keyup', e => keys[e.code] = 0);
let sens = .006; try { const v = parseFloat(localStorage.getItem('pbonk_sens')); if (v) sens = v; } catch (_) {}
let drag = 0; R.domElement.onpointerdown = e => { drag = e.clientX; };
addEventListener('pointerup', () => drag = 0);
addEventListener('pointermove', e => { if (drag) { yaw -= (e.clientX - drag) * sens; drag = e.clientX; } });
addEventListener('resize', () => { R.setSize(innerWidth, innerHeight); cam.aspect = innerWidth / innerHeight; cam.updateProjectionMatrix(); });

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
    else if (l) { px.x += wx * S.spd * dt; px.z += wz * S.spd * dt; P.rotation.y = Math.atan2(wx, wz); }
    if (keys.Space && py <= 0) vy = 9; vy -= 26 * dt; py = Math.max(0, py + vy * dt); if (py == 0) vy = 0; px.y = py;
    S.fire -= dt; if (S.fire <= 0) { shoot(); S.fire = S.cd; }
    acc += dt * (1.4 + S.t / 35); while (acc > 1 && E.length < 170) { acc--; spawn(); } acc = Math.min(acc, 3);
    aura.rotation.y += dt * 2; aura.scale.lerp(new THREE.Vector3(1, 1, 1), dt * 8);
    orbA += dt * 3; while (orbG.children.length < S.orbs) orbG.add(new THREE.Mesh(orbGeo, orbMat));
    orbG.children.forEach((o, i) => { const a = orbA + i * 6.28 / S.orbs; o.position.set(px.x + Math.cos(a) * 3, 1 + py, px.z + Math.sin(a) * 3); });
    for (const e of [...E]) {
      const p = e.m.position, dx = px.x - p.x, dz = px.z - p.z, d = Math.hypot(dx, dz) || 1;
      p.x += dx / d * e.sp * dt; p.z += dz / d * e.sp * dt; e.m.rotation.y = Math.atan2(dx, dz);
      e.m.scale.lerp(new THREE.Vector3(e.s, e.s, e.s), dt * 10);
      if (d < e.s * .9 + .6 && py < 1.2 && dashT <= 0) S.hp -= e.d * dt;
      if (d > 60) { p.x = px.x - dx / d * 26; p.z = px.z - dz / d * 26; }
      for (let i = 0; i < orbG.children.length; i++) {
        const o = orbG.children[i].position;
        if ((o.x - p.x) ** 2 + (o.z - p.z) ** 2 < (e.s * .7 + .5) ** 2 && !(e.h[i] > S.t - .4)) { e.h[i] = S.t; hurt(e, S.dmg * 1.2); }
      }
    }
    for (const b of [...B]) {
      b.m.position.x += b.vx * dt; b.m.position.z += b.vz * dt; b.l -= dt; let dead = b.l <= 0;
      for (const e of [...E]) {
        if (b.hit.has(e)) continue; const p = e.m.position;
        if ((p.x - b.m.position.x) ** 2 + (p.z - b.m.position.z) ** 2 < (e.s * .7 + .3) ** 2) {
          b.hit.add(e); hurt(e, S.dmg * 1.5 * (b.crit ? 2 : 1)); if (b.pi-- <= 0) { dead = true; break; }
        }
      }
      if (dead) { sc.remove(b.m); B.splice(B.indexOf(b), 1); }
    }
    for (const g of [...G]) {
      const p = g.m.position, dx = px.x - p.x, dz = px.z - p.z, d = Math.hypot(dx, dz); g.m.rotation.y += dt * 4;
      if (d < S.mag) { p.x += dx / d * 14 * dt; p.z += dz / d * 14 * dt; }
      if (d < .9) { sc.remove(g.m); G.splice(G.indexOf(g), 1); S.xp += g.x; if (S.xp >= S.need) { S.xp -= S.need; S.lvl++; S.need = Math.round(S.need * 1.35 + 2); levelUp(); } }
    }
    grid.position.set(Math.round(px.x / 4) * 4, 0, Math.round(px.z / 4) * 4); floor.position.x = px.x; floor.position.z = px.z;
    cam.position.set(px.x + Math.sin(yaw) * 13, 11, px.z + Math.cos(yaw) * 13); cam.lookAt(px.x, 1.5, px.z);
    $('hp').style.width = Math.max(0, S.hp / S.max * 100) + '%';
    document.querySelector('#xp i').style.width = S.xp / S.need * 100 + '%';
    $('time').textContent = Math.floor(S.t / 60) + ':' + String(Math.floor(S.t % 60)).padStart(2, '0');
    $('info').textContent = 'LV ' + S.lvl + ' · ' + S.kills + ' ☠';
    $('dash').textContent = dashCdT <= 0 ? 'MAJ : DASH PRÊT' : 'DASH ' + dashCdT.toFixed(1) + ' s';
    if (S.hp <= 0) end(false); else if (S.t >= 300) end(true);
  }
  R.render(sc, cam);
}
init(); cam.position.set(0, 11, 13); cam.lookAt(0, 1.5, 0); mainMenu(); requestAnimationFrame(loop);
