import type { DailyContribution, WeeklyContribution } from "../types";

function createSeededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0xffffffff;
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function generateDailyContributions(days = 365, maxCount = 20): DailyContribution[] {
  const random = createSeededRandom(2026);
  const data: DailyContribution[] = [];

  for (let day = 0; day < days; day += 1) {
    const seasonality =
      4.8 +
      2.6 * Math.sin((day / days) * Math.PI * 1.85) +
      1.4 * Math.sin((day / days) * Math.PI * 9.6);
    const momentum = 1.6 * Math.sin((day / days) * Math.PI * 20);
    const noise = random() * 4.5;
    const weekendBias = day % 7 >= 5 ? -1.2 : 0.35;
    const count = clamp(Math.round(seasonality + momentum + noise + weekendBias), 0, maxCount);
    data.push({ dayOfYear: day + 1, count });
  }

  const bursts = [
    { start: 17, length: 5 },
    { start: 48, length: 8 },
    { start: 103, length: 6 },
    { start: 160, length: 11 },
    { start: 220, length: 7 },
    { start: 302, length: 10 },
  ];

  for (const burst of bursts) {
    for (let offset = 0; offset < burst.length; offset += 1) {
      const index = burst.start + offset;
      if (index >= data.length) {
        break;
      }

      const base = 15 + Math.floor(random() * 3);
      data[index] = {
        dayOfYear: data[index].dayOfYear,
        count: clamp(base + Math.floor(random() * 5), 15, maxCount),
      };
    }
  }

  return data;
}

export function aggregateByWeek(daily: DailyContribution[]): WeeklyContribution[] {
  const weeks: WeeklyContribution[] = [];

  for (let start = 0; start < daily.length; start += 7) {
    const chunk = daily.slice(start, start + 7);
    const total = chunk.reduce((sum, item) => sum + item.count, 0);
    const activeDays = chunk.filter((item) => item.count > 0).length;
    const peakDayCount = chunk.reduce((max, item) => Math.max(max, item.count), 0);

    weeks.push({
      weekIndex: weeks.length,
      total,
      activeDays,
      peakDayCount,
      startDay: chunk[0].dayOfYear,
      endDay: chunk[chunk.length - 1].dayOfYear,
    });
  }

  return weeks;
}
