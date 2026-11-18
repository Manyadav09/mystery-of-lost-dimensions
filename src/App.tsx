/* ============================================================
   MYSTERY OF THE LOST DIMENSIONS — App Shell
   GameManager: screen flow, save/load, achievements, settings.
   ============================================================ */
import { useCallback, useEffect, useRef, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { SaveManager, freshSave, type SaveData, type Settings } from './game/save';
import { audio } from './game/audio';
import { getLevel, TOTAL_LEVELS } from './game/levels';
import { evaluateAchievements } from './game/achievements';
import { MainMenu } from './components/MainMenu';
import { LevelSelect } from './components/LevelSelect';
import { SettingsScreen } from './components/SettingsScreen';
import { AchievementsScreen } from './components/AchievementsScreen';
import { CreditsScreen } from './components/CreditsScreen';
import { GameScreen, type RawCompletion } from './components/GameScreen';

type Screen = 'menu' | 'levels' | 'settings' | 'credits' | 'achievements' | 'game';

export default function App() {
  const recoveredRef = useRef(false);
  const [save, setSave] = useState<SaveData>(() => {
    const { data, recovered } = SaveManager.load();
    recoveredRef.current = recovered;
    return data;
  });
  const saveRef = useRef(save);
  useEffect(() => { saveRef.current = save; }, [save]);
  const [screen, setScreen] = useState<Screen>('menu');
  const [gameLevel, setGameLevel] = useState(1);
  const [gameKey, setGameKey] = useState(0);
  const [notice, setNotice] = useState<string | null>(recoveredRef.current ? 'A corrupted save was found — it has been restored to a blank expedition.' : null);

  /* live audio volumes */
  useEffect(() => {
    audio.setVolumes(save.settings.musicVolume, save.settings.sfxVolume);
  }, [save.settings.musicVolume, save.settings.sfxVolume]);

  /* notice auto-dismiss */
  useEffect(() => {
    if (!notice) return;
    const t = window.setTimeout(() => setNotice(null), 5200);
    return () => window.clearTimeout(t);
  }, [notice]);

  const handleSettingsChange = useCallback((settings: Settings) => {
    setSave(prev => {
      const next = { ...prev, settings };
      SaveManager.save(next);
      return next;
    });
  }, []);

  const handleResetProgress = useCallback(() => {
    SaveManager.erase();
    const fresh = freshSave();
    setSave(fresh);
    setNotice('The save-stone is wiped clean. A new expedition dawns.');
    audio.sealedThud();
  }, []);

  const startLevel = useCallback((id: number) => {
    setGameLevel(id);
    setGameKey(k => k + 1);
    setScreen('game');
  }, []);

  const nextContinueLevel = useCallback((data: SaveData) => {
    for (let i = 1; i <= TOTAL_LEVELS; i++) if (!data.completedLevels.includes(i)) return i;
    return TOTAL_LEVELS;
  }, []);

  const totalStars = Object.values(save.bestStars).reduce((a, b) => a + b, 0);

  /* ---- completion pipeline: bests, stats, achievements ---- */
  const handleComplete = useCallback((raw: RawCompletion): { newAchievements: string[] } => {
    const prev = saveRef.current;
    const next: SaveData = { ...prev };
    const id = raw.levelId;
    next.completedLevels = prev.completedLevels.includes(id) ? [...prev.completedLevels] : [...prev.completedLevels, id].sort((a, b) => a - b);
    next.bestStars = { ...prev.bestStars, [id]: Math.max(prev.bestStars[id] ?? 0, raw.stars) };
    next.bestScores = { ...prev.bestScores, [id]: Math.max(prev.bestScores[id] ?? 0, raw.score) };
    next.bestTimes = { ...prev.bestTimes, [id]: Math.min(prev.bestTimes[id] ?? Infinity, raw.time) };
    const mergedShards = new Set(prev.levelShards[id] ?? []);
    raw.shardIndices.forEach(i => mergedShards.add(i));
    next.levelShards = { ...prev.levelShards, [id]: [...mergedShards].sort((a, b) => a - b) };
    const totalShards = Object.values(next.levelShards).reduce((a, arr) => a + arr.length, 0);
    next.lastLevel = nextContinueLevel(next);
    next.stats = {
      ...prev.stats,
      puzzlesSolved: prev.stats.puzzlesSolved + 1,
      hintsUsed: prev.stats.hintsUsed + raw.hintsUsed,
      shardsCollected: totalShards,
      runsCompleted: prev.stats.runsCompleted + (id === TOTAL_LEVELS ? 1 : 0),
      bestLevelTime: prev.stats.bestLevelTime === null ? raw.time : Math.min(prev.stats.bestLevelTime, raw.time),
    };
    const newStars = Object.values(next.bestStars).reduce((a, b) => a + b, 0);
    const newAchievements = evaluateAchievements(
      {
        completedLevels: next.completedLevels,
        totalStars: newStars,
        totalShards,
        lastLevelHints: raw.hintsUsed,
        lastStars: raw.stars,
        lastTime: raw.time,
      },
      prev.achievements
    );
    next.achievements = [...prev.achievements, ...newAchievements];
    saveRef.current = next;
    setSave(next);
    SaveManager.save(next);
    if (newAchievements.length > 0) window.setTimeout(() => audio.achievement(), 900);
    return { newAchievements };
  }, [nextContinueLevel]);

  const level = getLevel(gameLevel);

  return (
    <div className="w-full h-full bg-[#07090f] overflow-hidden">
      {screen === 'menu' && (
        <MainMenu
          save={save}
          totalStars={totalStars}
          onContinue={() => startLevel(save.lastLevel)}
          onNewGame={() => startLevel(1)}
          onOpenLevels={() => setScreen('levels')}
          onOpenSettings={() => setScreen('settings')}
          onOpenAchievements={() => setScreen('achievements')}
          onOpenCredits={() => setScreen('credits')}
        />
      )}
      {screen === 'levels' && (
        <LevelSelect save={save} onBack={() => setScreen('menu')} onPlay={startLevel} />
      )}
      {screen === 'settings' && (
        <SettingsScreen settings={save.settings} onChange={handleSettingsChange} onResetProgress={handleResetProgress} onBack={() => setScreen('menu')} />
      )}
      {screen === 'achievements' && (
        <AchievementsScreen save={save} onBack={() => setScreen('menu')} />
      )}
      {screen === 'credits' && (
        <CreditsScreen onBack={() => setScreen('menu')} />
      )}
      {screen === 'game' && (
        <GameScreen
          key={`${gameLevel}-${gameKey}`}
          level={level}
          settings={save.settings}
          onSettingsChange={handleSettingsChange}
          onComplete={handleComplete}
          onNextLevel={() => startLevel(Math.min(TOTAL_LEVELS, gameLevel + 1))}
          onExitToLevels={() => setScreen('levels')}
          onMainMenu={() => setScreen('menu')}
          hasNextLevel={gameLevel < TOTAL_LEVELS}
        />
      )}

      {/* recovery notice toast */}
      {notice && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 hud-chip !border-emerald-400/40 !text-emerald-200 text-xs px-4 py-2">
          <ShieldCheck size={14} /> {notice}
        </div>
      )}
    </div>
  );
}
