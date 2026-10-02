import React, { useState } from 'react';
import { Play, Settings, Volume2, VolumeX, Sparkles, ArrowRight, X } from 'lucide-react';
import { sounds, triggerHaptic } from '../utils/audio';

interface Props {
  onEnter: () => void;
  onOpenAdmin: () => void;
}

export const FullscreenStartScreen: React.FC<Props> = ({ onEnter, onOpenAdmin }) => {
  const [isPlaying, setIsPlaying] = useState(sounds.isBgmPlaying);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleStart = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    triggerHaptic('success');
    sounds.playClick();
    if (!sounds.isBgmPlaying) {
      sounds.startBgm();
    }
    setTimeout(() => {
      onEnter();
    }, 250);
  };

  const handleToggleAudio = (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic('tap');
    sounds.playClick();
    sounds.toggleBgm();
    setIsPlaying(!isPlaying);
  };

  const handleAdminClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic('tap');
    sounds.playClick();
    onOpenAdmin();
  };

  return (
    <div
      className={`fixed inset-0 z-50 bg-sky-950 flex flex-col items-center justify-start overflow-y-auto overflow-x-hidden transition-opacity duration-300 select-none ${
        isTransitioning ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100'
      }`}
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      {/* Ambient background blur for larger screens */}
      <div
        className="fixed inset-0 bg-cover bg-center blur-2xl opacity-40 scale-110 pointer-events-none"
        style={{ backgroundImage: `url('/images/suter_splash.jpg')` }}
      />

      {/* Main Artwork Container - Fully Scrollable and Mobile Friendly */}
      <div className="relative w-full max-w-[500px] min-h-screen flex flex-col items-center justify-between p-3 sm:p-5 z-10 safe-top safe-bottom">
        {/* Top Floating Controls */}
        <div className="w-full flex items-center justify-between gap-2 pt-2">
          {/* School Badge Pill */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-950/85 text-amber-200 border-2 border-amber-400/80 rounded-2xl text-[11px] font-black shadow-lg backdrop-blur-xs">
            <span>📍 SDN 3 Loloan Timur</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Audio Toggle */}
            <button
              type="button"
              onClick={handleToggleAudio}
              title={isPlaying ? 'Jeda Musik' : 'Putar Musik'}
              className="w-10 h-10 rounded-full bg-blue-900/85 hover:bg-blue-800 text-white border-2 border-cyan-300 flex items-center justify-center shadow-lg active:scale-90 transition-transform cursor-pointer"
            >
              {isPlaying ? <Volume2 className="w-5 h-5 text-cyan-300 animate-pulse" /> : <VolumeX className="w-5 h-5 text-slate-300" />}
            </button>

            {/* Teacher / Admin Settings Cog */}
            <button
              type="button"
              onClick={handleAdminClick}
              title="Menu Guru / Admin"
              className="w-10 h-10 rounded-full bg-amber-600/90 hover:bg-amber-500 text-white border-2 border-amber-300 flex items-center justify-center shadow-lg active:scale-90 transition-transform cursor-pointer"
            >
              <Settings className="w-5 h-5" />
            </button>

            {/* Skip / Close directly to Home */}
            <button
              type="button"
              onClick={handleStart}
              title="Masuk ke Beranda"
              className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 text-white border-2 border-white/40 flex items-center justify-center shadow-lg active:scale-90 transition-transform cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Artwork Image Card - Clickable */}
        <div
          onClick={handleStart}
          className="my-auto py-3 w-full flex flex-col items-center cursor-pointer group"
        >
          <div className="relative rounded-3xl overflow-hidden shadow-2xl border-3 border-amber-300/80 max-w-sm group-hover:scale-101 transition-transform">
            <img
              src="/images/suter_splash.jpg"
              alt="SUTER SD Negeri 3 Loloan Timur - Petualangan Matematika"
              className="w-full h-auto object-contain drop-shadow-xl"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>

        {/* Bottom Interactive Controls */}
        <div className="w-full px-2 flex flex-col items-center gap-2.5 pb-4">
          {/* Pulsing Action Prompt Badge */}
          <div className="animate-bounce">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-amber-950 font-black text-xs sm:text-sm rounded-full shadow-xl border-2 border-white ring-4 ring-amber-400/50">
              <Sparkles className="w-3.5 h-3.5 text-amber-900 animate-spin-slow" />
              <span>SENTUH TOMBOL UNTUK MASUK</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-900 animate-spin-slow" />
            </span>
          </div>

          {/* Clickable Start Trigger Button */}
          <button
            type="button"
            onClick={handleStart}
            className="w-full max-w-xs py-3.5 sm:py-4 px-6 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 hover:from-amber-300 hover:to-yellow-400 text-amber-950 font-black text-xl sm:text-2xl rounded-3xl shadow-2xl border-4 border-amber-200 active:scale-95 transition-all flex items-center justify-center gap-2.5 tracking-wider font-display cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-inner">
              <Play className="w-5 h-5 fill-amber-600 text-amber-600 ml-0.5" />
            </div>
            <span>MULAI SEKARANG</span>
          </button>

          <p className="text-[11px] font-extrabold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] text-center tracking-wide">
            Ketuk &ldquo;MULAI SEKARANG&rdquo; untuk membuka Beranda Petualangan
          </p>
        </div>
      </div>
    </div>
  );
};
