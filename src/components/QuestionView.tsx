import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { ClientQuestion } from '../types/game';
import { ShapeDiagram } from './ShapeDiagram';
import { sounds, triggerHaptic } from '../utils/audio';
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowRight,
  RefreshCw,
  Send,
  AlertTriangle,
  Trophy,
  Sparkles,
  Check,
} from 'lucide-react';

interface Props {
  stationCode: string;
  stationName?: string;
  questionIndex: number; // 0 to 4
  totalQuestions: number; // 5
  question: ClientQuestion;
  questions?: ClientQuestion[];
  solvedQuestionIds?: string[];
  maxAttempts: number;
  attemptsUsedSoFar: number;
  onSelectQuestionIndex?: (index: number) => void;
  onSubmitAnswer: (answer: string) => Promise<{
    isCorrect: boolean;
    pointsAwarded: number;
    attemptsUsed: number;
    attemptsLeft?: number;
    canRetry?: boolean;
    message?: string;
    explanation?: string;
    posCompleted?: boolean;
    allCompleted?: boolean;
    nextStation?: any;
    summary?: any;
    treasureCode?: string;
    teacherMessage?: string;
    session?: any;
  }>;
  onNextQuestion: () => void;
  onProceedToNextStation: (result: any) => void;
}

export const QuestionView: React.FC<Props> = ({
  stationCode,
  stationName,
  questionIndex,
  totalQuestions = 5,
  question,
  questions = [],
  solvedQuestionIds = [],
  maxAttempts,
  attemptsUsedSoFar,
  onSelectQuestionIndex,
  onSubmitAnswer,
  onNextQuestion,
  onProceedToNextStation,
}) => {
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [typedAnswer, setTypedAnswer] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationWarning, setValidationWarning] = useState<string | null>(null);

  const [feedback, setFeedback] = useState<{
    status: 'correct' | 'wrong';
    title: string;
    message: string;
    explanation?: string;
    canRetry?: boolean;
    attemptsLeft?: number;
    points?: number;
    posCompleted?: boolean;
    allCompleted?: boolean;
    rawResult?: any;
  } | null>(null);

  // Reset form when question changes
  useEffect(() => {
    setSelectedOption('');
    setTypedAnswer('');
    setValidationWarning(null);
    setFeedback(null);
  }, [question.id, questionIndex]);

  const hasOptions = Array.isArray(question.options) && question.options.length > 0;
  const effectiveAnswer = hasOptions ? selectedOption : typedAnswer;
  const hasAnswer = effectiveAnswer.trim().length > 0;

  // Check if current question is already solved
  const isCurrentlySolved = solvedQuestionIds.includes(question.id);

  // Total solved so far in this pos
  const solvedCount = solvedQuestionIds.length;
  const progressPercent = Math.min(100, Math.round((solvedCount / totalQuestions) * 100));

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!hasAnswer) {
      sounds.playWrong();
      triggerHaptic('error');
      setValidationWarning(
        hasOptions
          ? '⚠️ Silakan pilih salah satu opsi jawaban (A, B, C, atau D) di bawah!'
          : '⚠️ Silakan ketik angka jawabanmu pada kolom yang tersedia!'
      );
      return;
    }

    setValidationWarning(null);
    sounds.playClick();
    triggerHaptic('tap');
    setIsSubmitting(true);

    try {
      const res = await onSubmitAnswer(effectiveAnswer);
      if (res.isCorrect) {
        sounds.playSuccess();
        triggerHaptic('success');
        confetti({
          particleCount: res.posCompleted ? 90 : 45,
          spread: 70,
          origin: { y: 0.65 },
          colors: ['#2563eb', '#38bdf8', '#fbbf24', '#ffffff', '#1d4ed8'],
        });

        setFeedback({
          status: 'correct',
          title: '🎉 JAWABAN BENAR!',
          message: res.posCompleted
            ? `Luar biasa! Seluruh ${totalQuestions} soal di pos ini berhasil dituntaskan! (+${res.pointsAwarded} poin)`
            : `Hebat sekali! Jawabanmu tepat dan kamu mendapatkan +${res.pointsAwarded} poin!`,
          explanation: res.explanation,
          points: res.pointsAwarded,
          posCompleted: res.posCompleted,
          allCompleted: res.allCompleted,
          rawResult: res,
        });
      } else {
        sounds.playWrong();
        triggerHaptic('error');
        const left = res.attemptsLeft ?? 0;
        setFeedback({
          status: 'wrong',
          title: '❌ JAWABAN BELUM TEPAT',
          message:
            left > 0
              ? `Masih ada sisa ${left}x percobaan. Periksa kembali rumus dan hitungan luas bangun datarmu!`
              : 'Kesempatan mencoba telah habis. Pelajari pembahasannya di bawah ini lalu coba lagi.',
          explanation: res.explanation,
          canRetry: res.canRetry ?? true,
          attemptsLeft: left,
          posCompleted: false,
          allCompleted: false,
          rawResult: res,
        });
      }
    } catch (err) {
      console.error('Error submitting answer:', err);
      setValidationWarning('Terjadi kendala saat memeriksa jawaban. Silakan klik Submit kembali.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNextAction = () => {
    sounds.playClick();
    triggerHaptic('tap');

    if (feedback?.posCompleted) {
      onProceedToNextStation(feedback.rawResult);
      setFeedback(null);
      return;
    }

    setFeedback(null);
    setSelectedOption('');
    setTypedAnswer('');
    setValidationWarning(null);

    if (onSelectQuestionIndex && questions.length > 0) {
      const nextUnsolvedIndex = questions.findIndex(
        (q, idx) => idx > questionIndex && !solvedQuestionIds.includes(q.id)
      );
      if (nextUnsolvedIndex !== -1) {
        onSelectQuestionIndex(nextUnsolvedIndex);
        return;
      }
      const anyUnsolvedIndex = questions.findIndex((q) => !solvedQuestionIds.includes(q.id));
      if (anyUnsolvedIndex !== -1) {
        onSelectQuestionIndex(anyUnsolvedIndex);
        return;
      }
    }

    onNextQuestion();
  };

  const handleRetryCurrent = () => {
    sounds.playClick();
    triggerHaptic('tap');
    setFeedback(null);
    setValidationWarning(null);
    setSelectedOption('');
    setTypedAnswer('');
  };

  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl shadow-blue-900/10 border-2 sm:border-3 border-blue-400 overflow-hidden max-w-xl mx-auto">
      {/* Station Header & Blue Top Bar */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 text-white p-3 sm:p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="bg-blue-600/70 text-cyan-200 px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-black tracking-wider uppercase border border-cyan-400/40 shadow-xs shrink-0">
              {stationCode}
            </span>
            {stationName && (
              <span className="text-blue-100 text-[11px] sm:text-xs font-bold truncate max-w-[130px] sm:max-w-[200px]">
                ({stationName})
              </span>
            )}
          </div>
          <span className="text-[10px] sm:text-xs font-extrabold bg-blue-950/60 border border-blue-400/30 px-2.5 py-0.5 rounded-full text-cyan-200 shrink-0">
            Soal #{questionIndex + 1} dari {totalQuestions}
          </span>
        </div>

        {/* 5-Question Selector Tabs Ribbon - Optimized for Thumb Tap on Smartphones */}
        <div className="grid grid-cols-5 gap-1.5 mb-2">
          {Array.from({ length: totalQuestions }).map((_, idx) => {
            const qItem = questions[idx];
            const isSolved = qItem ? solvedQuestionIds.includes(qItem.id) : false;
            const isCurrent = idx === questionIndex;

            let tabStyle = 'bg-blue-950/50 text-blue-200 border-blue-600/50 hover:bg-blue-900/70';
            if (isSolved) {
              tabStyle = 'bg-emerald-500 text-white border-emerald-400 shadow-xs font-black';
            } else if (isCurrent) {
              tabStyle = 'bg-cyan-400 text-blue-950 border-white font-black ring-2 ring-cyan-200 shadow-sm';
            }

            return (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  if (onSelectQuestionIndex && idx !== questionIndex) {
                    sounds.playClick();
                    triggerHaptic('tap');
                    onSelectQuestionIndex(idx);
                  }
                }}
                className={`py-2 px-1 min-h-[44px] rounded-xl text-xs flex items-center justify-center gap-1 border transition-all cursor-pointer font-bold active:scale-95 ${tabStyle}`}
                title={`Buka Soal ${idx + 1}`}
              >
                <span className="text-sm font-black">{idx + 1}</span>
                {isSolved && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </button>
            );
          })}
        </div>

        {/* Progress bar */}
        <div className="w-full bg-blue-950/60 rounded-full h-2 p-0.5 overflow-hidden border border-blue-400/30">
          <div
            className="bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-300 h-full rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>
        <div className="flex justify-between items-center text-[10px] text-blue-200 font-semibold mt-1">
          <span>Progres: {solvedCount}/{totalQuestions} Soal</span>
          <span className="font-extrabold text-cyan-200">{progressPercent}%</span>
        </div>
      </div>

      <div className="p-3.5 sm:p-5 space-y-3">
        {/* Difficulty & Attempt Status */}
        <div className="flex items-center justify-between">
          <span
            className={`text-[10px] sm:text-xs px-2.5 py-0.5 rounded-full font-extrabold uppercase tracking-wide ${
              question.difficulty === 'mudah'
                ? 'bg-blue-100 text-blue-800 border border-blue-300'
                : question.difficulty === 'sedang'
                ? 'bg-sky-100 text-sky-800 border border-sky-300'
                : 'bg-indigo-100 text-indigo-800 border border-indigo-300'
            }`}
          >
            {question.difficulty === 'mudah' ? '🔵 Mudah' : question.difficulty === 'sedang' ? '🔷 Sedang' : '🌌 Tantangan'}
          </span>

          <span className="text-[10px] sm:text-xs text-blue-900 font-bold flex items-center gap-1 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-200">
            <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
            Percobaan: {attemptsUsedSoFar + 1}/{maxAttempts}
          </span>
        </div>

        {/* Question Text in Prominent Blue Card */}
        <div className="text-blue-950 font-extrabold text-sm sm:text-base leading-relaxed bg-blue-50/80 p-3 sm:p-4 rounded-2xl border-2 border-blue-200 shadow-2xs">
          {question.question}
        </div>

        {/* Geometric Shape Diagram (SVG) - Scaled fluidly for phone screens */}
        {question.diagram && <ShapeDiagram diagram={question.diagram} />}

        {/* Validation Warning Alert */}
        {validationWarning && (
          <div className="p-2.5 bg-blue-100 border-2 border-blue-400 text-blue-950 rounded-2xl text-xs font-black flex items-center gap-2 animate-bounce">
            <AlertTriangle className="w-4 h-4 text-blue-600 shrink-0" />
            <span>{validationWarning}</span>
          </div>
        )}

        {/* Feedback Alert if Answered */}
        {feedback && (
          <div
            className={`p-3.5 sm:p-4 rounded-2xl border-2 shadow-md animate-in zoom-in-95 duration-200 ${
              feedback.status === 'correct'
                ? 'bg-gradient-to-br from-emerald-50 to-blue-50 border-emerald-500 text-emerald-950'
                : 'bg-gradient-to-br from-rose-50 to-blue-50 border-rose-500 text-rose-950'
            }`}
          >
            <div className="flex items-start gap-2.5">
              {feedback.status === 'correct' ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div className="flex-1 min-w-0">
                <h4 className="font-black text-sm sm:text-base flex items-center gap-1.5">
                  <span>{feedback.title}</span>
                  {feedback.posCompleted && <Trophy className="w-4 h-4 text-amber-500 animate-bounce shrink-0" />}
                </h4>
                <p className="text-xs sm:text-sm mt-0.5 font-semibold leading-relaxed">{feedback.message}</p>

                {feedback.explanation && (
                  <div className="mt-2 p-2.5 bg-white/95 rounded-xl border border-blue-200 text-xs shadow-2xs">
                    <span className="font-black text-blue-900 block mb-0.5">💡 Pembahasan:</span>
                    <span className="text-slate-800 leading-relaxed">{feedback.explanation}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Action buttons inside feedback */}
            <div className="mt-3 flex gap-2 justify-end">
              {feedback.status === 'correct' || !feedback.canRetry ? (
                <button
                  type="button"
                  onClick={handleNextAction}
                  className={`w-full py-3 px-4 text-white font-black rounded-2xl shadow-lg text-xs sm:text-sm flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer border-2 ${
                    feedback.posCompleted
                      ? 'bg-gradient-to-r from-blue-600 via-sky-600 to-blue-700 text-white border-cyan-300 ring-2 ring-blue-300'
                      : 'bg-gradient-to-r from-blue-600 to-indigo-700 border-blue-400'
                  }`}
                >
                  {feedback.posCompleted ? (
                    feedback.allCompleted ? (
                      <>
                        <Sparkles className="w-4 h-4 text-yellow-300" /> BUKA PETI HARTA KARUN! ➔
                      </>
                    ) : (
                      <>
                        <Trophy className="w-4 h-4 text-yellow-300" /> MENUJU POS BERIKUTNYA ➔
                      </>
                    )
                  ) : (
                    <>
                      Lanjut ke Soal Berikutnya <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleRetryCurrent}
                  className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 text-white font-black rounded-2xl text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer border border-blue-300"
                >
                  <RefreshCw className="w-4 h-4" /> Coba Hitung Lagi ({feedback.attemptsLeft}x tersisa)
                </button>
              )}
            </div>
          </div>
        )}

        {/* Answer Input Controls */}
        {!feedback?.status || feedback.status === 'wrong' ? (
          <div className="space-y-3 pt-0.5">
            {!hasOptions ? (
              <form onSubmit={handleSubmit} className="space-y-2">
                <label className="block text-xs font-extrabold text-blue-950 uppercase tracking-wider">
                  Ketik Jawaban {question.unit ? `(${question.unit})` : ''}:
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={typedAnswer}
                    onChange={(e) => {
                      setTypedAnswer(e.target.value);
                      if (validationWarning) setValidationWarning(null);
                    }}
                    placeholder="Contoh: 3/4 atau 3 1/2"
                    disabled={isSubmitting}
                    className="w-full px-4 py-3 bg-blue-50/50 border-2 border-blue-300 focus:border-blue-600 rounded-2xl text-lg font-black text-blue-950 focus:outline-hidden focus:bg-white transition-all shadow-inner"
                  />
                  {question.unit && (
                    <span className="absolute right-3 top-3 text-xs font-black text-blue-600 bg-blue-100 px-2 py-0.5 rounded-lg border border-blue-200">
                      {question.unit}
                    </span>
                  )}
                </div>
              </form>
            ) : (
              <div className="space-y-1.5">
                <label className="block text-xs font-extrabold text-blue-950 uppercase tracking-wider mb-0.5">
                  Pilih Salah Satu Jawaban:
                </label>
                {/* 1-Column on mobile for easy thumb selection without misses */}
                <div className="grid grid-cols-1 gap-2">
                  {(question.options || []).map((option, idx) => {
                    const letters = ['A', 'B', 'C', 'D'];
                    const isSelected = selectedOption === option;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          sounds.playClick();
                          triggerHaptic('tap');
                          setSelectedOption(option);
                          if (validationWarning) setValidationWarning(null);
                        }}
                        disabled={isSubmitting}
                        className={`p-3 min-h-[50px] rounded-2xl border-2 text-left font-bold transition-all flex items-center gap-3 cursor-pointer active:scale-98 ${
                          isSelected
                            ? 'bg-blue-600 border-blue-700 text-white shadow-md shadow-blue-600/30 ring-2 ring-blue-300'
                            : 'bg-white hover:bg-blue-50/80 border-blue-200 text-blue-950 shadow-2xs'
                        }`}
                      >
                        <span
                          className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${
                            isSelected
                              ? 'bg-white text-blue-700 shadow-xs'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {letters[idx] || idx + 1}
                        </span>
                        <span className="text-xs sm:text-sm font-extrabold leading-snug flex-1">
                          {option}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* SUBMIT BUTTON - LARGE TOUCH TARGET */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => handleSubmit()}
                disabled={isSubmitting}
                className="w-full py-3.5 min-h-[52px] bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 hover:from-blue-700 hover:to-indigo-900 active:scale-95 text-white font-black rounded-2xl shadow-xl shadow-blue-600/30 transition-all flex items-center justify-center gap-2 text-sm sm:text-base tracking-wide uppercase font-display cursor-pointer border-2 border-cyan-300"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <span className="animate-spin text-base">⏳</span>
                    <span>Memeriksa Jawaban...</span>
                  </div>
                ) : (
                  <>
                    <Send className="w-4 h-4 text-cyan-200" />
                    <span>
                      {solvedCount >= totalQuestions - 1 && !isCurrentlySolved
                        ? 'SUBMIT & BUKA POS BERIKUTNYA'
                        : 'SUBMIT JAWABAN'}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : null}

        {/* SD Encouragement Note */}
        <div className="bg-blue-50/90 border border-blue-200 rounded-xl p-2.5 flex items-center gap-2 text-[10px] sm:text-xs text-blue-950 font-bold">
          <AlertTriangle className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <span>
            Tips: Hitung rumus luas dengan cermat di buku catatan sebelum submit!
          </span>
        </div>
      </div>
    </div>
  );
};
