// Risky everyday choices: the odds are shown before choosing and a family stat moves them.
import type { AbilityCheck } from '../ability-checks';
import { labels, type Gamble, type Stat } from '../data';
import { mergeEffects, statOf } from '../stats';
import { surpriseRoll } from '../surprises';
import { clamp, log, type State } from './state';

/** Base odds, shifted 0.4 points per stat point away from 50, kept within 10–90%. */
export function gambleChance(s: State, g: Gamble) {
  return Math.max(0.1, Math.min(0.9, g.base + (s.stats[statOf(g.stat)] - 50) * 0.004));
}

export const gambleLabel = (s: State, g: Gamble) =>
  `성공 확률 ${Math.round(gambleChance(s, g) * 100)}% · ${labels[statOf(g.stat)]} ${Math.round(s.stats[statOf(g.stat)])} 반영`;

/** Rolls the gamble, applies the win or loss, and records the real odds for the result screen. */
export function resolveGamble(s: State, g: Gamble, checks: AbilityCheck[]) {
  const chance = gambleChance(s, g);
  const success = surpriseRoll(s, 31) < chance;
  checks.push({
    actor: s.head,
    label: g.label,
    chance,
    success,
    factors: [{ label: labels[statOf(g.stat)], value: s.stats[statOf(g.stat)] }],
  });
  for (const [k, v] of Object.entries(mergeEffects(success ? g.win : g.lose)))
    s.stats[k as Stat] = clamp(s.stats[k as Stat] + v);
  log(s, success ? g.winText : g.loseText, 'gamble');
}
