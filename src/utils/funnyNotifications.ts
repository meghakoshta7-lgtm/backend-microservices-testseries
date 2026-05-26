type TestLite = {
  _id?: unknown;
  name?: string;
  duration?: number;
};

type ResultLite = {
  score?: number;
  accuracy?: number;
  completedAt?: Date | string;
};

type FunnyNotificationInput = {
  userId: unknown;
  tests?: TestLite[];
  recentResults?: ResultLite[];
  streak?: number;
  now?: Date;
};

type MessageCandidate = {
  title: string;
  body: string;
  type: 'test_launch' | 'reminder';
  priority: number;
};

const dayMs = 24 * 60 * 60 * 1000;

const getDailyOffset = (userId: unknown, date: Date) => {
  const seed = `${userId?.toString?.() || 'user'}-${date.toISOString().slice(0, 10)}`;
  return seed.split('').reduce((total, char) => total + char.charCodeAt(0), 0);
};

const isSameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();

const getResultDate = (result?: ResultLite) => {
  if (!result?.completedAt) return null;
  const date = new Date(result.completedAt);
  return Number.isNaN(date.getTime()) ? null : date;
};

const average = (values: number[]) => {
  if (!values.length) return 0;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
};

const pickTestText = (test?: TestLite) => {
  if (!test?.name) return 'Aaj ka mock test';
  const duration = test.duration ? ` (${test.duration} min)` : '';
  return `${test.name}${duration}`;
};

const rotateCandidates = (candidates: MessageCandidate[], userId: unknown, now: Date) => {
  const offset = getDailyOffset(userId, now);
  return [...candidates]
    .sort((a, b) => b.priority - a.priority)
    .map((candidate, index, sorted) => sorted[(index + offset) % sorted.length]);
};

export const buildFunnyTestNotifications = ({
  userId,
  tests = [],
  recentResults = [],
  streak = 0,
  now = new Date(),
}: FunnyNotificationInput) => {
  const latestResultAt = getResultDate(recentResults[0]);
  const hasTestToday = latestResultAt ? isSameDay(latestResultAt, now) : false;
  const inactiveDays = latestResultAt ? Math.floor((now.getTime() - latestResultAt.getTime()) / dayMs) : null;
  const avgScore = average(recentResults.map(r => Number(r.score || 0)).filter(score => score > 0));
  const avgAccuracy = average(recentResults.map(r => Number(r.accuracy || 0)).filter(score => score > 0));
  const hour = now.getHours();
  const testText = pickTestText(tests[0]);

  const candidates: MessageCandidate[] = [];

  if (!latestResultAt) {
    candidates.push({
      title: 'First mock pending',
      body: `📚 Paper tumse zyada wait nahi karega. ${testText} start karo.`,
      type: 'test_launch',
      priority: 100,
    });
  }

  if (inactiveDays !== null && inactiveDays >= 2) {
    candidates.push({
      title: 'Syllabus ne yaad kiya',
      body: `⏰ ${inactiveDays} din ho gaye. Syllabus ne pucha: "Milne kab aaoge?"`,
      type: 'reminder',
      priority: 95,
    });
  }

  if (!hasTestToday) {
    candidates.push({
      title: 'Aaj ka score missing',
      body: `☕ Chai ho gayi? Ab score bhi bana lo. ${testText} ready hai.`,
      type: 'test_launch',
      priority: 90,
    });
  }

  if (streak > 0 && !hasTestToday) {
    candidates.push({
      title: 'Streak bachao',
      body: `🔥 ${streak} day streak garam hai, thandi mat hone do. Ek mock test aur.`,
      type: 'reminder',
      priority: 88,
    });
  }

  if (avgAccuracy > 0 && avgAccuracy < 55) {
    candidates.push({
      title: 'Accuracy ko attention chahiye',
      body: `🎯 Guesswork se relationship khatam. Accuracy ${avgAccuracy}% hai, aaj practice serious.`,
      type: 'reminder',
      priority: 84,
    });
  }

  if (avgScore > 0 && avgScore < 60) {
    candidates.push({
      title: 'Score comeback mode',
      body: `📈 Average score ${avgScore}% hai. Rank ko thoda attention chahiye.`,
      type: 'reminder',
      priority: 82,
    });
  }

  if (hour >= 6 && hour < 11 && !hasTestToday) {
    candidates.push({
      title: 'Morning mock?',
      body: `🧠 Brain online hai. Ab ${testText} bhi start kar do.`,
      type: 'test_launch',
      priority: 75,
    });
  }

  if (hour >= 16 && hour < 22) {
    candidates.push({
      title: 'Evening push',
      body: '🚀 Future wala tum bol raha hai: "Ek test aur."',
      type: 'reminder',
      priority: 72,
    });
  }

  if (hasTestToday) {
    candidates.push({
      title: 'Momentum live hai',
      body: '😶 Notes dekhte rehna bhi ek hobby hi hai. Aaj ek mini revision aur?',
      type: 'reminder',
      priority: 70,
    });
  }

  if (!candidates.length) {
    candidates.push({
      title: 'Mock test calling',
      body: `📚 ${testText} tumhara wait kar raha hai. Test de do.`,
      type: 'test_launch',
      priority: 1,
    });
  }

  return rotateCandidates(candidates, userId, now).slice(0, 3).map((candidate, index) => {
    const createdAt = new Date(now.getTime() - (index + 1) * 60 * 60 * 1000);
    return {
      _id: `funny-test-${now.toISOString().slice(0, 10)}-${index}`,
      type: candidate.type,
      title: candidate.title,
      message: candidate.body,
      body: candidate.body,
      isRead: false,
      read: false,
      createdAt,
      time: createdAt,
      testId: tests[index % Math.max(tests.length, 1)]?._id,
    };
  });
};

export const buildFunnyResultMessage = (testName: string, score: number) => {
  if (score >= 80) return `Result aa gaya. ${testName} me ${score}% score, rank ko full attention mil gaya.`;
  if (score >= 50) return `Result ready hai. ${testName} me ${score}% score, thoda aur push aur scoreboard smile karega.`;
  return `Result ready hai. ${testName} me ${score}% score, syllabus ne bola: "Ek rematch ho jaye?"`;
};
