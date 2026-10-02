import React from 'react';
import { X, Smartphone, CheckCircle, Download, Zap } from 'lucide-react';
import { sounds, triggerHaptic } from '../utils/audio';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onTriggerInstall?: () => void;
  isInstallAvailable?: boolean;
}

export const AndroidGuideModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onTriggerInstall,
  isInstallAvailable,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border-3 border-blue-400 flex flex-col max-h-[90dvh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 text-white p-3.5 flex items-center justify-between shadow-md shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-lg">
              📱
            </div>
            <div>
              <h3 className="font-extrabold text-base font-display tracking-wide text-white">
                Panduan Aplikasi di HP Android
              </h3>
              <p className="text-[11px] text-cyan-200 font-medium">
                &ldquo;Suter&rdquo; SD Negeri 3 Loloan Timur
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
          {/* Quick Install Button if available */}
          {isInstallAvailable && onTriggerInstall && (
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white p-3 rounded-2xl shadow-md border-2 border-emerald-300 space-y-2">
              <div className="flex items-center gap-2 font-black text-xs sm:text-sm">
                <Download className="w-4 h-4 text-emerald-100" />
                <span>Instal Langsung ke Layar HP:</span>
              </div>
              <p className="text-[11px] text-emerald-50 leading-relaxed">
                Browser HP Android Anda mendukung pemasangan langsung. Klik tombol di bawah untuk memasang &ldquo;Suter&rdquo; ke layar utama:
              </p>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('tap');
                  onTriggerInstall();
                  onClose();
                }}
                className="w-full py-2.5 bg-white hover:bg-emerald-50 text-emerald-900 font-black rounded-xl text-xs uppercase tracking-wider shadow-sm transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 min-h-[44px]"
              >
                <Zap className="w-4 h-4 fill-emerald-600 text-emerald-600" /> Pasang Aplikasi Sekarang
              </button>
            </div>
          )}

          {/* Step by Step Chrome on Android */}
          <div className="space-y-2">
            <h4 className="text-xs font-black text-blue-950 uppercase tracking-wider flex items-center gap-1.5">
              <Smartphone className="w-4 h-4 text-blue-600" />
              <span>Cara Pasang di Layar Utama HP (Chrome):</span>
            </h4>

            <div className="grid grid-cols-1 gap-2">
              <div className="flex items-start gap-2.5 p-2.5 bg-blue-50/80 border border-blue-200 rounded-2xl">
                <div className="w-6 h-6 rounded-lg bg-blue-600 text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                  1
                </div>
                <div className="text-xs text-slate-700 leading-relaxed">
                  Buka aplikasi melalui browser <strong>Google Chrome</strong> di HP Android kamu.
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-2.5 bg-blue-50/80 border border-blue-200 rounded-2xl">
                <div className="w-6 h-6 rounded-lg bg-blue-600 text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                  2
                </div>
                <div className="text-xs text-slate-700 leading-relaxed">
                  Ketuk tombol <strong>Titik Tiga (⋮)</strong> di pojok kanan atas browser Chrome HP.
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-2.5 bg-blue-50/80 border border-blue-200 rounded-2xl">
                <div className="w-6 h-6 rounded-lg bg-blue-600 text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                  3
                </div>
                <div className="text-xs text-slate-700 leading-relaxed">
                  Pilih menu <strong>&ldquo;Tambahkan ke Layar Utama&rdquo;</strong> (atau <em>&ldquo;Instal Aplikasi&rdquo;</em>).
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-2.5 bg-emerald-50 border border-emerald-300 rounded-2xl">
                <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                  4
                </div>
                <div className="text-xs text-emerald-950 leading-relaxed font-semibold">
                  Ikon <strong>&ldquo;Suter&rdquo; SDN 3 Loloan Timur</strong> akan terpasang di layar HP seperti aplikasi Android asli dan dapat dibuka layar penuh tanpa bar browser!
                </div>
              </div>
            </div>
          </div>

          {/* Android Tips for Students */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 space-y-1.5 text-xs">
            <span className="font-extrabold text-blue-950 block uppercase tracking-wider text-[11px]">
              💡 Tips Bermain di HP:
            </span>
            <ul className="space-y-1 text-slate-700 font-medium text-[11px]">
              <li className="flex items-start gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                <span><strong>Izin Kamera:</strong> Izinkan kamera saat memindai QR Code untuk deteksi cepat.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                <span><strong>Mode Tegak (Portrait):</strong> Tampilan didesain pas dioperasikan dengan satu jempol tangan.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                <span><strong>Navigasi Bawah:</strong> Gunakan bilah tombol bawah untuk akses cepat ke scanner, rute, dan beranda.</span>
              </li>
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
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl text-xs sm:text-sm shadow-md transition-all active:scale-95 cursor-pointer min-h-[44px]"
          >
            TUTUP PANDUAN
          </button>
        </div>
      </div>
    </div>
  );
};
