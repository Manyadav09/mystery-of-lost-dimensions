/* ============================================================
   MYSTERY OF THE LOST DIMENSIONS — Mechanism Puzzle Modules
   CrystalAlign · LaserBeam · GearTrain · GlyphEcho (Simon)
   ============================================================ */
import { useEffect, useMemo, useRef, useState } from 'react';
import { MoveUp, Sun, Target, Lock, RotateCcw, ChevronRight, ArrowUpNarrowWide, ArrowDownWideNarrow, Hourglass, Ear, Check } from 'lucide-react';
import { audio } from '../../game/audio';
import type { CrystalPuzzleCfg, LaserPuzzleCfg, GearsPuzzleCfg, SimonPuzzleCfg, LaserOrientation } from '../../game/levels';

/* ============ CRYSTAL ALIGN ============ */
export function CrystalAlign({ cfg, onSolve }: { cfg: CrystalPuzzleCfg; onSolve: () => void }) {
  const [rot, setRot] = useState<number[]>(() => cfg.starts.map(s => ((s % 4) + 4) % 4));
  const solvedRef = useRef(false);
  const aligned = rot.map(r => r % 4 === 0);
  const alignedCount = aligned.filter(Boolean).length;

  useEffect(() => {
    if (alignedCount === rot.length && !solvedRef.current) {
      solvedRef.current = true;
      audio.success();
      const t = setTimeout(onSolve, 700);
      return () => clearTimeout(t);
    }
  }, [alignedCount, rot.length, onSolve]);

  const turn = (i: number) => {
    audio.rotate();
    setRot(r => r.map((v, j) => (j === i ? (v + 1) % 4 : v)));
  };

  return (
    <div className="text-center">
      <div className="flex flex-col items-center gap-0.5 mb-3 text-cyan-300">
        <MoveUp size={20} className="animate-bounce" />
        <span className="text-[10px] tracking-[0.4em] uppercase text-cyan-200/80">N · The Great Door</span>
      </div>
      <p className="text-stone-300 text-sm font-serif-body mb-4">{cfg.flavor}</p>
      <div className="flex items-end justify-center gap-3 md:gap-5 flex-wrap">
        {cfg.runes.map((rune, i) => (
          <button key={i} onClick={() => turn(i)} aria-label={`Rotate crystal ${i + 1}`}
            className="group flex flex-col items-center gap-2 outline-none">
            <div
              className={`relative w-20 h-28 md:w-24 md:h-32 flex flex-col items-center justify-center gap-1 transition-all duration-300
                ${aligned[i] ? 'crystal-aligned' : ''}`}
              style={{ clipPath: 'polygon(50% 0%, 100% 22%, 88% 82%, 50% 100%, 12% 82%, 0% 22%)' }}
            >
              <div className={`absolute inset-0 transition-all duration-300
                ${aligned[i]
                  ? 'bg-gradient-to-b from-cyan-300/70 via-cyan-500/50 to-cyan-900/80'
                  : 'bg-gradient-to-b from-amber-200/40 via-amber-600/30 to-stone-900/80'}`} />
              <div
                className="relative font-serif text-3xl md:text-4xl text-white/95 transition-transform duration-300"
                style={{ transform: `rotate(${rot[i] * 90}deg)`, textShadow: '0 0 14px rgba(255,255,255,0.6)' }}
              >{rune}</div>
            </div>
            <div className="flex gap-1.5">
              {[0, 1, 2, 3].map(p => (
                <div key={p} className={`w-1.5 h-1.5 rounded-full transition-all ${rot[i] === p ? (aligned[i] ? 'bg-cyan-300 shadow-[0_0_6px_#67e8f9]' : 'bg-amber-300') : 'bg-stone-700'}`} />
              ))}
            </div>
            <span className={`text-[9px] tracking-[0.3em] uppercase ${aligned[i] ? 'text-cyan-300' : 'text-stone-500'}`}>{aligned[i] ? 'Aligned' : `Turn ${rot[i]}`}</span>
          </button>
        ))}
      </div>
      <p className="mt-4 text-[11px] tracking-[0.3em] uppercase text-stone-500">{alignedCount} / {rot.length} in accord</p>
    </div>
  );
}

/* ============ LASER BEAM ============ */
const LASER_DIRS = { R: [1, 0], D: [0, 1], L: [-1, 0], U: [0, -1] } as const;
const SLASH: Record<string, 'R' | 'U' | 'L' | 'D'> = { R: 'U', U: 'R', L: 'D', D: 'L' };
const BACK: Record<string, 'R' | 'U' | 'L' | 'D'> = { R: 'D', D: 'R', L: 'U', U: 'L' };
type LaserDir = 'R' | 'U' | 'L' | 'D';

function traceBeam(cfg: LaserPuzzleCfg, mirrors: { x: number; y: number; o: LaserOrientation }[]) {
  const grid = new Map(mirrors.map(m => [`${m.x},${m.y}`, m.o]));
  let x = cfg.emitter.x, y = cfg.emitter.y;
  let dir: LaserDir = cfg.emitter.dir;
  const pts: { x: number; y: number }[] = [{ x, y }];
  let hit = false;
  for (let s = 0; s < 220; s++) {
    const [dx, dy] = LASER_DIRS[dir];
    x += dx; y += dy;
    if (x < 0 || y < 0 || x >= cfg.w || y >= cfg.h) { pts.push({ x: x - dx * 0.12, y: y - dy * 0.12 }); break; }
    if (x === cfg.receptor.x && y === cfg.receptor.y) { pts.push({ x, y }); hit = true; break; }
    const o = grid.get(`${x},${y}`);
    if (o) {
      pts.push({ x, y });
      dir = o === '/' ? SLASH[dir] : BACK[dir];
    }
  }
  return { pts, hit };
}

export function LaserPuzzle({ cfg, onSolve }: { cfg: LaserPuzzleCfg; onSolve: () => void }) {
  const [mirrors, setMirrors] = useState(() => cfg.mirrors.map(m => ({ ...m })));
  const solvedRef = useRef(false);
  const { pts, hit } = useMemo(() => traceBeam(cfg, mirrors), [cfg, mirrors]);

  useEffect(() => {
    if (hit && !solvedRef.current) {
      solvedRef.current = true;
      audio.success();
      const t = setTimeout(onSolve, 850);
      return () => clearTimeout(t);
    }
  }, [hit, onSolve]);

  const toggle = (idx: number) => {
    if (mirrors[idx].locked) { audio.sealedThud(); return; }
    audio.rotate();
    setMirrors(ms => ms.map((m, i) => (i === idx ? { ...m, o: m.o === '/' ? '\\' : '/' } : m)));
  };

  const linePoints = pts.map(p => `${p.x + 0.5},${p.y + 0.5}`).join(' ');

  return (
    <div className="text-center">
      <p className="text-stone-300 text-sm font-serif-body mb-2">Turn the mirrors. Guide the beam into the dormant lens.</p>
      <div className="relative mx-auto select-none" style={{ width: 'min(100%, 430px)', aspectRatio: `${cfg.w} / ${cfg.h}` }}>
        {/* grid */}
        <div className="absolute inset-0 grid rounded-sm overflow-hidden border border-cyan-400/25 bg-[#040d12]"
          style={{ gridTemplateColumns: `repeat(${cfg.w}, 1fr)`, gridTemplateRows: `repeat(${cfg.h}, 1fr)` }}>
          {Array.from({ length: cfg.w * cfg.h }, (_, i) => (
            <div key={i} className="border border-white/[0.045]" />
          ))}
        </div>

        {/* beam */}
        <svg viewBox={`0 0 ${cfg.w} ${cfg.h}`} className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none">
          <polyline points={linePoints} fill="none" stroke="#67e8f9" strokeOpacity="0.28" strokeWidth="0.34" strokeLinejoin="round" strokeLinecap="round" />
          <polyline className="beam-line" points={linePoints} fill="none" stroke="#a5f3fc" strokeWidth="0.1" strokeLinejoin="round" strokeLinecap="round" style={{ filter: 'drop-shadow(0 0 2px #22d3ee)' }} />
        </svg>

        {/* emitter */}
        <div className="absolute flex items-center justify-center"
          style={{ left: `${(cfg.emitter.x / cfg.w) * 100}%`, top: `${(cfg.emitter.y / cfg.h) * 100}%`, width: `${100 / cfg.w}%`, height: `${100 / cfg.h}%` }}>
          <div className="w-[68%] h-[68%] rounded-full bg-amber-400/90 flex items-center justify-center shadow-[0_0_18px_rgba(251,191,36,0.8)]">
            <Sun size={20} className="text-amber-950" strokeWidth={2.5} />
          </div>
        </div>

        {/* receptor */}
        <div className="absolute flex items-center justify-center"
          style={{ left: `${(cfg.receptor.x / cfg.w) * 100}%`, top: `${(cfg.receptor.y / cfg.h) * 100}%`, width: `${100 / cfg.w}%`, height: `${100 / cfg.h}%` }}>
          <div className={`w-[72%] h-[72%] rounded-full flex items-center justify-center border-2 transition-all duration-300
            ${hit ? 'border-emerald-300 bg-emerald-400/30 shadow-[0_0_26px_rgba(52,211,153,0.9)] scale-110' : 'border-cyan-300/70 bg-cyan-400/10 shadow-[0_0_14px_rgba(103,232,249,0.4)]'}`}>
            <Target size={20} className={hit ? 'text-emerald-300' : 'text-cyan-300'} strokeWidth={2.4} />
          </div>
        </div>

        {/* mirrors */}
        {mirrors.map((m, i) => (
          <button key={i} onClick={() => toggle(i)} disabled={m.locked}
            aria-label={m.locked ? 'Welded mirror' : 'Rotate mirror'}
            className="absolute flex items-center justify-center group"
            style={{ left: `${(m.x / cfg.w) * 100}%`, top: `${(m.y / cfg.h) * 100}%`, width: `${100 / cfg.w}%`, height: `${100 / cfg.h}%` }}>
            <svg viewBox="0 0 10 10" className={`w-[78%] h-[78%] transition-transform duration-200 ${m.locked ? '' : 'group-hover:scale-110'}`}>
              <line x1="1.2" y1="8.8" x2="8.8" y2="1.2" stroke={m.locked ? '#78716c' : '#e7e5e4'} strokeWidth="1.5" strokeOpacity="0.35" strokeLinecap="round"
                transform={m.o === '\\' ? 'rotate(90 5 5)' : undefined} />
              <line x1="1.2" y1="8.8" x2="8.8" y2="1.2" stroke={m.locked ? '#a8a29e' : '#fde68a'} strokeWidth="0.85" strokeLinecap="round" style={{ filter: m.locked ? undefined : 'drop-shadow(0 0 1.4px #f59e0b)' }}
                transform={m.o === '\\' ? 'rotate(90 5 5)' : undefined} />
            </svg>
            {m.locked && (
              <div className="absolute bottom-0.5 right-0.5 bg-stone-800/90 rounded-sm p-0.5">
                <Lock size={9} className="text-stone-400" />
              </div>
            )}
          </button>
        ))}
      </div>
      <div className="flex items-center justify-center gap-4 mt-3">
        <button onClick={() => { audio.uiBack(); setMirrors(cfg.mirrors.map(m => ({ ...m }))); }}
          className="flex items-center gap-2 text-[10px] tracking-[0.3em] uppercase text-stone-400 hover:text-stone-100 transition-colors border border-white/10 hover:border-white/30 px-3 py-1.5">
          <RotateCcw size={12} /> Reset
        </button>
        <span className={`text-[10px] tracking-[0.35em] uppercase ${hit ? 'text-emerald-300' : 'text-cyan-200/60'}`}>
          {hit ? '· Lens Struck ·' : '· Beam Unresolved ·'}
        </span>
      </div>
    </div>
  );
}

/* ============ GEAR TRAIN ============ */
function gearPoints(cx: number, cy: number, rOuter: number, rInner: number, teeth: number): string {
  const pts: string[] = [];
  const step = (Math.PI * 2) / teeth;
  const polar = (r: number, a: number) => `${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`;
  for (let i = 0; i < teeth; i++) {
    const a = i * step;
    pts.push(polar(rInner, a), polar(rOuter, a + step * 0.3), polar(rOuter, a + step * 0.52), polar(rInner, a + step * 0.82));
  }
  return pts.join(' ');
}

export function GearTrain({ cfg, onSolve }: { cfg: GearsPuzzleCfg; onSolve: () => void }) {
  const [engaged, setEngaged] = useState<number[]>([]); // indices into display order
  const [shake, setShake] = useState(0);
  const [spin, setSpin] = useState(0);
  const solvedRef = useRef(false);

  // display order is shuffled each mount — the player must read the tooth counts, not the slots
  const gears = useMemo(() => {
    const arr = cfg.teeth.map((t, i) => ({ teeth: t, id: i }));
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    // never present them in perfect target order
    const sorted = [...arr].sort((a, b) => (cfg.order === 'asc' ? a.teeth - b.teeth : b.teeth - a.teeth));
    if (arr.every((g, i) => g.id === sorted[i].id)) arr.push(arr.shift()!);
    return arr;
  }, [cfg.teeth, cfg.order]);
  const target = useMemo(
    () => [...gears].sort((a, b) => (cfg.order === 'asc' ? a.teeth - b.teeth : b.teeth - a.teeth)),
    [gears, cfg.order]
  );

  const click = (g: { teeth: number; id: number }) => {
    if (solvedRef.current) return;
    const expect = target[engaged.length];
    if (g.id === expect.id) {
      audio.gearClang();
      setSpin(s => s + 1);
      const next = [...engaged, g.id];
      setEngaged(next);
      if (next.length === target.length) {
        solvedRef.current = true;
        window.setTimeout(onSolve, 750);
      }
    } else {
      audio.fail();
      setShake(s => s + 1);
      setEngaged([]);
    }
  };

  const OrderIcon = cfg.order === 'asc' ? ArrowUpNarrowWide : ArrowDownWideNarrow;

  return (
    <div className="text-center">
      <div className="flex items-center justify-center gap-2 mb-1 text-amber-300">
        <OrderIcon size={19} />
        <span className="text-[11px] tracking-[0.3em] uppercase">{cfg.order === 'asc' ? 'Engage smallest → largest' : 'Engage largest → smallest'}</span>
      </div>
      <p className="text-stone-400 text-xs font-serif-body mb-3">Read the tooth-count graven beneath each gear. One mistake and the line resets.</p>
      <div key={shake} className={`flex items-end justify-center gap-1.5 md:gap-3 flex-wrap ${shake > 0 ? 'shake-hard' : ''}`}>
        {gears.map(g => {
          const engagedIdx = engaged.indexOf(g.id);
          const isOn = engagedIdx !== -1;
          const rOuter = 15 + g.teeth * 0.42;
          const rInner = rOuter * 0.78;
          return (
            <button key={g.id} onClick={() => click(g)} aria-label={`Gear with ${g.teeth} teeth`}
              className="flex flex-col items-center gap-1 group outline-none">
              <svg width="92" height="92" viewBox="0 0 48 48" key={spin}
                className={`transition-colors duration-200 ${isOn ? 'drop-shadow-[0_0_10px_rgba(212,175,55,0.65)]' : 'group-hover:drop-shadow-[0_0_8px_rgba(212,175,55,0.35)]'}`}>
                <polygon points={gearPoints(24, 24, rOuter * 0.62, rInner * 0.62, Math.min(g.teeth, 20))}
                  fill={isOn ? '#8a6f1e' : '#3f3f46'}
                  stroke={isOn ? '#f5d76e' : '#a8a29e'} strokeWidth="0.7"
                  className={isOn ? 'gear-spin-once' : ''}
                  style={isOn ? { transformOrigin: '24px 24px', animation: 'gearSpin .9s cubic-bezier(.2,.9,.3,1)' } : { transformOrigin: '24px 24px' }} />
                <circle cx="24" cy="24" r={rInner * 0.24} fill="#18181b" stroke={isOn ? '#f5d76e' : '#71717a'} strokeWidth="0.8" />
              </svg>
              <span className={`font-mono text-xs ${isOn ? 'text-amber-300' : 'text-stone-400 group-hover:text-stone-200'}`}>{g.teeth}</span>
              {isOn && <span className="text-[8px] tracking-[0.3em] text-amber-400/90 uppercase">Engaged {engagedIdx + 1}</span>}
            </button>
          );
        })}
      </div>
      <p className="mt-3 text-[10px] tracking-[0.35em] uppercase text-stone-500">{engaged.length} / {gears.length} gears awake</p>
      <style>{`@keyframes gearSpin { from { transform: rotate(-50deg); } to { transform: rotate(0deg); } }`}</style>
    </div>
  );
}

/* ============ GLYPH ECHO (timed memory) ============ */
const ECHO_GLYPHS = ['ᚠ', 'ᚢ', 'ᚦ', 'ᚨ', 'ᚱ', 'ᚲ', 'ᚷ', 'ᚹ'];

export function GlyphEcho({ cfg, onSolve }: { cfg: SimonPuzzleCfg; onSolve: () => void }) {
  const [phase, setPhase] = useState<'idle' | 'showing' | 'input'>('idle');
  const [sequence] = useState(() => Array.from({ length: cfg.length }, () => Math.floor(Math.random() * ECHO_GLYPHS.length)));
  const [flash, setFlash] = useState(-1);       // glyph index lit during playback
  const [progress, setProgress] = useState(0);  // player input progress
  const [strikes, setStrikes] = useState(0);
  const [wrongTile, setWrongTile] = useState(-1);
  const [timeLeft, setTimeLeft] = useState(cfg.timeLimit);
  const solvedRef = useRef(false);

  // playback driver
  useEffect(() => {
    if (phase !== 'showing') return;
    setFlash(-1);
    const stepDur = 620, gap = 190;
    const timers: number[] = [];
    sequence.forEach((g, idx) => {
      timers.push(window.setTimeout(() => { setFlash(g); audio.dialTick(); }, idx * (stepDur + gap)));
      timers.push(window.setTimeout(() => setFlash(-1), idx * (stepDur + gap) + stepDur));
    });
    timers.push(window.setTimeout(() => { setPhase('input'); setProgress(0); setTimeLeft(cfg.timeLimit); }, sequence.length * (stepDur + gap) + 150));
    return () => timers.forEach(t => window.clearTimeout(t));
  }, [phase, sequence, cfg.timeLimit]);

  // countdown during input
  useEffect(() => {
    if (phase !== 'input') return;
    const iv = window.setInterval(() => {
      setTimeLeft(t => {
        if (t <= 0.1) {
          window.clearInterval(iv);
          strike();
          return 0;
        }
        if (t <= 3.05 && Math.abs(t % 1 - 0) < 0.1) audio.countdownTick();
        return +(t - 0.1).toFixed(1);
      });
    }, 100);
    return () => window.clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const strike = () => {
    setStrikes(s => s + 1);
    audio.fail();
    setPhase('idle');
    setProgress(0);
  };

  const press = (g: number) => {
    if (phase !== 'input') return;
    if (g === sequence[progress]) {
      audio.click();
      const next = progress + 1;
      setProgress(next);
      if (next === sequence.length) {
        if (!solvedRef.current) {
          solvedRef.current = true;
          setPhase('showing'); // freeze board; success plays through
          window.setTimeout(onSolve, 650);
        }
      }
    } else {
      setWrongTile(g);
      window.setTimeout(() => setWrongTile(-1), 450);
      strike();
    }
  };

  return (
    <div className="text-center">
      <p className="text-stone-300 text-sm font-serif-body mb-2">The void flares in sequence. Answer in the same rhythm.</p>

      {/* status row */}
      <div className="flex items-center justify-center gap-4 mb-3 text-[10px] tracking-[0.3em] uppercase">
        <span className="flex items-center gap-1.5 text-rose-300/90"><Hourglass size={12} /> {phase === 'input' ? `${timeLeft.toFixed(1)}s` : `${cfg.timeLimit}s`}</span>
        <span className="text-stone-500">·</span>
        <span className="text-stone-400">Strikes <span className="text-red-400">{strikes}</span></span>
        <span className="text-stone-500">·</span>
        <span className="text-stone-400">Progress <span className="text-amber-300">{progress}/{sequence.length}</span></span>
      </div>
      {/* time bar */}
      <div className="h-1.5 w-64 md:w-80 mx-auto bg-stone-800 rounded-full overflow-hidden mb-4">
        <div className={`h-full transition-all duration-100 ${timeLeft < 5 ? 'bg-red-500' : 'bg-gradient-to-r from-amber-500 to-rose-400'}`}
          style={{ width: `${(timeLeft / cfg.timeLimit) * 100}%` }} />
      </div>

      <div className="grid grid-cols-4 gap-2 max-w-xs mx-auto">
        {ECHO_GLYPHS.map((g, i) => (
          <button key={i} onClick={() => press(i)}
            className={`aspect-square rounded-sm border font-serif text-3xl md:text-4xl transition-all duration-150
              ${flash === i ? 'border-amber-300 bg-amber-400/30 text-amber-100 scale-110 shadow-[0_0_28px_rgba(251,191,36,0.6)]' : ''}
              ${wrongTile === i ? 'border-red-500 bg-red-950/50 text-red-300' : 'border-rose-400/25 bg-black/45 text-rose-100/90 hover:border-rose-300/60'}`}>
            {g}
          </button>
        ))}
      </div>

      {phase === 'idle' && (
        <button onClick={() => setPhase('showing')} className="btn-rune btn-rune-primary mt-4 mx-auto !tracking-[0.25em] text-xs">
          <Ear size={15} /> {strikes === 0 ? 'Heed the Echo' : 'Listen Again'}
        </button>
      )}
      {phase === 'showing' && <p className="mt-3 text-[11px] tracking-[0.4em] uppercase text-amber-300 animate-pulse flex items-center justify-center gap-2"><Ear size={13}/> The void speaks…</p>}
      {phase === 'input' && <p className="mt-3 text-[11px] tracking-[0.4em] uppercase text-rose-300 flex items-center justify-center gap-2"><ChevronRight size={13}/> Your answer ({sequence.length} beats)</p>}
      {solvedRef.current && <p className="mt-2 text-emerald-300 text-xs flex items-center justify-center gap-1"><Check size={13}/> The echo is yours.</p>}
    </div>
  );
}
