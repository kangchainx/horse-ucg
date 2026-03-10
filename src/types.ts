export interface DailyContribution {
  dayOfYear: number;
  count: number;
}

export interface WeeklyContribution {
  weekIndex: number;
  total: number;
  activeDays: number;
  peakDayCount: number;
  startDay: number;
  endDay: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface WeekBarLayout {
  weekIndex: number;
  x: number;
  width: number;
  height: number;
  topY: number;
  total: number;
  intensity: number;
}

export interface SceneConfig {
  width: number;
  height: number;
  paddingX: number;
  paddingTop: number;
  horizonY: number;
  groundY: number;
  chartFloorY: number;
  chartHeight: number;
  weeks: number;
}

export interface HorseConfig {
  bodyWidth: number;
  bodyHeight: number;
  clearance: number;
  sampleRate: number;
  anticipationWeeks: number;
  jumpCurvature: number;
  durationSeconds: number;
}
