// One file = all characters. To add one: copy the "ren" block and change the values.
// Later: replace build() with a .glb model loader (models/ folder).
const CHARACTERS = {
  ren: {
    id: 'ren', name: 'REN', title: 'The Phantom Thief', arcana: 'Fool', startPersona: 'orpheus',
    passive: ['Rebel Heart', '15% chance of a critical hit (x2 damage).'],
    skill: ['Phantom Step', 'SHIFT: invulnerable dash (3 s cooldown).'],
    // Starting stats
    stats: { hp: 100, spd: 7, dmg: 1, crit: 0.15, dashCd: 3 },
    build() {
      const M = c => new THREE.MeshLambertMaterial({ color: c });
      const g = new THREE.Group();
      const coat = new THREE.Mesh(new THREE.CylinderGeometry(.5, .75, 1.5, 10), M(0x151515)); coat.position.y = .85;
      const head = new THREE.Mesh(new THREE.SphereGeometry(.4, 12, 10), M(0xf0d0b0)); head.position.y = 1.9;
      const hair = new THREE.Mesh(new THREE.SphereGeometry(.44, 12, 8, 0, 6.28, 0, 1.6), M(0x0a0a0a)); hair.position.y = 1.98;
      const mask = new THREE.Mesh(new THREE.BoxGeometry(.6, .4, .1), new THREE.MeshBasicMaterial({ color: 0xffffff })); mask.position.set(0, 1.95, .38);
      const scarf = new THREE.Mesh(new THREE.TorusGeometry(.45, .12, 6, 12), M(0xe60012)); scarf.rotation.x = Math.PI / 2; scarf.position.y = 1.55;
      const tail = new THREE.Mesh(new THREE.BoxGeometry(.2, .8, .08), M(0xe60012)); tail.position.set(0, 1.2, -.5); tail.rotation.x = .3;
      const aura = new THREE.Mesh(new THREE.OctahedronGeometry(.6), new THREE.MeshBasicMaterial({ color: 0xe60012, wireframe: true })); aura.position.y = 3.4;
      g.add(coat, head, hair, mask, scarf, tail, aura);
      g.userData.aura = aura;
      return g;
    }
  }
};
let currentChar = 'ren';
