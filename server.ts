import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import {
  GameSession,
  LocationConfig,
  GameSettings,
  Question,
  ClientQuestion,
  LeaderboardEntry,
} from './src/types/game.js';
import {
  DEFAULT_LOCATIONS,
  DEFAULT_SETTINGS,
  DEFAULT_QUESTIONS,
} from './src/data/defaultData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In-memory data store with optional persistence
let locations: LocationConfig[] = [...DEFAULT_LOCATIONS];
let settings: GameSettings = { ...DEFAULT_SETTINGS };
let questions: Question[] = [...DEFAULT_QUESTIONS];
const activeGames: Map<string, GameSession> = new Map();
let leaderboard: LeaderboardEntry[] = [];

// Helper to shuffle array
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Sanitize question for client (strips correctAnswer & explanation)
function toClientQuestion(q: Question): ClientQuestion {
  const sanitized: ClientQuestion = {
    id: q.id,
    locationId: q.locationId,
    question: q.question,
    shapeType: q.shapeType,
    type: q.type,
    difficulty: q.difficulty,
    unit: q.unit,
    diagram: q.diagram,
  };

  if (q.options && q.options.length > 0) {
    // Shuffle options so correct answer is NOT always in the same place
    sanitized.options = shuffleArray(q.options);
  }

  return sanitized;
}

function parseFractionValue(str: string): number | null {
  const s = str.trim();
  const mixedMatch = s.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (mixedMatch) {
    const whole = parseInt(mixedMatch[1], 10);
    const num = parseInt(mixedMatch[2], 10);
    const den = parseInt(mixedMatch[3], 10);
    if (den !== 0) return whole + num / den;
  }
  const fracMatch = s.match(/^(\d+)\/(\d+)$/);
  if (fracMatch) {
    const num = parseInt(fracMatch[1], 10);
    const den = parseInt(fracMatch[2], 10);
    if (den !== 0) return num / den;
  }
  const f = parseFloat(s);
  return isNaN(f) ? null : f;
}

// Compare answer loosely
function checkAnswerMatch(userAns: string, correctAns: string): boolean {
  if (!userAns || !correctAns) return false;
  const normalize = (val: string) =>
    val
      .trim()
      .toLowerCase()
      .replace(/^[a-d]\.\s*/, '')
      .replace(/\s+/g, ' ')
      .replace(/,/g, '.');

  const u = normalize(userAns);
  const c = normalize(correctAns);

  if (u === c) return true;

  const stripUnits = (str: string) =>
    str
      .replace(/\(.*?\)/g, '')
      .replace(/(cm²|m²|cm2|m2|cm|m|buah|kali|kg|liter|loyang|kuintal|bagian|potong|petak)/g, '')
      .trim();

  const cleanU = stripUnits(u);
  const cleanC = stripUnits(c);

  if (cleanU === cleanC && cleanU.length > 0) return true;

  const uVal = parseFractionValue(cleanU);
  const cVal = parseFractionValue(cleanC);
  if (uVal !== null && cVal !== null && Math.abs(uVal - cVal) < 0.001) {
    return true;
  }

  return false;
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // Explicitly serve static audio files directly with proper content-type, byte-range, and no-cache headers
  const publicAudioDir = path.resolve(__dirname, 'public', 'audio');
  app.use('/audio', express.static(publicAudioDir, {
    setHeaders: (res) => {
      res.set('Accept-Ranges', 'bytes');
      res.set('Cache-Control', 'no-cache, must-revalidate');
    },
  }));

  // Explicitly serve static images directory
  const publicImagesDir = path.resolve(__dirname, 'public', 'images');
  fs.mkdirSync(publicImagesDir, { recursive: true });
  app.use('/images', express.static(publicImagesDir));

  // --- API ROUTES ---

  // Audio info: returns metadata about default music
  app.get('/api/audio-info', (req: Request, res: Response) => {
    try {
      const audioPath = path.join(publicAudioDir, 'adventure-theme.mp3');
      if (fs.existsSync(audioPath)) {
        const stat = fs.statSync(audioPath);
        return res.json({
          success: true,
          exists: true,
          fileName: 'adventure-theme.mp3',
          sizeBytes: stat.size,
          sizeMb: (stat.size / (1024 * 1024)).toFixed(2),
          mtimeMs: Math.round(stat.mtimeMs),
          isDefault: true,
          title: 'Musik Petualangan Resmi SD Negeri 3 Loloan Timur',
        });
      }
      return res.json({ success: true, exists: false });
    } catch (e) {
      return res.status(500).json({ success: false, error: 'Gagal membaca status audio' });
    }
  });

  // Reset audio to default
  app.post('/api/reset-music', (req: Request, res: Response) => {
    try {
      const backupPath = path.join(publicAudioDir, 'default-adventure-theme.mp3');
      const targetPath = path.join(publicAudioDir, 'adventure-theme.mp3');
      if (fs.existsSync(backupPath)) {
        fs.copyFileSync(backupPath, targetPath);
        const distAudio = path.resolve(__dirname, 'dist', 'audio', 'adventure-theme.mp3');
        if (fs.existsSync(path.dirname(distAudio))) {
          fs.copyFileSync(backupPath, distAudio);
        }
        return res.json({ success: true, message: 'Musik bawaan aplikasi berhasil dipulihkan!' });
      }
      return res.status(404).json({ success: false, error: 'File cadangan musik bawaan tidak ditemukan' });
    } catch (e) {
      return res.status(500).json({ success: false, error: 'Gagal memulihkan musik bawaan' });
    }
  });

  // Upload custom music/video and extract original audio using ffmpeg
  app.post(
    '/api/upload-music',
    express.raw({ limit: '150mb', type: () => true }),
    async (req: Request, res: Response) => {
      try {
        const buffer = req.body;
        if (!buffer || buffer.length === 0) {
          return res.status(400).json({ success: false, error: 'File kosong atau tidak valid' });
        }

        const tempInput = path.join('/tmp', `music_upload_${Date.now()}`);
        const outputPath = path.join(publicAudioDir, 'adventure-theme.mp3');
        const backupPath = path.join(publicAudioDir, 'default-adventure-theme.mp3');

        fs.mkdirSync(publicAudioDir, { recursive: true });
        fs.writeFileSync(tempInput, buffer);

        const { exec } = await import('child_process');
        // Extract raw audio stream with 100% fidelity without altering the audio
        exec(
          `ffmpeg -y -i "${tempInput}" -vn -codec:a libmp3lame -q:a 1 "${outputPath}"`,
          (err, stdout, stderr) => {
            try {
              if (fs.existsSync(tempInput)) fs.unlinkSync(tempInput);
            } catch {
              // ignore
            }

            if (err) {
              console.error('ffmpeg conversion error:', stderr);
              return res.status(500).json({
                success: false,
                error: 'Gagal mengekstrak audio dari file yang diunggah',
              });
            }

            // Sync to backup and dist
            try {
              fs.copyFileSync(outputPath, backupPath);
              const distAudio = path.resolve(__dirname, 'dist', 'audio', 'adventure-theme.mp3');
              if (fs.existsSync(path.dirname(distAudio))) {
                fs.copyFileSync(outputPath, distAudio);
              }
            } catch {
              // ignore
            }

            console.log('Successfully saved and synced new default adventure-theme.mp3');
            return res.json({
              success: true,
              message: 'Audio berhasil disimpan sebagai musik bawaan aplikasi!',
            });
          }
        );
      } catch (error) {
        console.error('Upload music error:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
      }
    }
  );

  // Upload custom splash image
  app.post(
    '/api/upload-splash',
    express.raw({ limit: '25mb', type: () => true }),
    async (req: Request, res: Response) => {
      try {
        const buffer = req.body;
        if (!buffer || buffer.length === 0) {
          return res.status(400).json({ success: false, error: 'File gambar kosong atau tidak valid' });
        }
        const targetPath = path.join(publicImagesDir, 'suter_splash.jpg');
        fs.writeFileSync(targetPath, buffer);

        // Also sync to dist if dist exists
        const distImages = path.resolve(__dirname, 'dist', 'images', 'suter_splash.jpg');
        if (fs.existsSync(path.dirname(distImages))) {
          fs.writeFileSync(distImages, buffer);
        }

        return res.json({ success: true, message: 'Gambar tampilan awal berhasil diperbarui!' });
      } catch (err) {
        console.error('Upload splash error:', err);
        return res.status(500).json({ success: false, error: 'Gagal menyimpan gambar tampilan awal' });
      }
    }
  );

  // Settings
  app.get('/api/settings', (req: Request, res: Response) => {
    res.json({ success: true, settings });
  });

  app.post('/api/settings', (req: Request, res: Response) => {
    const newSettings = req.body;
    if (newSettings) {
      settings = { ...settings, ...newSettings };
    }
    res.json({ success: true, settings });
  });

  // Locations
  app.get('/api/locations', (req: Request, res: Response) => {
    res.json({ success: true, locations });
  });

  app.post('/api/locations', (req: Request, res: Response) => {
    const updated = req.body.locations;
    if (Array.isArray(updated)) {
      locations = updated;
    }
    res.json({ success: true, locations });
  });

  // Questions
  app.get('/api/questions', (req: Request, res: Response) => {
    res.json({ success: true, questions });
  });

  app.post('/api/questions', (req: Request, res: Response) => {
    const updated = req.body.questions;
    if (Array.isArray(updated)) {
      questions = updated;
    }
    res.json({ success: true, questions });
  });

  app.post('/api/questions/reset', (req: Request, res: Response) => {
    questions = [...DEFAULT_QUESTIONS];
    locations = [...DEFAULT_LOCATIONS];
    settings = { ...DEFAULT_SETTINGS };
    res.json({ success: true, message: 'Data dikembalikan ke setelan awal!' });
  });

  // Leaderboard
  app.get('/api/leaderboard', (req: Request, res: Response) => {
    const sorted = [...leaderboard].sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.correctCount !== a.correctCount) return b.correctCount - a.correctCount;
      return a.durationSeconds - b.durationSeconds;
    });
    res.json({ success: true, leaderboard: sorted });
  });

  app.post('/api/leaderboard/clear', (req: Request, res: Response) => {
    leaderboard = [];
    res.json({ success: true, message: 'Semua data peringkat berhasil dibersihkan!' });
  });

  // Start a new game session
  app.post('/api/game/start', (req: Request, res: Response) => {
    const { player } = req.body;
    if (!player || !player.playerName) {
      return res.status(400).json({ success: false, error: 'Nama pemain harus diisi!' });
    }

    // 1. Identify active non-final locations (Pos 1 s.d Pos 4) and final location (Pos 5 Gudang)
    const nonFinalLocs = locations.filter(l => l.isActive && !l.isFinal).map(l => l.id);
    const finalLoc = locations.find(l => l.isActive && l.isFinal) || locations.find(l => l.isFinal);

    if (!finalLoc || nonFinalLocs.length < 1) {
      return res.status(400).json({ success: false, error: 'Lokasi pos belum dikonfigurasi dengan benar.' });
    }

    // 2. Acak urutan Pos 1 sampai Pos 4 untuk setiap sesi permainan baru
    const shuffledFirstPos = shuffleArray(nonFinalLocs);

    // 3. Pos 5 (Gudang) SELALU tetap sebagai pos ke-5 dan pos akhir
    const route = [...shuffledFirstPos, finalLoc.id];

    // Generate human-friendly game ID: GAME-2026-XXXX
    const randomCode = Math.floor(1000 + Math.random() * 9000);
    const gameId = `GAME-2026-${randomCode}`;

    const posProgress: GameSession['posProgress'] = {};
    route.forEach(locId => {
      posProgress[locId] = {
        locationId: locId,
        qrVerified: false,
        completed: false,
        currentQuestionIndex: 0,
        questionAttempts: {},
        solvedQuestions: [],
      };
    });

    const session: GameSession = {
      gameId,
      player,
      startTime: Date.now(),
      route,
      currentPosIndex: 0,
      score: 0,
      totalCorrect: 0,
      totalAttempts: 0,
      posProgress,
      status: 'active',
      treasureUnlocked: false,
    };

    activeGames.set(gameId, session);

    const currentLocId = route[0];
    const currentLocConfig = locations.find(l => l.id === currentLocId);

    res.json({
      success: true,
      gameId,
      session,
      currentStation: {
        posNumber: 1,
        totalPos: route.length,
        id: currentLocId,
        code: currentLocConfig?.code || 'POS 1',
        name: settings.hintMode === 'easy' ? currentLocConfig?.name : undefined,
        hint: currentLocConfig?.hint || 'Carilah kode QR di pos pertama.',
        isFinal: false,
      },
      settings,
    });
  });

  // Get active session status for teacher panel
  app.get('/api/game/active-status', (req: Request, res: Response) => {
    const games = Array.from(activeGames.values());
    const latestGame = games[games.length - 1] || null;
    return res.json({
      success: true,
      hasActiveGame: !!latestGame,
      session: latestGame,
    });
  });

  // Teacher reset application endpoint with secret code "ulangi"
  app.post('/api/game/teacher-reset', (req: Request, res: Response) => {
    const { code, gameId } = req.body;
    if (!code || typeof code !== 'string' || code.trim().toLowerCase() !== 'ulangi') {
      return res.status(400).json({
        success: false,
        error: 'Kode verifikasi salah! Guru harus memasukkan kata "ulangi" untuk mereset aplikasi.',
      });
    }

    if (gameId && activeGames.has(gameId)) {
      activeGames.delete(gameId);
    } else {
      activeGames.clear();
    }

    return res.json({
      success: true,
      message: 'Aplikasi berhasil direset oleh Guru! Siswa dapat mengulang permainan kembali.',
    });
  });

  // Get current game session info
  app.get('/api/game/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const session = activeGames.get(id);
    if (!session) {
      return res.status(404).json({ success: false, error: 'Sesi permainan tidak ditemukan.' });
    }

    const currentLocId = session.route[session.currentPosIndex];
    const currentLocConfig = locations.find(l => l.id === currentLocId);
    const currentProgress = session.posProgress[currentLocId];

    // Get client questions for current pos
    const stationQuestions = questions
      .filter(q => q.locationId === currentLocId)
      .slice(0, 5)
      .map(toClientQuestion);

    res.json({
      success: true,
      session,
      currentStation: {
        posNumber: session.currentPosIndex + 1,
        totalPos: session.route.length,
        id: currentLocId,
        code: currentLocConfig?.code || `POS ${session.currentPosIndex + 1}`,
        name: settings.hintMode === 'easy' ? currentLocConfig?.name : undefined,
        hint: currentLocConfig?.hint,
        isFinal: currentLocConfig?.isFinal || false,
        qrVerified: currentProgress?.qrVerified || false,
        completed: currentProgress?.completed || false,
      },
      questions: currentProgress?.qrVerified ? stationQuestions : [],
      settings,
    });
  });

  // Verify QR Code scanned by student
  app.post('/api/game/:id/verify-qr', (req: Request, res: Response) => {
    const { id } = req.params;
    const { qrCode } = req.body;
    const session = activeGames.get(id);

    if (!session) {
      return res.status(404).json({ success: false, error: 'Sesi permainan tidak ditemukan.' });
    }

    if (!qrCode || typeof qrCode !== 'string') {
      return res.status(400).json({ success: false, error: 'Kode QR tidak valid.' });
    }

    const currentLocId = session.route[session.currentPosIndex];
    const targetLoc = locations.find(l => l.id === currentLocId);

    const scannedClean = qrCode.trim().toUpperCase();
    const targetClean = (targetLoc?.qrCode || '').trim().toUpperCase();

    // Check if matching target
    if (scannedClean === targetClean) {
      session.posProgress[currentLocId].qrVerified = true;

      // Prepare 5 questions for this pos
      const stationQuestions = questions
        .filter(q => q.locationId === currentLocId)
        .slice(0, 5)
        .map(toClientQuestion);

      return res.json({
        success: true,
        matched: true,
        message: '🎉 KODE DITEMUKAN!\nSelamat! Kamu menemukan Pos yang benar.\nJawab 5 tantangan matematika untuk membuka petunjuk berikutnya.',
        stationName: targetLoc?.name,
        questions: stationQuestions,
        currentPosIndex: session.currentPosIndex,
      });
    }

    // If not matching target
    return res.json({
      success: true,
      matched: false,
      message: '🔒 KODE BELUM BISA DIBUKA\nKode ini bukan tujuanmu saat ini.\nTemukan lokasi yang sesuai dengan petunjuk.',
    });
  });

  // Submit answer for a question
  app.post('/api/game/:id/submit-answer', (req: Request, res: Response) => {
    const { id } = req.params;
    const { questionId, answer } = req.body;

    const session = activeGames.get(id);
    if (!session) {
      return res.status(404).json({ success: false, error: 'Sesi permainan tidak ditemukan.' });
    }

    const currentLocId = session.route[session.currentPosIndex];
    const posProgress = session.posProgress[currentLocId];

    if (!posProgress.qrVerified) {
      return res.status(403).json({ success: false, error: 'Pos ini belum di-scan dengan QR code!' });
    }

    const q = questions.find(item => item.id === questionId);
    if (!q) {
      return res.status(404).json({ success: false, error: 'Soal tidak ditemukan.' });
    }

    const currentAttempts = (posProgress.questionAttempts[questionId] || 0) + 1;
    posProgress.questionAttempts[questionId] = currentAttempts;
    session.totalAttempts++;

    const isCorrect = checkAnswerMatch(answer, q.correctAnswer);

    if (isCorrect) {
      session.totalCorrect++;
      let pointsAwarded = settings.pointsFirstAttempt;
      if (currentAttempts === 2) pointsAwarded = settings.pointsSecondAttempt;
      else if (currentAttempts >= 3) pointsAwarded = settings.pointsThirdAttempt;

      session.score += pointsAwarded;
      if (!posProgress.solvedQuestions.includes(questionId)) {
        posProgress.solvedQuestions.push(questionId);
      }

      // Check if all 5 questions for this pos are answered
      const stationQuestions = questions.filter(item => item.locationId === currentLocId).slice(0, 5);
      const isPosCompleted =
        stationQuestions.every(item => posProgress.solvedQuestions.includes(item.id)) ||
        posProgress.solvedQuestions.length >= 5;

      if (isPosCompleted) {
        posProgress.completed = true;
        session.score += settings.pointsPosBonus;

        const nextIndex = session.currentPosIndex + 1;
        const allCompleted = nextIndex >= session.route.length;

        if (allCompleted) {
          session.currentPosIndex = nextIndex;
          session.status = 'completed';
          session.treasureUnlocked = true;
          session.endTime = Date.now();
          session.score += settings.pointsGameBonus;

          // Compute duration
          const durationSeconds = Math.round((session.endTime - session.startTime) / 1000);
          const totalQ = session.route.length * 5;
          const accuracy = Math.min(100, Math.round((session.totalCorrect / Math.max(session.totalAttempts, 1)) * 100));

          let badge = '🏅 MASTER MATEMATIKA';
          if (accuracy >= 95) badge = '🎯 AKURASI SEMPURNA';
          else if (durationSeconds <= 1200) badge = '⚡ PENJELAJAH KILAT';
          else if (accuracy >= 80) badge = '🧭 PETUALANG TANGGUH';

          // Save to leaderboard
          const entry: LeaderboardEntry = {
            id: `lb_${Date.now()}`,
            gameId: session.gameId,
            playerName: session.player.playerName,
            mode: session.player.mode,
            className: session.player.className,
            members: session.player.members,
            score: session.score,
            completedStations: 5,
            correctCount: session.totalCorrect,
            totalQuestions: totalQ,
            durationSeconds,
            accuracy,
            badge,
            completedAt: new Date().toISOString(),
          };
          leaderboard.push(entry);

          return res.json({
            success: true,
            isCorrect: true,
            pointsAwarded,
            attemptsUsed: currentAttempts,
            explanation: q.explanation,
            posCompleted: true,
            allCompleted: true,
            score: session.score,
            treasureCode: settings.treasureCode,
            teacherMessage: settings.teacherMessage,
            summary: entry,
            session,
          });
        }

        // Pos completed, unlock next station
        session.currentPosIndex = nextIndex;
        const nextLocId = session.route[nextIndex];
        const nextLocConfig = locations.find(l => l.id === nextLocId);

        // Reset QR verified flag on next station to ensure it must be scanned
        if (session.posProgress[nextLocId]) {
          session.posProgress[nextLocId].qrVerified = false;
        }

        return res.json({
          success: true,
          isCorrect: true,
          pointsAwarded,
          attemptsUsed: currentAttempts,
          explanation: q.explanation,
          posCompleted: true,
          allCompleted: false,
          score: session.score,
          session,
          nextStation: {
            posNumber: nextIndex + 1,
            totalPos: session.route.length,
            id: nextLocId,
            code: nextLocConfig?.code || `POS ${nextIndex + 1}`,
            name: settings.hintMode === 'easy' ? nextLocConfig?.name : undefined,
            hint: nextLocConfig?.hint,
            isFinal: nextLocConfig?.isFinal || false,
          },
        });
      }

      // Solved, continue to next question in this station
      return res.json({
        success: true,
        isCorrect: true,
        pointsAwarded,
        attemptsUsed: currentAttempts,
        explanation: q.explanation,
        posCompleted: false,
        allCompleted: false,
        score: session.score,
        solvedCount: posProgress.solvedQuestions.length,
        session,
      });
    }

    // Wrong answer
    const maxAttempts = settings.maxAttempts || 3;
    const canRetry = currentAttempts < maxAttempts;

    if (!canRetry) {
      // Group failed on this question after 3 attempts! Lock application
      const currentLocConfig = locations.find(l => l.id === currentLocId);
      session.status = 'locked';
      session.lockedReason = 'Kelompok gagal karena 3 kali salah menjawab dalam 1 soal.';
      session.lockedQuestionId = questionId;
      session.lockedPosName = currentLocConfig?.name || currentLocConfig?.code || 'Pos Ini';

      return res.json({
        success: true,
        isCorrect: false,
        isLocked: true,
        pointsAwarded: 0,
        attemptsUsed: currentAttempts,
        attemptsLeft: 0,
        canRetry: false,
        message: '⚠️ KESEMPATAN 3X HABIS! Kelompok gagal pada pos ini. Aplikasi terkunci dan memerlukan reset oleh Guru di Panel Guru dengan kode "ulangi".',
        explanation: q.explanation,
        session,
      });
    }

    return res.json({
      success: true,
      isCorrect: false,
      isLocked: false,
      pointsAwarded: 0,
      attemptsUsed: currentAttempts,
      attemptsLeft: Math.max(0, maxAttempts - currentAttempts),
      canRetry: true,
      message: `❌ JAWABAN BELUM TEPAT\nMasih ada sisa ${maxAttempts - currentAttempts} percobaan. Coba hitung kembali dengan teliti!`,
      session,
    });
  });

  // Vite or Static handling
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
