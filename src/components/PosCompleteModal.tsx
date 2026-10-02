import React from 'react';
import { Award, Compass, ArrowRight } from 'lucide-react';
import { sounds, triggerHaptic } from '../utils/audio';

interface Props {
  isOpen: boolean;
  completedPosCode: string;
  nextStation: {
    posNumber: number;
    totalPos: number;
    code: string;
    name?: string;
    hint: string;
    isFinal: boolean;
  } | null;
  onContinue: () => void;
}

export const PosCompleteModal: React.FC<Props> = ({
  isOpen,
  completedPosCode,
  nextStation,
  onContinue,
}) => {
  if (!isOpen || !nextStation) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/85 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border-3 border-blue-400 p-5 text-center animate-in zoom-in-95 duration-200 max-h-[90dvh] overflow-y-auto">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-cyan-400 via-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30 mb-3 rotate-3 animate-bounce">
          <Award className="w-8 h-8 text-white" />
        </div>

        <span className="text-[10px] font-black tracking-wider uppercase bg-blue-100 text-blue-900 border border-blue-200 px-3 py-0.5 rounded-full">
          {completedPosCode} SELESAI
        </span>

        <h2 className="text-xl sm:text-2xl font-black font-display text-blue-950 mt-1 mb-0.5">
          🎉 POS BERHASIL DITAKLUKKAN!
        </h2>
        <p className="text-xs font-semibold text-emerald-600 mb-3">
          +100 Bonus Poin Pos Ditambahkan! 🌟
        </p>

        {/* Next Location Clue Box */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-2xl p-3 text-left shadow-inner mb-4">
          <div className="flex items-center gap-1.5 mb-1.5 text-blue-900 font-bold text-[11px] uppercase tracking-wider">
            <Compass className="w-3.5 h-3.5 text-blue-600 animate-spin-slow" />
            <span>Petunjuk Menuju {nextStation.code}:</span>
          </div>

          {nextStation.name && (
            <div className="text-xs sm:text-sm font-extrabold text-blue-950 mb-1">
              📍 Lokasi: {nextStation.name}
            </div>
          )}

          <div className="bg-white/95 p-3 rounded-xl border border-blue-200 text-slate-800 text-xs sm:text-sm font-medium leading-relaxed italic shadow-2xs">
            &ldquo;{nextStation.hint}&rdquo;
          </div>

          <p className="text-[10px] text-slate-500 mt-1.5 text-center">
            Pergilah ke lokasi tersebut dan cari QR Code rahasia berikutnya!
          </p>
        </div>

        <button
          onClick={() => {
            sounds.playClick();
            triggerHaptic('tap');
            onContinue();
          }}
          className="w-full py-3.5 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 hover:from-blue-700 text-white font-black text-sm rounded-2xl shadow-xl shadow-blue-500/25 transition-all active:scale-98 flex items-center justify-center gap-2 uppercase tracking-wide font-display cursor-pointer border border-cyan-300/30 min-h-[50px]"
        >
          CARI POS BERIKUTNYA <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
