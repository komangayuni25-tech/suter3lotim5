import React, { useEffect, useState } from 'react';
import {
  Compass,
  Trophy,
  Clock,
  MapPin,
  QrCode,
  Sparkles,
  Lock,
  CheckCircle,
  HelpCircle,
  AlertCircle,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { GameSession, LocationConfig, GameSettings, ClientQuestion } from '../types/game';
import { sounds, triggerHaptic } from '../utils/audio';

interface Props {
  session: GameSession;
  locations: LocationConfig[];
  settings: GameSettings;
  currentStation: {
    posNumber: number;
    totalPos: number;
    id: string;
    code: string;
    name?: string;
    hint: string;
    isFinal: boolean;
  };
  questionsForCurrentPos: ClientQuestion[];
  onOpenScanner: () => void;
  onOpenHowToPlay: () => void;
  onTimeout: () => void;
}

export const AdventureDashboard: React.FC<Props> = ({
  session,
  locations,
  settings,
  currentStation,
  questionsForCurrentPos,
  onOpenScanner,
  onOpenHowToPlay,
  onTimeout,
}) => {
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(() => {
    if (settings.durationMinutes <= 0) return null;
    const elapsedSeconds = Math.floor((Date.now() - session.startTime) / 1000);
    const totalSeconds = settings.durationMinutes * 60;
    return Math.max(0, totalSeconds - elapsedSeconds);
  });

  const [soundEnabled, setSoundEnabled] = useState(sounds.enabled);

  // Timer countdown
  useEffect(() => {
    if (secondsRemaining === null) return;
    if (secondsRemaining <= 0) {
      onTimeout();
      return;
    }

    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          clearInterval(interval);
          onTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [secondsRemaining, onTimeout]);

  const toggleSound = () => {
    sounds.enabled = !sounds.enabled;
    setSoundEnabled(sounds.enabled);
    triggerHaptic('tap');
    if (sounds.enabled) sounds.playClick();
  };

  const formatTimer = (totalSecs: number | null) => {
    if (totalSecs === null) return '∞ Bebas';
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const currentLocId = session.route[session.currentPosIndex];
  const currentPosProgress = session.posProgress[currentLocId];
  const isQrVerified = currentPosProgress?.qrVerified || false;

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Top Floating Dashboard Bar - Android Mobile Optimized */}
      <div className="bg-white/95 backdrop-blur-md rounded-2xl sm:rounded-3xl p-3 sm:p-4 shadow-lg border-2 sm:border-3 border-blue-300 space-y-2.5">
        {/* Row 1: Player Name & Quick Help */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-cyan-400 via-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 font-black text-sm sm:text-base shrink-0">
              🧭
            </div>
            <div className="truncate min-w-0">
              <div className="flex items-center gap-1.5 truncate">
                <span className="font-extrabold text-blue-950 text-xs sm:text-sm leading-tight truncate">
                  {session.player.playerName}
                </span>
                <span className="text-[9px] sm:text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-blue-100 text-blue-900 border border-blue-200 shrink-0">
                  {session.player.className}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium truncate mt-0.5">
                {session.player.mode === 'group' ? 'Kelompok' : 'Individu'} &bull; {session.gameId}
              </p>
            </div>
          </div>

          {/* Quick Help & FX toggle */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={toggleSound}
              title={soundEnabled ? 'Matikan Suara Efek' : 'Nyalakan Suara Efek'}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-600 hover:text-blue-900 hover:bg-blue-50 active:scale-90 transition-all cursor-pointer"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-blue-600" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
            </button>
            <button
              type="button"
              onClick={() => {
                sounds.playClick();
                triggerHaptic('tap');
                onOpenHowToPlay();
              }}
              title="Cara Bermain"
              className="px-2 py-1 rounded-xl flex items-center gap-1 text-[11px] font-bold text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 active:scale-95 transition-all shadow-2xs shrink-0 cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
              <span>Panduan</span>
            </button>
          </div>
        </div>

        {/* Row 2: Stats Trio Grid (Skor, Pos, Waktu) - Optimized for 320px+ Phones */}
        <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
          {/* Score */}
          <div className="flex flex-col items-center justify-center py-1.5 sm:py-2 px-1 bg-blue-50/80 border border-blue-200 rounded-xl shadow-2xs">
            <div className="flex items-center gap-1 text-[9px] sm:text-[10px] font-extrabold text-blue-700 uppercase">
              <Trophy className="w-3 h-3 text-amber-500" /> Skor
            </div>
            <div className="text-base sm:text-lg font-black text-blue-950 leading-tight">
              {session.score}
            </div>
          </div>

          {/* Pos Tracker */}
          <div className="flex flex-col items-center justify-center py-1.5 sm:py-2 px-1 bg-sky-50/80 border border-sky-200 rounded-xl shadow-2xs">
            <div className="flex items-center gap-1 text-[9px] sm:text-[10px] font-extrabold text-sky-800 uppercase">
              <MapPin className="w-3 h-3 text-blue-600" /> Pos
            </div>
            <div className="text-base sm:text-lg font-black text-blue-950 leading-tight">
              {session.currentPosIndex + 1}/{session.route.length}
            </div>
          </div>

          {/* Timer */}
          <div
            className={`flex flex-col items-center justify-center py-1.5 sm:py-2 px-1 rounded-xl border shadow-2xs ${
              secondsRemaining !== null && secondsRemaining < 300
                ? 'bg-rose-50 border-rose-300 text-rose-700 animate-pulse'
                : 'bg-blue-50/80 border-blue-200 text-blue-950'
            }`}
          >
            <div className="flex items-center gap-1 text-[9px] sm:text-[10px] font-extrabold uppercase">
              <Clock className="w-3 h-3 text-blue-600" /> Waktu
            </div>
            <div className="text-sm sm:text-base font-black font-mono leading-tight">
              {formatTimer(secondsRemaining)}
            </div>
          </div>
        </div>
      </div>

      {/* Secret Route Progression Bar */}
      <div className="bg-white/95 rounded-2xl p-2.5 sm:p-3 border-2 border-blue-200 shadow-sm">
        <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center justify-between">
          <span className="text-blue-950 font-black">Rute Petualangan</span>
          <span className="text-[10px] text-blue-700 font-bold">
            {session.currentPosIndex === 4 ? '⭐ Pos Harta Karun' : `Pos ${session.currentPosIndex + 1}`}
          </span>
        </div>

        <div className="grid grid-cols-5 gap-1 sm:gap-2">
          {session.route.map((locId, idx) => {
            const isCompleted = idx < session.currentPosIndex;
            const isCurrent = idx === session.currentPosIndex;
            const isFinalPos = idx === 4;

            let statusClass = 'bg-slate-100 border-slate-200 text-slate-400';
            if (isCompleted) {
              statusClass = 'bg-emerald-500 border-emerald-600 text-white shadow-xs';
            } else if (isCurrent) {
              statusClass = isFinalPos
                ? 'bg-gradient-to-r from-amber-400 to-yellow-300 border-amber-500 text-amber-950 ring-2 ring-yellow-400 ring-offset-1 animate-pulse font-black shadow-md'
                : 'bg-blue-600 border-blue-700 text-white ring-2 ring-cyan-300 ring-offset-1 font-black shadow-md shadow-blue-500/25';
            }

            return (
              <div
                key={idx}
                className={`py-1.5 px-0.5 rounded-xl border flex flex-col items-center justify-center text-center transition-all ${statusClass}`}
              >
                <div className="flex items-center justify-center gap-0.5 text-[10px] font-extrabold uppercase">
                  {isCompleted ? (
                    <CheckCircle className="w-3.5 h-3.5" />
                  ) : isCurrent ? (
                    <MapPin className="w-3.5 h-3.5" />
                  ) : (
                    <Lock className="w-3 h-3" />
                  )}
                  <span className="hidden sm:inline">
                    {isFinalPos ? 'Final' : `P${idx + 1}`}
                  </span>
                </div>
                <span className="text-[9px] sm:hidden font-black">
                  {isFinalPos ? '⭐' : `P${idx + 1}`}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Target Destination & QR Code Mission Box (When NOT yet QR verified) */}
      {!isQrVerified && (
        <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white rounded-3xl p-3.5 sm:p-5 shadow-xl shadow-blue-900/20 border-3 border-cyan-400 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="p-1.5 sm:p-2 bg-white/20 rounded-xl text-lg sm:text-xl backdrop-blur-xs">🧭</span>
              <div>
                <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-cyan-200">
                  MISI POS AKTIF #{currentStation.posNumber}
                </span>
                <h3 className="text-base sm:text-xl font-black font-display tracking-wide text-white">
                  {currentStation.code}
                </h3>
              </div>
            </div>

            {currentStation.isFinal && (
              <span className="bg-yellow-400 text-amber-950 font-black text-[9px] sm:text-xs px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm flex items-center gap-1 border border-yellow-200 animate-pulse shrink-0">
                <Sparkles className="w-3 h-3" /> HARTA KARUN
              </span>
            )}
          </div>

          {/* Clue/Riddle Box */}
          <div className="bg-white/95 text-slate-800 rounded-2xl p-3 sm:p-3.5 shadow-inner space-y-2 border-2 border-blue-300">
            <div className="flex items-center gap-1 text-[11px] font-bold text-blue-900 uppercase tracking-wider">
              <Compass className="w-3.5 h-3.5 text-blue-600" />
              <span>Petunjuk Lokasi (Teka-Teki):</span>
            </div>

            {currentStation.name && (
              <div className="text-xs sm:text-sm font-extrabold text-blue-950">
                📍 Lokasi Tujuan: <span className="underline decoration-cyan-400">{currentStation.name}</span>
              </div>
            )}

            <p className="text-xs sm:text-sm font-semibold text-slate-800 leading-relaxed italic bg-blue-50/70 p-2.5 sm:p-3 rounded-xl border border-blue-200 shadow-2xs">
              &ldquo;{currentStation.hint}&rdquo;
            </p>

            <div className="text-[10px] sm:text-xs text-slate-600 flex items-center gap-1.5 pt-0.5">
              <AlertCircle className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>
                Cari kartu QR Code di lokasi ini, lalu tekan tombol scan di bawah!
              </span>
            </div>
          </div>

          {/* Scan QR Button - Large Touch Target */}
          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              triggerHaptic('tap');
              onOpenScanner();
            }}
            className="w-full py-3.5 sm:py-4 min-h-[54px] bg-gradient-to-r from-blue-600 via-sky-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 active:scale-95 text-white font-black text-sm sm:text-base rounded-2xl shadow-xl shadow-blue-900/30 transition-all flex items-center justify-center gap-2 uppercase tracking-wide font-display border-2 border-cyan-300 cursor-pointer"
          >
            <QrCode className="w-5 h-5 text-cyan-200" />
            <span>SCAN QR CODE {currentStation.code}</span>
          </button>
        </div>
      )}
    </div>
  );
};
