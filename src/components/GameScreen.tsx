/* ============================================================
   MYSTERY OF THE LOST DIMENSIONS — GameScreen
   First-person controller, HUD, interaction & puzzle flow.
   ============================================================ */
import { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  Pause, Play, Sparkles, Timer, X, DoorOpen, Target,
  RotateCcw, Home, Map as MapIcon, Star, Crown, Volume2, VolumeX, AlertTriangle, Footprints,
} from 'lucide-react';
import { audio, type AudioWorld } from '../game/audio';
import { buildLevel } from '../three/buildLevel';
import { WORLD_INFO, SHARDS_PER_LEVEL, type LevelDef } from '../game/levels';
import { ACHIEVEMENTS } from '../game/achievements';
import { PuzzleModal, PuzzleBody } from './puzzles';
import type { Settings } from '../game/save';

export interface RawCompletion {
  levelId: number;
  time: number;
  hintsUsed: number;
  shardIndices: number[];
  stars: number;
  score: number;
}

interface GameScreenProps {
  level: LevelDef;
  settings: Settings;
  onSettingsChange: (s: Settings) => void;
  onComplete: (raw: RawCompletion) => { newAchievements: string[] };
  onNextLevel: () => void;
  onExitToLevels: () => void;
  onMainMenu: () => void;
  hasNextLevel: boolean;
}

type Phase = 'playing' | 'paused' | 'complete' | 'failed';

const WORLD_AUDIO: Record<number, AudioWorld> = { 1: 'temple', 2: 'crystal', 3: 'lost' };

export function GameScreen({ level, settings, onSettingsChange, onComplete, onNextLevel, onExitToLevels, onMainMenu, hasNextLevel }: GameScreenProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<Phase>('playing');
  const [runId, setRunId] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [puzzleSolved, setPuzzleSolved] = useState(false);
  const [hintVisible, setHintVisible] = useState(false);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [shards, setShards] = useState<number[]>([]);
  const [shardPop, setShardPop] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [completion, setCompletion] = useState<{ stars: number; score: number; shardIndices: number[]; timeBonus: number; hintPenalty: number; newAchievements: string[] } | null>(null);
  const [showControls, setShowControls] = useState(true);
  const [tabletOpen, setTabletOpen] = useState(false);

  const elapsedRef = useRef(0);
  const phaseRef = useRef<Phase>('playing');
  const modalRef = useRef(false);
  const solvedRef = useRef(false);
  const doorOpenRef = useRef(0);
  const shardsRef = useRef<number[]>([]);
  const hintsRef = useRef(0);
  const completedRef = useRef(false);
  const promptRef = useRef<string | null>(null);
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  const world = WORLD_INFO[level.world - 1];
  const isHiddenPuzzle = level.type === 'hidden';
  const tabletOpenRef = useRef(false);
  const [isLocked, setIsLocked] = useState(false);

  /* ---------- toast helper ---------- */
  const toastTimer = useRef<number | null>(null);
  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2400);
  }, []);

  /* ---------- reset run state ---------- */
  const resetRunState = useCallback(() => {
    setPhase('playing'); phaseRef.current = 'playing';
    setModalOpen(false); modalRef.current = false;
    setPuzzleSolved(false); solvedRef.current = false;
    setHintVisible(false); setHintsUsed(0); hintsRef.current = 0;
    setShards([]); shardsRef.current = [];
    setElapsed(0); elapsedRef.current = 0;
    setCompletion(null); completedRef.current = false;
    doorOpenRef.current = 0;
    setPrompt(null); promptRef.current = null;
    setTabletOpen(false);
    setShowControls(true);
  }, []);

  const restart = useCallback(() => { resetRunState(); setRunId(r => r + 1); audio.uiBack(); }, [resetRunState]);

  /* ========== THREE.JS LIFECYCLE ========== */
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    audio.ensureStarted(WORLD_AUDIO[level.world]);
    audio.setWorld(WORLD_AUDIO[level.world]);

    const built = buildLevel(level);
    const scene = built.scene;
    const camera = new THREE.PerspectiveCamera(71, container.clientWidth / container.clientHeight, 0.08, 60);
    camera.rotation.order = 'YXZ';
    camera.position.set(0, 1.66, 5.35);
    let yaw = 0, pitch = 0;

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.28;
    container.appendChild(renderer.domElement);
    renderer.domElement.style.display = 'block';

    /* ----- input ----- */
    const keys = new Set<string>();
    const onKeyDown = (e: KeyboardEvent) => {
      keys.add(e.code);
      if (e.code === 'KeyE') tryInteract();
      if (e.code === 'Escape' && modalRef.current) closeModal();
    };
    const onKeyUp = (e: KeyboardEvent) => keys.delete(e.code);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    let lockAcquiredAt = 0;
    const onMouseMove = (e: MouseEvent) => {
      if (document.pointerLockElement !== renderer.domElement) return;
      // ignore the movement spike Chrome fires on pointer-lock acquisition
      if (performance.now() - lockAcquiredAt < 120) return;
      const mx = Math.max(-90, Math.min(90, e.movementX));
      const my = Math.max(-90, Math.min(90, e.movementY));
      const sens = 0.0023 * settingsRef.current.mouseSensitivity;
      yaw -= mx * sens;
      pitch -= my * sens;
      pitch = Math.max(-1.35, Math.min(1.35, pitch));
    };
    window.addEventListener('mousemove', onMouseMove);

    const requestLock = () => { renderer.domElement.requestPointerLock(); };
    const onContainerClick = () => {
      if (phaseRef.current !== 'playing') return;
      if (modalRef.current || tabletOpenRef.current) return;
      if (document.pointerLockElement !== renderer.domElement) requestLock();
      else tryInteract();
    };
    container.addEventListener('click', onContainerClick);

    const onLockChange = () => {
      const locked = document.pointerLockElement === renderer.domElement;
      if (locked) lockAcquiredAt = performance.now();
      setIsLocked(locked);
      if (!locked && phaseRef.current === 'playing' && !modalRef.current && !tabletOpenRef.current && !completedRef.current) {
        setPhase('paused'); phaseRef.current = 'paused';
      }
    };
    document.addEventListener('pointerlockchange', onLockChange);

    const onResize = () => {
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', onResize);

    /* ----- interaction raycasting ----- */
    const raycaster = new THREE.Raycaster();
    raycaster.far = 3.6;
    const center = new THREE.Vector2(0, 0);
    const interactables = [...built.interactables];

    function findInteract(): { id: string; label: string } | null {
      raycaster.setFromCamera(center, camera);
      const hits = raycaster.intersectObjects(interactables, true);
      for (const hit of hits) {
        let obj: THREE.Object3D | null = hit.object;
        while (obj) {
          const ud = (obj.userData as { interact?: { id: string; label: string } }).interact;
          if (ud) return ud;
          obj = obj.parent;
        }
      }
      return null;
    }

    function tryInteract() {
      if (phaseRef.current !== 'playing' || modalRef.current) return;
      const target = findInteract();
      if (!target) return;
      if (target.id === 'puzzle') {
        if (isHiddenPuzzle) {
          audio.hint();
          showToast('The relics are hidden among the stones — seek the golden glints');
          return;
        }
        audio.puzzleOpen();
        setModalOpen(true); modalRef.current = true;
        setIsLocked(false);
        document.exitPointerLock();
      } else if (target.id === 'tablet') {
        audio.click();
        setTabletOpen(true); tabletOpenRef.current = true;
        setIsLocked(false);
        document.exitPointerLock();
      } else if (target.id.startsWith('collectible-')) {
        const idx = parseInt(target.id.split('-')[1], 10);
        collect(idx);
      }
    }

    function collect(idx: number) {
      if (shardsRef.current.includes(idx)) return;
      shardsRef.current = [...shardsRef.current, idx];
      setShards(shardsRef.current);
      setShardPop(p => p + 1);
      audio.shardPickup();
      const mesh = scene.getObjectByName(`collectible-${idx}`);
      if (mesh) {
        scene.remove(mesh);
        const i = interactables.indexOf(mesh);
        if (i >= 0) interactables.splice(i, 1);
      }
      const remaining = interactables.filter(o => o.name.startsWith('collectible-')).length;
      showToast(isHiddenPuzzle ? `Relic recovered (${shardsRef.current.length})` : '+250 · Star Shard recovered');
      if (isHiddenPuzzle && remaining === 0 && !solvedRef.current) {
        solvedRef.current = true;
        window.setTimeout(() => {
          setPuzzleSolved(true);
          audio.success();
          showToast('The relics resonate — the mechanism awakens');
        }, 500);
      }
    }

    /* ----- main loop ----- */
    const lastDispRef = { current: -1 };
    const clock = new THREE.Clock();
    let bobPhase = 0, bobAmp = 0, lastStepCycle = 0;
    let raf = 0;
    const playerPos = new THREE.Vector3(0, 0, 5.35);

    const tick = () => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min(clock.getDelta(), 0.05);
      const t = clock.elapsedTime;
      const active = phaseRef.current === 'playing' && !modalRef.current && !tabletOpenRef.current;

      // timer (throttled to displayed precision to limit re-renders)
      if (active && !completedRef.current) {
        elapsedRef.current += dt;
        const precision = settingsRef.current.countdownTimer ? 10 : 1;
        const disp = Math.floor(elapsedRef.current * precision);
        if (disp !== lastDispRef.current) { lastDispRef.current = disp; setElapsed(elapsedRef.current); }
        if (settingsRef.current.countdownTimer) {
          const remaining = level.parTime - elapsedRef.current;
          if (remaining <= 0 && !completedRef.current) {
            completedRef.current = true;
            setPhase('failed'); phaseRef.current = 'failed';
            audio.fail();
            document.exitPointerLock();
          }
        }
      }

      // movement
      const locked = document.pointerLockElement === renderer.domElement;
      let moving = false;
      if (locked && active) {
        const fwd = (keys.has('KeyW') || keys.has('ArrowUp') ? 1 : 0) - (keys.has('KeyS') || keys.has('ArrowDown') ? 1 : 0);
        const str = (keys.has('KeyD') || keys.has('ArrowRight') ? 1 : 0) - (keys.has('KeyA') || keys.has('ArrowLeft') ? 1 : 0);
        if (fwd !== 0 || str !== 0) {
          moving = true;
          const sprint = keys.has('ShiftLeft') || keys.has('ShiftRight');
          const speed = sprint ? 4.9 : 3.15;
          const sin = Math.sin(yaw), cos = Math.cos(yaw);
          const dx = (fwd * -sin + str * cos);
          const dz = (fwd * -cos + str * -sin);
          const len = Math.hypot(dx, dz) || 1;
          playerPos.x += (dx / len) * speed * dt;
          playerPos.z += (dz / len) * speed * dt;
        }
      }

      // bounds
      const minZ = solvedRef.current ? -6.6 : -5.45;
      playerPos.x = Math.max(-6.0, Math.min(6.0, playerPos.x));
      playerPos.z = Math.max(minZ, Math.min(6.0, playerPos.z));

      // colliders (circle push-out)
      for (const c of built.colliders) {
        const dx = playerPos.x - c.x, dz = playerPos.z - c.z;
        const d = Math.hypot(dx, dz);
        if (d < c.r && d > 0.0001) {
          playerPos.x = c.x + (dx / d) * c.r;
          playerPos.z = c.z + (dz / d) * c.r;
        }
      }

      // head bob + footsteps
      bobAmp += ((moving ? 1 : 0) - bobAmp) * Math.min(1, dt * 8);
      if (moving) {
        bobPhase += dt * (keys.has('ShiftLeft') ? 11.5 : 8.6);
        const cycle = Math.floor(bobPhase / Math.PI);
        if (cycle !== lastStepCycle) { lastStepCycle = cycle; audio.step(); }
      }
      camera.position.set(playerPos.x, 1.66 + Math.sin(bobPhase * 2) * 0.045 * bobAmp, playerPos.z);
      camera.rotation.set(pitch, yaw, 0);

      // door animation
      const targetDoor = solvedRef.current ? 1 : 0;
      if (doorOpenRef.current < targetDoor) {
        doorOpenRef.current = Math.min(1, doorOpenRef.current + dt * 0.75);
      }
      built.update(dt, t, doorOpenRef.current);

      // door traversal completes the level
      if (solvedRef.current && doorOpenRef.current > 0.72 && playerPos.z < -4.6 && !completedRef.current) {
        completedRef.current = true;
        finalizeLevel();
      }

      // interaction prompt
      let label: string | null = null;
      if (locked && active) {
        const found = findInteract();
        label = found ? found.label : null;
      }
      if (label !== promptRef.current) { promptRef.current = label; setPrompt(label); }

      renderer.render(scene, camera);
    };

    function finalizeLevel() {
      const time = elapsedRef.current;
      const hintPenalty = hintsRef.current * 150;
      const timeBonus = Math.max(0, Math.floor(level.parTime - time)) * 10;
      const shardBonus = shardsRef.current.length * 250;
      const score = Math.max(50, 1000 + timeBonus + shardBonus - hintPenalty);
      let stars = 3;
      if (hintsRef.current > 0) stars -= 1;
      if (time > level.parTime) stars -= 1;
      stars = Math.max(1, stars);
      audio.victory();
      document.exitPointerLock();
      const summary = onComplete({
        levelId: level.id, time, hintsUsed: hintsRef.current,
        shardIndices: [...shardsRef.current], stars, score,
      });
      setCompletion({ stars, score, shardIndices: [...shardsRef.current], timeBonus, hintPenalty, newAchievements: summary.newAchievements });
      setPhase('complete'); phaseRef.current = 'complete';
    }

    tick();

    // debug/testing hook: expose camera position & lock state
    (window as unknown as { __mld?: unknown }).__mld = {
      pos: () => ({ x: camera.position.x, y: camera.position.y, z: camera.position.z }),
      locked: () => document.pointerLockElement === renderer.domElement,
      keys: () => [...keys],
      teleport: (x: number, z: number) => { playerPos.x = x; playerPos.z = z; },
    };

    // fade out controls hint
    const hintTimer = window.setTimeout(() => setShowControls(false), 7000);

    return () => {
      window.clearTimeout(hintTimer);
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', onResize);
      container.removeEventListener('click', onContainerClick);
      document.removeEventListener('pointerlockchange', onLockChange);
      if (document.pointerLockElement === renderer.domElement) document.exitPointerLock();
      built.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) container.removeChild(renderer.domElement);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level, runId]);

  // Escape during tablet view closes it
  useEffect(() => {
    if (!tabletOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.code === 'Escape') closeTablet(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabletOpen]);

  const closeTablet = () => { setTabletOpen(false); tabletOpenRef.current = false; setIsLocked(false); audio.uiBack(); };

  const closeModal = () => {
    setModalOpen(false); modalRef.current = false;
    audio.uiBack();
  };

  const handlePuzzleSolved = () => {
    setPuzzleSolved(true);
    solvedRef.current = true;
    // let success animation play, then unseal
    window.setTimeout(() => {
      setModalOpen(false); modalRef.current = false;
      audio.doorOpen();
      showToast('The seal breaks — the door rumbles open');
    }, 1500);
  };

  const useHint = () => { setHintVisible(true); setHintsUsed(h => { hintsRef.current = h + 1; return h + 1; }); };

  const setCountdown = (v: boolean) => onSettingsChange({ ...settings, countdownTimer: v });

  const remaining = Math.max(0, level.parTime - elapsed);
  const timerDanger = settings.countdownTimer && remaining <= 10 && phase === 'playing';
  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

  /* ========== RENDER ========== */
  return (
    <div className="relative w-full h-full overflow-hidden bg-black" ref={containerRef}>
      {/* letterbox + vignette */}
      <div className="letterbox top-0" /><div className="letterbox bottom-0" />
      <div className="vignette" />

      {/* ===== HUD ===== */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        {/* top-left: level identity */}
        <div className="absolute top-[4vh] left-4 md:left-8 flex flex-col gap-1">
          <div className="flex items-center gap-2 text-[10px] tracking-[0.4em] text-[#d4af37]/85 uppercase">
            <span className="inline-block w-6 h-px bg-[#d4af37]/60" /> Level {level.id} · {world.short}
          </div>
          <h1 className="font-display text-lg md:text-2xl font-bold text-amber-50 etched leading-none">{level.name}</h1>
        </div>

        {/* top-center: objective */}
        <div className="absolute top-[4vh] left-1/2 -translate-x-1/2 max-w-md w-[46rem] hidden md:block">
          <div className="hud-chip mx-auto justify-center text-center !py-1.5">
            {puzzleSolved ? <DoorOpen size={15} className="text-emerald-300 shrink-0" /> : <Target size={15} className="text-[#d4af37] shrink-0" />}
            <span className="text-[13px] text-stone-200 font-medium leading-tight">{puzzleSolved ? 'The way is open — pass through the portal.' : level.objective}</span>
          </div>
        </div>

        {/* top-right: stats + pause */}
        <div className="absolute top-[4vh] right-4 md:right-8 flex items-center gap-2 pointer-events-auto">
          <div className="hud-chip" title={isHiddenPuzzle ? 'Ancient Relics recovered' : 'Star Shards recovered'}>
            <Sparkles size={15} className="text-[#f5d76e]" />
            <span className="font-mono text-sm text-amber-100">{shards.length}<span className="text-stone-500">/{isHiddenPuzzle ? (level.puzzle as { relics: number }).relics : SHARDS_PER_LEVEL}</span></span>
          </div>
          {settings.showTimer && (
            <div className={`hud-chip ${timerDanger ? 'timer-danger border-red-500/60' : ''}`} title={settings.countdownTimer ? 'Countdown to seal-failure' : 'Expedition time'}>
              <Timer size={15} className={timerDanger ? 'text-red-400' : 'text-cyan-200'} />
              <span className="font-mono text-sm text-stone-100">{fmt(settings.countdownTimer ? remaining : elapsed)}</span>
            </div>
          )}
          <button className="icon-btn" onClick={() => { setPhase('paused'); phaseRef.current = 'paused'; document.exitPointerLock(); audio.click(); }} aria-label="Pause expedition">
            <Pause size={17} />
          </button>
        </div>

        {/* crosshair */}
        {phase === 'playing' && !modalOpen && !tabletOpen && <div className="crosshair-dot" />}

        {/* interaction prompt */}
        {prompt && phase === 'playing' && !modalOpen && !tabletOpen && (
          <div className="absolute left-1/2 top-[58%] -translate-x-1/2 flex items-center gap-3 hud-chip !border-[#d4af37]/60 !bg-black/80 !px-4 !py-2 pulse-glow">
            <kbd className="px-2 py-1 font-mono text-sm font-bold text-[#0b0b08] bg-[#f5d76e] rounded-sm shadow">E</kbd>
            <span className="text-sm text-amber-100 font-semibold tracking-wide">{prompt}</span>
          </div>
        )}

        {/* shard pickup pop */}
        {shardPop > 0 && (
          <div key={shardPop} className="shard-pop absolute left-1/2 top-[38%] -translate-x-1/2 flex items-center gap-2 text-[#f5d76e] font-display font-bold text-lg">
            <Sparkles size={20} /> {isHiddenPuzzle ? 'RELIC SECURED' : '+250'}
          </div>
        )}

        {/* toast */}
        {toast && <div className="toast-in absolute left-1/2 bottom-[13%] -translate-x-1/2 hud-chip !border-emerald-400/40 !text-emerald-200 text-sm whitespace-nowrap">{toast}</div>}

        {/* controls hint */}
        {showControls && phase === 'playing' && (
          <div className="absolute bottom-[5vh] left-1/2 -translate-x-1/2 flex items-center gap-4 text-[10px] md:text-[11px] tracking-[0.2em] uppercase text-stone-400 bg-black/55 border border-white/10 px-4 py-2 rounded-sm backdrop-blur-sm whitespace-nowrap">
            <span className="flex items-center gap-1.5"><Footprints size={13}/> W A S D · Move</span>
            <span>Mouse · Look</span>
            <span className="hidden sm:inline">Shift · Sprint</span>
            <span>E · Interact</span>
            <span>Esc · Pause</span>
          </div>
        )}

        {/* click-to-continue veil */}
        {phase === 'playing' && !modalOpen && !tabletOpen && !isLocked && (
          <button className="absolute inset-0 z-20 bg-black/55 backdrop-blur-[2px] flex flex-col items-center justify-center gap-3 cursor-pointer pointer-events-auto" onClick={() => containerRef.current?.querySelector('canvas')?.requestPointerLock()}>
            <MousePointerClickIcon />
            <span className="font-display text-xl text-amber-100 tracking-[0.2em]">CLICK TO CONTINUE</span>
            <span className="text-stone-500 text-xs tracking-[0.3em] uppercase">The expedition awaits</span>
          </button>
        )}
      </div>

      {/* ===== PUZZLE MODAL ===== */}
      {modalOpen && (
        <PuzzleModal
          title={level.name}
          codeName={`PUZZLE ${String(level.id).padStart(2, '0')} · ${level.type.toUpperCase()}`}
          difficulty={level.difficulty}
          hint={level.hint}
          hintVisible={hintVisible}
          hintsUsed={hintsUsed}
          onToggleHint={useHint}
          onClose={closeModal}
          solved={puzzleSolved}
        >
          {level.type !== 'hidden' && <PuzzleBody level={level} onSolve={handlePuzzleSolved} />}
        </PuzzleModal>
      )}

      {/* ===== TABLET / LORE ===== */}
      {tabletOpen && (
        <div className="absolute inset-0 z-40 flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={closeTablet} />
          <div className="modal-in panel-ancient relative max-w-lg w-full p-6 md:p-8 text-center">
            <button className="icon-btn absolute top-3 right-3 !w-9 !h-9" onClick={closeTablet} aria-label="Close inscription"><X size={16} /></button>
            <div className="text-[#d4af37]/70 text-[10px] tracking-[0.4em] uppercase mb-3">Inscription · Level {level.id}</div>
            <p className="font-serif-body italic text-amber-100/90 text-base md:text-lg leading-relaxed">“{level.lore}”</p>
            <div className="mt-5 h-px w-24 mx-auto bg-gradient-to-r from-transparent via-[#d4af37] to-transparent" />
            <p className="mt-3 text-[10px] tracking-[0.35em] uppercase text-stone-500">Mystery of the Lost Dimensions</p>
          </div>
        </div>
      )}

      {/* ===== PAUSE MENU ===== */}
      {phase === 'paused' && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/72 backdrop-blur-md">
          <div className="modal-in panel-ancient w-full max-w-md p-6 md:p-8 text-center relative">
            <div className="text-[10px] tracking-[0.45em] text-[#d4af37]/80 uppercase">Expedition Paused</div>
            <h2 className="font-display text-3xl font-bold gold-text etched mt-1 mb-5">{level.name}</h2>
            <div className="flex flex-col gap-2.5">
              <button className="btn-rune btn-rune-primary justify-center" onClick={() => { setPhase('playing'); phaseRef.current = 'playing'; audio.click(); }}><Play size={17}/> Resume Expedition</button>
              <button className="btn-rune justify-center" onClick={restart}><RotateCcw size={16}/> Restart Level</button>
              <button className="btn-rune justify-center" onClick={() => { audio.uiBack(); onExitToLevels(); }}><MapIcon size={16}/> Level Selection</button>
              <button className="btn-rune justify-center" onClick={() => { audio.uiBack(); onMainMenu(); }}><Home size={16}/> Main Menu</button>
            </div>
            {/* quick volume */}
            <div className="mt-5 pt-4 border-t border-white/10 grid grid-cols-2 gap-4 text-left">
              <label className="flex items-center gap-2">
                {settings.musicVolume > 0 ? <Volume2 size={15} className="text-[#d4af37]"/> : <VolumeX size={15} className="text-stone-500"/>}
                <input type="range" min={0} max={100} value={Math.round(settings.musicVolume * 100)} aria-label="Music volume"
                  onChange={e => onSettingsChange({ ...settings, musicVolume: Number(e.target.value) / 100 })}
                  className="gold-range w-full" style={{ ['--fill' as string]: `${settings.musicVolume * 100}%` }} />
              </label>
              <label className="flex items-center gap-2">
                <Volume2 size={15} className="text-cyan-300"/>
                <input type="range" min={0} max={100} value={Math.round(settings.sfxVolume * 100)} aria-label="Effects volume"
                  onChange={e => onSettingsChange({ ...settings, sfxVolume: Number(e.target.value) / 100 })}
                  className="gold-range w-full" style={{ ['--fill' as string]: `${settings.sfxVolume * 100}%` }} />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* ===== COUNTDOWN FAILURE ===== */}
      {phase === 'failed' && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/80 backdrop-blur-md">
          <div className="modal-in panel-ancient w-full max-w-md p-8 text-center border-red-900/50">
            <AlertTriangle size={44} className="text-red-400 mx-auto mb-3" />
            <h2 className="font-display text-3xl font-bold text-red-300 etched">THE MAGIC FADES</h2>
            <p className="text-stone-400 text-sm mt-2 mb-6">The countdown struck zero and the seal hardened shut. The temple does not mourn — it waits.</p>
            <div className="flex flex-col gap-2.5">
              <button className="btn-rune btn-rune-primary justify-center" onClick={restart}><RotateCcw size={16}/> Try Again</button>
              <button className="btn-rune justify-center" onClick={() => { audio.uiBack(); onExitToLevels(); }}><MapIcon size={16}/> Level Selection</button>
            </div>
            <button className="mt-4 text-[10px] tracking-[0.3em] uppercase text-stone-500 hover:text-stone-300" onClick={() => setCountdown(false)}>Disable the Countdown in Settings</button>
          </div>
        </div>
      )}

      {/* ===== LEVEL COMPLETE ===== */}
      {phase === 'complete' && completion && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/78 backdrop-blur-md p-4">
          <div className="modal-in panel-ancient w-full max-w-lg p-6 md:p-8 text-center max-h-full overflow-y-auto nice-scroll">
            <div className="text-[10px] tracking-[0.45em] text-emerald-300/90 uppercase">Seal Broken · Level Complete</div>
            <h2 className="font-display text-2xl md:text-3xl font-bold gold-text etched mt-1">{level.name}</h2>

            {/* stars */}
            <div className="flex items-center justify-center gap-3 my-4">
              {[0, 1, 2].map(i => (
                <Star key={i} size={i === 1 ? 52 : 40} strokeWidth={1.4}
                  className={i < completion.stars ? 'success-burst text-[#f5d76e] fill-[#d4af37] drop-shadow-[0_0_18px_rgba(245,215,110,0.55)]' : 'text-stone-700'}
                  style={{ animationDelay: `${0.2 + i * 0.25}s` }} />
              ))}
            </div>

            {/* score breakdown */}
            <div className="text-left text-sm max-w-xs mx-auto space-y-1 font-mono text-stone-300 border border-white/8 bg-black/35 rounded-sm p-3">
              <div className="flex justify-between"><span>Seal broken</span><span className="text-stone-100">1000</span></div>
              <div className="flex justify-between"><span>Swiftness bonus</span><span className="text-emerald-300">+{completion.timeBonus}</span></div>
              <div className="flex justify-between"><span>Shards ×{completion.shardIndices.length}</span><span className="text-amber-300">+{completion.shardIndices.length * 250}</span></div>
              {completion.hintPenalty > 0 && <div className="flex justify-between"><span>Hints used</span><span className="text-red-400">−{completion.hintPenalty}</span></div>}
              <div className="flex justify-between border-t border-white/10 pt-1.5 mt-1.5 text-base"><span className="text-[#f5d76e] font-bold">TOTAL</span><span className="text-[#f5d76e] font-bold">{completion.score}</span></div>
            </div>
            <div className="mt-2 text-[11px] tracking-[0.25em] uppercase text-stone-500">Time <span className="text-stone-300">{fmt(elapsed)}</span> · Par <span className="text-stone-300">{fmt(level.parTime)}</span></div>

            {/* achievements */}
            {completion.newAchievements.length > 0 && (
              <div className="mt-4 border border-[#d4af37]/35 bg-[#d4af37]/8 rounded-sm p-3">
                <div className="text-[10px] tracking-[0.4em] uppercase text-[#d4af37] mb-2">Achievement{completion.newAchievements.length > 1 ? 's' : ''} Unlocked</div>
                {completion.newAchievements.map(id => {
                  const def = ACHIEVEMENTS.find(a => a.id === id);
                  if (!def) return null;
                  return (
                    <div key={id} className="flex items-center gap-2 justify-center py-0.5 text-amber-100">
                      <Crown size={14} className="text-[#f5d76e]" />
                      <span className="font-semibold">{def.name}</span>
                      <span className="text-stone-500 text-xs hidden sm:inline">— {def.desc}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* finale banner */}
            {level.id === 30 && (
              <div className="mt-4 font-display text-lg text-[#f5d76e] etched">✦ THE LOST DIMENSIONS REST AGAIN ✦</div>
            )}

            {/* actions */}
            <div className="flex flex-col sm:flex-row gap-2.5 justify-center mt-5">
              {hasNextLevel && <button className="btn-rune btn-rune-primary justify-center" onClick={() => { audio.click(); onNextLevel(); }}>Next Level<DoorOpen size={16}/></button>}
              <button className="btn-rune justify-center" onClick={restart}><RotateCcw size={15}/> Replay</button>
              <button className="btn-rune justify-center" onClick={() => { audio.uiBack(); onExitToLevels(); }}><MapIcon size={15}/> Levels</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MousePointerClickIcon() {
  return (
    <svg width="46" height="46" viewBox="0 0 24 24" fill="none" stroke="#f5d76e" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-[0_0_16px_rgba(245,215,110,0.6)]">
      <path d="M14 4.1 12 6" /><path d="m5.1 8-2.9-.8" /><path d="m6 12-1.9 2" />
      <path d="M7.2 2.2 8 5.1" /><path d="M9.037 9.69a.498.498 0 0 1 .653-.653l11 4.5a.498.498 0 0 1-.074.949l-4.349 1.041a1 1 0 0 0-.74.739l-1.04 4.35a.498.498 0 0 1-.95.074z" />
    </svg>
  );
}
