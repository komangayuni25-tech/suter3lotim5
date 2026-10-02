import React from 'react';
import { Crown, Sparkles, MapPin, ArrowRight } from 'lucide-react';
import { sounds, triggerHaptic } from '../utils/audio';

interface Props {
  isOpen: boolean;
  finalHint: string;
  finalLocationName?: string;
  onContinue: () => void;
}

export const FinalPosIntroModal: React.FC<Props> = ({
  isOpen,
  finalHint,
  finalLocationName,
  onContinue,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-blue-950/85 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-gradient-to-b from-blue-900 via-indigo-950 to-blue-950 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border-3 border-cyan-400 p-5 text-center text-white relative animate-in zoom-in-95 duration-200 max-h-[90dvh] overflow-y-auto">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-cyan-400 via-blue-500 to-indigo-600 flex items-center justify-center shadow-xl mb-3 border-2 border-cyan-200 animate-pulse">
          <Crown className="w-8 h-8 text-white" />
        </div>

        <div className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full bg-blue-600/40 border border-cyan-400/40 text-cyan-200 text-[10px] font-black uppercase tracking-widest mb-1.5">
          <Sparkles className="w-3 h-3 text-cyan-200" /> POS FINAL / HARTA KARUN
        </div>

        <h2 className="text-xl sm:text-2xl font-black font-display text-white mb-1 drop-shadow-md">
          🏆 TANTANGAN TERAKHIR 🏆
        </h2>

        <p className="text-blue-100 text-xs sm:text-sm font-semibold mb-3">
          Petualanganmu hampir selesai! Temukan kode rahasia terakhir untuk membuka peti harta karun!
        </p>

        {/* Final Clue Parchment */}
        <div className="bg-white/10 border-2 border-cyan-400/40 rounded-2xl p-3 text-left backdrop-blur-xs mb-4 shadow-inner">
          <div className="flex items-center gap-1.5 mb-1.5 text-cyan-300 font-extrabold text-[11px] uppercase tracking-wider">
            <MapPin className="w-3.5 h-3.5 text-cyan-300" />
            <span>Petunjuk Lokasi Harta Karun:</span>
          </div>

          {finalLocationName && (
            <div className="text-xs sm:text-sm font-extrabold text-white mb-1">
              📍 {finalLocationName}
            </div>
          )}

          <div className="bg-blue-950/60 p-3 rounded-xl border border-blue-400/30 text-blue-100 text-xs sm:text-sm font-medium leading-relaxed italic">
            &ldquo;{finalHint}&rdquo;
          </div>
        </div>

        <button
          onClick={() => {
            sounds.playClick();
            triggerHaptic('tap');
            onContinue();
          }}
          className="w-full py-3.5 bg-gradient-to-r from-blue-600 via-sky-600 to-indigo-700 hover:from-blue-700 text-white font-black text-sm rounded-2xl shadow-xl shadow-blue-500/30 transition-all active:scale-98 flex items-center justify-center gap-2 font-display uppercase tracking-wide border-2 border-cyan-300 cursor-pointer min-h-[50px]"
        >
          SIAP CARI QR CODE FINAL! <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
