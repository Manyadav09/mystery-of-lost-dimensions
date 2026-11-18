/* ============================================================
   MYSTERY OF THE LOST DIMENSIONS — Achievements Hall
   ============================================================ */
import {
  ChevronLeft, Footprints, Landmark, Gem, Eclipse, Crown, Sparkles, Star,
  Brain, ShieldCheck, Zap, Sparkle, Sun, Lock,
} from 'lucide-react';
import { audio } from '../game/audio';
import { ACHIEVEMENTS } from '../game/achievements';
import type { SaveData } from '../game/save';

const ICONS: Record<string, typeof Footprints> = {
  Footprints, Landmark, Gem, Eclipse, Crown, Sparkles, Star, Brain, ShieldCheck, Zap, Sparkle, Sun,
};

export function AchievementsScreen({ save, onBack }: { save: SaveData; onBack: () => void }) {
  const unlocked = new Set(save.achievements);
  const count = ACHIEVEMENTS.filter(a => unlocked.has(a.id)).length;

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#07090f]">
      <img src="/images/keyart.jpg" alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover object-[30%_25%] opacity-15" draggable={false} />
      <div className="absolute inset-0 bg-gradient-to-b from-[#07090f]/75 to-[#07090f]" />

      <div className="relative h-full flex flex-col">
        <div className="flex items-center gap-4 px-5 md:px-10 pt-5 md:pt-7">
          <button className="icon-btn" onClick={() => { audio.uiBack(); onBack(); }} aria-label="Back"><ChevronLeft size={20} /></button>
          <div>
            <div className="text-[10px] tracking-[0.45em] text-[#d4af37]/80 uppercase">Relics of Renown · {count}/{ACHIEVEMENTS.length}</div>
            <h1 className="font-display text-2xl md:text-4xl font-bold gold-text etched leading-none">HALL OF ECHOES</h1>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto nice-scroll px-5 md:px-10 pb-8 pt-4 max-w-5xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {ACHIEVEMENTS.map(a => {
              const got = unlocked.has(a.id);
              const Icon = got ? (ICONS[a.icon] ?? Sparkles) : Lock;
              return (
                <div key={a.id}
                  className={`flex items-center gap-4 p-3.5 rounded-sm border transition-all duration-300
                    ${got ? 'border-[#d4af37]/45 bg-gradient-to-r from-[#d4af37]/14 to-transparent shadow-[0_0_26px_rgba(212,175,55,0.12)]' : 'border-white/6 bg-black/40 opacity-55'}`}>
                  <div className={`w-14 h-14 shrink-0 flex items-center justify-center rounded-sm rotate-45 border
                    ${got ? 'border-[#d4af37] bg-[#d4af37]/15' : 'border-stone-700 bg-stone-900'}`}>
                    <Icon size={24} className={`-rotate-45 ${got ? 'text-[#f5d76e]' : 'text-stone-600'}`} strokeWidth={1.8} />
                  </div>
                  <div className="min-w-0">
                    <div className={`font-display text-sm md:text-base font-bold leading-tight ${got ? 'text-amber-100' : 'text-stone-500'}`}>{a.name}</div>
                    <div className={`text-[10px] md:text-[11px] leading-snug mt-0.5 ${got ? 'text-stone-400' : 'text-stone-600'}`}>{a.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
