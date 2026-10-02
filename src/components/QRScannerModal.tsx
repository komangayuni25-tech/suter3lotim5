import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, X, AlertCircle, CheckCircle, Keyboard, Scan, Zap } from 'lucide-react';
import { sounds, triggerHaptic } from '../utils/audio';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onVerify: (qrCode: string) => Promise<{
    matched: boolean;
    message: string;
    stationName?: string;
  }>;
  currentPosCode: string;
}

export const QRScannerModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onVerify,
  currentPosCode,
}) => {
  const [activeTab, setActiveTab] = useState<'camera' | 'manual'>('camera');
  const [manualCode, setManualCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    title: string;
    message: string;
  } | null>(null);

  const [cameraError, setCameraError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isVerifyingRef = useRef(false);
  const scannerContainerId = 'qr-reader-container';

  // Helper to safely stop and clean up Html5Qrcode scanner without throwing
  const safelyStop = (scanner: Html5Qrcode | null) => {
    if (!scanner) return;
    try {
      if (scanner.isScanning) {
        scanner
          .stop()
          .catch(() => {})
          .finally(() => {
            try {
              scanner.clear();
            } catch {
              // ignore
            }
          });
      } else {
        try {
          scanner.clear();
        } catch {
          // ignore
        }
      }
    } catch {
      // Catch synchronous exceptions
    }
  };

  // Start scanner when modal opens with camera tab
  useEffect(() => {
    let isMounted = true;
    let localScanner: Html5Qrcode | null = null;

    if (isOpen && activeTab === 'camera') {
      const startScanner = async () => {
        try {
          setCameraError(null);
          await new Promise((r) => setTimeout(r, 200));
          if (!isMounted) return;

          const container = document.getElementById(scannerContainerId);
          if (!container || !isMounted) return;

          localScanner = new Html5Qrcode(scannerContainerId);
          scannerRef.current = localScanner;

          await localScanner.start(
            { facingMode: 'environment' },
            {
              fps: 10,
              qrbox: { width: 220, height: 220 },
              aspectRatio: 1.0,
            },
            (decodedText) => {
              if (!isMounted || isVerifyingRef.current) return;
              handleVerifyCode(decodedText);
            },
            () => {}
          );

          if (!isMounted) {
            safelyStop(localScanner);
          }
        } catch (err: unknown) {
          if (!isMounted) return;
          console.warn('Camera failed or not permitted', err);
          setCameraError(
            'Kamera tidak dapat diakses atau izin belum diberikan. Gunakan tab "Ketik Manual" di bawah ini!'
          );
          setActiveTab('manual');
        }
      };

      startScanner();
    }

    return () => {
      isMounted = false;
      const scanner = scannerRef.current || localScanner;
      scannerRef.current = null;
      safelyStop(scanner);
    };
  }, [isOpen, activeTab]);

  if (!isOpen) return null;

  const handleVerifyCode = async (codeToTest: string) => {
    if (isVerifyingRef.current) return;
    const clean = codeToTest.trim();
    if (!clean) return;

    isVerifyingRef.current = true;
    setIsVerifying(true);
    setFeedback(null);

    try {
      const result = await onVerify(clean);
      if (result.matched) {
        sounds.playSuccess();
        triggerHaptic('success');
        setFeedback({
          type: 'success',
          title: '🎉 KODE VALID DITEMUKAN!',
          message: 'Selamat! Pos ini berhasil dibuka. Selesaikan 5 soal matematika luas bangun datar di bawah ini!',
        });
        setTimeout(() => {
          isVerifyingRef.current = false;
          setIsVerifying(false);
          onClose();
          setFeedback(null);
        }, 1500);
      } else {
        sounds.playWrong();
        triggerHaptic('error');
        setFeedback({
          type: 'error',
          title: '🔒 BUKAN POS TUJUANMU',
          message: 'Kode QR ini bukan tujuanmu saat ini. Silakan periksa teka-teki petunjuk lokasimu!',
        });
        setTimeout(() => {
          isVerifyingRef.current = false;
          setIsVerifying(false);
        }, 2000);
      }
    } catch {
      sounds.playWrong();
      triggerHaptic('error');
      setFeedback({
        type: 'error',
        title: '❌ GAGAL MEMVALIDASI',
        message: 'Terjadi kesalahan saat memeriksa kode. Silakan coba lagi.',
      });
      setTimeout(() => {
        isVerifyingRef.current = false;
        setIsVerifying(false);
      }, 2000);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    triggerHaptic('tap');
    handleVerifyCode(manualCode);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/85 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border-3 border-blue-400 flex flex-col max-h-[90dvh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 text-white p-3.5 flex items-center justify-between shadow-md shrink-0">
          <div className="flex items-center space-x-2">
            <span className="p-1.5 bg-white/20 rounded-xl text-lg backdrop-blur-xs">📷</span>
            <div>
              <h3 className="font-bold text-base font-display tracking-wide text-white">
                SCAN QR CODE POS
              </h3>
              <p className="text-[11px] text-cyan-200 font-medium">
                Mencari Pos: <span className="font-bold text-white underline">{currentPosCode}</span>
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

        {/* Tab switch */}
        <div className="flex border-b border-blue-100 bg-blue-50/50 p-1 shrink-0">
          <button
            onClick={() => {
              sounds.playClick();
              triggerHaptic('tap');
              setActiveTab('camera');
              setFeedback(null);
            }}
            className={`flex-1 py-2 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer min-h-[40px] ${
              activeTab === 'camera'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-blue-900 hover:bg-blue-100'
            }`}
          >
            <Camera className="w-4 h-4" /> Kamera Scan HP
          </button>
          <button
            onClick={() => {
              sounds.playClick();
              triggerHaptic('tap');
              setActiveTab('manual');
              setFeedback(null);
            }}
            className={`flex-1 py-2 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer min-h-[40px] ${
              activeTab === 'manual'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-blue-900 hover:bg-blue-100'
            }`}
          >
            <Keyboard className="w-4 h-4" /> Ketik Manual
          </button>
        </div>

        {/* Feedback Banner */}
        {feedback && (
          <div
            className={`p-3 m-2.5 rounded-2xl flex items-start gap-2.5 animate-in zoom-in-95 duration-150 shrink-0 ${
              feedback.type === 'success'
                ? 'bg-emerald-100 border-2 border-emerald-500 text-emerald-950'
                : 'bg-rose-100 border-2 border-rose-500 text-rose-950'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            )}
            <div>
              <div className="font-extrabold text-sm">{feedback.title}</div>
              <div className="text-[11px] whitespace-pre-line mt-0.5 font-medium leading-relaxed">
                {feedback.message}
              </div>
            </div>
          </div>
        )}

        {/* Content Body */}
        <div className="p-3.5 overflow-y-auto flex-1 flex flex-col items-center">
          {activeTab === 'camera' ? (
            <div className="w-full flex flex-col items-center">
              <div className="relative w-full max-w-[260px] aspect-square rounded-2xl overflow-hidden border-3 border-blue-400 bg-black shadow-inner flex items-center justify-center">
                <div id={scannerContainerId} className="w-full h-full"></div>
                {/* Target overlay corners */}
                <div className="absolute inset-4 pointer-events-none border-2 border-cyan-400/50 rounded-xl flex flex-col justify-between p-2">
                  <div className="flex justify-between">
                    <span className="w-3.5 h-3.5 border-t-3 border-l-3 border-cyan-400"></span>
                    <span className="w-3.5 h-3.5 border-t-3 border-r-3 border-cyan-400"></span>
                  </div>
                  <div className="flex justify-between">
                    <span className="w-3.5 h-3.5 border-b-3 border-l-3 border-cyan-400"></span>
                    <span className="w-3.5 h-3.5 border-b-3 border-r-3 border-cyan-400"></span>
                  </div>
                </div>
              </div>

              {cameraError && (
                <div className="mt-2.5 p-2.5 bg-blue-50 text-blue-900 border border-blue-200 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>{cameraError}</span>
                </div>
              )}

              <p className="text-[11px] text-center text-slate-500 mt-2 font-medium">
                Arahkan kamera HP ke QR Code yang tertempel di kartu pos sekolah!
              </p>
            </div>
          ) : (
            <form onSubmit={handleManualSubmit} className="w-full space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Ketik Kode QR Lokasi:
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                    placeholder="Contoh: MATH-LOC-A-001"
                    className="w-full px-3.5 py-3 bg-blue-50/50 border-2 border-blue-200 rounded-xl text-slate-900 font-mono font-bold tracking-wider placeholder-slate-400 focus:outline-hidden focus:border-blue-600 focus:bg-white text-base uppercase"
                    autoFocus
                  />
                  <Scan className="w-5 h-5 text-blue-500 absolute right-3 top-3.5" />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  Kode tertera tepat di bawah kotak QR Code pada kartu pos sekolah.
                </p>
              </div>

              <button
                type="submit"
                disabled={isVerifying || !manualCode.trim()}
                className="w-full py-3 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 disabled:opacity-50 text-white font-extrabold rounded-xl shadow-md transition-all active:scale-98 flex items-center justify-center gap-2 text-sm cursor-pointer border border-cyan-300/30 min-h-[48px]"
              >
                {isVerifying ? (
                  <span>Memeriksa Kode...</span>
                ) : (
                  <>
                    <Zap className="w-4 h-4 text-cyan-200" /> VALIDASI KODE
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
