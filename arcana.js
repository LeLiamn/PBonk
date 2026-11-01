// ARCANA = items (passives). Max 3 equipped, each up to level 5.
// per = bonus per level. Keys read by game.js: xp, crit, dmg, regen, hp.
const ARCANA = {
  fool:      { name: 'Fool',      d: 'XP gain +15% and crit chance +3% per level.', per: { xp: .15, crit: .03 } },
  magician:  { name: 'Magician',  d: 'Damage +12% per level.',                      per: { dmg: .12 } },
  priestess: { name: 'Priestess', d: 'Regenerate 0.6 HP/s and +12 max HP per level.', per: { regen: .6, hp: 12 } }
};
