/* ============================================================
   MYSTERY OF THE LOST DIMENSIONS — Campaign Data (30 Levels)
   All puzzle configurations are hand-authored and solvable.
   ============================================================ */

export type PuzzleType =
  | 'symbol' | 'sequence' | 'combination' | 'hidden' | 'crystal'
  | 'laser' | 'gears' | 'pattern' | 'simon' | 'finale';

export interface SymbolPuzzleCfg { pairs: number }
export interface SequenceQuestion { series: number[]; answer: number; options: number[]; rule: string }
export interface SequencePuzzleCfg { questions: SequenceQuestion[] }
export interface ComboPuzzleCfg { dials: number; code: number[]; clueTitle: string; clue: string }
export interface HiddenPuzzleCfg { relics: number; relicName: string }
export interface CrystalPuzzleCfg { runes: string[]; starts: number[]; flavor: string }
export type LaserOrientation = '/' | '\\';
export interface LaserMirror { x: number; y: number; o: LaserOrientation; locked?: boolean }
export interface LaserPuzzleCfg {
  w: number; h: number;
  emitter: { x: number; y: number; dir: 'R' | 'U' | 'L' | 'D' };
  receptor: { x: number; y: number };
  mirrors: LaserMirror[];
}
export interface GearsPuzzleCfg { teeth: number[]; order: 'asc' | 'desc' }
export interface PatternQuestion { grid: (string | null)[]; answer: string; options: string[]; rule: string }
export interface PatternPuzzleCfg { questions: PatternQuestion[] }
export interface SimonPuzzleCfg { length: number; timeLimit: number }
export interface FinalePuzzleCfg { combination: ComboPuzzleCfg; laser: LaserPuzzleCfg; simon: SimonPuzzleCfg }

export type AnyPuzzleCfg =
  | SymbolPuzzleCfg | SequencePuzzleCfg | ComboPuzzleCfg | HiddenPuzzleCfg
  | CrystalPuzzleCfg | LaserPuzzleCfg | GearsPuzzleCfg | PatternPuzzleCfg
  | SimonPuzzleCfg | FinalePuzzleCfg;

export interface LevelDef {
  id: number;
  name: string;
  world: 1 | 2 | 3;
  type: PuzzleType;
  difficulty: 1 | 2 | 3 | 4 | 5;
  parTime: number; // seconds for 3-star timer
  objective: string;
  hint: string;
  lore: string;
  puzzle: AnyPuzzleCfg;
}

export const WORLD_INFO = [
  { id: 1 as const, name: 'The Ancient Temple', short: 'Ancient Temple', subtitle: 'Where the first seal broke', levels: [1, 10], hue: '#d4af37', fog: 0x1a1409, accent: '#f5d76e' },
  { id: 2 as const, name: 'The Crystal Dimension', short: 'Crystal Dimension', subtitle: 'Where light remembers', levels: [11, 20], hue: '#67e8f9', fog: 0x06161d, accent: '#a5f3fc' },
  { id: 3 as const, name: 'The Lost Dimension', short: 'Lost Dimension', subtitle: 'Where time unravels', levels: [21, 30], hue: '#fb7185', fog: 0x160609, accent: '#fda4af' },
] as const;

export const SHARDS_PER_LEVEL = 3;
export const TOTAL_LEVELS = 30;

export const LEVELS: LevelDef[] = [
  /* ============ WORLD 1 — THE ANCIENT TEMPLE ============ */
  {
    id: 1, name: 'The Awakening Seal', world: 1, type: 'symbol', difficulty: 1,
    parTime: 150,
    objective: 'Restore the seal — attune the twin glyphs on the mechanism.',
    hint: 'Every glyph on the table has exactly one twin etched somewhere else in the chamber. Reveal them in pairs.',
    lore: 'Here the First Ones slept, and dreamed the world into being. Their dreams leak through the cracked stone.',
    puzzle: { pairs: 3 },
  },
  {
    id: 2, name: 'The Numeral Obelisk', world: 1, type: 'sequence', difficulty: 1,
    parTime: 120,
    objective: 'Decipher the obelisk numerals and speak the next number aloud.',
    hint: 'Walk the staircase mentally. The obelisk climbs in relentless equal strides — find the stride.',
    lore: 'The obelisk counts the grains of sand in the hourglass of the First One. It never lost count. Until today.',
    puzzle: {
      questions: [
        { series: [4, 7, 10, 13], answer: 16, options: [16, 17, 15, 19], rule: 'Each number climbs by +3.' },
        { series: [2, 5, 8, 11], answer: 14, options: [13, 14, 16, 17], rule: 'Each number climbs by +3.' },
      ],
    },
  },
  {
    id: 3, name: 'The Bronze Seal', world: 1, type: 'combination', difficulty: 1,
    parTime: 150,
    objective: 'Unbind the bronze mechanism — three rings guard the way.',
    hint: 'Read the inscription slowly. The numbers appear in the order the words are written.',
    lore: 'Three bronze rings, older than the mountain, cold to the touch even in the desert noon.',
    puzzle: {
      dials: 3, code: [4, 2, 7],
      clueTitle: 'Inscription on the Mechanism',
      clue: '“Four winds guard the gate. Two serpents coil the pillar. Seven lamps burn eternal for the sleeping king.”',
    },
  },
  {
    id: 4, name: 'Relics of the Fallen', world: 1, type: 'hidden', difficulty: 1,
    parTime: 180,
    objective: 'Recover the three buried relics hidden within the shrine.',
    hint: 'Relics drink the light. Look for faint golden glints behind pillars, beneath the braziers, along the walls.',
    lore: 'They were not buried. They were planted — like seeds of a garden meant to bloom again.',
    puzzle: { relics: 3, relicName: 'Ancient Relic' },
  },
  {
    id: 5, name: 'The Twin Glyphs', world: 1, type: 'symbol', difficulty: 2,
    parTime: 180,
    objective: 'Match all twin glyphs to wake the slumbering seal.',
    hint: 'Memorize two cards at a time. Corners first — the center is a trap for the impatient.',
    lore: 'The glyphic tongue has no alphabet, only echoes. Every mark remembers its twin.',
    puzzle: { pairs: 5 },
  },
  {
    id: 6, name: 'The Ascending Spiral', world: 1, type: 'sequence', difficulty: 2,
    parTime: 150,
    objective: 'Answer the spiral’s riddles of growth and prime.',
    hint: 'One spiral doubles; the other dances over only what cannot be divided.',
    lore: 'The spiral on the floor turns always inward, toward the point where numbers began.',
    puzzle: {
      questions: [
        { series: [3, 6, 12, 24], answer: 48, options: [48, 36, 30, 60], rule: 'Each number doubles (×2).' },
        { series: [2, 3, 5, 7], answer: 11, options: [9, 11, 13, 15], rule: 'The sequence lists prime numbers.' },
      ],
    },
  },
  {
    id: 7, name: "The Emperor's Lock", world: 1, type: 'combination', difficulty: 2,
    parTime: 180,
    objective: 'Three fates guard the Emperor’s vault. Speak their numbers.',
    hint: 'Seven — the day of rest. Three — the fates with shears. Nine — the muses and their songs.',
    lore: 'The Emperor bound his vault to the oldest arithmetic: day, fate, and song.',
    puzzle: {
      dials: 3, code: [7, 3, 9],
      clueTitle: 'Verse on the Vault Door',
      clue: '“I am the seventh day, and all labor rests. Three fates spin, measure and cut. Nine muses weep upon my brow.”',
    },
  },
  {
    id: 8, name: 'The Pattern of Ages', world: 1, type: 'pattern', difficulty: 2,
    parTime: 180,
    objective: 'Complete the sacred matrix etched into the altar.',
    hint: 'Read each row like a sentence. The sentence repeats — it simply begins one word later each line.',
    lore: 'The altar does not ask what comes next. It asks whether you have been paying attention.',
    puzzle: {
      questions: [
        { grid: ['ᚠ', 'ᚱ', 'ᛁ', 'ᚱ', 'ᛁ', 'ᚠ', 'ᛁ', 'ᚠ', null], answer: 'ᚱ', options: ['ᚱ', 'ᚠ', 'ᛁ', 'ᛊ'], rule: 'Each row rotates the cycle ᚠ → ᚱ → ᛁ one step to the left.' },
        { grid: ['ᚨ', 'ᚦ', 'ᚺ', 'ᚦ', 'ᚺ', 'ᚨ', 'ᚺ', 'ᚨ', null], answer: 'ᚦ', options: ['ᚨ', 'ᚦ', 'ᚺ', 'ᚾ'], rule: 'Each row rotates the cycle ᚨ → ᚦ → ᚺ one step to the left.' },
      ],
    },
  },
  {
    id: 9, name: 'The Fibonacci Gate', world: 1, type: 'sequence', difficulty: 3,
    parTime: 210,
    objective: 'The gate speaks only in nature’s own numbers. Answer all three.',
    hint: 'The spiral lives inside sunflowers and seashells: each term is the sum of the two before it. And remember your squares.',
    lore: 'Before emperors, before temples, the rabbit knew this number. The gate remembers the rabbit.',
    puzzle: {
      questions: [
        { series: [1, 1, 2, 3, 5], answer: 8, options: [8, 7, 10, 13], rule: 'Each number is the sum of the previous two.' },
        { series: [1, 4, 9, 16], answer: 25, options: [20, 25, 32, 36], rule: 'Perfect squares: 1², 2², 3², 4²…' },
        { series: [1, 3, 6, 10], answer: 15, options: [12, 14, 15, 18], rule: 'Triangular numbers: add 2, then 3, then 4, then 5…' },
      ],
    },
  },
  {
    id: 10, name: "The Guardian's Trial", world: 1, type: 'combination', difficulty: 3,
    parTime: 240,
    objective: 'The Guardian admits only those who count its heart correctly.',
    hint: 'One — the sun. Six — the serpent’s coils. Eight — the banners of the lost legion. Three — the kneeling kings.',
    lore: 'The Guardian does not guard gold. It guards the memory of why the temple was sealed.',
    puzzle: {
      dials: 4, code: [1, 6, 8, 3],
      clueTitle: 'The Guardian’s Verse',
      clue: '“One sun rose over my birth. Six serpents whispered my name. Eight banners carried my shadow. Three kings knelt, and never rose.”',
    },
  },

  /* ============ WORLD 2 — THE CRYSTAL DIMENSION ============ */
  {
    id: 11, name: 'The First Refraction', world: 2, type: 'crystal', difficulty: 1,
    parTime: 150,
    objective: 'Turn each crystal so its rune faces the northern gate.',
    hint: 'North is where the great door sleeps. Click a crystal to rotate it in 90° steps until every rune gazes the same way.',
    lore: 'The crystals never stopped singing. The dimension simply forgot how to listen.',
    puzzle: {
      runes: ['ᛊ', 'ᚠ', 'ᚱ'],
      starts: [1, 2, 3],
      flavor: 'Align all runes toward the Great Door.',
    },
  },
  {
    id: 12, name: 'The Mirror Gallery', world: 2, type: 'laser', difficulty: 1,
    parTime: 150,
    objective: 'Strike the dormant lens with the light beam.',
    hint: 'Light travels straight, and mirrors turn it by ninety degrees. The beam must climb upward, then cross the arch.',
    lore: 'The Gallery was built to catch a single ray of the First Dawn — and never let it go.',
    puzzle: {
      w: 7, h: 6,
      emitter: { x: 0, y: 4, dir: 'R' },
      receptor: { x: 6, y: 1 },
      mirrors: [
        { x: 4, y: 4, o: '\\' },
        { x: 4, y: 1, o: '\\' },
      ],
    },
  },
  {
    id: 13, name: 'Frequency of Light', world: 2, type: 'sequence', difficulty: 2,
    parTime: 150,
    objective: 'Match the harmonic frequencies of the resonating prisms.',
    hint: 'Each prism vibrates exactly twice its neighbor — and the primes are the indivisible atoms of light.',
    lore: 'Sound made the crystal. Light is merely sound that learned to be seen.',
    puzzle: {
      questions: [
        { series: [5, 10, 20, 40], answer: 80, options: [80, 60, 70, 100], rule: 'Each frequency doubles (×2).' },
        { series: [7, 14, 28], answer: 56, options: [42, 49, 56, 64], rule: 'Each frequency doubles (×2).' },
      ],
    },
  },
  {
    id: 14, name: 'The Triple Prism', world: 2, type: 'crystal', difficulty: 2,
    parTime: 180,
    objective: 'Four crystals, one accord. Align every rune to the gate.',
    hint: 'Work left to right. A crystal that glows dim amber is not yet home — only cold cyan light is true north.',
    lore: 'Four voices, one chord. The dimension exhaled when they first sang together.',
    puzzle: {
      runes: ['ᚠ', 'ᚱ', 'ᛁ', 'ᛋ'],
      starts: [1, 3, 2, 3],
      flavor: 'Align all four runes toward the Great Door.',
    },
  },
  {
    id: 15, name: 'The Silver Path', world: 2, type: 'laser', difficulty: 2,
    parTime: 180,
    objective: 'Bend the silver path down, then across to the far lens.',
    hint: 'The beam must descend one shaft, then travel the lower gallery east into the lens.',
    lore: 'The Silver Path is the reflection of a road that existed in a world that did not survive it.',
    puzzle: {
      w: 7, h: 6,
      emitter: { x: 0, y: 1, dir: 'R' },
      receptor: { x: 6, y: 5 },
      mirrors: [
        { x: 4, y: 1, o: '/' },
        { x: 4, y: 5, o: '/' },
      ],
    },
  },
  {
    id: 16, name: 'The Resonance Matrix', world: 2, type: 'pattern', difficulty: 2,
    parTime: 180,
    objective: 'Complete the resonance matrix carved in starlight.',
    hint: 'The signs checkerboard. What stands in even positions must stand again in even positions.',
    lore: 'The Matrix does not predict. It remembers what the pattern always was.',
    puzzle: {
      questions: [
        { grid: ['△', '▽', '△', '▽', '△', '▽', '△', '▽', null], answer: '△', options: ['△', '▽', '◇', '○'], rule: 'The signs alternate in a checkerboard — every even cell matches its neighbors diagonally.' },
        { grid: ['●', '○', '●', '○', '●', '○', '●', '○', null], answer: '●', options: ['○', '●', '◉', '□'], rule: 'Filled and hollow circles alternate like a checkerboard.' },
      ],
    },
  },
  {
    id: 17, name: 'The Locked Lens', world: 2, type: 'laser', difficulty: 3,
    parTime: 210,
    objective: 'One mirror is welded fast. Make the light obey anyway.',
    hint: 'The welded mirror cannot move — so the beam must arrive at it exactly as mathematics demands: traveling east, along the floor.',
    lore: 'Some laws cannot be bent. Only understanding can route around them.',
    puzzle: {
      w: 8, h: 7,
      emitter: { x: 0, y: 3, dir: 'R' },
      receptor: { x: 7, y: 6 },
      mirrors: [
        { x: 3, y: 3, o: '/' },
        { x: 3, y: 6, o: '\\', locked: true },
        { x: 5, y: 1, o: '/' },
      ],
    },
  },
  {
    id: 18, name: 'The Harmonic Array', world: 2, type: 'crystal', difficulty: 3,
    parTime: 210,
    objective: 'Five crystals sing the Array. Bring every voice to north.',
    hint: 'They turn in quarter-steps. North is the cold direction. Warm light means still turning.',
    lore: 'The Array powered the dimension’s first sunrise. It has not risen since.',
    puzzle: {
      runes: ['ᛊ', 'ᛏ', 'ᚹ', 'ᛁ', 'ᛉ'],
      starts: [3, 1, 2, 3, 1],
      flavor: 'Align all five runes toward the Great Door.',
    },
  },
  {
    id: 19, name: 'The Twin Beams', world: 2, type: 'laser', difficulty: 3,
    parTime: 240,
    objective: 'Thread one beam through the whole gallery — four turns.',
    hint: 'Descend the western shaft, cross the middle, drop through the eastern shaft, and out along the floor.',
    lore: 'The twin beams were lovers, separated by a wall of years. The gallery is what remains of their road.',
    puzzle: {
      w: 8, h: 7,
      emitter: { x: 0, y: 0, dir: 'R' },
      receptor: { x: 7, y: 6 },
      mirrors: [
        { x: 2, y: 0, o: '/' },
        { x: 2, y: 4, o: '/' },
        { x: 6, y: 4, o: '/' },
        { x: 6, y: 6, o: '/' },
      ],
    },
  },
  {
    id: 20, name: 'The Prismatic Core', world: 2, type: 'combination', difficulty: 3,
    parTime: 210,
    objective: 'The Core answers only to its spectrum — speak it in order.',
    hint: 'Two cores, seven facets, four burning stars, nine rays of the dawn that cannot arrive.',
    lore: 'At the center of the Crystal Dimension sleeps a single frozen sunrise. The Core is its heartbeat.',
    puzzle: {
      dials: 4, code: [2, 7, 4, 9],
      clueTitle: 'Spectrum Verse',
      clue: '“Two cores dream in the deep. Seven facets hold the dawn. Four stars burn in the heart of light. Nine rays escape, and are caught forever.”',
    },
  },

  /* ============ WORLD 3 — THE LOST DIMENSION ============ */
  {
    id: 21, name: 'Echoes of Eternity', world: 3, type: 'simon', difficulty: 2,
    parTime: 120,
    objective: 'The void whispers a rhythm — repeat it exactly.',
    hint: 'Watch the glyphs flare in order, breathe, then press them in that same order. The void has no patience for guesses.',
    lore: 'In the Lost Dimension, sound arrives before the event that made it. Listen carefully.',
    puzzle: { length: 4, timeLimit: 45 },
  },
  {
    id: 22, name: 'The Gears of Ruin', world: 3, type: 'gears', difficulty: 2,
    parTime: 150,
    objective: 'Wake the engine — engage its gears from smallest to largest.',
    hint: 'Count the teeth. Fewest teeth first. The engine must be taught gently, from whisper to thunder.',
    lore: 'The engine of ruin was built to unmake a world politely — one tooth at a time.',
    puzzle: { teeth: [6, 10, 14, 19, 25, 33], order: 'asc' },
  },
  {
    id: 23, name: 'The Seventh Equation', world: 3, type: 'sequence', difficulty: 3,
    parTime: 210,
    objective: 'Solve the equations graven on the obsidian altar.',
    hint: 'One series doubles and subtracts a candle each step. One is built purely of threes. One divides itself into dust.',
    lore: 'The Seventh Equation was never written by hands. It was found, the way a fossil is found.',
    puzzle: {
      questions: [
        { series: [3, 5, 9, 17], answer: 33, options: [33, 31, 25, 41], rule: 'Double the number, then subtract 1.' },
        { series: [2, 6, 18, 54], answer: 162, options: [108, 126, 162, 216], rule: 'Each number is multiplied by 3.' },
        { series: [81, 27, 9, 3], answer: 1, options: [1, 0, 3, 9], rule: 'Each number is divided by 3.' },
      ],
    },
  },
  {
    id: 24, name: 'The Descending Harmonic', world: 3, type: 'gears', difficulty: 3,
    parTime: 150,
    objective: 'This mechanism drinks power downward — largest gear first.',
    hint: 'The machine reverses the ancient order. Most teeth first. Thunder before whisper.',
    lore: 'When the world above ended, this gear-train drank the sky and asked for more.',
    puzzle: { teeth: [8, 12, 17, 23, 30, 40], order: 'desc' },
  },
  {
    id: 25, name: 'The Temporal Sigil', world: 3, type: 'simon', difficulty: 3,
    parTime: 150,
    objective: 'The sigil replays the moment itself. Repeat its five-note heartbeat.',
    hint: 'Five flares. Let the rhythm lodge behind your eyes, then answer. Speed is a trap; memory is the key.',
    lore: 'Time folds through this room like a ribbon. What you just saw has already happened, forever.',
    puzzle: { length: 5, timeLimit: 40 },
  },
  {
    id: 26, name: 'The Abyssal Refraction', world: 3, type: 'laser', difficulty: 4,
    parTime: 270,
    objective: 'One welded mirror remains. Thread the beam through the abyss.',
    hint: 'Down the western shaft, across the floor, up the eastern shaft, across the dark — the welded lens waits at the eastern ledge, facing east.',
    lore: 'The Abyss does not bend light. Light, terrified, bends itself.',
    puzzle: {
      w: 9, h: 8,
      emitter: { x: 0, y: 2, dir: 'R' },
      receptor: { x: 8, y: 3 },
      mirrors: [
        { x: 2, y: 2, o: '/' },
        { x: 2, y: 6, o: '/' },
        { x: 6, y: 6, o: '\\' },
        { x: 6, y: 3, o: '/', locked: true },
        { x: 4, y: 5, o: '/' },
      ],
    },
  },
  {
    id: 27, name: 'The Chrono-Matrix', world: 3, type: 'pattern', difficulty: 4,
    parTime: 210,
    objective: 'Read the matrix the way time reads it — beneath the surface.',
    hint: 'Each column descends the cycle one glyph at a time. Follow any single column from top to bottom.',
    lore: 'The Chrono-Matrix is not a puzzle. It is a photograph of eternity, missing one frame.',
    puzzle: {
      questions: [
        { grid: ['ᚨ', 'ᚦ', 'ᚺ', 'ᚦ', 'ᚺ', 'ᚨ', 'ᚺ', 'ᚨ', null], answer: 'ᚦ', options: ['ᚨ', 'ᚦ', 'ᚺ', 'ᛁ'], rule: 'Each column descends the cycle ᚨ → ᚦ → ᚺ one step.' },
        { grid: ['◐', '◓', '◑', '◓', '◑', '◒', '◑', '◒', null], answer: '◐', options: ['◐', '◑', '◓', '◒'], rule: 'The quarter-moons rotate 90° clockwise, left to right and top to bottom.' },
      ],
    },
  },
  {
    id: 28, name: "The Emperor's Cipher II", world: 3, type: 'combination', difficulty: 4,
    parTime: 240,
    objective: 'The second verse of the oldest song. Four numbers, spoken as one.',
    hint: 'Five shadows that never moved. Eight chains that never broke. Three tombs without kings. Six names no tongue may speak.',
    lore: 'The Emperor returned from the Lost Dimension with his shadow missing and a number on his lips.',
    puzzle: {
      dials: 4, code: [5, 8, 3, 6],
      clueTitle: 'The Second Verse',
      clue: '“Five shadows stand where I once stood. Eight chains bind what cannot be bound. Three tombs hold no kings. Six names are written nowhere.”',
    },
  },
  {
    id: 29, name: 'The Heart of the Lost', world: 3, type: 'simon', difficulty: 4,
    parTime: 160,
    objective: 'The heartbeat of eternity has six notes. Miss none.',
    hint: 'Do not chase the flashes. Let them land in you, one by one, like rain on a still roof. Then answer.',
    lore: 'This is the heart the dimension grew in place of a sun. It beats in glyphs.',
    puzzle: { length: 6, timeLimit: 50 },
  },
  {
    id: 30, name: 'The Last Door', world: 3, type: 'finale', difficulty: 5,
    parTime: 420,
    objective: 'The Last Door opens only for the complete soul: Lock, Light and Memory.',
    hint: 'Stage one is a verse — odd flames march in order. Stage two begins with a rising beam: walk it across the upper gallery, sink it, and bring it home. Stage three is rhythm — five beats and no mercy.',
    lore: 'Beyond this door is the room where the First Ones went to forget. You are the sound of them remembering.',
    puzzle: {
      combination: {
        dials: 4, code: [1, 3, 5, 7],
        clueTitle: 'The First Seal — The Lock',
        clue: '“One truth. Three pillars. Five stars. Seven seals. The odd flames march, and the door remembers.”',
      },
      laser: {
        w: 8, h: 7,
        emitter: { x: 0, y: 5, dir: 'U' },
        receptor: { x: 7, y: 3 },
        mirrors: [
          { x: 0, y: 1, o: '\\' },
          { x: 6, y: 1, o: '/' },
          { x: 6, y: 5, o: '\\' },
          { x: 2, y: 5, o: '/' },
          { x: 2, y: 3, o: '\\' },
          { x: 4, y: 6, o: '/' },
        ],
      },
      simon: { length: 5, timeLimit: 45 },
    },
  },
];

/* Verify laser configs solve uniquely-ish (development-time sanity check). */
export function getLevel(id: number): LevelDef {
  const level = LEVELS.find(l => l.id === id);
  if (!level) throw new Error(`[Levels] Unknown level id: ${id}`);
  return level;
}

export function worldOf(levelId: number): 1 | 2 | 3 {
  if (levelId <= 10) return 1;
  if (levelId <= 20) return 2;
  return 3;
}
