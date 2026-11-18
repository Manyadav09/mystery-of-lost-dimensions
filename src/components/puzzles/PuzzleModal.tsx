import React from 'react';
import { X, Lightbulb, Flame, Check } from 'lucide-react';
import { audio } from '../../game/audio';

interface PuzzleModalProps {
  title: string;
  codeName: string;
  difficulty: number;
  hint: string;
  hintVisible: boolean;
  hintsUsed: number;
  onToggleHint: () => void;
  onClose: () => void;
  children: React.ReactNode;
  solved: boolean;
}

export function PuzzleModal({ title, codeName, difficulty, hint, hintVisible, hintsUsed, onToggleHint, onClose, children, solved }: PuzzleModalProps) {
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center p-4 md:p-8">
      <div className="absolute inset-0 bg-black/72 backdrop-blur-[6px]" onClick={solved ? undefined : onClose} />
      <div className="modal-in panel-ancient relative w-full max-w-2xl max-h-full overflow-y-auto nice-scroll rounded-sm">
        {/* corner rivets */}
        {['top-2 left-2', 'top-2 right-2', 'bottom-2 left-2', 'bottom-2 right-2'].map(pos => (
          <div key={pos} className={`absolute ${pos} w-1.5 h-1.5 rounded-full bg-[#d4af37]/50`} />
        ))}

        {!solved && (
          <button onClick={() => { audio.uiBack(); onClose(); }} className="icon-btn absolute top-3 right-3 z-10 !w-9 !h-9" aria-label="Step away from the mechanism">
            <X size={17} strokeWidth={2.4} />
          </button>
        )}

        {/* header */}
        <div className="px-6 pt-5 pb-3 border-b border-[#d4af37]/18 text-center">
          <div className="flex items-center justify-center gap-3 mb-1">
            <span className="font-mono text-[10px] tracking-[0.35em] text-[#d4af37]/70">{codeName}</span>
            <span className="flex gap-1" aria-label={`Difficulty ${difficulty} of 5`}>
              {Array.from({ length: 5 }, (_, i) => (
                <Flame key={i} size={12} className={i < difficulty ? 'text-orange-400 fill-orange-400/60' : 'text-stone-700'} />
              ))}
            </span>
          </div>
          <h2 className="font-display text-xl md:text-2xl font-bold gold-text etched leading-tight">{title}</h2>
        </div>

        {/* body */}
        <div className="px-5 py-4 md:px-7 md:py-5">
          {solved ? (
            <div className="flex flex-col items-center justify-center py-10 gap-4">
              <div className="success-burst w-24 h-24 rounded-full border-2 border-[#d4af37] flex items-center justify-center bg-[#d4af37]/10 shadow-[0_0_60px_rgba(212,175,55,0.45)]">
                <Check size={52} strokeWidth={3} className="text-[#f5d76e]" />
              </div>
              <div className="font-display text-2xl font-bold gold-text etched text-center">THE SEAL YIELDS</div>
              <p className="text-stone-400 text-sm tracking-[0.25em] uppercase">The way opens</p>
            </div>
          ) : (
            children
          )}
        </div>

        {/* footer: hint system */}
        {!solved && (
          <div className="px-5 pb-4 md:px-7">
            {hintVisible ? (
              <div className="toast-in flex items-start gap-3 border border-amber-400/40 bg-amber-400/10 px-4 py-3 rounded-sm">
                <Lightbulb size={17} className="text-amber-300 mt-0.5 shrink-0" />
                <p className="text-amber-100/90 text-sm leading-snug font-serif-body">{hint}</p>
              </div>
            ) : (
              <button
                onClick={() => { audio.hint(); onToggleHint(); }}
                className="flex items-center gap-2 mx-auto text-[11px] tracking-[0.3em] uppercase text-amber-200/70 hover:text-amber-200 transition-colors border border-amber-400/25 hover:border-amber-400/60 px-4 py-2 rounded-sm"
              >
                <Lightbulb size={14} /> Whisper a Hint {hintsUsed > 0 && <span className="text-amber-400/70">({hintsUsed} used)</span>}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
