// One file = all characters. To add one: copy a block, change the values, write its build().
// stats: hp, spd, dmg, crit, xpB (bonus XP: .25 = +25%), skillCd (+ freeze = seconds, for the 'time' skill).
// skill = [name, description, id]. Skill ids handled in game.js: 'dash' (invulnerable dash), 'time' (freezes Shadows), 'rush' (damaging dash).
// theme = interface colors/shapes (CSS variables) + 3D world colors. Applied by applyTheme() in game.js.
// Later: replace build() with a .glb model loader (models/ folder).
const mat = c => new THREE.MeshLambertMaterial({ color: c });
const CHARACTERS = {
  ren: {
    id: 'ren', name: 'REN', title: 'The Phantom Thief', game: 'Persona 5', arcana: 'Fool', startPersona: 'arsene',
    passive: ['Rebel Heart', '15% chance of a critical hit (x2 damage).'],
    skill: ['Phantom Step', 'SHIFT: invulnerable dash (3 s cooldown).', 'dash'],
    stats: { hp: 100, spd: 7, dmg: 1, crit: .15, xpB: 0, skillCd: 3 },
    theme: { accent: '#e60012', bg: '#0a0306', on: '#ffffff', h1c: '#000000', font: 'Impact,"Arial Black",sans-serif', fw: '400', skew: '-10deg', skew2: '-20deg', rot: '-2deg', radius: '0px', ovbg: 'rgba(10,3,6,.82)',
      light: '#ffa0a0', bullet: '#ff3b30', lo: [.1, .02, .08], hi: [.6, .08, .18] },
    build() {
      const g = new THREE.Group();
      const coat = new THREE.Mesh(new THREE.CylinderGeometry(.5, .75, 1.5, 10), mat(0x151515)); coat.position.y = .85;
      const head = new THREE.Mesh(new THREE.SphereGeometry(.4, 12, 10), mat(0xf0d0b0)); head.position.y = 1.9;
      const hair = new THREE.Mesh(new THREE.SphereGeometry(.44, 12, 8, 0, 6.28, 0, 1.6), mat(0x0a0a0a)); hair.position.y = 1.98;
      const mask = new THREE.Mesh(new THREE.BoxGeometry(.6, .4, .1), new THREE.MeshBasicMaterial({ color: 0xffffff })); mask.position.set(0, 1.95, .38);
      const scarf = new THREE.Mesh(new THREE.TorusGeometry(.45, .12, 6, 12), mat(0xe60012)); scarf.rotation.x = Math.PI / 2; scarf.position.y = 1.55;
      const tail = new THREE.Mesh(new THREE.BoxGeometry(.2, .8, .08), mat(0xe60012)); tail.position.set(0, 1.2, -.5); tail.rotation.x = .3;
      const aura = new THREE.Mesh(new THREE.OctahedronGeometry(.6), new THREE.MeshBasicMaterial({ color: 0xe60012, wireframe: true })); aura.position.y = 3.4;
      g.add(coat, head, hair, mask, scarf, tail, aura); g.userData.aura = aura; return g;
    }
  },
  makoto: {
    id: 'makoto', name: 'MAKOTO', title: 'The Dark Hour Wanderer', game: 'Persona 3', arcana: 'Fool', startPersona: 'orpheus',
    passive: ['Calm Resolve', 'Unshaken in the face of death: +25% max HP.'],
    skill: ['Dark Hour', 'SHIFT: freezes every Shadow in time for 2.5 s (12 s cooldown).', 'time'],
    stats: { hp: 125, spd: 6.8, dmg: 1, crit: .05, xpB: 0, skillCd: 12, freeze: 2.5 },
    theme: { accent: '#35d0ff', bg: '#040a1c', on: '#04102a', h1c: '#04102a', font: '"Century Gothic","Trebuchet MS","Segoe UI",sans-serif', fw: '700', skew: '-4deg', skew2: '-8deg', rot: '0deg', radius: '0px', ovbg: 'rgba(4,10,28,.85)',
      light: '#9fd8ff', bullet: '#7fe8ff', lo: [.02, .05, .16], hi: [.08, .42, .72] },
    build() {
      const g = new THREE.Group();
      const coat = new THREE.Mesh(new THREE.CylinderGeometry(.5, .72, 1.5, 10), mat(0x141c3c)); coat.position.y = .85;
      const head = new THREE.Mesh(new THREE.SphereGeometry(.4, 12, 10), mat(0xf0d0b0)); head.position.y = 1.9;
      const hair = new THREE.Mesh(new THREE.SphereGeometry(.45, 12, 8, 0, 6.28, 0, 1.7), mat(0x1b2a5c)); hair.position.y = 1.98;
      const bang = new THREE.Mesh(new THREE.BoxGeometry(.5, .32, .16), mat(0x1b2a5c)); bang.position.set(-.12, 2.05, .34); bang.rotation.z = .35;
      const phones = new THREE.Mesh(new THREE.TorusGeometry(.5, .07, 6, 14), mat(0x9aa5b8)); phones.rotation.x = Math.PI / 2; phones.position.y = 1.58;
      const aura = new THREE.Mesh(new THREE.OctahedronGeometry(.6), new THREE.MeshBasicMaterial({ color: 0x35d0ff, wireframe: true })); aura.position.y = 3.4;
      g.add(coat, head, hair, bang, phones, aura); g.userData.aura = aura; return g;
    }
  },
  yu: {
    id: 'yu', name: 'YU', title: 'The Midnight Investigator', game: 'Persona 4', arcana: 'Fool', startPersona: 'izanagi',
    passive: ['Bond of Friends', 'Gains 25% more XP.'],
    skill: ['Rampage Rush', 'SHIFT: damaging dash that cuts through Shadows (6 s cooldown).', 'rush'],
    stats: { hp: 100, spd: 7.2, dmg: 1, crit: .05, xpB: .25, skillCd: 6 },
    theme: { accent: '#ffd400', bg: '#0d0c08', on: '#000000', h1c: '#000000', font: '"Arial Rounded MT Bold","Trebuchet MS",Arial,sans-serif', fw: '700', skew: '-2deg', skew2: '-4deg', rot: '1deg', radius: '14px', ovbg: 'rgba(13,12,8,.85)',
      light: '#fff0b0', bullet: '#ffd400', lo: [.09, .08, .02], hi: [.65, .52, .08] },
    build() {
      const g = new THREE.Group();
      const coat = new THREE.Mesh(new THREE.CylinderGeometry(.5, .72, 1.5, 10), mat(0x2f333d)); coat.position.y = .85;
      const head = new THREE.Mesh(new THREE.SphereGeometry(.4, 12, 10), mat(0xf0d0b0)); head.position.y = 1.9;
      const hair = new THREE.Mesh(new THREE.SphereGeometry(.45, 12, 8, 0, 6.28, 0, 1.7), mat(0xb9bec9)); hair.position.y = 1.98;
      const fringe = new THREE.Mesh(new THREE.BoxGeometry(.6, .18, .16), mat(0xb9bec9)); fringe.position.set(0, 2.12, .32);
      const gl = new THREE.TorusGeometry(.1, .018, 6, 12), gm = new THREE.MeshBasicMaterial({ color: 0xffd400 });
      const gL = new THREE.Mesh(gl, gm), gR = new THREE.Mesh(gl, gm); gL.position.set(-.15, 1.93, .39); gR.position.set(.15, 1.93, .39);
      const tie = new THREE.Mesh(new THREE.BoxGeometry(.12, .5, .05), mat(0xffd400)); tie.position.set(0, 1.3, .6);
      const aura = new THREE.Mesh(new THREE.OctahedronGeometry(.6), new THREE.MeshBasicMaterial({ color: 0xffd400, wireframe: true })); aura.position.y = 3.4;
      g.add(coat, head, hair, fringe, gL, gR, tie, aura); g.userData.aura = aura; return g;
    }
  }
};
let currentChar = 'ren';
