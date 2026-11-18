/* ============================================================
   MYSTERY OF THE LOST DIMENSIONS — Classic Puzzle Modules
   SymbolMatch · Sequence · CombinationLock · Pattern
   ============================================================ */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronUp, ChevronDown, Check, X, Sparkles, KeyRound, ScrollText } from 'lucide-react';
import { audio } from '../../game/audio';
import type { SymbolPuzzleCfg, SequencePuzzleCfg, ComboPuzzleCfg, PatternPuzzleCfg } from '../../game/levels';

/* ============ SYMBOL MATCH (memory pairs) ============ */
const GLYPH_POOL = ['ᚠ', 'ᚢ', 'ᚦ', 'ᚨ', 'ᚱ', 'ᚲ', 'ᚷ', 'ᚹ', 'ᚺ', 'ᚾ'];

export function SymbolMatch({ cfg, onSolve }: { cfg: SymbolPuzzleCfg; onSolve: () => void }) {
  const cards = useMemo(() => {
    const chosen = GLYPH_POOL.slice(0, cfg.pairs);
    const doubled = [...chosen, ...chosen];
    for (let i = doubled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [doubled[i], doubled[j]] = [doubled[j], doubled[i]];
    }
    return doubled.map((glyph, i) => ({ id: i, glyph }));
  }, [cfg.pairs]);

  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [moves, setMoves] = useState(0);
  const [busy, setBusy] = useState(false);
  const [wrong, setWrong] = useState<number[]>([]);
  const solvedRef = useRef(false);

  useEffect(() => {
    if (matched.size === GLYPH_POOL.slice(0, cfg.pairs).length && !solvedRef.current) {
      solvedRef.current = true;
      const t = setTimeout(onSolve, 650);
      return () => clearTimeout(t);
    }
  }, [matched, cfg.pairs, onSolve]);

  const flip = (card: { id: number; glyph: string }) => {
    if (busy || flipped.includes(card.id) || matched.has(card.glyph)) return;
    audio.click();
    const next = [...flipped, card.id];
    setFlipped(next);
    if (next.length === 2) {
      setBusy(true);
      setMoves(m => m + 1);
      const [a, b] = next;
      const ga = cards[a].glyph, gb = cards[b].glyph;
      if (ga === gb) {
        window.setTimeout(() => {
          audio.success();
          setMatched(prev => new Set(prev).add(ga));
          setFlipped([]);
          setBusy(false);
        }, 420);
      } else {
        setWrong(next);
        audio.sealedThud();
        window.setTimeout(() => { setFlipped([]); setWrong([]); setBusy(false); }, 780);
      }
    }
  };

  return (
    <div>
      <p className="text-center text-stone-300 text-sm mb-3 font-serif-body">Attune the twin glyphs etched in the temple stone.</p>
      <div className="flex items-center justify-between mb-2 px-1">
        <span className="text-[10px] tracking-[0.3em] uppercase text-stone-500">Moves <span className="text-amber-300">{moves}</span></span>
        <span className="text-[10px] tracking-[0.3em] uppercase text-stone-500">Attuned <span className="text-amber-300">{matched.size}/{cfg.pairs}</span></span>
      </div>
      <div className={`grid gap-2 mx-auto ${cfg.pairs > 4 ? 'grid-cols-5 max-w-md' : 'grid-cols-3 max-w-xs'}`}>
        {cards.map(card => {
          const isOpen = flipped.includes(card.id) || matched.has(card.glyph);
          const isWrong = wrong.includes(card.id);
          const isMatched = matched.has(card.glyph);
          return (
            <button
              key={card.id}
              onClick={() => flip(card)}
              aria-label={isOpen ? `Glyph ${card.glyph}` : 'Hidden glyph'}
              className={`relative aspect-[3/4] rounded-sm transition-all duration-300 select-none
                ${isMatched ? 'border-2 border-[#d4af37] shadow-[0_0_18px_rgba(212,175,55,0.4)] bg-[#2a2413]' : 'border border-[#d4af37]/35'}
                ${!isOpen ? 'bg-gradient-to-br from-[#2e2a33] via-[#1c1a22] to-[#121016] hover:border-[#d4af37]/70 hover:-translate-y-0.5 cursor-pointer' : ''}
                ${isWrong ? 'border-red-500/80 bg-red-950/40' : ''}`}
            >
              {isOpen ? (
                <span className={`absolute inset-0 flex items-center justify-center font-serif text-3xl ${isMatched ? 'text-[#f5d76e]' : 'text-amber-100'}`}>{card.glyph}</span>
              ) : (
                <span className="absolute inset-0 flex flex-col items-center justify-center gap-1">
                  <span className="text-[#d4af37]/55 text-xl leading-none">✦</span>
                  <span className="w-6 h-px bg-[#d4af37]/40" />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ============ SEQUENCE ORACLE ============ */
export function SequencePuzzle({ cfg, onSolve }: { cfg: SequencePuzzleCfg; onSolve: () => void }) {
  const [qi, setQi] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [result, setResult] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [shake, setShake] = useState(0);
  const solvedRef = useRef(false);
  const q = cfg.questions[qi];

  const choose = (opt: number) => {
    if (result === 'correct') return;
    setPicked(opt);
    if (opt === q.answer) {
      setResult('correct');
      audio.dialTick();
      window.setTimeout(() => {
        if (qi + 1 >= cfg.questions.length) {
          if (!solvedRef.current) { solvedRef.current = true; onSolve(); }
        } else {
          setQi(v => v + 1); setPicked(null); setResult('idle');
        }
      }, 950);
    } else {
      setResult('wrong');
      setShake(s => s + 1);
      audio.fail();
      window.setTimeout(() => { setPicked(null); setResult('idle'); }, 650);
    }
  };

  return (
    <div className="text-center">
      <div className="flex items-center justify-center gap-2 mb-3">
        {cfg.questions.map((_, i) => (
          <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${i < qi ? 'w-10 bg-[#d4af37]' : i === qi ? 'w-10 bg-[#f5d76e] animate-pulse' : 'w-6 bg-stone-700'}`} />
        ))}
      </div>
      <p className="text-stone-400 text-[10px] tracking-[0.35em] uppercase mb-2">Inscription {qi + 1} of {cfg.questions.length} — name the next number</p>
      <div className="flex items-center justify-center gap-2 md:gap-3 flex-wrap my-4">
        {q.series.map((n, i) => (
          <React.Fragment key={i}>
            <div className="w-12 h-12 md:w-14 md:h-14 flex items-center justify-center font-display text-lg md:text-xl font-bold text-amber-100 border border-[#d4af37]/40 bg-black/40 rounded-sm">{n}</div>
            <div className="text-[#d4af37]/60">→</div>
          </React.Fragment>
        ))}
        <div className="w-12 h-12 md:w-14 md:h-14 flex items-center justify-center font-display text-2xl font-bold text-[#f5d76e] border-2 border-dashed border-[#d4af37] bg-[#d4af37]/10 rounded-sm animate-pulse">?</div>
      </div>
      <div key={shake} className={shake > 0 ? 'shake-hard' : ''}>
        <div className="grid grid-cols-2 gap-2 max-w-sm mx-auto">
          {q.options.map(opt => {
            const isPicked = picked === opt;
            const state = !isPicked ? 'idle' : result === 'correct' ? 'correct' : 'wrong';
            return (
              <button key={opt} onClick={() => choose(opt)}
                className={`h-14 font-display text-2xl font-bold rounded-sm border transition-all duration-200
                  ${state === 'idle' ? 'border-[#d4af37]/30 text-stone-200 hover:border-[#d4af37] hover:text-[#f5d76e] hover:bg-[#d4af37]/10' : ''}
                  ${state === 'correct' ? 'border-emerald-400 text-emerald-300 bg-emerald-500/15 shadow-[0_0_22px_rgba(52,211,153,0.35)]' : ''}
                  ${state === 'wrong' ? 'border-red-500 text-red-300 bg-red-950/40' : ''}`}>
                {opt}
              </button>
            );
          })}
        </div>
      </div>
      {result === 'correct' && (
        <div className="toast-in mt-3 flex items-center justify-center gap-2 text-emerald-300/90 text-xs tracking-wider">
          <Check size={14} /> {q.rule}
        </div>
      )}
    </div>
  );
}

/* ============ COMBINATION LOCK ============ */
export function CombinationLock({ cfg, onSolve }: { cfg: ComboPuzzleCfg; onSolve: () => void }) {
  const [digits, setDigits] = useState<number[]>(() => Array(cfg.dials).fill(0));
  const [shake, setShake] = useState(0);
  const [flash, setFlash] = useState<'idle' | 'wrong' | 'right'>('idle');
  const [attempts, setAttempts] = useState(0);
  const solvedRef = useRef(false);

  const step = (i: number, delta: number) => {
    audio.dialTick();
    setDigits(d => d.map((v, j) => (j === i ? (v + delta + 10) % 10 : v)));
  };

  const engage = () => {
    if (solvedRef.current) return;
    const ok = digits.every((d, i) => d === cfg.code[i]);
    if (ok) {
      solvedRef.current = true;
      setFlash('right');
      onSolve();
    } else {
      setFlash('wrong');
      setShake(s => s + 1);
      setAttempts(a => a + 1);
      audio.fail();
      window.setTimeout(() => setFlash('idle'), 600);
    }
  };

  return (
    <div>
      {/* inscription */}
      <div className="mb-4 border border-[#d4af37]/30 bg-black/45 rounded-sm px-4 py-3 text-center">
        <div className="flex items-center justify-center gap-2 text-[#d4af37]/80 text-[10px] tracking-[0.35em] uppercase mb-1.5">
          <ScrollText size={12} /> {cfg.clueTitle}
        </div>
        <p className="font-serif-body italic text-amber-100/90 text-sm md:text-[15px] leading-snug">{cfg.clue}</p>
      </div>

      {/* dials */}
      <div key={shake} className={`flex items-start justify-center gap-3 md:gap-5 ${shake > 0 ? 'shake-hard' : ''}`}>
        {digits.map((d, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <button onClick={() => step(i, 1)} className="icon-btn !w-12 !h-9" aria-label="Dial up"><ChevronUp size={18} /></button>
            <div
              onWheel={e => step(i, e.deltaY < 0 ? 1 : -1)}
              className={`w-16 h-24 md:w-[4.5rem] md:h-28 flex items-center justify-center font-display font-bold text-5xl md:text-6xl rounded-sm border-2 cursor-ns-resize transition-colors duration-200
                ${flash === 'wrong' ? 'border-red-500 text-red-300' : flash === 'right' ? 'border-emerald-400 text-emerald-300' : 'border-[#d4af37]/55 text-amber-100'}
                bg-gradient-to-b from-[#141019] via-[#241f2e] to-[#141019]`}
            >{d}</div>
            <button onClick={() => step(i, -1)} className="icon-btn !w-12 !h-9" aria-label="Dial down"><ChevronDown size={18} /></button>
          </div>
        ))}
      </div>

      <button onClick={engage} className="btn-rune btn-rune-primary mt-5 mx-auto !tracking-[0.3em]">
        <KeyRound size={17} /> Engage the Seal
      </button>
      {attempts > 0 && <p className="text-center text-red-400/80 text-[11px] mt-2 tracking-widest uppercase">The mechanism rejects you · {attempts} {attempts === 1 ? 'attempt' : 'attempts'}</p>}
    </div>
  );
}

/* ============ PATTERN MATRIX ============ */
export function PatternPuzzle({ cfg, onSolve }: { cfg: PatternPuzzleCfg; onSolve: () => void }) {
  const [qi, setQi] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [result, setResult] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [shake, setShake] = useState(0);
  const solvedRef = useRef(false);
  const q = cfg.questions[qi];

  const choose = (opt: string) => {
    if (result === 'correct') return;
    setPicked(opt);
    if (opt === q.answer) {
      setResult('correct');
      audio.dialTick();
      window.setTimeout(() => {
        if (qi + 1 >= cfg.questions.length) {
          if (!solvedRef.current) { solvedRef.current = true; onSolve(); }
        } else { setQi(v => v + 1); setPicked(null); setResult('idle'); }
      }, 950);
    } else {
      setResult('wrong');
      setShake(s => s + 1);
      audio.fail();
      window.setTimeout(() => { setPicked(null); setResult('idle'); }, 650);
    }
  };

  return (
    <div className="text-center">
      <p className="text-stone-400 text-[10px] tracking-[0.35em] uppercase mb-3">Sacred Matrix {qi + 1} of {cfg.questions.length} — complete the pattern</p>
      <div key={shake} className={`grid grid-cols-3 gap-2 w-44 h-44 md:w-48 md:h-48 mx-auto ${shake > 0 ? 'shake-hard' : ''}`}>
        {q.grid.map((cell, i) => (
          <div key={i} className={`flex items-center justify-center text-3xl md:text-4xl rounded-sm border
            ${cell === null
              ? 'border-dashed border-2 border-[#d4af37] bg-[#d4af37]/10 text-[#f5d76e] animate-pulse font-bold'
              : 'border-[#d4af37]/25 bg-black/45 text-amber-100'}`}>
            {cell === null ? '?' : cell}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-4 gap-2 max-w-xs mx-auto mt-4">
        {q.options.map(opt => {
          const isPicked = picked === opt;
          const state = !isPicked ? 'idle' : result === 'correct' ? 'correct' : 'wrong';
          return (
            <button key={opt} onClick={() => choose(opt)}
              className={`h-16 text-3xl rounded-sm border transition-all duration-200
                ${state === 'idle' ? 'border-[#d4af37]/30 text-stone-200 hover:border-[#d4af37] hover:bg-[#d4af37]/10' : ''}
                ${state === 'correct' ? 'border-emerald-400 text-emerald-300 bg-emerald-500/15' : ''}
                ${state === 'wrong' ? 'border-red-500 text-red-300 bg-red-950/40' : ''}`}>
              {opt}
            </button>
          );
        })}
      </div>
      {result === 'correct' && (
        <div className="toast-in mt-3 flex items-center justify-center gap-2 text-emerald-300/90 text-xs tracking-wider">
          <Sparkles size={13} /> {q.rule}
        </div>
      )}
      {result === 'wrong' && <p className="mt-2 flex items-center justify-center gap-1 text-red-400/90 text-[11px] uppercase tracking-widest"><X size={12} /> The matrix rejects the glyph</p>}
    </div>
  );
}
