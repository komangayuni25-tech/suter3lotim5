import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, Key, RotateCcw, Award, Clock, Target, CheckCircle2, ChevronRight, Sparkles } from 'lucide-react';
import { LeaderboardEntry } from '../types/game';
import { sounds, triggerHaptic } from '../utils/audio';

interface Props {
  summary: LeaderboardEntry;
  treasureCode: string;
  teacherMessage: string;
  onPlayAgain: () => void;
  onViewLeaderboard: () => void;
}

export const TreasureVictoryView: React.FC<Props> = ({
  summary,
  treasureCode,
  teacherMessage,
  onPlayAgain,
  onViewLeaderboard,
}) => {
  const [chestOpen, setChestOpen] = useState(false);

  useEffect(() => {
    sounds.playTreasureChest();
    triggerHaptic('success');

    // Trigger grand confetti show
    const count = 180;
    const defaults = { origin: { y: 0.7 }, zIndex: 999 };

    function fire(particleRatio: number, opts: confetti.Options) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio),
      });
    }

    fire(0.25, { spread: 26, startVelocity: 55 });
    fire(0.2, { spread: 60 });
    fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
    fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
    fire(0.1, { spread: 120, startVelocity: 45 });

    const timer = setTimeout(() => {
      setChestOpen(true);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="max-w-2xl mx-auto px-2 sm:px-4 py-4 sm:py-6 space-y-4 animate-in fade-in duration-300">
      {/* Victory Banner */}
      <div className="text-center space-y-1.5">
        <div className="inline-flex items-center gap-1.5 bg-blue-600 text-white font-black px-3 py-1 rounded-full text-[10px] sm:text-xs uppercase tracking-widest shadow-md border border-cyan-300">
          <Sparkles className="w-3.5 h-3.5 text-cyan-200" /> MISI PETUALANGAN TUNTAS
        </div>

        <h1 className="text-2xl sm:text-4xl font-black font-display text-blue-950 tracking-tight">
          🎉 SELAMAT! 🎉
        </h1>
        <p className="text-xs sm:text-sm font-bold text-blue-900 max-w-md mx-auto">
          Kamu berhasil menyelesaikan seluruh tantangan luas bangun datar di sekolah!
        </p>
      </div>

      {/* Animated Treasure Chest */}
      <div className="bg-gradient-to-b from-amber-700 via-amber-800 to-amber-950 rounded-3xl p-4 sm:p-6 text-center text-white border-3 sm:border-4 border-yellow-400 shadow-2xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col items-center">
          <div
            className={`w-28 h-28 sm:w-36 sm:h-36 transition-transform duration-700 ${
              chestOpen ? 'scale-105' : 'scale-95'
            }`}
          >
            {/* SVG Treasure Chest */}
            <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-2xl select-none">
              <rect x="30" y="85" width="140" height="90" rx="14" fill="#78350f" stroke="#f59e0b" strokeWidth="5" />
              <rect x="55" y="85" width="16" height="90" fill="#d97706" />
              <rect x="129" y="85" width="16" height="90" fill="#d97706" />
              <circle cx="63" cy="100" r="3" fill="#fde68a" />
              <circle cx="63" cy="130" r="3" fill="#fde68a" />
              <circle cx="63" cy="160" r="3" fill="#fde68a" />
              <circle cx="137" cy="100" r="3" fill="#fde68a" />
              <circle cx="137" cy="130" r="3" fill="#fde68a" />
              <circle cx="137" cy="160" r="3" fill="#fde68a" />

              <g className={`transition-opacity duration-700 ${chestOpen ? 'opacity-100' : 'opacity-0'}`}>
                <circle cx="70" cy="75" r="14" fill="#fbbf24" stroke="#d97706" strokeWidth="2" />
                <circle cx="100" cy="65" r="18" fill="#fde047" stroke="#b45309" strokeWidth="2" />
                <circle cx="130" cy="75" r="14" fill="#fbbf24" stroke="#d97706" strokeWidth="2" />
                <polygon points="100,50 115,70 85,70" fill="#38bdf8" />
                <polygon points="75,60 85,75 65,75" fill="#f43f5e" />
                <polygon points="125,60 135,75 115,75" fill="#a855f7" />
              </g>

              <g
                className={`transition-all duration-700 origin-[100px_85px] ${
                  chestOpen ? '-rotate-45 -translate-y-4' : 'rotate-0'
                }`}
              >
                <path d="M 25 85 C 25 45, 175 45, 175 85 Z" fill="#92400e" stroke="#f59e0b" strokeWidth="5" />
                <path d="M 55 53 C 55 45, 71 45, 71 53 L 71 85 L 55 85 Z" fill="#d97706" />
                <path d="M 129 53 C 129 45, 145 45, 145 53 L 145 85 L 129 85 Z" fill="#d97706" />
                <rect x="88" y="75" width="24" height="24" rx="4" fill="#fde047" stroke="#b45309" strokeWidth="3" />
                <circle cx="100" cy="84" r="3" fill="#78350f" />
                <line x1="100" y1="87" x2="100" y2="94" stroke="#78350f" strokeWidth="2.5" />
              </g>
            </svg>
          </div>

          <h2 className="text-xl sm:text-2xl font-black font-display text-yellow-300 mt-1 mb-1 tracking-wide">
            🏆 HARTA KARUN DITEMUKAN!
          </h2>

          <p className="text-amber-200 text-xs sm:text-sm max-w-sm font-medium mb-3">
            Tunjukkan kode rahasia ini kepada Guru untuk mengambil hadiahmu:
          </p>

          {/* Secret Code Card */}
          <div className="w-full max-w-sm bg-amber-950/80 border-2 border-yellow-400/80 rounded-2xl p-3 sm:p-4 shadow-xl">
            <div className="flex items-center justify-center gap-1.5 text-[10px] font-bold text-yellow-300 uppercase tracking-widest mb-1">
              <Key className="w-3.5 h-3.5 text-yellow-400" />
              <span>🔐 KODE HARTA KARUN:</span>
            </div>
            <div className="text-xl sm:text-2xl font-black font-mono tracking-widest text-yellow-300 bg-black/40 py-2 px-3 rounded-xl border border-yellow-400/40 select-all">
              {treasureCode}
            </div>

            <div className="mt-2 pt-2 border-t border-yellow-400/20 text-xs text-amber-100 font-semibold leading-relaxed">
              📍 &ldquo;{teacherMessage}&rdquo;
            </div>
          </div>
        </div>
      </div>

      {/* Summary Scorecard */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-xl border-2 sm:border-3 border-blue-300 space-y-3">
        <div className="flex items-center justify-between border-b border-blue-100 pb-2.5">
          <div>
            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-blue-700 bg-blue-100 px-2 py-0.5 rounded-md">
              SDN 3 Loloan Timur
            </span>
            <h3 className="text-base sm:text-lg font-black font-display text-blue-950 mt-0.5">
              📊 Rapor Hasil Petualangan
            </h3>
            <p className="text-[10px] text-slate-500 font-medium">Game ID: {summary.gameId}</p>
          </div>
          <span className="text-[10px] sm:text-xs font-black uppercase px-2.5 py-1 bg-blue-100 text-blue-900 rounded-full border border-blue-200">
            {summary.badge}
          </span>
        </div>

        {/* Player Name and Members */}
        <div className="bg-blue-50/70 p-3 rounded-2xl border border-blue-200">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-blue-900 uppercase tracking-wider">
              {summary.mode === 'group' ? 'Nama Kelompok:' : 'Nama Siswa:'}
            </span>
            <span className="text-[10px] font-bold bg-white text-slate-700 px-2 py-0.2 rounded-md border border-blue-200">
              {summary.className}
            </span>
          </div>
          <div className="text-base sm:text-lg font-black text-blue-950 mt-0.5">
            {summary.playerName}
          </div>
          {summary.members && summary.members.length > 0 && (
            <div className="text-xs text-slate-600 mt-0.5">
              Anggota: <span className="font-semibold text-slate-800">{summary.members.join(', ')}</span>
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="bg-blue-50 p-2.5 rounded-2xl border border-blue-200 text-center">
            <Trophy className="w-4 h-4 text-amber-500 mx-auto mb-0.5" />
            <div className="text-lg font-black text-blue-950">{summary.score}</div>
            <div className="text-[10px] text-blue-700 font-bold uppercase">Total Skor</div>
          </div>

          <div className="bg-emerald-50 p-2.5 rounded-2xl border border-emerald-200 text-center">
            <Award className="w-4 h-4 text-emerald-600 mx-auto mb-0.5" />
            <div className="text-lg font-black text-emerald-950">5/5</div>
            <div className="text-[10px] text-slate-500 font-bold uppercase">Pos Tuntas</div>
          </div>

          <div className="bg-sky-50 p-2.5 rounded-2xl border border-sky-200 text-center">
            <Target className="w-4 h-4 text-sky-600 mx-auto mb-0.5" />
            <div className="text-lg font-black text-sky-950">{summary.accuracy}%</div>
            <div className="text-[10px] text-slate-500 font-bold uppercase">Akurasi</div>
          </div>

          <div className="bg-purple-50 p-2.5 rounded-2xl border border-purple-200 text-center">
            <Clock className="w-4 h-4 text-purple-600 mx-auto mb-0.5" />
            <div className="text-sm font-black text-purple-950 mt-1">
              {formatDuration(summary.durationSeconds)}
            </div>
            <div className="text-[10px] text-slate-500 font-bold uppercase mt-0.5">Waktu</div>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="pt-1.5 flex flex-col sm:flex-row gap-2">
          <button
            onClick={() => {
              sounds.playClick();
              triggerHaptic('tap');
              onViewLeaderboard();
            }}
            className="flex-1 py-3 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 hover:from-blue-700 text-white font-extrabold rounded-2xl shadow-md transition-all active:scale-98 flex items-center justify-center gap-2 font-display text-xs sm:text-sm uppercase cursor-pointer border border-cyan-300/30 min-h-[48px]"
          >
            <Trophy className="w-4 h-4 text-amber-300" /> LIHAT LEADERBOARD <ChevronRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              sounds.playClick();
              triggerHaptic('tap');
              onPlayAgain();
            }}
            className="py-3 px-5 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-900 font-bold rounded-2xl border border-slate-300 transition-colors flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer min-h-[48px]"
          >
            <RotateCcw className="w-4 h-4" /> MAIN LAGI
          </button>
        </div>
      </div>
    </div>
  );
};
