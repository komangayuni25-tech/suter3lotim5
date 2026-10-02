import React, { useState } from 'react';
import { Users, User, ArrowRight, Plus, Trash2, ArrowLeft } from 'lucide-react';
import { PlayerInfo } from '../types/game';
import { sounds, triggerHaptic } from '../utils/audio';

interface Props {
  onStartGame: (player: PlayerInfo) => void;
  onBack: () => void;
}

export const PlayerSetup: React.FC<Props> = ({ onStartGame, onBack }) => {
  const [mode, setMode] = useState<'individual' | 'group'>('group');
  const [playerName, setPlayerName] = useState('');
  const [className, setClassName] = useState('Kelas 5A');
  const [memberInput, setMemberInput] = useState('');
  const [members, setMembers] = useState<string[]>(['Andi', 'Budi', 'Citra']);

  const handleAddMember = () => {
    if (!memberInput.trim()) return;
    sounds.playClick();
    triggerHaptic('tap');
    if (!members.includes(memberInput.trim())) {
      setMembers([...members, memberInput.trim()]);
    }
    setMemberInput('');
  };

  const handleRemoveMember = (idx: number) => {
    sounds.playClick();
    triggerHaptic('tap');
    setMembers(members.filter((_, i) => i !== idx));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim()) return;

    sounds.playClick();
    triggerHaptic('success');
    onStartGame({
      mode,
      playerName: playerName.trim(),
      className: className.trim(),
      members: mode === 'group' ? members : undefined,
    });
  };

  return (
    <div className="max-w-lg mx-auto bg-white rounded-3xl p-4 sm:p-7 shadow-xl border-2 sm:border-4 border-blue-300">
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => {
            sounds.playClick();
            triggerHaptic('tap');
            onBack();
          }}
          className="text-xs font-bold text-slate-600 hover:text-blue-900 flex items-center gap-1.5 py-1.5 px-3 bg-blue-50/70 rounded-xl border border-blue-200 cursor-pointer active:scale-95 min-h-[36px]"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali
        </button>

        <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider bg-blue-100 text-blue-900 border border-blue-200 px-2.5 py-0.5 rounded-full truncate">
          SDN 3 Loloan Timur
        </span>
      </div>

      <div className="text-center mb-4">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-cyan-400 via-blue-500 to-indigo-600 flex items-center justify-center text-2xl shadow-md shadow-blue-500/20 mb-2 text-white">
          🎒
        </div>
        <h2 className="text-xl sm:text-2xl font-black font-display text-blue-950">
          Siapkan Regu Berburumu!
        </h2>
        <p className="text-xs text-blue-800 font-bold mt-0.5">
          &ldquo;SUTER&rdquo; &bull; SD Negeri 3 Loloan Timur
        </p>
        <p className="text-[11px] text-slate-500 mt-0.5">
          Masukkan identitas regu atau nama siswa untuk memulai petualangan.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3.5">
        {/* Mode Selector: Individu vs Kelompok */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Pilih Mode Bermain:
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                sounds.playClick();
                triggerHaptic('tap');
                setMode('group');
                if (!playerName) setPlayerName('Kelompok Garuda');
              }}
              className={`p-2.5 rounded-2xl border-2 font-bold flex items-center justify-center gap-1.5 text-xs sm:text-sm transition-all cursor-pointer min-h-[46px] ${
                mode === 'group'
                  ? 'bg-blue-600 border-blue-700 text-white shadow-xs'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-blue-50'
              }`}
            >
              <Users className="w-4 h-4" /> Kelompok / Regu
            </button>
            <button
              type="button"
              onClick={() => {
                sounds.playClick();
                triggerHaptic('tap');
                setMode('individual');
                if (playerName === 'Kelompok Garuda') setPlayerName('');
              }}
              className={`p-2.5 rounded-2xl border-2 font-bold flex items-center justify-center gap-1.5 text-xs sm:text-sm transition-all cursor-pointer min-h-[46px] ${
                mode === 'individual'
                  ? 'bg-blue-600 border-blue-700 text-white shadow-xs'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-blue-50'
              }`}
            >
              <User className="w-4 h-4" /> Individu
            </button>
          </div>
        </div>

        {/* Player / Team Name */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            {mode === 'group' ? 'Nama Kelompok:' : 'Nama Siswa:'}
          </label>
          <input
            type="text"
            required
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder={mode === 'group' ? 'Contoh: Kelompok Garuda' : 'Contoh: Andi Pratama'}
            className="w-full px-3.5 py-2.5 bg-blue-50/40 border-2 border-blue-200 focus:border-blue-500 rounded-xl text-slate-900 font-bold focus:outline-hidden focus:bg-white text-base"
          />
        </div>

        {/* Class Name */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Kelas:
          </label>
          <select
            value={className}
            onChange={(e) => setClassName(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-blue-50/40 border-2 border-blue-200 focus:border-blue-500 rounded-xl text-slate-900 font-bold focus:outline-hidden focus:bg-white text-base"
          >
            <option value="Kelas 5A">Kelas 5A</option>
            <option value="Kelas 5B">Kelas 5B</option>
            <option value="Kelas 5C">Kelas 5C</option>
            <option value="Kelas 6A">Kelas 6A</option>
            <option value="Kelas 6B">Kelas 6B</option>
            <option value="Kelas 6C">Kelas 6C</option>
            <option value="Kelas Lainnya">Kelas Lainnya</option>
          </select>
        </div>

        {/* Group Members List (if group mode) */}
        {mode === 'group' && (
          <div className="bg-blue-50/60 p-3 rounded-2xl border border-blue-200 space-y-2">
            <label className="block text-xs font-bold text-blue-950 uppercase tracking-wider">
              Daftar Anggota Kelompok:
            </label>

            <div className="flex gap-1.5">
              <input
                type="text"
                value={memberInput}
                onChange={(e) => setMemberInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddMember();
                  }
                }}
                placeholder="Ketik nama anggota"
                className="flex-1 px-3 py-2 bg-white border border-blue-300 rounded-xl text-xs font-semibold focus:outline-hidden focus:border-blue-500"
              />
              <button
                type="button"
                onClick={handleAddMember}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center gap-1 shadow-xs cursor-pointer min-h-[38px]"
              >
                <Plus className="w-3.5 h-3.5" /> Tambah
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
              {members.map((member, idx) => (
                <span
                  key={idx}
                  className="bg-white text-slate-700 text-xs font-bold px-2.5 py-1 rounded-xl border border-blue-200 flex items-center gap-1.5 shadow-2xs"
                >
                  <span>{member}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveMember(idx)}
                    className="w-5 h-5 flex items-center justify-center text-slate-400 hover:text-rose-600 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Start Adventure Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={!playerName.trim()}
            className="w-full py-3.5 min-h-[52px] bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 disabled:opacity-50 text-white font-black text-base sm:text-lg rounded-2xl shadow-xl shadow-blue-500/25 transition-all active:scale-98 flex items-center justify-center gap-2 font-display uppercase tracking-wide cursor-pointer border border-cyan-300/40"
          >
            MULAI PETUALANGAN <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
