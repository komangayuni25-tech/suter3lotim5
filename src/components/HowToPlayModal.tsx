import React from 'react';
import { X, Smartphone, CheckCircle, Trophy, Sparkles } from 'lucide-react';
import { sounds, triggerHaptic } from '../utils/audio';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const HowToPlayModal: React.FC<Props> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const steps = [
    {
      step: '1',
      title: 'Bentuk Regu & Bawa HP Android',
      desc: 'Masukkan nama regu atau nama siswa. Desain dirancang khusus pas di genggaman satu tangan pada HP Android.',
      icon: '🎒',
    },
    {
      step: '2',
      title: 'Pecahkan Teka-Teki Pos',
      desc: 'Sistem mengacak 4 pos rute pertama. Baca teka-teki petunjuk lokasi yang ada di lingkungan SD Negeri 3 Loloan Timur.',
      icon: '🧭',
    },
    {
      step: '3',
      title: 'Cari & Scan Kartu QR Code Pos',
      desc: 'Datangi lokasi dan scan QR Code menggunakan kamera HP Android atau ketikkan kode manual jika kamera bermasalah.',
      icon: '📷',
    },
    {
      step: '4',
      title: 'Jawab 5 Soal Pecahan Kelas 5',
      desc: 'Selesaikan tantangan membandingkan, mengurutkan, dan penjumlahan pecahan dengan bantuan gambar visual interaktif di setiap pos.',
      icon: '🍰',
    },
    {
      step: '5',
      title: 'Buka Petunjuk Pos Berikutnya',
      desc: 'Jika seluruh 5 soal di pos berhasil dijawab, tombol pembuka pos berikutnya otomatis menyala untuk melanjutkan petualangan.',
      icon: '🔓',
    },
    {
      step: '6',
      title: 'Pos Final Harta Karun!',
      desc: 'Setelah Pos 1 s.d. Pos 4 tuntas, Pos 5 Harta Karun akan terbuka. Jawab tantangan pamungkas untuk membuka Peti Harta Karun!',
      icon: '🏆',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border-3 border-blue-400 flex flex-col max-h-[90dvh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 text-white p-3.5 flex items-center justify-between shadow-md shrink-0">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-white/20 rounded-xl text-lg backdrop-blur-xs">📖</span>
            <div>
              <h3 className="font-extrabold text-base font-display tracking-wide text-white">
                PANDUAN &ldquo;SUTER&rdquo;
              </h3>
              <p className="text-[11px] text-cyan-200 font-medium">
                SD Negeri 3 Loloan Timur &bull; Petualangan Matematika
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              sounds.playClick();
              triggerHaptic('tap');
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors text-white cursor-pointer active:scale-90"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-3.5 sm:p-4 overflow-y-auto space-y-3 text-left">
          {/* Steps List */}
          <div className="space-y-2">
            {steps.map((item) => (
              <div
                key={item.step}
                className="flex items-start gap-2.5 p-2.5 bg-blue-50/70 border border-blue-200 rounded-2xl"
              >
                <div className="w-7 h-7 rounded-xl bg-blue-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                  {item.step}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-extrabold text-xs text-blue-950 flex items-center gap-1">
                    <span>{item.title}</span>
                    <span>{item.icon}</span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed font-medium">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Android Mobile Tips Card */}
          <div className="bg-sky-50 border border-sky-300 rounded-2xl p-3 space-y-1 text-xs text-sky-950">
            <div className="flex items-center gap-1.5 font-black uppercase text-sky-900">
              <Smartphone className="w-4 h-4 text-blue-600" />
              <span>Kenyamanan Bermain di HP Android:</span>
            </div>
            <ul className="list-disc list-inside space-y-0.5 text-[11px] font-medium text-sky-900">
              <li>Pegang HP dengan posisi tegak (portrait) satu tangan.</li>
              <li>Izinkan akses kamera saat popup scan QR muncul.</li>
              <li>Tambahkan ke Layar Utama melalui menu Chrome (⋮) untuk tampilan fullscreen.</li>
            </ul>
          </div>

          {/* Scoring rule card */}
          <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-3 space-y-1 text-xs text-emerald-950">
            <span className="font-black uppercase tracking-wider block text-emerald-900 text-[11px]">
              🌟 Aturan Skor:
            </span>
            <ul className="list-disc list-inside space-y-0.5 text-[10px] sm:text-[11px] font-medium text-emerald-800">
              <li>Jawaban benar percobaan 1: <strong>+100 poin</strong></li>
              <li>Jawaban benar percobaan 2: <strong>+75 poin</strong></li>
              <li>Jawaban benar percobaan 3: <strong>+50 poin</strong></li>
              <li>Bonus menyelesaikan 1 Pos: <strong>+100 poin</strong></li>
              <li>Bonus menuntaskan semua pos: <strong>+500 poin</strong></li>
            </ul>
          </div>
        </div>

        {/* Sticky Footer */}
        <div className="p-3 border-t border-blue-100 bg-blue-50/50 text-center shrink-0">
          <button
            onClick={() => {
              sounds.playClick();
              triggerHaptic('tap');
              onClose();
            }}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 text-white font-black rounded-xl text-xs sm:text-sm shadow-md transition-all active:scale-95 cursor-pointer uppercase tracking-wider min-h-[44px]"
          >
            SAYA MENGERTI, SIAP BERPETUALANG! 🚀
          </button>
        </div>
      </div>
    </div>
  );
};
