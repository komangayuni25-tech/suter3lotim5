import {
  GameSession,
  LocationConfig,
  GameSettings,
  Question,
  ClientQuestion,
  LeaderboardEntry,
  PlayerInfo,
} from '../types/game';
import {
  DEFAULT_LOCATIONS,
  DEFAULT_SETTINGS,
  DEFAULT_QUESTIONS,
} from '../data/defaultData';

const LOCAL_SESSION_KEY = 'matematika_berburu_harta_session';
const LOCAL_SETTINGS_KEY = 'matematika_settings';
const LOCAL_LOCATIONS_KEY = 'matematika_locations';
const LOCAL_QUESTIONS_KEY = 'matematika_questions';
const LOCAL_LEADERBOARD_KEY = 'matematika_leaderboard';

// Helper to shuffle array
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
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

// Client Question Sanitizer
function toClientQuestion(q: Question): ClientQuestion {
  return {
    id: q.id,
    locationId: q.locationId,
    question: q.question,
    shapeType: q.shapeType,
    type: q.type,
    difficulty: q.difficulty,
    unit: q.unit,
    diagram: q.diagram,
    options: q.options ? shuffleArray(q.options) : undefined,
  };
}

class GameService {
  // Get Settings
  async getSettings(): Promise<GameSettings> {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        if (data.settings) {
          localStorage.setItem(LOCAL_SETTINGS_KEY, JSON.stringify(data.settings));
          return data.settings;
        }
      }
    } catch {
      // fallback
    }
    const saved = localStorage.getItem(LOCAL_SETTINGS_KEY);
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  }

  // Update Settings
  async updateSettings(settings: Partial<GameSettings>): Promise<GameSettings> {
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem(LOCAL_SETTINGS_KEY, JSON.stringify(data.settings));
        return data.settings;
      }
    } catch {
      // fallback
    }
    const current = await this.getSettings();
    const merged = { ...current, ...settings };
    localStorage.setItem(LOCAL_SETTINGS_KEY, JSON.stringify(merged));
    return merged;
  }

  // Get Locations
  async getLocations(): Promise<LocationConfig[]> {
    try {
      const res = await fetch('/api/locations');
      if (res.ok) {
        const data = await res.json();
        if (data.locations) {
          localStorage.setItem(LOCAL_LOCATIONS_KEY, JSON.stringify(data.locations));
          return data.locations;
        }
      }
    } catch {
      // fallback
    }
    const saved = localStorage.getItem(LOCAL_LOCATIONS_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const hasGudang = parsed.some((l: any) => l.name?.toLowerCase().includes('gudang') || l.id === 'pos_5');
          if (!hasGudang) {
            localStorage.setItem(LOCAL_LOCATIONS_KEY, JSON.stringify(DEFAULT_LOCATIONS));
            return DEFAULT_LOCATIONS;
          }
          return parsed;
        }
      } catch {
        // fallback
      }
    }
    return DEFAULT_LOCATIONS;
  }

  // Update Locations
  async updateLocations(locations: LocationConfig[]): Promise<LocationConfig[]> {
    try {
      const res = await fetch('/api/locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locations }),
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem(LOCAL_LOCATIONS_KEY, JSON.stringify(data.locations));
        return data.locations;
      }
    } catch {
      // fallback
    }
    localStorage.setItem(LOCAL_LOCATIONS_KEY, JSON.stringify(locations));
    return locations;
  }

  // Get Questions (For Admin)
  async getQuestions(): Promise<Question[]> {
    try {
      const res = await fetch('/api/questions');
      if (res.ok) {
        const data = await res.json();
        if (data.questions) {
          localStorage.setItem(LOCAL_QUESTIONS_KEY, JSON.stringify(data.questions));
          return data.questions;
        }
      }
    } catch {
      // fallback
    }
    const saved = localStorage.getItem(LOCAL_QUESTIONS_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // If legacy questions from geometry are detected, upgrade to Grade 5 fractions
          const isLegacy = parsed.some((q: any) => q.shapeType === 'persegi' || q.unit === 'cm²' || q.question?.includes('persegi'));
          if (isLegacy) {
            localStorage.setItem(LOCAL_QUESTIONS_KEY, JSON.stringify(DEFAULT_QUESTIONS));
            return DEFAULT_QUESTIONS;
          }
          return parsed;
        }
      } catch {
        // fallback
      }
    }
    return DEFAULT_QUESTIONS;
  }

  // Update Questions (For Admin)
  async updateQuestions(questions: Question[]): Promise<Question[]> {
    try {
      const res = await fetch('/api/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questions }),
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem(LOCAL_QUESTIONS_KEY, JSON.stringify(data.questions));
        return data.questions;
      }
    } catch {
      // fallback
    }
    localStorage.setItem(LOCAL_QUESTIONS_KEY, JSON.stringify(questions));
    return questions;
  }

  // Reset to default
  async resetAllData(): Promise<void> {
    try {
      await fetch('/api/questions/reset', { method: 'POST' });
    } catch {
      // fallback
    }
    localStorage.removeItem(LOCAL_QUESTIONS_KEY);
    localStorage.removeItem(LOCAL_LOCATIONS_KEY);
    localStorage.removeItem(LOCAL_SETTINGS_KEY);
    localStorage.removeItem(LOCAL_SESSION_KEY);
  }

  // Get Leaderboard
  async getLeaderboard(): Promise<LeaderboardEntry[]> {
    try {
      const res = await fetch('/api/leaderboard');
      if (res.ok) {
        const data = await res.json();
        if (data.leaderboard) {
          localStorage.setItem(LOCAL_LEADERBOARD_KEY, JSON.stringify(data.leaderboard));
          return data.leaderboard;
        }
      }
    } catch {
      // fallback
    }
    const saved = localStorage.getItem(LOCAL_LEADERBOARD_KEY);
    return saved ? JSON.parse(saved) : [];
  }

  // Clear Leaderboard
  async clearLeaderboard(): Promise<boolean> {
    try {
      const res = await fetch('/api/leaderboard/clear', { method: 'POST' });
      if (res.ok) {
        localStorage.removeItem(LOCAL_LEADERBOARD_KEY);
        return true;
      }
    } catch {
      // fallback
    }
    localStorage.removeItem(LOCAL_LEADERBOARD_KEY);
    return true;
  }

  // Start a new game
  async startGame(player: PlayerInfo): Promise<{
    session: GameSession;
    currentStation: {
      posNumber: number;
      totalPos: number;
      id: string;
      code: string;
      name?: string;
      hint: string;
      isFinal: boolean;
    };
    settings: GameSettings;
  }> {
    try {
      const res = await fetch('/api/game/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ player }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.session) {
          localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(data.session));
          return data;
        }
      }
    } catch {
      // fallback to offline local game logic
    }

    // Fallback: Local Client Execution
    const locations = await this.getLocations();
    const settings = await this.getSettings();

    const activeNonFinal = locations.filter(l => l.isActive && !l.isFinal).map(l => l.id);
    const finalLoc = locations.find(l => l.isActive && l.isFinal) || locations.find(l => l.isFinal);
    const route = [...activeNonFinal, finalLoc ? finalLoc.id : 'pos_5'];

    const gameId = `GAME-2026-${Math.floor(1000 + Math.random() * 9000)}`;
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
      route: route,
      currentPosIndex: 0,
      score: 0,
      totalCorrect: 0,
      totalAttempts: 0,
      posProgress,
      status: 'active',
      treasureUnlocked: false,
    };

    localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(session));

    const firstLocId = route[0];
    const locCfg = locations.find(l => l.id === firstLocId);

    return {
      session,
      currentStation: {
        posNumber: 1,
        totalPos: route.length,
        id: firstLocId,
        code: locCfg?.code || 'POS 1',
        name: settings.hintMode === 'easy' ? locCfg?.name : undefined,
        hint: locCfg?.hint || 'Carilah kode QR di pos pertama.',
        isFinal: false,
      },
      settings,
    };
  }

  // Restore existing game session if present
  getStoredSession(): GameSession | null {
    try {
      const data = localStorage.getItem(LOCAL_SESSION_KEY);
      if (data) {
        const session = JSON.parse(data) as GameSession;
        if (session && session.route && session.route.some(r => r.startsWith('pos_a') || r === 'pos_final')) {
          localStorage.removeItem(LOCAL_SESSION_KEY);
          return null;
        }
        return session;
      }
    } catch {
      // ignore
    }
    return null;
  }

  clearStoredSession(): void {
    localStorage.removeItem(LOCAL_SESSION_KEY);
  }

  // Verify QR
  async verifyQr(
    gameId: string,
    qrCode: string,
    session: GameSession
  ): Promise<{
    matched: boolean;
    message: string;
    stationName?: string;
    questions?: ClientQuestion[];
  }> {
    try {
      const res = await fetch(`/api/game/${gameId}/verify-qr`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrCode }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.matched) {
          session.posProgress[session.route[session.currentPosIndex]].qrVerified = true;
          localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(session));
        }
        return data;
      }
    } catch {
      // fallback
    }

    const locations = await this.getLocations();
    const currentLocId = session.route[session.currentPosIndex];
    const targetLoc = locations.find(l => l.id === currentLocId);

    if (qrCode.trim().toUpperCase() === (targetLoc?.qrCode || '').trim().toUpperCase()) {
      session.posProgress[currentLocId].qrVerified = true;
      localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(session));

      const allQuestions = await this.getQuestions();
      const stationQ = allQuestions
        .filter(q => q.locationId === currentLocId)
        .slice(0, 5)
        .map(toClientQuestion);

      return {
        matched: true,
        message: '🎉 KODE DITEMUKAN!\nSelamat! Kamu menemukan Pos yang benar.\nJawab 5 tantangan matematika untuk membuka petunjuk berikutnya.',
        stationName: targetLoc?.name,
        questions: stationQ,
      };
    }

    return {
      matched: false,
      message: '🔒 KODE BELUM BISA DIBUKA\nKode ini bukan tujuanmu saat ini.\nTemukan lokasi yang sesuai dengan petunjuk.',
    };
  }

  // Submit Answer
  async submitAnswer(
    gameId: string,
    questionId: string,
    answer: string,
    session: GameSession
  ): Promise<{
    isCorrect: boolean;
    isLocked?: boolean;
    pointsAwarded: number;
    attemptsUsed: number;
    attemptsLeft?: number;
    canRetry?: boolean;
    message?: string;
    explanation?: string;
    posCompleted?: boolean;
    allCompleted?: boolean;
    score?: number;
    session?: GameSession;
    nextStation?: {
      posNumber: number;
      totalPos: number;
      id: string;
      code: string;
      name?: string;
      hint: string;
      isFinal: boolean;
    };
    treasureCode?: string;
    teacherMessage?: string;
    summary?: LeaderboardEntry;
  }> {
    try {
      const res = await fetch(`/api/game/${gameId}/submit-answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId, answer }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.session) {
          localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(data.session));
          return data;
        }
        // Update local session cache if not provided
        if (data.isCorrect) {
          const currentLocId = session.route[session.currentPosIndex];
          const posProg = session.posProgress[currentLocId];
          if (posProg && !posProg.solvedQuestions.includes(questionId)) {
            posProg.solvedQuestions.push(questionId);
          }
          if (data.posCompleted) {
            posProg.completed = true;
            if (!data.allCompleted) {
              session.currentPosIndex++;
              const nextLocId = session.route[session.currentPosIndex];
              if (session.posProgress[nextLocId]) {
                session.posProgress[nextLocId].qrVerified = false;
              }
            } else {
              session.status = 'completed';
              session.treasureUnlocked = true;
            }
          }
          session.score = data.score ?? session.score + data.pointsAwarded;
          localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(session));
        }
        return { ...data, session };
      }
    } catch {
      // fallback
    }

    // Local fallback evaluation
    const questions = await this.getQuestions();
    const settings = await this.getSettings();
    const locations = await this.getLocations();
    const q = questions.find(item => item.id === questionId);

    const currentLocId = session.route[session.currentPosIndex];
    const posProg = session.posProgress[currentLocId];
    const attempts = (posProg.questionAttempts[questionId] || 0) + 1;
    posProg.questionAttempts[questionId] = attempts;
    session.totalAttempts++;

    const isCorrect = checkAnswerMatch(answer, q?.correctAnswer || '');

    if (isCorrect) {
      session.totalCorrect++;
      let pts = settings.pointsFirstAttempt;
      if (attempts === 2) pts = settings.pointsSecondAttempt;
      else if (attempts >= 3) pts = settings.pointsThirdAttempt;

      session.score += pts;
      if (!posProg.solvedQuestions.includes(questionId)) {
        posProg.solvedQuestions.push(questionId);
      }

      const stQuestions = questions.filter(item => item.locationId === currentLocId).slice(0, 5);
      const isPosDone = stQuestions.every(item => posProg.solvedQuestions.includes(item.id));

      if (isPosDone) {
        posProg.completed = true;
        session.score += settings.pointsPosBonus;
        const nextIdx = session.currentPosIndex + 1;
        const allDone = nextIdx >= session.route.length;

        if (allDone) {
          session.currentPosIndex = nextIdx;
          session.status = 'completed';
          session.treasureUnlocked = true;
          session.score += settings.pointsGameBonus;
          localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(session));

          const durationSeconds = Math.round((Date.now() - session.startTime) / 1000);
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
            totalQuestions: 25,
            durationSeconds,
            accuracy: Math.min(100, Math.round((session.totalCorrect / Math.max(session.totalAttempts, 1)) * 100)),
            badge: '🏅 MASTER MATEMATIKA',
            completedAt: new Date().toISOString(),
          };

          return {
            isCorrect: true,
            pointsAwarded: pts,
            attemptsUsed: attempts,
            explanation: q?.explanation,
            posCompleted: true,
            allCompleted: true,
            score: session.score,
            session,
            treasureCode: settings.treasureCode,
            teacherMessage: settings.teacherMessage,
            summary: entry,
          };
        }

        session.currentPosIndex = nextIdx;
        const nextLocId = session.route[nextIdx];
        if (session.posProgress[nextLocId]) {
          session.posProgress[nextLocId].qrVerified = false;
        }
        localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(session));
        const nextLoc = locations.find(l => l.id === nextLocId);

        return {
          isCorrect: true,
          pointsAwarded: pts,
          attemptsUsed: attempts,
          explanation: q?.explanation,
          posCompleted: true,
          allCompleted: false,
          score: session.score,
          session,
          nextStation: {
            posNumber: nextIdx + 1,
            totalPos: session.route.length,
            id: nextLocId,
            code: nextLoc?.code || `POS ${nextIdx + 1}`,
            name: settings.hintMode === 'easy' ? nextLoc?.name : undefined,
            hint: nextLoc?.hint || '',
            isFinal: nextLoc?.isFinal || false,
          },
        };
      }

      localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(session));
      return {
        isCorrect: true,
        pointsAwarded: pts,
        attemptsUsed: attempts,
        explanation: q?.explanation,
        posCompleted: false,
        allCompleted: false,
        score: session.score,
        session,
      };
    }

    // Wrong answer
    const maxAttempts = settings.maxAttempts || 3;
    const canRetry = attempts < maxAttempts;

    if (!canRetry) {
      session.status = 'locked';
      session.lockedReason = 'Kelompok gagal karena 3 kali salah menjawab dalam 1 soal.';
      session.lockedQuestionId = questionId;
      const targetLoc = locations.find(l => l.id === currentLocId);
      session.lockedPosName = targetLoc?.name || targetLoc?.code || 'Pos Ini';
      localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(session));

      return {
        isCorrect: false,
        isLocked: true,
        pointsAwarded: 0,
        attemptsUsed: attempts,
        attemptsLeft: 0,
        canRetry: false,
        message: '⚠️ KESEMPATAN 3X HABIS! Kelompok gagal pada pos ini. Aplikasi otomatis terkunci dan memerlukan pembukaan kunci oleh Guru Pendamping.',
        explanation: q?.explanation,
        session,
      };
    }

    localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(session));

    return {
      isCorrect: false,
      isLocked: false,
      pointsAwarded: 0,
      attemptsUsed: attempts,
      attemptsLeft: Math.max(0, maxAttempts - attempts),
      canRetry: true,
      message: `❌ JAWABAN BELUM TEPAT\nMasih ada sisa ${maxAttempts - attempts} percobaan. Coba lagi!`,
      session,
    };
  }

  // Teacher reset with secret code
  async teacherReset(
    code: string,
    gameId?: string
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    const cleanCode = (code || '').trim().toLowerCase();
    if (cleanCode !== 'ulangi') {
      return {
        success: false,
        error: 'Kode verifikasi Guru tidak sesuai! Harap periksa kembali kode rahasia Anda.',
      };
    }

    try {
      const res = await fetch('/api/game/teacher-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: cleanCode, gameId }),
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.removeItem(LOCAL_SESSION_KEY);
        return data;
      }
      const data = await res.json();
      return {
        success: false,
        error: data.error || 'Gagal mereset aplikasi di server.',
      };
    } catch {
      // fallback
    }

    localStorage.removeItem(LOCAL_SESSION_KEY);
    return {
      success: true,
      message: 'Aplikasi berhasil direset oleh Guru! Siswa dapat mengulang permainan kembali.',
    };
  }

  // Get active session status
  async getActiveStatus(): Promise<{ hasActiveGame: boolean; session: GameSession | null }> {
    try {
      const res = await fetch('/api/game/active-status');
      if (res.ok) {
        const data = await res.json();
        return data;
      }
    } catch {
      // fallback
    }
    const local = localStorage.getItem(LOCAL_SESSION_KEY);
    const session = local ? JSON.parse(local) : null;
    return {
      hasActiveGame: !!session,
      session,
    };
  }
}

export const gameService = new GameService();
