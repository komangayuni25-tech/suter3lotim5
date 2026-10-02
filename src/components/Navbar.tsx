import React, { useState } from 'react';
import { Compass, Trophy, ShieldCheck, Volume2, VolumeX } from 'lucide-react';
import { sounds, triggerHaptic } from '../utils/audio';
import { MusicPlayerControl } from './MusicPlayerControl';

interface Props {
  onGoHome: () => void;
  onOpenLeaderboard: () => void;
  onOpenAdmin: () => void;
  showAdminBtn?: boolean;
}

export const Navbar: React.FC<Props> = ({
  onGoHome,
  onOpenLeaderboard,
  onOpenAdmin,
}) => {
  const [soundOn, setSoundOn] = useState(sounds.enabled);

  const toggleSound = () => {
    sounds.enabled = !sounds.enabled;
    setSoundOn(sounds.enabled);
    triggerHaptic('tap');
    if (sounds.enabled) sounds.playClick();
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-b-2 border-blue-200/80 shadow-xs safe-top">
        <div className="max-w-5xl mx-auto px-3 sm:px-4 py-2 sm:py-2.5 flex items-center justify-between gap-2">
          {/* Brand */}
          <button
            onClick={() => {
              sounds.playClick();
              triggerHaptic('tap');
              onGoHome();
            }}
            className="flex items-center gap-2 text-left group shrink-0 cursor-pointer active:scale-95 transition-transform"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-blue-500 to-cyan-400 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform shrink-0">
              <Compass className="w-5 h-5 sm:w-6 sm:h-6 animate-spin-slow" />
            </div>
            <div className="min-w-0">
              <div className="font-black text-blue-950 font-display text-base sm:text-lg leading-tight tracking-tight">
                SUTER
              </div>
              <div className="text-[9px] sm:text-xs font-bold text-blue-700 tracking-wider uppercase mt-0.5 truncate max-w-[130px] sm:max-w-none">
                SDN 3 Loloan Timur
              </div>
            </div>
          </button>

          {/* Action icons */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Adventure Backsound Control */}
            <MusicPlayerControl />

            {/* Sound FX Toggle */}
            <button
              onClick={toggleSound}
              title={soundOn ? 'Matikan Suara Efek' : 'Nyalakan Suara Efek'}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-slate-600 hover:text-blue-900 hover:bg-blue-50 active:scale-95 transition-all cursor-pointer"
            >
              {soundOn ? <Volume2 className="w-4 h-4 text-blue-600" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
            </button>

            {/* Leaderboard Button */}
            <button
              onClick={() => {
                sounds.playClick();
                triggerHaptic('tap');
                onOpenLeaderboard();
              }}
              title="Papan Peringkat"
              className="flex items-center justify-center gap-1 min-w-[36px] sm:min-w-[40px] h-9 sm:h-10 px-2 sm:px-3 rounded-xl text-xs font-bold text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 active:scale-95 transition-all shadow-2xs cursor-pointer"
            >
              <Trophy className="w-4 h-4 text-blue-600 shrink-0" />
              <span className="hidden sm:inline">Peringkat</span>
            </button>

            {/* Teacher Portal */}
            <button
              onClick={() => {
                sounds.playClick();
                triggerHaptic('tap');
                onOpenAdmin();
              }}
              title="Portal Guru / Admin"
              className="flex items-center justify-center gap-1 min-w-[36px] sm:min-w-[40px] h-9 sm:h-10 px-2.5 sm:px-3 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 border border-blue-700 active:scale-95 transition-all shadow-xs cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-blue-200 shrink-0" />
              <span className="hidden sm:inline">Guru</span>
            </button>
          </div>
        </div>
      </header>
      {/* Spacer so page content starts cleanly below the fixed header */}
      <div className="h-14 sm:h-16 safe-top shrink-0 pointer-events-none" aria-hidden="true" />
    </>
  );
};
