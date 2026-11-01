// Chaque upgrade modifie l'objet S (stats du joueur). "char:true" = proposé seulement
// aux persos qui le listent dans extraUpgrades (voir characters.js).
const UPGRADES = [
  { id: 'dmg',   n: 'Fool — Agi',        d: 'Dégâts +25 %',          f: S => S.dmg *= 1.25 },
  { id: 'cd',    n: 'Magician — Zio',    d: 'Cadence +20 %',         f: S => S.cd *= .8 },
  { id: 'multi', n: 'Lovers — Maragi',   d: '+1 projectile',         f: S => S.n++ },
  { id: 'spd',   n: 'Chariot — Garu',    d: 'Vitesse +15 %',         f: S => S.spd *= 1.15 },
  { id: 'hp',    n: 'Empress — Diarama', d: 'PV max +25 et soin',    f: S => { S.max += 25; S.hp = S.max; } },
  { id: 'mag',   n: 'Hermit — Sukukaja', d: 'Aimant x1,6',           f: S => S.mag *= 1.6 },
  { id: 'pierce',n: 'Justice — Perce',   d: 'Les tirs traversent +1 ennemi', f: S => S.pi++ },
  { id: 'orbs',  n: 'Star — Orbes',      d: '+1 orbe protecteur',    f: S => S.orbs++ },
  { id: 'crit',  n: 'Fool — Coup de maître', d: 'Critique +10 %',    f: S => S.crit += .1, char: true },
  { id: 'dashcd',n: 'Fool — Pas fantôme+',   d: 'Recharge du dash -25 %', f: S => S.dashCd *= .75, char: true }
];
