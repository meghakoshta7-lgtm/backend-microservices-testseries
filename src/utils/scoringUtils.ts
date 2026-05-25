export const calculateAccuracy = (correct: number, attempted: number): number => {
  if (attempted <= 0) return 0;
  return Math.round((correct / attempted) * 100);
};

export const calculateScore = (correct: number, wrong: number, marksPerCorrect: number, negativeMarks: number): number => {
  return Math.max(0, correct * marksPerCorrect - wrong * negativeMarks);
};

export const getCorrectAnswerIndex = (question: { correctAnswer: unknown; options?: Array<{ label?: string; text?: string } | string> }): number | null => {
  const answer = Array.isArray(question.correctAnswer) ? question.correctAnswer[0] : question.correctAnswer;
  if (typeof answer === 'number') return answer;

  const raw = String(answer ?? '').trim();
  if (!raw) return null;

  if (/^\d+$/.test(raw)) return Number(raw);

  const upper = raw.toUpperCase();
  const letterIndex = upper.length === 1 ? upper.charCodeAt(0) - 65 : -1;
  if (letterIndex >= 0 && letterIndex < 26) return letterIndex;

  const optionIndex = question.options?.findIndex((option) => {
    if (typeof option === 'string') return option.trim().toLowerCase() === raw.toLowerCase();
    return option.label?.trim().toLowerCase() === raw.toLowerCase() || option.text?.trim().toLowerCase() === raw.toLowerCase();
  });

  return optionIndex !== undefined && optionIndex >= 0 ? optionIndex : null;
};

export const isAnswerCorrect = (
  question: { correctAnswer: unknown; options?: Array<{ label?: string; text?: string } | string> },
  userAnswer: unknown,
): boolean => {
  const correctIndex = getCorrectAnswerIndex(question);
  if (correctIndex !== null) return Number(userAnswer) === correctIndex;
  return String(userAnswer ?? '').trim().toLowerCase() === String(question.correctAnswer ?? '').trim().toLowerCase();
};

export const computeTopicPerformance = (
  questions: { _id?: unknown; correctAnswer: unknown; options?: Array<{ label?: string; text?: string } | string>; topic?: string; subject?: string }[],
  answers: Record<string, unknown>,
): { topic: string; total: number; correct: number; wrong: number; skipped: number; accuracy: number }[] => {
  const map: Record<string, { total: number; correct: number; wrong: number; skipped: number }> = {};
  questions.forEach(q => {
    const topic = q.topic || q.subject || 'General';
    if (!map[topic]) map[topic] = { total: 0, correct: 0, wrong: 0, skipped: 0 };
    map[topic].total++;
    const userAnswer = answers[String(q._id ?? '')];
    if (userAnswer === undefined || userAnswer === null) {
      map[topic].skipped++;
    } else if (isAnswerCorrect(q, userAnswer)) {
      map[topic].correct++;
    } else {
      map[topic].wrong++;
    }
  });
  return Object.entries(map).map(([topic, data]) => ({
    topic,
    ...data,
    accuracy: calculateAccuracy(data.correct, data.correct + data.wrong),
  }));
};

export const computeAverageScore = (scores: number[]): number => {
  if (!scores.length) return 0;
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
};

export const computePercentage = (value: number, total: number): number => {
  if (total <= 0) return 0;
  return Math.round((value / total) * 100);
};
