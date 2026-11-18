/* ============================================================
   MYSTERY OF THE LOST DIMENSIONS — AchievementManager data
   ============================================================ */

export interface AchievementDef {
  id: string;
  name: string;
  desc: string;
  icon: string; // lucide icon key handled by UI
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'first_steps',    name: 'First Steps',        desc: 'Complete the first trial of the Ancient Temple.',            icon: 'Footprints' },
  { id: 'temple_master',  name: 'Awakened Guardian',  desc: 'Conquer all 10 levels of the Ancient Temple.',               icon: 'Landmark' },
  { id: 'crystal_master', name: 'Prismatic Adept',    desc: 'Conquer all 10 levels of the Crystal Dimension.',            icon: 'Gem' },
  { id: 'lost_master',    name: 'Walker Between Worlds', desc: 'Conquer all 10 levels of the Lost Dimension.',             icon: 'Eclipse' },
  { id: 'grand_master',   name: 'Master of Dimensions', desc: 'Complete all 30 levels of the expedition.',                 icon: 'Crown' },
  { id: 'relic_hunter',   name: 'Relic Hunter',       desc: 'Recover 15 star shards from across the dimensions.',         icon: 'Sparkles' },
  { id: 'collector',      name: 'Hoarder of Starlight', desc: 'Recover 45 star shards. The dimensions shimmer for you.',    icon: 'Star' },
  { id: 'no_hints',       name: 'Pure Intuition',     desc: 'Complete any level without spending a single hint.',          icon: 'Brain' },
  { id: 'flawless',       name: 'Flawless Seal',      desc: 'Earn a 3-star rating on any level.',                         icon: 'ShieldCheck' },
  { id: 'speedrunner',    name: 'Blink of an Eye',    desc: 'Complete any level in under 60 seconds.',                     icon: 'Zap' },
  { id: 'star_30',        name: 'Constellation Keeper', desc: 'Earn 30 total stars across the campaign.',                  icon: 'Sparkle' },
  { id: 'star_70',        name: 'Astral Sovereign',   desc: 'Earn 70 total stars across the campaign.',                    icon: 'Sun' },
];

export interface AchievementContext {
  completedLevels: number[];
  totalStars: number;
  totalShards: number;
  lastLevelHints: number;
  lastStars: number;
  lastTime: number;
}

/** Returns ids of newly unlocked achievements given the latest completion. */
export function evaluateAchievements(ctx: AchievementContext, already: string[]): string[] {
  const has = new Set(already);
  const gained: string[] = [];
  const completed = new Set(ctx.completedLevels);
  const unlock = (id: string, ok: boolean) => { if (ok && !has.has(id)) { has.add(id); gained.push(id); } };
  const inRange = (a: number, b: number) => { for (let i = a; i <= b; i++) if (!completed.has(i)) return false; return true; };

  unlock('first_steps', completed.has(1));
  unlock('temple_master', inRange(1, 10));
  unlock('crystal_master', inRange(11, 20));
  unlock('lost_master', inRange(21, 30));
  unlock('grand_master', completed.size >= 30);
  unlock('relic_hunter', ctx.totalShards >= 15);
  unlock('collector', ctx.totalShards >= 45);
  unlock('no_hints', ctx.lastLevelHints === 0);
  unlock('flawless', ctx.lastStars === 3);
  unlock('speedrunner', ctx.lastTime < 60);
  unlock('star_30', ctx.totalStars >= 30);
  unlock('star_70', ctx.totalStars >= 70);
  return gained;
}
