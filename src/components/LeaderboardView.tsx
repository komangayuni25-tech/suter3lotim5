import React, { useEffect, useState } from 'react';
import { Trophy, ArrowLeft, Medal, Users, User, Clock, Target, Search } from 'lucide-react';
import { LeaderboardEntry } from '../types/game';
import { gameService } from '../services/gameService';
import { sounds, triggerHaptic } from '../utils/audio';

interface Props {
  onBack: () => void;
}

export const LeaderboardView: React.FC<Props> = ({ onBack }) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [filterMode, setFilterMode] = useState<'all' | 'group' | 'individual'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await gameService.getLeaderboard();
        setEntries(data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  const filtered = entries
    .filter((e) => {
      if (filterMode === 'all') return true;
      return e.mode === filterMode;
    })
    .filter((e) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        e.playerName.toLowerCase().includes(q) ||
        e.className.toLowerCase().includes(q) ||
        (e.members && e.members.some((m) => m.toLowerCase().includes(q)))
      );
    });

  return (
    <div className="max-w-2xl mx-auto space-y-3 sm:space-y-4">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => {
            sounds.playClick();
            triggerHaptic('tap');
            onBack();
          }}
          className="text-xs font-bold text-slate-600 hover:text-blue-900 flex items-center gap-1.5 bg-white px-3 py-2 rounded-xl border border-blue-200 shadow-2xs cursor-pointer active:scale-95 min-h-[36px]"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali
        </button>

        <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider bg-blue-100 text-blue-900 px-2.5 py-0.5 rounded-full border border-blue-300 flex items-center gap-1">
          <Trophy className="w-3.5 h-3.5 text-amber-500" /> SDN 3 Loloan Timur
        </span>
      </div>

      {/* Main Container */}
      <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-xl border-2 sm:border-3 border-blue-400 space-y-3.5">
        <div className="text-center">
          <h2 className="text-xl sm:text-2xl font-black font-display text-blue-950">
            🏆 Papan Peringkat &ldquo;SUTER&rdquo;
          </h2>
          <p className="text-[11px] sm:text-xs text-blue-700 font-bold mt-0.5">
            SD Negeri 3 Loloan Timur &bull; Skor Petualangan Matematika
          </p>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col gap-2 pt-1">
          {/* Mode Tabs */}
          <div className="flex bg-blue-50 p-1 rounded-xl border border-blue-200">
            <button
              onClick={() => {
                sounds.playClick();
                triggerHaptic('tap');
                setFilterMode('all');
              }}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer min-h-[36px] ${
                filterMode === 'all'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-blue-100'
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => {
                sounds.playClick();
                triggerHaptic('tap');
                setFilterMode('group');
              }}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer min-h-[36px] ${
                filterMode === 'group'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-blue-100'
              }`}
            >
              <Users className="w-3.5 h-3.5" /> Kelompok
            </button>
            <button
              onClick={() => {
                sounds.playClick();
                triggerHaptic('tap');
                setFilterMode('individual');
              }}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer min-h-[36px] ${
                filterMode === 'individual'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-blue-100'
              }`}
            >
              <User className="w-3.5 h-3.5" /> Individu
            </button>
          </div>

          {/* Search Input */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari regu, nama, atau kelas..."
              className="w-full pl-8 pr-3 py-2 bg-blue-50/50 border border-blue-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:border-blue-500"
            />
            <Search className="w-3.5 h-3.5 text-blue-500 absolute left-2.5 top-2.5" />
          </div>
        </div>

        {/* List of Entries */}
        {isLoading ? (
          <div className="py-8 text-center text-slate-400 text-xs font-semibold">
            Memuat papan peringkat...
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs font-semibold bg-amber-50/50 rounded-2xl border border-dashed border-amber-200 p-4">
            Belum ada data petualangan yang cocok. Jadilah regu pertama yang mencatatkan skor!
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((item, index) => {
              const rank = index + 1;
              let rankBadge = (
                <span className="w-7 h-7 rounded-xl bg-slate-100 text-slate-600 font-black text-xs flex items-center justify-center shrink-0">
                  #{rank}
                </span>
              );

              let cardBg = 'bg-white border-slate-200';
              if (rank === 1) {
                rankBadge = (
                  <span className="w-7 h-7 rounded-xl bg-gradient-to-tr from-yellow-400 to-amber-300 text-amber-950 font-black text-xs flex items-center justify-center shadow-xs shrink-0">
                    🥇
                  </span>
                );
                cardBg = 'bg-gradient-to-r from-amber-50/90 to-yellow-50/90 border-amber-400 shadow-2xs';
              } else if (rank === 2) {
                rankBadge = (
                  <span className="w-7 h-7 rounded-xl bg-gradient-to-tr from-slate-200 to-slate-300 text-slate-700 font-black text-xs flex items-center justify-center shadow-2xs shrink-0">
                    🥈
                  </span>
                );
                cardBg = 'bg-slate-50 border-slate-300';
              } else if (rank === 3) {
                rankBadge = (
                  <span className="w-7 h-7 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-700 text-white font-black text-xs flex items-center justify-center shadow-2xs shrink-0">
                    🥉
                  </span>
                );
                cardBg = 'bg-orange-50/50 border-amber-200';
              }

              return (
                <div
                  key={item.id}
                  className={`p-3 rounded-2xl border-2 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${cardBg}`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {rankBadge}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-extrabold text-slate-900 text-xs sm:text-sm truncate">
                          {item.playerName}
                        </span>
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-amber-100 text-amber-900 border border-amber-200 shrink-0">
                          {item.className}
                        </span>
                      </div>

                      {item.members && item.members.length > 0 && (
                        <p className="text-[10px] text-slate-500 truncate">
                          {item.members.join(', ')}
                        </p>
                      )}
                      <span className="text-[10px] font-semibold text-amber-700">
                        {item.badge}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-t-0 pt-1.5 sm:pt-0 border-amber-100 shrink-0">
                    <div className="text-left sm:text-right">
                      <div className="text-sm sm:text-base font-black text-amber-950 leading-tight">
                        {item.score} <span className="text-[10px] text-amber-700 font-bold">poin</span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-medium flex items-center gap-2">
                        <span className="flex items-center gap-0.5">
                          <Target className="w-3 h-3 text-blue-500" /> {item.accuracy}%
                        </span>
                        <span className="flex items-center gap-0.5">
                          <Clock className="w-3 h-3 text-purple-500" /> {formatDuration(item.durationSeconds)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
