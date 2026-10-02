import React from 'react';
import { Home, Compass, Trophy, Smartphone } from 'lucide-react';
import { sounds, triggerHaptic } from '../utils/audio';

interface Props {
  currentView: string;
  hasActiveSession: boolean;
  currentPosCode?: string;
  isQrVerified?: boolean;
  onGoHome: () => void;
  onGoAdventure: () => void;
  onOpenScanner?: () => void;
  onOpenLeaderboard: () => void;
  onOpenAndroidGuide: () => void;
}

export const MobileBottomNav: React.FC<Props> = ({
  currentView,
  hasActiveSession,
  currentPosCode,
  onGoHome,
  onGoAdventure,
  onOpenLeaderboard,
  onOpenAndroidGuide,
}) => {
  // Only render on smartphone / mobile screens
  return (
    <nav
      aria-label="Navigasi Utama HP"
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t-2 border-blue-200/90 shadow-[0_-4px_24px_rgba(30,58,138,0.12)] md:hidden safe-bottom"
    >
      <div className="max-w-md mx-auto px-2 py-1.5 flex items-center justify-around relative">
        {/* 1. Beranda */}
        <button
          type="button"
          onClick={() => {
            sounds.playClick();
            triggerHaptic('tap');
            onGoHome();
          }}
          className={`flex-1 py-1 px-1 flex flex-col items-center justify-center rounded-xl transition-all cursor-pointer ${
            currentView === 'home'
              ? 'text-blue-600 font-black'
              : 'text-slate-500 hover:text-blue-900 font-semibold'
          }`}
        >
          <Home className={`w-5 h-5 ${currentView === 'home' ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-[10px] tracking-tight mt-0.5">Beranda</span>
        </button>

        {/* 2. Petualangan (Pos Aktif) */}
        <button
          type="button"
          onClick={() => {
            sounds.playClick();
            triggerHaptic('tap');
            onGoAdventure();
          }}
          className={`flex-1 py-1 px-1 flex flex-col items-center justify-center rounded-xl transition-all cursor-pointer relative ${
            currentView === 'adventure'
              ? 'text-blue-600 font-black'
              : 'text-slate-500 hover:text-blue-900 font-semibold'
          }`}
        >
          <div className="relative">
            <Compass className={`w-5 h-5 ${currentView === 'adventure' ? 'stroke-[2.5] animate-spin-slow' : 'stroke-2'}`} />
            {hasActiveSession && (
              <span className="absolute -top-1 -right-1.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full"></span>
            )}
          </div>
          <span className="text-[10px] tracking-tight mt-0.5 truncate max-w-[64px]">
            {currentPosCode || 'Misi'}
          </span>
        </button>

        {/* 3. Papan Peringkat */}
        <button
          type="button"
          onClick={() => {
            sounds.playClick();
            triggerHaptic('tap');
            onOpenLeaderboard();
          }}
          className={`flex-1 py-1 px-1 flex flex-col items-center justify-center rounded-xl transition-all cursor-pointer ${
            currentView === 'leaderboard'
              ? 'text-blue-600 font-black'
              : 'text-slate-500 hover:text-blue-900 font-semibold'
          }`}
        >
          <Trophy className={`w-5 h-5 ${currentView === 'leaderboard' ? 'stroke-[2.5] text-amber-500' : 'stroke-2'}`} />
          <span className="text-[10px] tracking-tight mt-0.5">Peringkat</span>
        </button>

        {/* 4. Panduan HP Android */}
        <button
          type="button"
          onClick={() => {
            sounds.playClick();
            triggerHaptic('tap');
            onOpenAndroidGuide();
          }}
          className="flex-1 py-1 px-1 flex flex-col items-center justify-center rounded-xl text-slate-500 hover:text-blue-900 font-semibold transition-all cursor-pointer"
        >
          <Smartphone className="w-5 h-5 stroke-2 text-blue-600" />
          <span className="text-[10px] tracking-tight mt-0.5">Panduan HP</span>
        </button>
      </div>
    </nav>
  );
};
