import React, { useEffect, useRef, useState } from 'react';
import { Music, Volume2, VolumeX, Play, Pause, Disc, Upload, CheckCircle2, Loader2 } from 'lucide-react';
import { sounds } from '../utils/audio';

export const MusicPlayerControl: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(sounds.isBgmPlaying);
  const [volume, setVolume] = useState(sounds.bgmVolume);
  const [isOpenMenu, setIsOpenMenu] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const unsubscribe = sounds.subscribeBgm((playing, vol) => {
      setIsPlaying(playing);
      setVolume(vol);
    });
    return () => unsubscribe();
  }, []);

  const handleTogglePlay = () => {
    sounds.playClick();
    sounds.toggleBgm();
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = parseFloat(e.target.value);
    setVolume(newVol);
    sounds.setBgmVolume(newVol);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadStatus('Mengunggah & memproses audio...');
    try {
      const buffer = await file.arrayBuffer();
      const res = await fetch('/api/upload-music', {
        method: 'POST',
        headers: {
          'Content-Type': file.type || 'application/octet-stream',
        },
        body: buffer,
      });

      const data = await res.json();
      if (data.success) {
        setUploadStatus('Musik asli berhasil dipasang!');
        sounds.reloadBgm();
        setTimeout(() => setUploadStatus(null), 3000);
      } else {
        setUploadStatus('Gagal: ' + (data.error || 'Terjadi kesalahan'));
      }
    } catch (err) {
      console.error(err);
      setUploadStatus('Gagal memproses file audio');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="relative">
      {/* Main Music Toggle Pill */}
      <div className="flex items-center bg-blue-100/90 hover:bg-blue-200/90 border border-blue-300 rounded-2xl p-1 shadow-xs transition-all">
        <button
          type="button"
          onClick={handleTogglePlay}
          title={isPlaying ? 'Jeda Musik Petualangan' : 'Putar Musik Petualangan'}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${
            isPlaying
              ? 'bg-blue-600 text-white shadow-xs animate-pulse-gentle'
              : 'text-blue-900 hover:text-blue-950'
          }`}
        >
          {isPlaying ? (
            <>
              <Pause className="w-3.5 h-3.5 fill-white" />
              {/* Mini Audio Equalizer Visualizer Bars */}
              <div className="flex items-end gap-0.5 h-3">
                <span className="w-1 bg-white rounded-full animate-music-bar-1 h-3"></span>
                <span className="w-1 bg-white rounded-full animate-music-bar-2 h-2"></span>
                <span className="w-1 bg-white rounded-full animate-music-bar-3 h-3"></span>
              </div>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-blue-700 text-blue-700" />
              <Music className="w-3.5 h-3.5 text-blue-700" />
            </>
          )}
          <span className="hidden sm:inline">
            {isPlaying ? 'Musik Aktif' : 'Musik'}
          </span>
        </button>

        {/* Volume Settings dropdown trigger */}
        <button
          type="button"
          onClick={() => {
            sounds.playClick();
            setIsOpenMenu(!isOpenMenu);
          }}
          title="Pengaturan Volume Musik"
          className="p-1.5 text-blue-800 hover:text-blue-950 rounded-lg hover:bg-blue-300/50 transition-colors"
        >
          {volume === 0 || !isPlaying ? (
            <VolumeX className="w-3.5 h-3.5" />
          ) : (
            <Volume2 className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      {/* Floating Volume Slider Popover */}
      {isOpenMenu && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl p-3.5 shadow-2xl border-2 border-blue-300 z-50 animate-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-2">
            <span className="flex items-center gap-1.5 text-blue-900">
              <Disc className="w-3.5 h-3.5 text-blue-600 animate-spin-slow" />
              <span>Volume Musik Bawaan</span>
            </span>
            <span className="text-[11px] text-blue-800 font-extrabold">{Math.round(volume * 100)}%</span>
          </div>

          <div className="mb-2 px-2 py-1.5 bg-blue-50/80 border border-blue-200 rounded-xl text-[11px] text-blue-950 font-semibold flex items-center justify-between">
            <span className="truncate pr-1">🎵 Tema Petualangan SDN 3 Loloan Timur</span>
            <button
              type="button"
              onClick={() => {
                sounds.playClick();
                sounds.reloadBgm();
              }}
              title="Mulai ulang lagu dari awal"
              className="text-[10px] text-blue-700 hover:text-blue-900 font-bold shrink-0 underline ml-1"
            >
              Ulang
            </button>
          </div>

          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={volume}
            onChange={handleVolumeChange}
            className="w-full accent-blue-600 cursor-pointer h-2 bg-blue-100 rounded-lg"
          />

          <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <button
              onClick={() => {
                sounds.playClick();
                sounds.setBgmVolume(0);
              }}
              className="text-slate-500 hover:text-rose-600 font-semibold"
            >
              Mute
            </button>
            <button
              onClick={() => {
                sounds.playClick();
                sounds.setBgmVolume(0.4);
              }}
              className="text-blue-700 hover:text-blue-900 font-bold"
            >
              Standar (40%)
            </button>
          </div>

          {/* Upload original video/audio button */}
          <div className="mt-3 pt-2.5 border-t border-blue-100">
            <input
              type="file"
              ref={fileInputRef}
              accept="audio/*,video/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <button
              type="button"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-black shadow-sm transition-all disabled:opacity-50"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Mengekstrak Suara...</span>
                </>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5" />
                  <span>Ganti / Perbarui Musik Bawaan</span>
                </>
              )}
            </button>
            <p className="text-[10px] text-slate-500 mt-1 text-center leading-tight">
              File yang diunggah otomatis tersimpan permanen sebagai musik bawaan aplikasi.
            </p>

            {uploadStatus && (
              <div className="mt-2 p-1.5 bg-blue-50 border border-blue-200 rounded-lg text-[10px] font-bold text-blue-900 flex items-center gap-1 justify-center">
                <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                <span>{uploadStatus}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
