import React, { useState } from 'react';
import { GameSession } from '../types/game';
import { Lock, AlertTriangle, ShieldCheck, RotateCcw, Users, MapPin, KeyRound, Eye, EyeOff } from 'lucide-react';
import { sounds, triggerHaptic } from '../utils/audio';
import { gameService } from '../services/gameService';

interface Props {
  session: GameSession;
  currentStation?: any;
  onOpenAdmin: () => void;
  onResetSuccess: () => void;
}

export const LockedGameView: React.FC<Props> = ({
  session,
  currentStation,
  onOpenAdmin,
  onResetSuccess,
}) => {
  const [teacherCode, setTeacherCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);
  const [showDirectReset, setShowDirectReset] = useState(false);

  const handleTeacherReset = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = teacherCode.trim().toLowerCase();
    if (clean !== 'ulangi') {
      sounds.playWrong();
      triggerHaptic('error');
      setErrorMsg('Kode verifikasi Guru tidak sesuai! Harap periksa kembali.');
      return;
    }

    setIsResetting(true);
    setErrorMsg(null);
    sounds.playClick();
    triggerHaptic('tap');

    try {
      const res = await gameService.teacherReset('ulangi', session.gameId);
      if (res.success) {
        sounds.playSuccess();
        triggerHaptic('success');
        onResetSuccess();
      } else {
        sounds.playWrong();
        triggerHaptic('error');
        setErrorMsg(res.error || 'Gagal mereset aplikasi');
      }
    } catch {
      sounds.playWrong();
      triggerHaptic('error');
      setErrorMsg('Terjadi kendala saat mereset aplikasi');
    } finally {
      setIsResetting(false);
    }
  };

  const posName = currentStation?.name || session.lockedPosName || currentStation?.code || 'Pos Aktif';
  const posCode = currentStation?.code || 'POS';

  return (
    <div className="max-w-2xl mx-auto space-y-3 sm:space-y-4 text-center animate-in fade-in zoom-in-95 duration-200">
      {/* Main Lock Card */}
      <div className="bg-gradient-to-b from-rose-700 via-rose-800 to-red-950 rounded-3xl p-4 sm:p-7 text-white shadow-2xl border-3 sm:border-4 border-rose-400 relative overflow-hidden">
        {/* Pulsing Lock Icon */}
        <div className="w-14 h-14 sm:w-18 sm:h-18 mx-auto rounded-2xl bg-rose-500/30 border-3 border-rose-300 flex items-center justify-center text-rose-100 shadow-lg shadow-rose-950/50 mb-2.5 animate-pulse">
          <Lock className="w-7 h-7 sm:w-9 sm:h-9 text-rose-200" />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-rose-900/80 border border-rose-400/50 text-[10px] sm:text-xs font-black uppercase tracking-widest text-rose-200 mb-2">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-300" /> KELOMPOK GAGAL DI POS INI
        </div>

        <h1 className="text-xl sm:text-3xl font-black font-display tracking-tight text-white drop-shadow-md">
          APLIKASI TERKUNCI!
        </h1>
        <p className="text-rose-200 font-bold text-xs sm:text-sm mt-0.5">
          3 Kali Berturut-turut Salah Menjawab Soal Matematika
        </p>

        {/* Failed Group Details Box */}
        <div className="mt-3 p-3 rounded-2xl bg-rose-950/70 border border-rose-500/50 text-left space-y-1.5 text-xs">
          <div className="flex items-center justify-between pb-1.5 border-b border-rose-800">
            <span className="text-rose-300 font-bold flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-rose-300" /> Kelompok:
            </span>
            <span className="text-white font-black text-xs">
              {session.player.playerName} ({session.player.className})
            </span>
          </div>

          {session.player.members && session.player.members.length > 0 && (
            <div className="flex items-start justify-between pb-1.5 border-b border-rose-800">
              <span className="text-rose-300 font-bold">Anggota:</span>
              <span className="text-rose-100 font-medium text-right max-w-xs text-[11px]">
                {session.player.members.join(', ')}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between pb-1.5 border-b border-rose-800">
            <span className="text-rose-300 font-bold flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-rose-300" /> Pos Lokasi:
            </span>
            <span className="text-amber-300 font-black text-xs">
              {posCode} - {posName}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-rose-300 font-bold">Status:</span>
            <span className="text-rose-300 font-extrabold bg-rose-900/60 px-2 py-0.5 rounded-md border border-rose-600 text-[10px]">
              Gagal & Perlu Reset Guru
            </span>
          </div>
        </div>

        {/* Official Rule Notice */}
        <div className="mt-3 p-3 rounded-2xl bg-amber-500/20 border-2 border-amber-400 text-amber-100 text-xs font-medium leading-relaxed">
          <p className="font-extrabold text-amber-300 uppercase tracking-wide text-center mb-0.5 text-[11px]">
            📜 Peraturan SDN 3 Loloan Timur
          </p>
          <p className="text-[11px]">
            Jika kelompok <strong>3 kali salah menjawab dalam 1 soal</strong>, pos dinyatakan gagal dan aplikasi otomatis terkunci.
          </p>
          <p className="mt-1 font-bold text-white text-[11px]">
            Pembukaan kunci aplikasi <u>HANYA DAPAT DILAKUKAN OLEH GURU</u>.
          </p>
        </div>

        {/* Primary Action Buttons */}
        <div className="mt-4 flex flex-col sm:flex-row gap-2 justify-center">
          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              triggerHaptic('tap');
              onOpenAdmin();
            }}
            className="w-full sm:w-auto px-4 py-3 min-h-[46px] bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 hover:from-blue-700 text-white font-black text-xs sm:text-sm rounded-2xl shadow-xl border-2 border-cyan-300 transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4 text-cyan-200" />
            <span>BUKA PANEL GURU UNTUK RESET</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              triggerHaptic('tap');
              setShowDirectReset(!showDirectReset);
            }}
            className="w-full sm:w-auto px-3.5 py-3 min-h-[46px] bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-2xl border-2 border-white/30 transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <KeyRound className="w-4 h-4 text-amber-300" />
            <span>{showDirectReset ? 'Tutup Form Reset' : 'Guru Ada di Sini? Reset Langsung'}</span>
          </button>
        </div>

        {/* Direct Teacher Reset Form on Lock Screen */}
        {showDirectReset && (
          <form
            onSubmit={handleTeacherReset}
            className="mt-3.5 p-3.5 rounded-2xl bg-slate-900/90 border-2 border-cyan-400 text-white text-left animate-in slide-in-from-top-2 duration-200 space-y-2.5"
          >
            <div className="flex items-center gap-1.5 text-cyan-300 text-xs font-black uppercase">
              <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
              <span>Verifikasi Guru Langsung di HP Siswa</span>
            </div>
            <p className="text-[11px] text-slate-300">
              Guru pendamping silakan masukkan kode verifikasi rahasia untuk membuka kunci:
            </p>

            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={teacherCode}
                  onChange={(e) => setTeacherCode(e.target.value)}
                  placeholder="Masukkan Kode Rahasia Guru"
                  className="w-full px-3.5 py-2.5 pr-10 bg-slate-800 border-2 border-slate-600 rounded-xl text-white font-mono text-base font-bold placeholder-slate-500 focus:outline-hidden focus:border-cyan-400"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white p-1"
                  title={showPassword ? 'Sembunyikan Kode' : 'Tampilkan Kode'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4 text-cyan-300" />}
                </button>
              </div>
              <button
                type="submit"
                disabled={isResetting || !teacherCode.trim()}
                className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-500 disabled:opacity-50 text-white font-black text-xs rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5 uppercase cursor-pointer shrink-0 min-h-[44px]"
              >
                <RotateCcw className="w-4 h-4" />
                <span>{isResetting ? 'Mereset...' : 'RESET SEKARANG'}</span>
              </button>
            </div>

            {errorMsg && (
              <div className="text-xs text-rose-300 font-bold bg-rose-950/60 p-2 rounded-lg border border-rose-500/50">
                ⚠️ {errorMsg}
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
};
