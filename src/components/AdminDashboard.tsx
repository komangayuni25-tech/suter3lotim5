import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  Settings,
  MapPin,
  QrCode,
  BookOpen,
  Printer,
  Download,
  Plus,
  Trash2,
  Edit2,
  CheckCircle,
  Save,
  RotateCcw,
  Lock,
  Eye,
  EyeOff,
  Key,
  Music,
  Play,
  Pause,
  Upload,
  CheckCircle2,
  Image as ImageIcon,
  AlertTriangle,
  Users,
  KeyRound,
} from 'lucide-react';
import { LocationConfig, GameSettings, Question, QuestionType, DifficultyLevel, ShapeType, GameSession } from '../types/game';
import { generateQrDataUrl, downloadQrImage, printQrCards } from '../utils/qr';
import { gameService } from '../services/gameService';
import { sounds, triggerHaptic } from '../utils/audio';

interface Props {
  onBack: () => void;
  onResetApp?: () => void;
}

export const AdminDashboard: React.FC<Props> = ({ onBack, onResetApp }) => {
  // Simple PIN guard for teacher
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [pinError, setPinError] = useState(false);

  // Active Admin Tab
  const [activeTab, setActiveTab] = useState<'locations' | 'qr' | 'questions' | 'settings' | 'reset'>('locations');

  // Active Student Session & Reset State
  const [activeSession, setActiveSession] = useState<GameSession | null>(null);
  const [resetCodeInput, setResetCodeInput] = useState('');
  const [showResetSecret, setShowResetSecret] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);
  const [clearLbStatus, setClearLbStatus] = useState<string | null>(null);

  // State
  const [locations, setLocations] = useState<LocationConfig[]>([]);
  const [settings, setSettings] = useState<GameSettings | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [qrImages, setQrImages] = useState<Record<string, string>>({});
  const [savingStatus, setSavingStatus] = useState<string | null>(null);

  // Question editing / creation modal state
  const [selectedLocationFilter, setSelectedLocationFilter] = useState<string>('all');
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);

  // Audio management state
  const [isBgmPlaying, setIsBgmPlaying] = useState(sounds.isBgmPlaying);
  const [audioInfo, setAudioInfo] = useState<{ fileName: string; sizeMb: string; exists: boolean } | null>(null);
  const [isUploadingMusic, setIsUploadingMusic] = useState(false);
  const [musicUploadStatus, setMusicUploadStatus] = useState<string | null>(null);
  const audioFileInputRef = useRef<HTMLInputElement | null>(null);

  const fetchAudioInfo = async () => {
    try {
      const res = await fetch('/api/audio-info');
      if (res.ok) {
        const data = await res.json();
        setAudioInfo(data);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    const unsub = sounds.subscribeBgm((playing) => {
      setIsBgmPlaying(playing);
    });
    fetchAudioInfo();
    return () => unsub();
  }, []);

  const handleAudioFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingMusic(true);
    setMusicUploadStatus('Memproses & menetapkan sebagai musik bawaan aplikasi...');
    try {
      const buffer = await file.arrayBuffer();
      const res = await fetch('/api/upload-music', {
        method: 'POST',
        headers: { 'Content-Type': file.type || 'application/octet-stream' },
        body: buffer,
      });
      const data = await res.json();
      if (data.success) {
        setMusicUploadStatus('Musik bawaan berhasil diperbarui! ✅');
        await fetchAudioInfo();
        sounds.reloadBgm();
        setTimeout(() => setMusicUploadStatus(null), 3500);
      } else {
        setMusicUploadStatus('Gagal: ' + (data.error || 'Terjadi kesalahan'));
      }
    } catch {
      setMusicUploadStatus('Gagal mengunggah file musik');
    } finally {
      setIsUploadingMusic(false);
      if (audioFileInputRef.current) audioFileInputRef.current.value = '';
    }
  };

  // Splash image management state
  const [splashImageVer, setSplashImageVer] = useState(Date.now());
  const [isUploadingSplash, setIsUploadingSplash] = useState(false);
  const [splashUploadStatus, setSplashUploadStatus] = useState<string | null>(null);
  const splashFileInputRef = useRef<HTMLInputElement | null>(null);

  const handleSplashImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingSplash(true);
    setSplashUploadStatus('Mengunggah gambar cover layar awal...');
    try {
      const buffer = await file.arrayBuffer();
      const res = await fetch('/api/upload-splash', {
        method: 'POST',
        headers: { 'Content-Type': file.type || 'application/octet-stream' },
        body: buffer,
      });
      const data = await res.json();
      if (data.success) {
        setSplashUploadStatus('Gambar cover layar awal berhasil diperbarui! ✅');
        setSplashImageVer(Date.now());
        setTimeout(() => setSplashUploadStatus(null), 3500);
      } else {
        setSplashUploadStatus('Gagal: ' + (data.error || 'Terjadi kesalahan'));
      }
    } catch {
      setSplashUploadStatus('Gagal mengunggah gambar');
    } finally {
      setIsUploadingSplash(false);
      if (splashFileInputRef.current) splashFileInputRef.current.value = '';
    }
  };

  // Load initial data
  useEffect(() => {
    const load = async () => {
      const locs = await gameService.getLocations();
      const sets = await gameService.getSettings();
      const qs = await gameService.getQuestions();
      setLocations(locs);
      setSettings(sets);
      setQuestions(qs);

      // Generate QR Data URLs
      const urls: Record<string, string> = {};
      for (const loc of locs) {
        urls[loc.id] = await generateQrDataUrl(loc.qrCode, { width: 280 });
      }
      setQrImages(urls);

      // Check for active student session
      try {
        const sessionStatus = await gameService.getActiveStatus();
        setActiveSession(sessionStatus.session);
        if (sessionStatus.session?.status === 'locked') {
          setActiveTab('reset');
        }
      } catch {
        // ignore
      }
    };
    load();
  }, []);

  const handleTeacherReset = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = resetCodeInput.trim().toLowerCase();
    if (clean !== 'ulangi') {
      sounds.playWrong();
      setResetError('Kode verifikasi Guru tidak sesuai. Harap periksa kembali.');
      setResetSuccess(null);
      return;
    }

    setIsResetting(true);
    setResetError(null);
    sounds.playClick();

    try {
      const res = await gameService.teacherReset('ulangi', activeSession?.gameId);
      if (res.success) {
        sounds.playSuccess();
        setResetSuccess('Aplikasi petualangan berhasil direset! Siswa dapat mengulang permainan dari awal.');
        setResetCodeInput('');
        setActiveSession(null);
        if (onResetApp) {
          onResetApp();
        }
      } else {
        sounds.playWrong();
        setResetError(res.error || 'Gagal mereset aplikasi');
      }
    } catch {
      sounds.playWrong();
      setResetError('Terjadi kesalahan saat mereset aplikasi');
    } finally {
      setIsResetting(false);
    }
  };

  const handleClearLeaderboard = async () => {
    sounds.playClick();
    triggerHaptic('medium');
    await gameService.clearLeaderboard();
    setClearLbStatus('Seluruh data riwayat peringkat berhasil dibersihkan! Papan peringkat kini mulai dari nol.');
    setTimeout(() => setClearLbStatus(null), 3500);
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === '1234' || pinInput === 'guru' || pinInput === 'admin') {
      sounds.playSuccess();
      setIsAuthenticated(true);
      setPinError(false);
    } else {
      sounds.playWrong();
      setPinError(true);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    sounds.playClick();
    setSavingStatus('Menyimpan pengaturan...');
    await gameService.updateSettings(settings);
    setSavingStatus('Pengaturan berhasil disimpan! ✅');
    setTimeout(() => setSavingStatus(null), 2500);
  };

  const handleSaveLocations = async () => {
    sounds.playClick();
    setSavingStatus('Menyimpan lokasi...');
    await gameService.updateLocations(locations);

    // Regenerate QR
    const urls: Record<string, string> = {};
    for (const loc of locations) {
      urls[loc.id] = await generateQrDataUrl(loc.qrCode, { width: 280 });
    }
    setQrImages(urls);

    setSavingStatus('Lokasi berhasil diperbarui! ✅');
    setTimeout(() => setSavingStatus(null), 2500);
  };

  const handleToggleLocationActive = (id: string) => {
    setLocations(
      locations.map((loc) => (loc.id === id ? { ...loc, isActive: !loc.isActive } : loc))
    );
  };

  const handleUpdateLocationField = (
    id: string,
    field: keyof LocationConfig,
    value: string | boolean
  ) => {
    setLocations(
      locations.map((loc) => (loc.id === id ? { ...loc, [field]: value } : loc))
    );
  };

  const handleDeleteQuestion = async (id: string) => {
    if (!confirm('Yakin ingin menghapus soal ini?')) return;
    sounds.playClick();
    const updated = questions.filter((q) => q.id !== id);
    setQuestions(updated);
    await gameService.updateQuestions(updated);
  };

  const handleSaveQuestion = async (q: Question) => {
    sounds.playClick();
    let updated: Question[];
    if (questions.some((item) => item.id === q.id)) {
      updated = questions.map((item) => (item.id === q.id ? q : item));
    } else {
      updated = [...questions, q];
    }
    setQuestions(updated);
    await gameService.updateQuestions(updated);
    setEditingQuestion(null);
    setIsAddingQuestion(false);
  };

  const handleResetAll = async () => {
    if (!confirm('Apakah Anda yakin ingin mengembalikan SEMUA soal, lokasi, dan pengaturan ke setelan default awal?'))
      return;
    sounds.playClick();
    await gameService.resetAllData();
    window.location.reload();
  };

  // PIN Login Gate
  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border-4 border-blue-400 text-center space-y-4">
        <div className="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-tr from-blue-600 to-indigo-700 text-white flex items-center justify-center text-3xl shadow-md">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black font-display text-blue-950">
          Akses Portal Guru / Admin
        </h2>
        <p className="text-xs text-slate-500 font-medium">
          Masukkan PIN Guru untuk mengelola lokasi, QR Code, dan bank soal matematika.
        </p>

        <form onSubmit={handlePinSubmit} className="space-y-3 pt-2">
          <div className="relative">
            <input
              type={showPin ? 'text' : 'password'}
              inputMode="numeric"
              maxLength={8}
              autoFocus
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              placeholder="Masukkan PIN Akses Guru"
              className="w-full text-center tracking-widest text-2xl font-mono py-3.5 pr-10 border-2 border-blue-300 rounded-2xl focus:outline-hidden focus:border-blue-600 font-bold bg-blue-50/50 text-blue-950"
            />
            <button
              type="button"
              onClick={() => setShowPin(!showPin)}
              className="absolute right-3 top-4 text-slate-400 hover:text-blue-600 p-1"
              title={showPin ? 'Sembunyikan PIN' : 'Lihat PIN'}
            >
              {showPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
            {pinError && (
              <span className="text-xs text-rose-600 font-bold mt-1 block">
                PIN tidak sesuai! Silakan periksa kembali PIN Anda.
              </span>
            )}
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                sounds.playClick();
                onBack();
              }}
              className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl text-sm cursor-pointer"
            >
              Kembali
            </button>
            <button
              type="submit"
              className="flex-1 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-black rounded-2xl text-sm shadow-md cursor-pointer"
            >
              Buka Portal
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={() => {
            sounds.playClick();
            onBack();
          }}
          className="text-xs font-bold text-slate-600 hover:text-blue-900 flex items-center gap-1.5 bg-white px-3.5 py-2.5 rounded-xl border border-blue-200 shadow-2xs cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Keluar dari Admin
        </button>

        <div className="flex items-center gap-2">
          {savingStatus && (
            <span className="text-xs font-bold bg-emerald-100 text-emerald-900 px-3 py-1 rounded-full border border-emerald-300">
              {savingStatus}
            </span>
          )}
          <span className="text-xs font-black uppercase tracking-wider bg-blue-100 text-blue-900 px-3 py-1 rounded-full border border-blue-300">
            👑 Mode Guru Aktif
          </span>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white rounded-3xl p-4 sm:p-7 shadow-xl border-3 border-blue-400 space-y-5">
        {/* Title */}
        <div>
          <h2 className="text-2xl sm:text-3xl font-black font-display text-blue-950">
            ⚙️ Panel Pengaturan Guru
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Atur nama lokasi pos, generate & cetak QR Code, edit bank soal luas bangun datar, serta aturan main & reset kunci siswa.
          </p>
        </div>

        {/* Urgent Lock Alert for Teacher */}
        {activeSession?.status === 'locked' && (
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-rose-600 via-rose-700 to-red-800 text-white border-3 border-rose-300 shadow-lg animate-pulse flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-left">
              <div className="w-12 h-12 rounded-2xl bg-white/20 border border-white/40 flex items-center justify-center text-2xl shrink-0">
                🚨
              </div>
              <div>
                <div className="inline-block px-2.5 py-0.5 rounded-full bg-rose-950/80 text-[11px] font-black uppercase tracking-wider text-rose-200 mb-1 border border-rose-400">
                  KELOMPOK TERKUNCI KARENA 3X SALAH
                </div>
                <h4 className="text-base sm:text-lg font-black font-display text-white">
                  {activeSession.player.playerName} ({activeSession.player.className})
                </h4>
                <p className="text-xs text-rose-100 font-medium">
                  Gagal di: <strong>{activeSession.lockedPosName || 'Pos Permainan'}</strong>. Buka tab &quot;Reset Siswa&quot; untuk membuka kunci aplikasi.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                sounds.playClick();
                setActiveTab('reset');
              }}
              className="px-5 py-3 bg-amber-400 hover:bg-amber-300 text-rose-950 font-black text-xs sm:text-sm rounded-xl shadow-md uppercase tracking-wider transition-all active:scale-95 cursor-pointer shrink-0"
            >
              Buka Form Reset &rarr;
            </button>
          </div>
        )}

        {/* Navigation Tabs (Mobile horizontal scrollable) */}
        <div className="flex overflow-x-auto pb-2 gap-2 border-b border-blue-100 no-scrollbar">
          {[
            { id: 'locations', label: '1. Kelola Lokasi', icon: MapPin },
            { id: 'qr', label: '2. Kelola & Cetak QR', icon: QrCode },
            { id: 'questions', label: '3. Bank Soal (25+)', icon: BookOpen },
            { id: 'settings', label: '4. Pengaturan Game', icon: Settings },
            { id: 'reset', label: '5. Reset Sesi Siswa', icon: RotateCcw, isUrgent: activeSession?.status === 'locked' },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  sounds.playClick();
                  setActiveTab(tab.id as typeof activeTab);
                }}
                className={`px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all shrink-0 cursor-pointer relative ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : tab.isUrgent
                    ? 'bg-rose-100 text-rose-900 border-2 border-rose-400 animate-pulse'
                    : 'bg-blue-50 hover:bg-blue-100 text-blue-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.isUrgent && (
                  <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping"></span>
                )}
              </button>
            );
          })}
        </div>

        {/* --- TAB 1: KELOLA LOKASI --- */}
        {activeTab === 'locations' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-amber-950">
                Daftar 5 Pos Lingkungan Sekolah
              </h3>
              <button
                onClick={handleSaveLocations}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs"
              >
                <Save className="w-3.5 h-3.5" /> Simpan Perubahan Lokasi
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {locations.map((loc) => (
                <div
                  key={loc.id}
                  className={`p-4 rounded-2xl border-2 transition-all space-y-3 ${
                    loc.isFinal
                      ? 'bg-yellow-50/80 border-yellow-400'
                      : 'bg-white border-amber-200 shadow-2xs'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-black text-xs px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-900">
                      {loc.code} {loc.isFinal ? '(Pos Akhir)' : ''}
                    </span>
                    <label className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={loc.isActive}
                        onChange={() => handleToggleLocationActive(loc.id)}
                        className="rounded text-amber-600 focus:ring-amber-500"
                      />
                      <span>Aktif</span>
                    </label>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                      Nama Lokasi Sekolah:
                    </label>
                    <input
                      type="text"
                      value={loc.name}
                      onChange={(e) => handleUpdateLocationField(loc.id, 'name', e.target.value)}
                      placeholder="Contoh: Perpustakaan"
                      className="w-full px-3 py-2 bg-amber-50/50 border border-amber-200 rounded-xl text-xs font-bold text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                      Kode QR String (Unik):
                    </label>
                    <input
                      type="text"
                      value={loc.qrCode}
                      onChange={(e) => handleUpdateLocationField(loc.id, 'qrCode', e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 font-mono rounded-xl text-xs font-bold text-slate-800 uppercase"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                      Petunjuk Teka-Teki (Hint):
                    </label>
                    <textarea
                      rows={2}
                      value={loc.hint}
                      onChange={(e) => handleUpdateLocationField(loc.id, 'hint', e.target.value)}
                      className="w-full px-3 py-2 bg-amber-50/50 border border-amber-200 rounded-xl text-xs text-slate-800 leading-relaxed font-medium"
                    ></textarea>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- TAB 2: KELOLA & CETAK QR --- */}
        {activeTab === 'qr' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-amber-50 p-4 rounded-2xl border border-amber-200">
              <div>
                <h3 className="font-extrabold text-sm sm:text-base text-amber-950">
                  🖨️ Cetak Kartu QR Code Petualangan
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  Cetak semua kartu pos di kertas A4, lalu tempelkan di lokasi sekolah masing-masing.
                </p>
              </div>
              <button
                onClick={() => {
                  sounds.playClick();
                  printQrCards(locations, qrImages);
                }}
                className="px-4 py-3 bg-amber-600 hover:bg-amber-700 text-white font-extrabold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-95"
              >
                <Printer className="w-4 h-4" /> CETAK SEMUA KARTU QR
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {locations.map((loc) => {
                const qrUrl = qrImages[loc.id];
                return (
                  <div
                    key={loc.id}
                    className={`bg-white rounded-2xl p-4 border-2 flex flex-col items-center text-center shadow-xs ${
                      loc.isFinal ? 'border-yellow-400 bg-yellow-50/30' : 'border-amber-200'
                    }`}
                  >
                    <span className="text-[11px] font-black uppercase px-2.5 py-0.5 bg-amber-100 text-amber-900 rounded-full mb-1">
                      {loc.code}
                    </span>
                    <h4 className="font-bold text-slate-800 text-sm">{loc.name}</h4>

                    <div className="my-3 p-2 bg-white rounded-xl border border-amber-100 shadow-2xs">
                      {qrUrl ? (
                        <img src={qrUrl} alt={loc.name} className="w-36 h-36" />
                      ) : (
                        <div className="w-36 h-36 flex items-center justify-center text-xs text-slate-400">
                          Membuat QR...
                        </div>
                      )}
                    </div>

                    <div className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md mb-2">
                      {loc.qrCode}
                    </div>

                    <p className="text-[11px] text-slate-500 italic line-clamp-2 px-2 mb-3">
                      &ldquo;{loc.hint}&rdquo;
                    </p>

                    <button
                      onClick={() => {
                        sounds.playClick();
                        if (qrUrl) downloadQrImage(qrUrl, `QR-${loc.code}-${loc.name}.png`);
                      }}
                      className="w-full py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" /> Unduh PNG
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* --- TAB 3: BANK SOAL --- */}
        {activeTab === 'questions' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-600">Filter Pos:</span>
                <select
                  value={selectedLocationFilter}
                  onChange={(e) => setSelectedLocationFilter(e.target.value)}
                  className="px-3 py-1.5 bg-amber-50 border border-amber-300 rounded-xl text-xs font-bold"
                >
                  <option value="all">Semua Pos ({questions.length} Soal)</option>
                  <option value="pos_1">POS 1 (Perpustakaan)</option>
                  <option value="pos_2">POS 2 (Taman Sekolah)</option>
                  <option value="pos_3">POS 3 (Ruang Kelas)</option>
                  <option value="pos_4">POS 4 (Lapangan)</option>
                  <option value="pos_5">POS 5 (Gudang)</option>
                </select>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    sounds.playClick();
                    setIsAddingQuestion(true);
                    setEditingQuestion({
                      id: `q_${Date.now()}`,
                      locationId: 'pos_1',
                      question: '',
                      shapeType: 'pecahan_lingkaran',
                      type: 'pilihan_ganda',
                      difficulty: 'mudah',
                      options: ['1/4', '2/4', '3/4', '4/4'],
                      correctAnswer: '3/4',
                      explanation: '',
                      unit: '',
                    });
                  }}
                  className="px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs flex items-center gap-1 shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" /> Tambah Soal Baru
                </button>
              </div>
            </div>

            {/* Questions List */}
            <div className="space-y-3">
              {questions
                .filter((q) =>
                  selectedLocationFilter === 'all' ? true : q.locationId === selectedLocationFilter
                )
                .map((q, idx) => (
                  <div
                    key={q.id}
                    className="p-4 bg-white rounded-2xl border border-amber-200 shadow-2xs space-y-2 hover:border-amber-400 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-black uppercase px-2 py-0.5 rounded-md bg-amber-100 text-amber-900">
                          {locations.find((l) => l.id === q.locationId)?.code || q.locationId}
                        </span>
                        <span className="text-[11px] font-bold text-slate-500">
                          Soal #{idx + 1} &bull; {q.shapeType} &bull; {q.type}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                            q.difficulty === 'mudah'
                              ? 'bg-emerald-100 text-emerald-800'
                              : q.difficulty === 'sedang'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {q.difficulty}
                        </span>
                        <button
                          onClick={() => {
                            sounds.playClick();
                            setEditingQuestion(q);
                            setIsAddingQuestion(false);
                          }}
                          className="p-1.5 text-slate-500 hover:text-amber-800"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteQuestion(q.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="font-bold text-slate-800 text-sm">{q.question}</div>

                    {q.options && (
                      <div className="flex flex-wrap gap-2 text-xs">
                        {q.options.map((opt, i) => (
                          <span
                            key={i}
                            className={`px-2 py-0.5 rounded-md border text-[11px] ${
                              opt === q.correctAnswer
                                ? 'bg-emerald-100 border-emerald-400 text-emerald-900 font-bold'
                                : 'bg-slate-50 border-slate-200 text-slate-600'
                            }`}
                          >
                            {opt} {opt === q.correctAnswer ? '✓ (Kunci)' : ''}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="text-[11px] text-slate-500 bg-amber-50/50 p-2 rounded-lg border border-amber-100">
                      <span className="font-bold text-amber-900">Pembahasan: </span>
                      {q.explanation}
                    </div>
                  </div>
                ))}
            </div>

            {/* Modal for editing or adding question */}
            {(editingQuestion || isAddingQuestion) && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs">
                <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border-4 border-amber-400 space-y-4 max-h-[90vh] overflow-y-auto">
                  <h3 className="font-black text-lg text-amber-950 font-display">
                    {isAddingQuestion ? 'Tambah Soal Baru' : 'Edit Soal'}
                  </h3>

                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Pos Lokasi:</label>
                      <select
                        value={editingQuestion?.locationId || 'pos_a'}
                        onChange={(e) =>
                          setEditingQuestion({
                            ...editingQuestion!,
                            locationId: e.target.value as any,
                          })
                        }
                        className="w-full px-3 py-2 border border-amber-300 rounded-xl font-semibold"
                      >
                        <option value="pos_1">POS 1 (Perpustakaan)</option>
                        <option value="pos_2">POS 2 (Taman Sekolah)</option>
                        <option value="pos_3">POS 3 (Ruang Kelas)</option>
                        <option value="pos_4">POS 4 (Lapangan)</option>
                        <option value="pos_5">POS 5 (Gudang)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Teks Pertanyaan:</label>
                      <textarea
                        rows={3}
                        value={editingQuestion?.question || ''}
                        onChange={(e) =>
                          setEditingQuestion({ ...editingQuestion!, question: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-amber-300 rounded-xl font-medium"
                      ></textarea>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Bentuk Soal:</label>
                        <select
                          value={editingQuestion?.type || 'pilihan_ganda'}
                          onChange={(e) =>
                            setEditingQuestion({
                              ...editingQuestion!,
                              type: e.target.value as QuestionType,
                            })
                          }
                          className="w-full px-3 py-2 border border-amber-300 rounded-xl font-semibold"
                        >
                          <option value="pilihan_ganda">Pilihan Ganda</option>
                          <option value="isian_angka">Isian Angka</option>
                          <option value="soal_cerita">Soal Cerita</option>
                          <option value="tantangan">Tantangan Berpikir</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Tingkat Kesulitan:</label>
                        <select
                          value={editingQuestion?.difficulty || 'mudah'}
                          onChange={(e) =>
                            setEditingQuestion({
                              ...editingQuestion!,
                              difficulty: e.target.value as DifficultyLevel,
                            })
                          }
                          className="w-full px-3 py-2 border border-amber-300 rounded-xl font-semibold"
                        >
                          <option value="mudah">🟢 Mudah</option>
                          <option value="sedang">🟡 Sedang</option>
                          <option value="sulit">🔴 Sulit</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Kunci Jawaban Benar:
                      </label>
                      <input
                        type="text"
                        value={editingQuestion?.correctAnswer || ''}
                        onChange={(e) =>
                          setEditingQuestion({ ...editingQuestion!, correctAnswer: e.target.value })
                        }
                        placeholder="Contoh: 3/4 atau 3 1/2 atau 5/7"
                        className="w-full px-3 py-2 border border-emerald-400 bg-emerald-50 rounded-xl font-bold"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Pilihan Jawaban (Pisahkan dengan koma jika pilihan ganda):
                      </label>
                      <input
                        type="text"
                        value={(editingQuestion?.options || []).join(', ')}
                        onChange={(e) =>
                          setEditingQuestion({
                            ...editingQuestion!,
                            options: e.target.value.split(',').map((s) => s.trim()),
                          })
                        }
                        placeholder="Contoh: 1/4, 2/4, 3/4, 4/4"
                        className="w-full px-3 py-2 border border-amber-300 rounded-xl"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Pembahasan Langkah & Rumus:
                      </label>
                      <textarea
                        rows={2}
                        value={editingQuestion?.explanation || ''}
                        onChange={(e) =>
                          setEditingQuestion({ ...editingQuestion!, explanation: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-amber-300 rounded-xl"
                      ></textarea>
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingQuestion(null);
                        setIsAddingQuestion(false);
                      }}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={() => editingQuestion && handleSaveQuestion(editingQuestion)}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-xs shadow-xs"
                    >
                      Simpan Soal
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- TAB 4: PENGATURAN GAME --- */}
        {activeTab === 'settings' && settings && (
          <form onSubmit={handleSaveSettings} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Duration */}
              <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-200 space-y-2">
                <label className="block text-xs font-bold text-slate-700 uppercase">
                  ⏱️ Durasi Permainan:
                </label>
                <select
                  value={settings.durationMinutes}
                  onChange={(e) =>
                    setSettings({ ...settings, durationMinutes: parseInt(e.target.value) })
                  }
                  className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl font-bold text-sm"
                >
                  <option value={15}>15 Menit</option>
                  <option value={30}>30 Menit</option>
                  <option value={45}>45 Menit (Standar)</option>
                  <option value={60}>60 Menit</option>
                  <option value={0}>Tanpa Batas Waktu (Bebas)</option>
                </select>
              </div>

              {/* Max Attempts */}
              <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-200 space-y-2">
                <label className="block text-xs font-bold text-slate-700 uppercase">
                  🎯 Jumlah Kesempatan Mencoba Per Soal:
                </label>
                <select
                  value={settings.maxAttempts}
                  onChange={(e) =>
                    setSettings({ ...settings, maxAttempts: parseInt(e.target.value) })
                  }
                  className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl font-bold text-sm"
                >
                  <option value={2}>Maksimal 2 Kali Percobaan</option>
                  <option value={3}>Maksimal 3 Kali Percobaan (Standar)</option>
                </select>
              </div>

              {/* Clue Mode */}
              <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-200 space-y-2">
                <label className="block text-xs font-bold text-slate-700 uppercase">
                  🗺️ Mode Tampilan Petunjuk:
                </label>
                <select
                  value={settings.hintMode}
                  onChange={(e) =>
                    setSettings({ ...settings, hintMode: e.target.value as any })
                  }
                  className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl font-bold text-sm"
                >
                  <option value="adventure">Mode Petualangan (Teka-Teki Saja)</option>
                  <option value="easy">Mode Mudah (Nama Lokasi Ditampilkan Langsung)</option>
                </select>
              </div>

              {/* Secret Treasure Code */}
              <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-200 space-y-2">
                <label className="block text-xs font-bold text-slate-700 uppercase">
                  🔐 Kode Harta Karun Final:
                </label>
                <input
                  type="text"
                  value={settings.treasureCode}
                  onChange={(e) => setSettings({ ...settings, treasureCode: e.target.value })}
                  placeholder="Contoh: MATEMATIKA-HEBAT"
                  className="w-full px-3 py-2 bg-white border border-amber-300 font-mono font-bold text-sm rounded-xl uppercase"
                />
              </div>

              {/* Teacher Message */}
              <div className="md:col-span-2 bg-amber-50/50 p-4 rounded-2xl border border-amber-200 space-y-2">
                <label className="block text-xs font-bold text-slate-700 uppercase">
                  💬 Pesan Lokasi Harta Karun Guru (Ditampilkan saat siswa menang):
                </label>
                <input
                  type="text"
                  value={settings.teacherMessage}
                  onChange={(e) => setSettings({ ...settings, teacherMessage: e.target.value })}
                  placeholder="Contoh: Segera temui guru di pos akhir untuk mengambil harta karun aslimu!"
                  className="w-full px-3 py-2 bg-white border border-amber-300 font-medium text-sm rounded-xl"
                />
              </div>

              {/* Default Application BGM Card */}
              <div className="md:col-span-2 bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-950 text-white p-4.5 rounded-2xl border-2 border-cyan-400 shadow-md space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-blue-800/80 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-cyan-400/20 border border-cyan-300 flex items-center justify-center text-cyan-300 shrink-0">
                      <Music className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-cyan-300 uppercase tracking-wide flex items-center gap-2">
                        <span>Musik Latar Bawaan Aplikasi (BGM Default)</span>
                      </h4>
                      <p className="text-xs text-blue-200">
                        File musik petualangan resmi yang diunggah telah ditetapkan secara permanen sebagai musik bawaan aplikasi.
                      </p>
                    </div>
                  </div>

                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 border border-emerald-400 text-emerald-300 rounded-full text-xs font-black self-start sm:self-auto">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Aktif Sebagai Bawaan
                  </span>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <div className="text-xs text-blue-200 space-y-0.5">
                    <div className="font-bold text-white">
                      Nama File: <span className="font-mono text-cyan-300">{audioInfo?.fileName || 'adventure-theme.mp3'}</span>
                      {audioInfo?.sizeMb && (
                        <span className="text-cyan-200 bg-blue-800/60 px-2 py-0.5 rounded-md font-mono text-[11px] ml-2">
                          {audioInfo.sizeMb} MB
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-blue-300">
                      Format Audio: High-Fidelity MP3 Stereo • Diputar mengiringi petualangan siswa di setiap pos
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        sounds.playClick();
                        sounds.toggleBgm();
                      }}
                      className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-xs cursor-pointer border ${
                        isBgmPlaying
                          ? 'bg-cyan-400 hover:bg-cyan-300 text-blue-950 border-cyan-200'
                          : 'bg-blue-600 hover:bg-blue-500 text-white border-blue-400'
                      }`}
                    >
                      {isBgmPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                      <span>{isBgmPlaying ? 'Jeda Musik' : 'Putar Musik'}</span>
                    </button>

                    <input
                      type="file"
                      ref={audioFileInputRef}
                      accept="audio/*,video/*"
                      className="hidden"
                      onChange={handleAudioFileChange}
                    />

                    <button
                      type="button"
                      disabled={isUploadingMusic}
                      onClick={() => audioFileInputRef.current?.click()}
                      className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 border border-indigo-400 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{isUploadingMusic ? 'Memproses...' : 'Ganti Musik Bawaan'}</span>
                    </button>
                  </div>
                </div>

                {musicUploadStatus && (
                  <div className="p-2.5 bg-blue-950/90 border border-cyan-400/50 rounded-xl text-xs font-bold text-cyan-200 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{musicUploadStatus}</span>
                  </div>
                )}
              </div>

              {/* Default Application Splash Cover Screen Card */}
              <div className="md:col-span-2 bg-gradient-to-r from-amber-900 via-orange-900 to-amber-950 text-white p-4.5 rounded-2xl border-2 border-amber-400 shadow-md space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-800/80 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-amber-400/20 border border-amber-300 flex items-center justify-center text-amber-300 shrink-0">
                      <ImageIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-amber-300 uppercase tracking-wide flex items-center gap-2">
                        <span>Cover Layar Awal (Fullscreen Splash Screen)</span>
                      </h4>
                      <p className="text-xs text-amber-100">
                        Gambar petualangan resmi yang ditampilkan saat pengguna pertama kali membuka aplikasi.
                      </p>
                    </div>
                  </div>

                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 border border-emerald-400 text-emerald-300 rounded-full text-xs font-black self-start sm:self-auto">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Aktif di Layar Awal
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 pt-1">
                  {/* Thumbnail Preview */}
                  <div className="w-24 h-40 sm:w-28 sm:h-48 rounded-xl overflow-hidden border-2 border-amber-300 shadow-lg shrink-0 bg-slate-900">
                    <img
                      src={`/images/suter_splash.jpg?v=${splashImageVer}`}
                      alt="Preview Cover Suter"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  <div className="flex-1 space-y-2 text-xs text-amber-100">
                    <div className="font-bold text-white text-sm">
                      Petualangan Matematika SUTER SD Negeri 3 Loloan Timur
                    </div>
                    <p className="text-[11px] leading-relaxed text-amber-200">
                      Siswa cukup mengetuk layar di mana saja untuk langsung masuk ke menu utama dan memulai petualangan. Dilengkapi tombol Mulai interaktif dan pemutaran musik latar otomatis.
                    </p>

                    <div className="pt-2 flex flex-wrap items-center gap-2">
                      <input
                        type="file"
                        ref={splashFileInputRef}
                        accept="image/*"
                        className="hidden"
                        onChange={handleSplashImageChange}
                      />

                      <button
                        type="button"
                        disabled={isUploadingSplash}
                        onClick={() => splashFileInputRef.current?.click()}
                        className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-amber-950 font-black rounded-xl text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>{isUploadingSplash ? 'Mengunggah...' : 'Ganti Gambar Layar Awal'}</span>
                      </button>
                    </div>

                    {splashUploadStatus && (
                      <div className="p-2 bg-amber-950/90 border border-amber-400/50 rounded-xl text-xs font-bold text-amber-200 flex items-center gap-2 mt-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>{splashUploadStatus}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Points Settings */}
              <div className="md:col-span-2 bg-amber-50/50 p-4 rounded-2xl border border-amber-200 space-y-2">
                <label className="block text-xs font-bold text-slate-700 uppercase">
                  🌟 Konfigurasi Skor & Bonus:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                  <div>
                    <span className="block text-slate-600 mb-1">Percobaan 1:</span>
                    <input
                      type="number"
                      value={settings.pointsFirstAttempt}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          pointsFirstAttempt: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-full p-2 bg-white border border-amber-200 rounded-lg font-bold"
                    />
                  </div>
                  <div>
                    <span className="block text-slate-600 mb-1">Percobaan 2:</span>
                    <input
                      type="number"
                      value={settings.pointsSecondAttempt}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          pointsSecondAttempt: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-full p-2 bg-white border border-amber-200 rounded-lg font-bold"
                    />
                  </div>
                  <div>
                    <span className="block text-slate-600 mb-1">Percobaan 3:</span>
                    <input
                      type="number"
                      value={settings.pointsThirdAttempt}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          pointsThirdAttempt: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-full p-2 bg-white border border-amber-200 rounded-lg font-bold"
                    />
                  </div>
                  <div>
                    <span className="block text-slate-600 mb-1">Bonus Pos:</span>
                    <input
                      type="number"
                      value={settings.pointsPosBonus}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          pointsPosBonus: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-full p-2 bg-white border border-amber-200 rounded-lg font-bold"
                    />
                  </div>
                  <div>
                    <span className="block text-slate-600 mb-1">Bonus Game:</span>
                    <input
                      type="number"
                      value={settings.pointsGameBonus}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          pointsGameBonus: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-full p-2 bg-white border border-amber-200 rounded-lg font-bold"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-3">
              <button
                type="submit"
                className="flex-1 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm rounded-2xl shadow-md transition-all active:scale-98 flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" /> SIMPAN SEMUA PENGATURAN
              </button>

              <button
                type="button"
                onClick={handleResetAll}
                className="py-3 px-4 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 border border-slate-300 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Kembalikan ke Standar Default
              </button>
            </div>
          </form>
        )}

        {/* --- TAB 5: RESET APLIKASI --- */}
        {activeTab === 'reset' && (
          <div className="space-y-5 animate-in fade-in duration-200">
            {/* Header info card */}
            <div className="bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 text-white p-5 rounded-3xl border-3 border-cyan-400 shadow-xl space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 text-xs font-black uppercase tracking-wider">
                <KeyRound className="w-3.5 h-3.5 text-cyan-300" /> Otoritas Khusus Guru
              </div>
              <h3 className="text-xl sm:text-2xl font-black font-display text-white">
                Reset Kunci Aplikasi & Permainan Siswa
              </h3>
              <p className="text-xs sm:text-sm text-blue-100 leading-relaxed max-w-2xl">
                Sesuai peraturan resmi petualangan: Apabila sebuah kelompok <strong>3 kali salah menjawab dalam 1 soal</strong>, aplikasi otomatis <strong>TERKUNCI</strong> pada pos tersebut. Hanya Guru yang dapat membuka kunci dan mereset aplikasi dengan memasukkan kode verifikasi rahasia Guru.
              </p>
            </div>

            {/* Status of Active / Locked Session */}
            <div className={`p-5 rounded-3xl border-3 shadow-md space-y-4 ${
              activeSession?.status === 'locked'
                ? 'bg-rose-50 border-rose-500 text-rose-950'
                : activeSession
                ? 'bg-blue-50 border-blue-400 text-blue-950'
                : 'bg-slate-50 border-slate-300 text-slate-700'
            }`}>
              <div className="flex items-center justify-between pb-3 border-b border-current/20">
                <div className="flex items-center gap-2">
                  <span className="text-xl">
                    {activeSession?.status === 'locked' ? '🚨' : activeSession ? '🧭' : 'ℹ️'}
                  </span>
                  <h4 className="font-extrabold text-sm sm:text-base">
                    Status Sesi Siswa Saat Ini
                  </h4>
                </div>
                {activeSession && (
                  <span className={`text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider ${
                    activeSession.status === 'locked'
                      ? 'bg-rose-600 text-white animate-pulse'
                      : 'bg-emerald-600 text-white'
                  }`}>
                    {activeSession.status === 'locked' ? 'TERKUNCI (GAGAL 3X)' : 'SEDANG BERJALAN'}
                  </span>
                )}
              </div>

              {activeSession ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 bg-white/80 rounded-2xl border border-current/10 space-y-1">
                    <span className="text-slate-500 font-bold block">Nama Kelompok / Siswa:</span>
                    <span className="font-black text-sm text-slate-900 block">
                      {activeSession.player.playerName}
                    </span>
                    <span className="text-[11px] text-slate-600 font-medium">
                      Kelas: {activeSession.player.className}
                    </span>
                  </div>

                  <div className="p-3 bg-white/80 rounded-2xl border border-current/10 space-y-1">
                    <span className="text-slate-500 font-bold block">Pos Lokasi Terakhir:</span>
                    <span className="font-black text-sm text-slate-900 block">
                      {activeSession.lockedPosName || locations.find(l => l.id === activeSession.route[activeSession.currentPosIndex])?.name || 'Pos Aktif'}
                    </span>
                    <span className="text-[11px] text-slate-600 font-medium">
                      Pos ke-{activeSession.currentPosIndex + 1} dari 5
                    </span>
                  </div>

                  <div className="p-3 bg-white/80 rounded-2xl border border-current/10 space-y-1">
                    <span className="text-slate-500 font-bold block">Poin & Akurasi:</span>
                    <span className="font-black text-sm text-amber-600 block">
                      {activeSession.score} Poin
                    </span>
                    <span className="text-[11px] text-slate-600 font-medium">
                      {activeSession.totalCorrect} benar dari {activeSession.totalAttempts} percobaan
                    </span>
                  </div>

                  <div className="p-3 bg-white/80 rounded-2xl border border-current/10 space-y-1">
                    <span className="text-slate-500 font-bold block">Kondisi:</span>
                    <span className={`font-black text-xs block ${
                      activeSession.status === 'locked' ? 'text-rose-700' : 'text-emerald-700'
                    }`}>
                      {activeSession.status === 'locked'
                        ? 'Terkunci karena 3x salah menjawab'
                        : 'Permainan aktif'}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-white/80 rounded-2xl text-xs text-slate-600 font-medium text-center">
                  Tidak ada sesi permainan aktif atau terkunci di memori perangkat ini. Jika kelompok baru ingin bermain, mereka dapat langsung memulai dari halaman utama.
                </div>
              )}
            </div>

            {/* Reset Form */}
            <form onSubmit={handleTeacherReset} className="bg-white p-5 sm:p-6 rounded-3xl border-3 border-rose-300 shadow-md space-y-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-800 mb-1.5">
                  🔑 Masukkan Kode Verifikasi Guru:
                </label>
                <div className="relative max-w-md">
                  <input
                    type={showResetSecret ? 'text' : 'password'}
                    value={resetCodeInput}
                    onChange={(e) => {
                      setResetCodeInput(e.target.value);
                      setResetError(null);
                    }}
                    placeholder="Masukkan Kode Rahasia Guru"
                    className="w-full px-4 py-3.5 pr-12 bg-slate-50 border-2 border-slate-300 rounded-2xl font-mono text-base font-black text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-rose-500 focus:bg-white uppercase tracking-wider"
                  />
                  <button
                    type="button"
                    onClick={() => setShowResetSecret(!showResetSecret)}
                    className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-700 p-1"
                    title={showResetSecret ? 'Sembunyikan Kode' : 'Lihat Kode'}
                  >
                    {showResetSecret ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5 text-slate-400" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5 font-medium">
                  Masukkan kode verifikasi rahasia Guru untuk membuka kunci dan mereset sesi permainan siswa.
                </p>
              </div>

              {resetError && (
                <div className="p-3 bg-rose-100 border-2 border-rose-400 text-rose-900 rounded-2xl text-xs font-bold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{resetError}</span>
                </div>
              )}

              {resetSuccess && (
                <div className="p-4 bg-emerald-100 border-2 border-emerald-500 text-emerald-950 rounded-2xl text-xs font-bold flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span>{resetSuccess}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playClick();
                      onBack();
                    }}
                    className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-black cursor-pointer shrink-0"
                  >
                    Ke Halaman Siswa &rarr;
                  </button>
                </div>
              )}

              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <button
                  type="submit"
                  disabled={isResetting || !resetCodeInput.trim()}
                  className="px-6 py-4 bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 hover:from-rose-700 hover:to-red-800 disabled:opacity-50 text-white font-black text-sm rounded-2xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 uppercase tracking-wide cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>{isResetting ? 'Mereset Aplikasi...' : 'RESET KUNCI APLIKASI SISWA'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    onBack();
                  }}
                  className="px-5 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm rounded-2xl transition-all cursor-pointer text-center"
                >
                  Kembali ke Menu
                </button>
              </div>
            </form>

            {/* Clear Leaderboard Data Card */}
            <div className="bg-white p-5 rounded-3xl border-3 border-amber-300 shadow-md space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="font-extrabold text-sm sm:text-base text-slate-900">
                    Bersihkan Riwayat Papan Peringkat
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5 max-w-xl">
                    Hapus semua catatan skor, nama kelompok, dan riwayat yang tersimpan agar papan peringkat bersih dan siap digunakan dari nol untuk siswa baru.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleClearLeaderboard}
                  className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black shadow-xs shrink-0 cursor-pointer active:scale-95 transition-all self-start sm:self-auto"
                >
                  Bersihkan Peringkat Sekarang
                </button>
              </div>

              {clearLbStatus && (
                <div className="p-3 bg-emerald-100 border border-emerald-400 text-emerald-900 rounded-xl text-xs font-bold flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{clearLbStatus}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
