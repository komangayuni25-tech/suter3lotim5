import React from 'react';
import { Play, BookOpen, Trophy, Sparkles, Compass, ShieldCheck, MapPin, Smartphone } from 'lucide-react';
import { sounds, triggerHaptic } from '../utils/audio';

interface Props {
  onStart: () => void;
  onHowToPlay: () => void;
  onLeaderboard: () => void;
  onAdmin: () => void;
  onAndroidGuide?: () => void;
  onShowSplash?: () => void;
  hasActiveSession?: boolean;
  isSessionLocked?: boolean;
  onResumeSession?: () => void;
}

export const StudentHome: React.FC<Props> = ({
  onStart,
  onHowToPlay,
  onLeaderboard,
  onAdmin,
  onAndroidGuide,
  onShowSplash,
  hasActiveSession,
  isSessionLocked,
  onResumeSession,
}) => {
  return (
    <div className="max-w-2xl mx-auto space-y-3 sm:space-y-4 text-center">
      {/* Hero Card - Dominant Blue Theme with Suter SDN 3 Branding */}
      <div className="bg-gradient-to-b from-blue-700 via-blue-800 to-indigo-900 rounded-3xl p-4 sm:p-7 text-white shadow-2xl border-3 sm:border-4 border-cyan-400 relative overflow-hidden">
        {/* Decorative corner elements */}
        <div className="absolute top-2 left-2 text-lg sm:text-2xl opacity-50 select-none">🗺️</div>
        <div className="absolute top-2 right-2 text-lg sm:text-2xl opacity-50 select-none">💎</div>
        <div className="absolute bottom-2 left-2 text-lg sm:text-2xl opacity-50 select-none">📜</div>
        <div className="absolute bottom-2 right-2 text-lg sm:text-2xl opacity-50 select-none">🪙</div>

        <div className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full bg-blue-600/60 backdrop-blur-xs text-[10px] sm:text-xs font-black uppercase tracking-widest mb-2 border border-cyan-300/40 text-cyan-200">
          <Sparkles className="w-3 h-3 text-cyan-200" /> SD NEGERI 3 LOLOAN TIMUR
        </div>

        {/* Hero Visual Avatar */}
        <div className="w-14 h-14 sm:w-20 sm:h-20 mx-auto rounded-2xl sm:rounded-3xl bg-gradient-to-tr from-cyan-400 via-blue-500 to-indigo-600 flex items-center justify-center text-3xl sm:text-4xl shadow-xl shadow-blue-950/40 mb-2 border-3 border-cyan-200">
          🧭
        </div>

        <h1 className="text-2xl sm:text-4xl font-black font-display tracking-tight text-white drop-shadow-md">
          &ldquo;SUTER&rdquo;
        </h1>
        <h2 className="text-base sm:text-xl font-black font-display text-cyan-300 mt-0.5 drop-shadow-xs">
          SD NEGERI 3 LOLOAN TIMUR
        </h2>
        <p className="text-[10px] sm:text-xs font-extrabold uppercase tracking-wider text-cyan-100/90 mt-0.5">
          Petualangan Matematika &bull; Berburu Harta Karun
        </p>

        <p className="text-blue-100 text-xs sm:text-sm font-semibold max-w-md mx-auto mt-2 leading-relaxed">
          Temukan kartu QR Code rahasia di lingkungan <strong>SDN 3 Loloan Timur</strong>, selesaikan 5 soal pecahan (membandingkan, mengurutkan, &amp; penjumlahan) di setiap pos, dan raih harta karun!
        </p>

        {/* Features highlight pills */}
        <div className="flex flex-wrap justify-center gap-1.5 mt-3">
          <span className="text-[10px] sm:text-xs bg-blue-900/70 border border-blue-400/40 text-cyan-100 px-2.5 py-0.5 rounded-full font-extrabold flex items-center gap-1">
            <MapPin className="w-3 h-3 text-cyan-300" /> 5 Pos Lokasi
          </span>
          <span className="text-[10px] sm:text-xs bg-blue-900/70 border border-blue-400/40 text-cyan-100 px-2.5 py-0.5 rounded-full font-extrabold flex items-center gap-1">
            <Compass className="w-3 h-3 text-cyan-300" /> Scan QR Pos
          </span>
          <span className="text-[10px] sm:text-xs bg-blue-900/70 border border-blue-400/40 text-cyan-100 px-2.5 py-0.5 rounded-full font-extrabold flex items-center gap-1">
            <Trophy className="w-3 h-3 text-cyan-300" /> Pecahan Kelas 5 SD
          </span>
        </div>
      </div>

      {/* Locked Game Alert if locked */}
      {hasActiveSession && isSessionLocked && (
        <div className="bg-rose-100 border-3 border-rose-500 rounded-2xl p-3.5 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg text-left animate-pulse">
          <div>
            <div className="text-xs font-black text-rose-950 uppercase flex items-center gap-1.5">
              <span>🔒 APLIKASI TERKUNCI (3X SALAH MENJAWAB)</span>
            </div>
            <div className="text-[11px] sm:text-xs text-rose-800 font-medium mt-0.5">
              Kelompok gagal pada pos terakhir. Hanya Guru Pendamping yang dapat membuka kunci dan mereset permainan.
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              triggerHaptic('tap');
              onAdmin();
            }}
            className="w-full sm:w-auto px-4 py-2.5 min-h-[44px] bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer shrink-0"
          >
            Buka Panel Guru &rarr;
          </button>
        </div>
      )}

      {/* Resume Active Game Alert if available and not locked */}
      {hasActiveSession && !isSessionLocked && onResumeSession && (
        <div className="bg-blue-100 border-2 border-blue-400 rounded-2xl p-3 sm:p-4 flex items-center justify-between gap-2 shadow-md">
          <div className="text-left min-w-0">
            <div className="text-xs font-black text-blue-950 uppercase truncate">Petualangan Berjalan</div>
            <div className="text-[11px] text-blue-800 font-medium truncate">Ada misi aktif yang belum selesai.</div>
          </div>
          <button
            onClick={() => {
              sounds.playClick();
              triggerHaptic('tap');
              if (!sounds.isBgmPlaying) {
                sounds.startBgm();
              }
              onResumeSession();
            }}
            className="px-3.5 py-2 min-h-[44px] bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer shrink-0"
          >
            Lanjutkan &rarr;
          </button>
        </div>
      )}

      {/* Main Action Buttons - Thumb-Friendly Touch Ergonomics */}
      <div className="space-y-2">
        <button
          onClick={() => {
            sounds.playClick();
            triggerHaptic('tap');
            if (!sounds.isBgmPlaying) {
              sounds.startBgm();
            }
            onStart();
          }}
          className="w-full py-3.5 sm:py-4.5 min-h-[54px] bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 hover:from-blue-700 hover:to-indigo-900 text-white font-black text-base sm:text-lg rounded-2xl sm:rounded-3xl shadow-xl shadow-blue-600/30 hover:shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-2 uppercase tracking-wide font-display border-2 border-cyan-300 cursor-pointer"
        >
          <Play className="w-5 h-5 fill-white shrink-0" />
          <span>MULAI PETUALANGAN BARU</span>
        </button>

        {/* Secondary buttons grid: 4 columns or 2x2 on smartphone */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            onClick={() => {
              sounds.playClick();
              triggerHaptic('tap');
              onHowToPlay();
            }}
            className="py-2.5 px-2 min-h-[46px] bg-white hover:bg-blue-50 text-blue-950 font-bold text-xs rounded-2xl shadow-sm border border-blue-200 transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <BookOpen className="w-4 h-4 text-blue-600 shrink-0" />
            <span className="truncate">Cara Main</span>
          </button>

          <button
            onClick={() => {
              sounds.playClick();
              triggerHaptic('tap');
              onLeaderboard();
            }}
            className="py-2.5 px-2 min-h-[46px] bg-white hover:bg-blue-50 text-blue-950 font-bold text-xs rounded-2xl shadow-sm border border-blue-200 transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Trophy className="w-4 h-4 text-amber-500 shrink-0" />
            <span className="truncate">Peringkat</span>
          </button>

          {onAndroidGuide && (
            <button
              onClick={() => {
                sounds.playClick();
                triggerHaptic('tap');
                onAndroidGuide();
              }}
              className="py-2.5 px-2 min-h-[46px] bg-white hover:bg-sky-50 text-blue-950 font-bold text-xs rounded-2xl shadow-sm border border-sky-300 transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Smartphone className="w-4 h-4 text-blue-600 shrink-0" />
              <span className="truncate">Panduan HP</span>
            </button>
          )}

          <button
            onClick={() => {
              sounds.playClick();
              triggerHaptic('tap');
              onAdmin();
            }}
            className="py-2.5 px-2 min-h-[46px] bg-white hover:bg-blue-50 text-blue-950 font-bold text-xs rounded-2xl shadow-sm border border-blue-200 transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
            <span className="truncate">Portal Guru</span>
          </button>
        </div>
      </div>

      {/* Button to re-open Fullscreen Cover Screen */}
      {onShowSplash && (
        <button
          type="button"
          onClick={() => {
            sounds.playClick();
            triggerHaptic('tap');
            onShowSplash();
          }}
          className="w-full py-2 px-3 min-h-[40px] bg-gradient-to-r from-amber-400/90 via-yellow-300/90 to-amber-400/90 hover:from-amber-300 text-amber-950 font-black text-xs rounded-2xl shadow-2xs border border-amber-300 transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-900" />
          <span>🖼️ LIHAT COVER LAYAR AWAL</span>
        </button>
      )}
    </div>
  );
};
