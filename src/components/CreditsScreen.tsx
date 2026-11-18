/* ============================================================
   MYSTERY OF THE LOST DIMENSIONS — Credits
   ============================================================ */
import { ChevronLeft, Gamepad2, Code2, Palette, Music4, Type, HeartHandshake, FlaskConical } from 'lucide-react';
import { audio } from '../game/audio';

const SECTIONS = [
  { icon: Gamepad2, title: 'Game Direction & Design', lines: ['Mystery of the Lost Dimensions', 'Lead Design — The Lost Dimensions Team', 'Level Design — 30 chambers, three worlds', 'Puzzle Architecture — reusable rune-driven modules'] },
  { icon: Code2, title: 'Engineering', lines: ['Engine — Three.js (WebGL) & React', 'Systems — GameManager · LevelManager · PuzzleManager', 'SaveManager — JSON persistence with corruption recovery', 'AudioManager — Procedural Web Audio synthesis'] },
  { icon: Palette, title: 'Art & Visuals', lines: ['Key Art — AI-generated cinematic concept', 'Textures — Procedurally painted stone & rune canvas', 'Lighting — Dynamic fog, shadows & ember particles', 'Three Worlds — Temple · Crystal · Lost'] },
  { icon: Music4, title: 'Audio', lines: ['Generative ambient score — distinct per dimension', 'Synthesized SFX — footsteps, seals, shards & triumph', 'No recordings were harmed — everything is synthesized live'] },
  { icon: Type, title: 'Typography', lines: ['Cinzel — the carved voice of the temples', 'Rajdhani — the clean hand of the HUD', 'Spectral — the serif whisper of inscriptions'] },
  { icon: FlaskConical, title: 'Quality & Testing', lines: ['Every puzzle hand-verified solvable', 'Save/load validated & corruption-hardened', 'Pointer-lock first-person controller, 60 FPS target'] },
  { icon: HeartHandshake, title: 'Special Thanks', lines: ['To the players who listen for the echo', 'To every temple that waits beneath the sand', 'To you — the one still reading the inscriptions'] },
];

export function CreditsScreen({ onBack }: { onBack: () => void }) {
  return (
    <div className="relative w-full h-full overflow-hidden bg-[#07090f]">
      <img src="/images/keyart.jpg" alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover object-[50%_35%] opacity-20" draggable={false} />
      <div className="absolute inset-0 bg-gradient-to-b from-[#07090f]/70 via-[#07090f]/80 to-[#07090f]" />

      <div className="relative h-full flex flex-col">
        <div className="flex items-center gap-4 px-5 md:px-10 pt-5 md:pt-7">
          <button className="icon-btn" onClick={() => { audio.uiBack(); onBack(); }} aria-label="Back"><ChevronLeft size={20} /></button>
          <div>
            <div className="text-[10px] tracking-[0.45em] text-[#d4af37]/80 uppercase">Who Woke the Temple</div>
            <h1 className="font-display text-2xl md:text-4xl font-bold gold-text etched leading-none">CREDITS</h1>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto nice-scroll px-5 md:px-10 pb-10 pt-5">
          <div className="max-w-3xl mx-auto grid md:grid-cols-2 gap-3">
            {SECTIONS.map(s => {
              const Icon = s.icon;
              return (
                <div key={s.title} className="panel-ancient rounded-sm p-4">
                  <div className="flex items-center gap-2 mb-2 text-[#d4af37]">
                    <Icon size={16} />
                    <h2 className="text-[11px] tracking-[0.35em] uppercase font-semibold">{s.title}</h2>
                  </div>
                  <ul className="space-y-1">
                    {s.lines.map((l, i) => <li key={i} className="text-[12px] text-stone-400 leading-snug font-serif-body">{l}</li>)}
                  </ul>
                </div>
              );
            })}
          </div>

          <div className="text-center mt-8">
            <div className="h-px w-40 mx-auto bg-gradient-to-r from-transparent via-[#d4af37] to-transparent mb-4" />
            <p className="font-display text-lg gold-text etched font-bold tracking-[0.2em]">MYSTERY OF THE LOST DIMENSIONS</p>
            <p className="text-[10px] tracking-[0.4em] text-stone-500 uppercase mt-1">© 2026 Lost Dimensions Interactive · All seals reserved</p>
            <p className="text-[10px] text-stone-600 mt-2 font-mono">Built for Windows 10/11 · Chrome · Edge · Firefox — fullscreen recommended for immersion</p>
          </div>
        </div>
      </div>
    </div>
  );
}
