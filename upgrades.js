// Each upgrade modifies the S object (player stats). "char:true" = only offered to
// characters that list it in extraUpgrades (see characters.js).
const UPGRADES = [
  { id: 'dmg',   n: 'Fool — Agi',        d: 'Damage +25%',               f: S => S.dmg *= 1.25 },
  { id: 'cd',    n: 'Magician — Zio',    d: 'Fire rate +20%',            f: S => S.cd *= .8 },
  { id: 'multi', n: 'Lovers — Maragi',   d: '+1 projectile',             f: S => S.n++ },
  { id: 'spd',   n: 'Chariot — Garu',    d: 'Move speed +15%',           f: S => S.spd *= 1.15 },
  { id: 'hp',    n: 'Empress — Diarama', d: 'Max HP +25 and full heal',  f: S => { S.max += 25; S.hp = S.max; } },
  { id: 'mag',   n: 'Hermit — Sukukaja', d: 'Pickup range x1.6',         f: S => S.mag *= 1.6 },
  { id: 'pierce',n: 'Justice — Pierce',  d: 'Shots pierce +1 enemy',     f: S => S.pi++ },
  { id: 'orbs',  n: 'Star — Orbs',       d: '+1 guardian orb',           f: S => S.orbs++ },
  { id: 'wings', n: 'Sun — Wings',       d: '+1 air jump',               f: S => S.air++ },
  { id: 'crit',  n: 'Fool — Masterstroke', d: 'Crit chance +10%',        f: S => S.crit += .1, char: true },
  { id: 'dashcd',n: 'Fool — Phantom Step+', d: 'Dash cooldown -25%',     f: S => S.dashCd *= .75, char: true }
];
