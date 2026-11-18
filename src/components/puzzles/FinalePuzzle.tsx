/* ============================================================
   THE LAST DOOR — three-stage finale seal
   Lock (combination) → Light (laser) → Memory (glyph echo)
   ============================================================ */
import { useRef, useState } from 'react';
import { Lock, Sun, Brain, ChevronRight } from 'lucide-react';
import { audio } from '../../game/audio';
import { CombinationLock } from './ClassicPuzzles';
import { LaserPuzzle, GlyphEcho } from './MechaPuzzles';
import type { FinalePuzzleCfg } from '../../game/levels';

const STAGES = [
  { icon: Lock, name: 'The Lock', sub: 'Speak the odd flames' },
  { icon: Sun, name: 'The Light', sub: 'Walk the beam home' },
  { icon: Brain, name: 'The Memory', sub: 'Become the echo' },
];

export function FinalePuzzle({ cfg, onSolve }: { cfg: FinalePuzzleCfg; onSolve: () => void }) {
  const [stage, setStage] = useState(0);
  const solvedRef = useRef(false);

  const advance = () => {
    audio.success();
    if (stage < 2) setStage(s => s + 1);
    else if (!solvedRef.current) { solvedRef.current = true; onSolve(); }
  };

  return (
    <div>
      {/* stage tracker */}
      <div className="flex items-center justify-center gap-1.5 md:gap-2 mb-3">
        {STAGES.map((s, i) => {
          const Icon = s.icon;
          const done = i < stage;
          const active = i === stage;
          return (
            <div key={i} className="flex items-center gap-1.5 md:gap-2">
              <div className={`flex items-center gap-1.5 px-2 py-1 border rounded-sm transition-all duration-300
                ${done ? 'border-emerald-400/60 bg-emerald-500/10 text-emerald-300' : active ? 'border-[#d4af37] bg-[#d4af37]/15 text-[#f5d76e] shadow-[0_0_16px_rgba(212,175,55,0.35)]' : 'border-white/10 text-stone-600'}`}>
                <Icon size={13} />
                <span className="text-[9px] md:text-[10px] tracking-[0.25em] uppercase hidden sm:inline">{s.name}</span>
              </div>
              {i < 2 && <ChevronRight size={13} className={done ? 'text-emerald-400' : 'text-stone-700'} />}
            </div>
          );
        })}
      </div>
      <p className="text-center text-[10px] tracking-[0.4em] uppercase text-rose-300/80 mb-3">{STAGES[stage].sub}</p>

      {stage === 0 && <CombinationLock cfg={cfg.combination} onSolve={advance} />}
      {stage === 1 && <LaserPuzzle cfg={cfg.laser} onSolve={advance} />}
      {stage === 2 && <GlyphEcho cfg={cfg.simon} onSolve={advance} />}
    </div>
  );
}
