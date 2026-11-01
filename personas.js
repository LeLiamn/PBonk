// PERSONAS = weapons. Max 3 equipped, each up to level 5. lv[] = stats per level, lvDesc[] = text per level.
// The behavior of each Persona lives in game.js (FIRE table), the numbers live here.
const PERSONAS = {
  orpheus: {
    name: 'Orphéus', desc: 'Strikes the nearest Shadow with notes from its lyre.',
    lv: [{ dmg: 1.5, cd: .9, n: 1, pi: 0 }, { dmg: 1.9, cd: .85, n: 1, pi: 0 }, { dmg: 1.9, cd: .8, n: 2, pi: 0 }, { dmg: 2.4, cd: .75, n: 2, pi: 1 }, { dmg: 3, cd: .65, n: 3, pi: 1 }],
    lvDesc: ['Fires 1 note at the nearest Shadow.', 'Damage up.', '+1 note.', 'Notes pierce 1 enemy.', '+1 note and faster fire.']
  },
  arsene: {
    name: 'Arsène', desc: 'The rebel. Unleashes a curse shockwave around you.',
    lv: [{ dmg: 3, cd: 2.2, r: 4.5 }, { dmg: 4, cd: 2.0, r: 5 }, { dmg: 4, cd: 1.7, r: 5.5 }, { dmg: 5.5, cd: 1.6, r: 6.5 }, { dmg: 7, cd: 1.3, r: 7.5 }],
    lvDesc: ['Shockwave every 2.2 s (radius 4.5).', 'Wider radius and more damage.', 'Faster shockwaves.', 'Bigger shockwave, more damage.', 'Huge radius, much faster.']
  },
  izanagi: {
    name: 'Izanagi', desc: 'Calls down lightning on Shadows around you.',
    lv: [{ dmg: 4, cd: 1.8, n: 1 }, { dmg: 5, cd: 1.6, n: 2 }, { dmg: 5, cd: 1.4, n: 2 }, { dmg: 6.5, cd: 1.3, n: 3 }, { dmg: 8, cd: 1.1, n: 4 }],
    lvDesc: ['Lightning strikes 1 Shadow every 1.8 s.', '+1 strike, more damage.', 'Faster strikes.', '+1 strike, more damage.', '+1 strike, much faster.']
  }
};
