/* ============================================================
   MYSTERY OF THE LOST DIMENSIONS — Level Selection
   ============================================================ */
import { ChevronLeft, Landmark, Gem, Eclipse, Lock, Star, Clock } from 'lucide-react';
import { audio } from '../game/audio';
import { LEVELS, WORLD_INFO } from '../game/levels';
import type { SaveData } from '../game/save';

const WORLD_ICONS = [Landmark, Gem, Eclipse];

interface LevelSelectProps {
  save: SaveData;
  onBack: () => void;
  onPlay: (levelId: number) => void;
}

export function LevelSelect({ save, onBack, onPlay }: LevelSelectProps) {
  const completed = new Set(save.completedLevels);
  const isUnlocked = (id: number) => id === 1 || completed.has(id - 1);

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#07090f]">
      {/* ambient backdrop */}
      <img src="/images/keyart.jpg" alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover object-[70%_30%] opacity-25" draggable={false} />
      <div className="absolute inset-0 bg-gradient-to-b from-[#07090f]/70 via-[#07090f]/85 to-[#07090f]" />

      <div className="relative h-full flex flex-col">
        {/* header */}
        <div className="flex items-center gap-4 px-5 md:px-10 pt-5 md:pt-7">
          <button className="icon-btn" onClick={() => { audio.uiBack(); onBack(); }} aria-label="Back to menu"><ChevronLeft size={20} /></button>
          <div>
            <div className="text-[10px] tracking-[0.45em] text-[#d4af37]/80 uppercase">The Expedition Atlas</div>
            <h1 className="font-display text-2xl md:text-4xl font-bold gold-text etched leading-none">CHOOSE YOUR TRIAL</h1>
          </div>
        </div>

        {/* three world galleries */}
        <div className="flex-1 min-h-0 overflow-y-auto nice-scroll px-4 md:px-10 pb-6 pt-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-5 max-w-7xl mx-auto">
            {WORLD_INFO.map((world, wi) => {
              const Icon = WORLD_ICONS[wi];
              const worldLevels = LEVELS.filter(l => l.world === world.id);
              const done = worldLevels.filter(l => completed.has(l.id)).length;
              const worldStars = worldLevels.reduce((acc, l) => acc + (save.bestStars[l.id] ?? 0), 0);
              return (
                <section key={world.id} className="panel-ancient rounded-sm p-4 md:p-5 flex flex-col"
                  style={{ boxShadow: `0 0 0 1px rgba(0,0,0,.6), 0 30px 80px rgba(0,0,0,.6), inset 0 0 60px ${world.hue}14` }}>
                  {/* world header */}
                  <div className="flex items-start gap-3 border-b pb-3 mb-3" style={{ borderColor: `${world.hue}33` }}>
                    <div className="w-12 h-12 flex items-center justify-center rounded-sm shrink-0"
                      style={{ background: `${world.hue}1a`, border: `1px solid ${world.hue}55`, boxShadow: `0 0 18px ${world.hue}44` }}>
                      <Icon size={24} style={{ color: world.hue }} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[9px] tracking-[0.4em] uppercase" style={{ color: world.hue }}>World {world.id} · {done}/10</div>
                      <h2 className="font-display text-lg md:text-xl font-bold text-stone-100 leading-tight">{world.name}</h2>
                      <p className="text-[10px] text-stone-500 italic font-serif-body">{world.subtitle}</p>
                      <div className="flex items-center gap-1 mt-1 text-[10px] text-[#f5d76e]"><Star size={11} className="fill-[#d4af37]" />{worldStars} / 30 stars</div>
                    </div>
                  </div>
                  {/* level tiles */}
                  <div className="grid grid-cols-5 gap-1.5 md:gap-2">
                    {worldLevels.map(l => {
                      const unlocked = isUnlocked(l.id);
                      const isDone = completed.has(l.id);
                      const stars = save.bestStars[l.id] ?? 0;
                      const bestTime = save.bestTimes[l.id];
                      return (
                        <button
                          key={l.id}
                          disabled={!unlocked}
                          onClick={() => { audio.ensureStarted(); audio.click(); onPlay(l.id); }}
                          className={`level-tile ${!unlocked ? 'locked' : ''} ${isDone ? 'completed' : ''}`}
                          title={unlocked ? `${l.name}${bestTime ? ` · Best ${Math.floor(bestTime / 60)}:${String(Math.floor(bestTime % 60)).padStart(2, '0')}` : ''}` : 'Break the previous seal to unlock'}
                          aria-label={unlocked ? `Play level ${l.id}: ${l.name}` : `Level ${l.id} locked`}
                        >
                          {unlocked ? (
                            <>
                              <span className="font-display text-xl md:text-2xl font-bold text-stone-100 leading-none">{l.id}</span>
                              <span className="flex gap-0.5">
                                {[0, 1, 2].map(s => <Star key={s} size={9} className={s < stars ? 'text-[#f5d76e] fill-[#d4af37]' : 'text-stone-700'} />)}
                              </span>
                              {isDone && bestTime !== undefined && (
                                <span className="hidden md:flex items-center gap-0.5 text-[8px] text-stone-500 font-mono"><Clock size={8} />{Math.floor(bestTime / 60)}:{String(Math.floor(bestTime % 60)).padStart(2, '0')}</span>
                              )}
                            </>
                          ) : (
                            <Lock size={18} className="text-stone-600" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
