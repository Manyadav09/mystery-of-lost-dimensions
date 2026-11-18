/* ============================================================
   MYSTERY OF THE LOST DIMENSIONS — SaveManager
   JSON localStorage persistence with validation & corruption recovery.
   ============================================================ */

export interface Settings {
  musicVolume: number;      // 0..1
  sfxVolume: number;        // 0..1
  mouseSensitivity: number; // 0.4..2.2 multiplier
  countdownTimer: boolean;  // optional hardcore countdown
  showTimer: boolean;
  subtitles: boolean;
}

export interface GameStats {
  puzzlesSolved: number;
  hintsUsed: number;
  shardsCollected: number;
  deaths: number;
  runsCompleted: number;
  bestLevelTime: number | null;
}

export interface SaveData {
  version: number;
  lastLevel: number;           // most recently played (1-based)
  completedLevels: number[];   // completed level ids
  bestStars: Record<number, number>;   // levelId -> 0..3
  bestScores: Record<number, number>;  // levelId -> score
  bestTimes: Record<number, number>;   // levelId -> seconds
  levelShards: Record<number, number[]>; // levelId -> collected shard indices
  achievements: string[];      // unlocked achievement ids
  settings: Settings;
  stats: GameStats;
}

const SAVE_KEY = 'mld_save_v1';
const CURRENT_VERSION = 1;

export const DEFAULT_SETTINGS: Settings = {
  musicVolume: 0.65,
  sfxVolume: 0.8,
  mouseSensitivity: 1.0,
  countdownTimer: false,
  showTimer: true,
  subtitles: true,
};

export const DEFAULT_STATS: GameStats = {
  puzzlesSolved: 0,
  hintsUsed: 0,
  shardsCollected: 0,
  deaths: 0,
  runsCompleted: 0,
  bestLevelTime: null,
};

export function freshSave(): SaveData {
  return {
    version: CURRENT_VERSION,
    lastLevel: 1,
    completedLevels: [],
    bestStars: {},
    bestScores: {},
    bestTimes: {},
    levelShards: {},
    achievements: [],
    settings: { ...DEFAULT_SETTINGS },
    stats: { ...DEFAULT_STATS },
  };
}

function isNum(v: unknown): v is number { return typeof v === 'number' && Number.isFinite(v); }
function numRecord(v: unknown): Record<number, number> {
  const out: Record<number, number> = {};
  if (v && typeof v === 'object') {
    for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
      if (isNum(Number(k)) && isNum(val)) out[Number(k)] = val;
    }
  }
  return out;
}
function numArrayRecord(v: unknown): Record<number, number[]> {
  const out: Record<number, number[]> = {};
  if (v && typeof v === 'object') {
    for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
      if (isNum(Number(k)) && Array.isArray(val)) {
        out[Number(k)] = val.filter(isNum);
      }
    }
  }
  return out;
}
function strArray(v: unknown): string[] { return Array.isArray(v) ? v.filter(x => typeof x === 'string') : []; }

/** Validate + repair an arbitrary parsed object into a safe SaveData. */
export function sanitizeSave(raw: unknown): SaveData {
  const fresh = freshSave();
  if (!raw || typeof raw !== 'object') return fresh;
  const r = raw as Record<string, unknown>;
  fresh.lastLevel = isNum(r.lastLevel) ? Math.min(30, Math.max(1, Math.floor(r.lastLevel))) : 1;
  fresh.completedLevels = Array.isArray(r.completedLevels)
    ? [...new Set(r.completedLevels.filter(isNum).map(n => Math.floor(n)).filter(n => n >= 1 && n <= 30))]
    : [];
  fresh.bestStars = numRecord(r.bestStars);
  fresh.bestScores = numRecord(r.bestScores);
  fresh.bestTimes = numRecord(r.bestTimes);
  fresh.levelShards = numArrayRecord(r.levelShards);
  fresh.achievements = strArray(r.achievements);
  const s = (r.settings ?? {}) as Record<string, unknown>;
  fresh.settings = {
    musicVolume: isNum(s.musicVolume) ? Math.min(1, Math.max(0, s.musicVolume)) : DEFAULT_SETTINGS.musicVolume,
    sfxVolume: isNum(s.sfxVolume) ? Math.min(1, Math.max(0, s.sfxVolume)) : DEFAULT_SETTINGS.sfxVolume,
    mouseSensitivity: isNum(s.mouseSensitivity) ? Math.min(2.2, Math.max(0.4, s.mouseSensitivity)) : DEFAULT_SETTINGS.mouseSensitivity,
    countdownTimer: typeof s.countdownTimer === 'boolean' ? s.countdownTimer : DEFAULT_SETTINGS.countdownTimer,
    showTimer: typeof s.showTimer === 'boolean' ? s.showTimer : DEFAULT_SETTINGS.showTimer,
    subtitles: typeof s.subtitles === 'boolean' ? s.subtitles : DEFAULT_SETTINGS.subtitles,
  };
  const st = (r.stats ?? {}) as Record<string, unknown>;
  fresh.stats = {
    puzzlesSolved: isNum(st.puzzlesSolved) ? Math.max(0, Math.floor(st.puzzlesSolved)) : 0,
    hintsUsed: isNum(st.hintsUsed) ? Math.max(0, Math.floor(st.hintsUsed)) : 0,
    shardsCollected: isNum(st.shardsCollected) ? Math.max(0, Math.floor(st.shardsCollected)) : 0,
    deaths: isNum(st.deaths) ? Math.max(0, Math.floor(st.deaths)) : 0,
    runsCompleted: isNum(st.runsCompleted) ? Math.max(0, Math.floor(st.runsCompleted)) : 0,
    bestLevelTime: isNum(st.bestLevelTime) ? st.bestLevelTime : null,
  };
  fresh.version = CURRENT_VERSION;
  return fresh;
}

export const SaveManager = {
  /** Load save; on any corruption, backs up the bad blob and returns a fresh save. */
  load(): { data: SaveData; recovered: boolean } {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return { data: freshSave(), recovered: false };
      const parsed = JSON.parse(raw);
      const data = sanitizeSave(parsed);
      return { data, recovered: false };
    } catch (err) {
      console.warn('[SaveManager] Corrupted save detected, resetting.', err);
      try {
        const raw = localStorage.getItem(SAVE_KEY);
        if (raw) localStorage.setItem(`${SAVE_KEY}_corrupt_${Date.now()}`, raw);
      } catch { /* storage full — best effort */ }
      try { localStorage.removeItem(SAVE_KEY); } catch { /* noop */ }
      return { data: freshSave(), recovered: true };
    }
  },

  save(data: SaveData): boolean {
    try {
      const payload: SaveData = { ...data, version: CURRENT_VERSION };
      localStorage.setItem(SAVE_KEY, JSON.stringify(payload));
      return true;
    } catch (err) {
      console.error('[SaveManager] Failed to persist save.', err);
      return false;
    }
  },

  erase(): boolean {
    try { localStorage.removeItem(SAVE_KEY); return true; } catch { return false; }
  },

  exportJSON(): string {
    const { data } = SaveManager.load();
    return JSON.stringify(data, null, 2);
  },
};
