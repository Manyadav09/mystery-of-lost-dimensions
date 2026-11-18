/* ============================================================
   MYSTERY OF THE LOST DIMENSIONS — Settings
   ============================================================ */
import { ChevronLeft, Music, Volume2, MousePointer2, Trash2, AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import { audio } from '../game/audio';
import type { Settings } from '../game/save';

interface SettingsScreenProps {
  settings: Settings;
  onChange: (s: Settings) => void;
  onResetProgress: () => void;
  onBack: () => void;
}

function Toggle({ checked, onChange, label, desc }: { checked: boolean; onChange: (v: boolean) => void; label: string; desc?: string }) {
  return (
    <button role="switch" aria-checked={checked} onClick={() => { audio.dialTick(); onChange(!checked); }}
      className="w-full flex items-center justify-between gap-4 py-3 group text-left">
      <span>
        <span className="block text-sm font-semibold text-stone-200 group-hover:text-white transition-colors">{label}</span>
        {desc && <span className="block text-[10px] text-stone-500 mt-0.5 leading-snug">{desc}</span>}
      </span>
      <span className="relative shrink-0">
        <input type="checkbox" className="sr-only peer" checked={checked} readOnly tabIndex={-1} />
        <span className="toggle-track block w-11 h-6 rounded-full bg-stone-800 border border-white/10" />
        <span className="toggle-knob absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-stone-400 shadow" />
      </span>
    </button>
  );
}

export function SettingsScreen({ settings, onChange, onResetProgress, onBack }: SettingsScreenProps) {
  const [confirmReset, setConfirmReset] = useState(false);
  const pct = (v: number) => `${Math.round(v * 100)}%`;

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#07090f] flex items-center justify-center">
      <img src="/images/keyart.jpg" alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover object-[50%_20%] opacity-15" draggable={false} />
      <div className="absolute inset-0 bg-gradient-to-b from-[#07090f]/80 to-[#07090f]" />

      <div className="relative panel-ancient w-full max-w-xl max-h-full overflow-y-auto nice-scroll rounded-sm p-6 md:p-8 m-4">
        <div className="flex items-center gap-4 mb-5">
          <button className="icon-btn" onClick={() => { audio.uiBack(); onBack(); }} aria-label="Back"><ChevronLeft size={20} /></button>
          <div>
            <div className="text-[10px] tracking-[0.45em] text-[#d4af37]/80 uppercase">Expedition Ledger</div>
            <h1 className="font-display text-2xl md:text-3xl font-bold gold-text etched leading-none">SETTINGS</h1>
          </div>
        </div>

        {/* audio */}
        <section className="border border-white/8 bg-black/30 rounded-sm p-4 mb-3">
          <div className="text-[10px] tracking-[0.4em] uppercase text-stone-500 mb-2">Audio</div>
          <label className="flex items-center gap-3 py-1.5">
            <Music size={17} className="text-[#d4af37] shrink-0" />
            <span className="text-sm text-stone-300 w-20">Music</span>
            <input type="range" min={0} max={100} value={Math.round(settings.musicVolume * 100)} aria-label="Music volume"
              onChange={e => onChange({ ...settings, musicVolume: Number(e.target.value) / 100 })}
              className="gold-range flex-1" style={{ ['--fill' as string]: pct(settings.musicVolume) }} />
            <span className="font-mono text-xs text-stone-400 w-9 text-right">{pct(settings.musicVolume)}</span>
          </label>
          <label className="flex items-center gap-3 py-1.5">
            <Volume2 size={17} className="text-cyan-300 shrink-0" />
            <span className="text-sm text-stone-300 w-20">Effects</span>
            <input type="range" min={0} max={100} value={Math.round(settings.sfxVolume * 100)} aria-label="Effects volume"
              onChange={e => onChange({ ...settings, sfxVolume: Number(e.target.value) / 100 })}
              className="gold-range flex-1" style={{ ['--fill' as string]: pct(settings.sfxVolume) }} />
            <span className="font-mono text-xs text-stone-400 w-9 text-right">{pct(settings.sfxVolume)}</span>
          </label>
        </section>

        {/* controls */}
        <section className="border border-white/8 bg-black/30 rounded-sm p-4 mb-3">
          <div className="text-[10px] tracking-[0.4em] uppercase text-stone-500 mb-2">Controls</div>
          <label className="flex items-center gap-3 py-1.5">
            <MousePointer2 size={17} className="text-rose-300 shrink-0" />
            <span className="text-sm text-stone-300 w-20">Sense</span>
            <input type="range" min={40} max={220} value={Math.round(settings.mouseSensitivity * 100)} aria-label="Mouse sensitivity"
              onChange={e => onChange({ ...settings, mouseSensitivity: Number(e.target.value) / 100 })}
              className="gold-range flex-1" style={{ ['--fill' as string]: `${((settings.mouseSensitivity - 0.4) / 1.8) * 100}%` }} />
            <span className="font-mono text-xs text-stone-400 w-9 text-right">{settings.mouseSensitivity.toFixed(1)}×</span>
          </label>
          <div className="mt-2 text-[10px] text-stone-600 font-mono border border-white/5 rounded-sm p-2 text-center">W A S D move · Mouse look · Shift sprint · E interact · Esc pause</div>
        </section>

        {/* challenge */}
        <section className="border border-white/8 bg-black/30 rounded-sm p-4 mb-3 divide-y divide-white/5">
          <div className="text-[10px] tracking-[0.4em] uppercase text-stone-500 mb-1">Trials</div>
          <Toggle checked={settings.countdownTimer} onChange={v => onChange({ ...settings, countdownTimer: v })}
            label="Countdown Timer" desc="Optional hardcore mode — the seal fails forever when par time expires. Glory demands discipline." />
          <Toggle checked={settings.showTimer} onChange={v => onChange({ ...settings, showTimer: v })}
            label="Show Timer" desc="Display the expedition clock in the HUD." />
          <Toggle checked={settings.subtitles} onChange={v => onChange({ ...settings, subtitles: v })}
            label="Inscription Subtitles" desc="Show tablet lore and clue inscriptions as text — recommended." />
        </section>

        {/* danger zone */}
        <section className="border border-red-900/40 bg-red-950/10 rounded-sm p-4">
          <div className="text-[10px] tracking-[0.4em] uppercase text-red-400/80 mb-2">Save Stone</div>
          {!confirmReset ? (
            <button className="flex items-center gap-2 text-sm text-red-300/90 hover:text-red-200 border border-red-900/50 hover:border-red-700 px-4 py-2 rounded-sm transition-colors"
              onClick={() => setConfirmReset(true)}>
              <Trash2 size={15} /> Erase all expedition progress
            </button>
          ) : (
            <div className="flex flex-col gap-2">
              <p className="flex items-center gap-2 text-sm text-red-300"><AlertTriangle size={15} /> This unwrites every seal, star and shard. There is no undoing it.</p>
              <div className="flex gap-2">
                <button className="flex-1 text-sm font-bold text-white bg-red-700/80 hover:bg-red-600 border border-red-500 px-3 py-2 rounded-sm" onClick={() => { onResetProgress(); setConfirmReset(false); }}>Erase Everything</button>
                <button className="flex-1 text-sm text-stone-300 border border-white/15 hover:border-white/40 px-3 py-2 rounded-sm" onClick={() => setConfirmReset(false)}>Keep Progress</button>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
