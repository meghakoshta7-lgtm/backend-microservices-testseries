export const now = () => new Date();

export const todayStart = () => {
  const d = now();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
};

export const daysAgo = (days: number) => {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
};

export const weeksAgo = (weeks: number) => daysAgo(weeks * 7);

export const monthsAgo = (months: number) => daysAgo(months * 30);

export const yearsAgo = (years: number) => daysAgo(years * 365);

export const daysMap = {
  '7d': 7, '30d': 30, '90d': 90, '1y': 365,
} as const;

export const parsePeriod = (period: string, fallback = 30): number => {
  return (daysMap as Record<string, number>)[period] || fallback;
};

export const sinceDate = (period: string, fallback = 30): Date => {
  return daysAgo(parsePeriod(period, fallback));
};
