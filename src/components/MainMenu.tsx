/* ============================================================
   MYSTERY OF THE LOST DIMENSIONS — Main Menu
   ============================================================ */
import { useMemo, useState } from 'react';
import {
  Play, Map, Settings, ScrollText, DoorOpen, Trophy, Sparkles, Star,
  Landmark, X, MousePointerClick,
} from 'lucide-react';
import { audio } from '../game/audio';
import type { SaveData } from '../game/save';

interface MainMenuProps {
  save: SaveData;
  totalStars: number;
  onContinue: () => void;
  onNewGame: () => void;
  onOpenLevels: () => void;
  onOpenSettings: () => void;
  onOpenAchievements: () => void;
  onOpenCredits: () => void;
}

export function MainMenu({ save, totalStars, onContinue, onNewGame, onOpenLevels, onOpenSettings, onOpenAchievements, onOpenCredits }: MainMenuProps) {
  const [exitConfirm, setExitConfirm] = useState(false);
  const hasProgress = save.completedLevels.length > 0;
  const completed = save.completedLevels.length;

  const embers = useMemo(
    () => Array.from({ length: 30 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      size: 2 + Math.random() * 5,
      delay: Math.random() * 11,
      dur: 9 + Math.random() * 10,
      drift: (Math.random() - 0.5) * 220,
      op: 0.35 + Math.random() * 0.55,
    })),
    []
  );

  return (
    <div className="relative w-full h-full overflow-hidden select-none">
      {/* key art backdrop */}
      <div className="absolute inset-0 overflow-hidden">
        <img src="/images/keyart.jpg" alt="" aria-hidden
          className="keyart-bg w-full h-full object-cover object-[62%_center]" draggable={false} />
        <div className="absolute inset-0 bg-gradient-to-r from-[#07090f] via-[#07090fdd] to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#07090f] via-transparent to-[#07090f99]" />
      </div>

      {/* drifting embers */}
      {embers.map(e => (
        <span key={e.id} className="ember"
          style={{ left: `${e.left}%`, width: e.size, height: e.size, animationDelay: `${e.delay}s`, animationDuration: `${e.dur}s`, ['--px' as string]: `${e.drift}px`, ['--po' as string]: e.op }} />
      ))}

      {/* top-right utility icons */}
      <div className="absolute top-5 right-5 md:top-7 md:right-8 flex items-center gap-2 z-10">
        <button className="icon-btn" onClick={() => { audio.click(); onOpenAchievements(); }} aria-label="Achievements" title="Achievements"><Trophy size={18} /></button>
        <button className="icon-btn" onClick={() => { audio.click(); onOpenSettings(); }} aria-label="Settings" title="Settings"><Settings size={18} /></button>
      </div>

      {/* ===== left column: title + menu ===== */}
      <div className="relative z-10 h-full flex flex-col justify-center pl-6 md:pl-14 lg:pl-20 pr-6 max-w-[880px]">
        {/* eyebrow */}
        <div className="flex items-center gap-3 mb-2 md:mb-4">
          <span className="h-px w-10 bg-[#d4af37]/70" />
          <span className="text-[#d4af37] text-[10px] md:text-[11px] tracking-[0.5em] uppercase font-semibold">A 3D Puzzle Adventure</span>
        </div>

        {/* title */}
        <h1 className="font-display font-black leading-[0.95] select-none">
          <span className="block text-stone-200 text-[clamp(1.6rem,4.6vw,3rem)] tracking-[0.22em] etched">MYSTERY</span>
          <span className="block text-[clamp(2.6rem,7.6vw,5.2rem)] gold-text etched">OF THE LOST</span>
          <span className="block text-[clamp(2.6rem,7.6vw,5.2rem)] gold-text etched">DIMENSIONS</span>
        </h1>
        <p className="mt-3 md:mt-4 text-stone-400 text-xs md:text-sm tracking-[0.18em] uppercase max-w-md">Three sealed worlds. Thirty trials. One way home.</p>

        {/* menu buttons */}
        <nav className="mt-5 md:mt-7 flex flex-col gap-2 w-64 md:w-80">
          {hasProgress && (
            <button className="btn-rune btn-rune-primary text-sm" onClick={() => { audio.ensureStarted(); audio.click(); onContinue(); }}>
              <Play size={17} className="fill-current" /> Continue · Lv {save.lastLevel}
            </button>
          )}
          <button className={`btn-rune text-sm ${hasProgress ? '' : 'btn-rune-primary'}`} onClick={() => { audio.ensureStarted(); audio.click(); onNewGame(); }}>
            <Landmark size={17} /> {hasProgress ? 'New Expedition' : 'Begin the Expedition'}
          </button>
          <button className="btn-rune text-sm" onClick={() => { audio.ensureStarted(); audio.click(); onOpenLevels(); }}>
            <Map size={17} /> Level Selection
          </button>
          <button className="btn-rune text-sm" onClick={() => { audio.click(); onOpenSettings(); }}>
            <Settings size={17} /> Settings
          </button>
          <button className="btn-rune text-sm" onClick={() => { audio.click(); onOpenCredits(); }}>
            <ScrollText size={17} /> Credits
          </button>
          <button className="btn-rune text-sm" onClick={() => { audio.click(); setExitConfirm(true); }}>
            <DoorOpen size={17} /> Exit Game
          </button>
        </nav>

        {/* expedition ledger */}
        <div className="mt-5 md:mt-7 flex items-center gap-5 text-[10px] md:text-[11px] tracking-[0.22em] uppercase text-stone-500">
          <span className="flex items-center gap-1.5"><Landmark size={13} className="text-[#d4af37]" /> {completed}/30 Seals Broken</span>
          <span className="flex items-center gap-1.5"><Star size={13} className="text-[#f5d76e]" /> {totalStars} Stars</span>
          <span className="flex items-center gap-1.5"><Trophy size={13} className="text-amber-500" /> {save.achievements.length}/12 Relics of Renown</span>
        </div>
      </div>

      {/* bottom-right edition tag */}
      <div className="absolute bottom-4 right-5 md:right-8 text-right z-10">
        <div className="text-[9px] md:text-[10px] tracking-[0.4em] text-stone-600 uppercase">Windows Edition · v1.0</div>
        <div className="text-[9px] tracking-[0.25em] text-stone-700 uppercase mt-0.5">© 2026 Lost Dimensions Interactive</div>
      </div>

      {/* ===== exit overlay ===== */}
      {exitConfirm && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/75 backdrop-blur-md">
          <div className="modal-in panel-ancient max-w-md w-full p-8 text-center mx-4">
            <Sparkles size={36} className="text-[#d4af37] mx-auto mb-3" />
            <h2 className="font-display text-2xl font-bold gold-text etched">THE EXPEDITION RESTS?</h2>
            <p className="text-stone-400 text-sm mt-2 font-serif-body">Your progress is inscribed in the save-stone. The temple will wait for your return. Close this window whenever you are ready.</p>
            <div className="flex flex-col gap-2.5 mt-6">
              <button className="btn-rune btn-rune-primary justify-center" onClick={() => { window.close(); setExitConfirm(false); }}>
                <MousePointerClick size={16} /> Close the Game
              </button>
              <button className="btn-rune justify-center" onClick={() => { audio.click(); setExitConfirm(false); }}>
                <X size={16} /> Not Yet — Return
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
