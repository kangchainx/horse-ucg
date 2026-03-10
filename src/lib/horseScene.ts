import type { HorseConfig, Point, SceneConfig, WeekBarLayout, WeeklyContribution } from "../types";

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

export function buildWeekBarLayout(
  weekly: WeeklyContribution[],
  scene: SceneConfig,
): WeekBarLayout[] {
  const innerWidth = scene.width - scene.paddingX * 2;
  const slotWidth = innerWidth / weekly.length;
  const maxTotal = Math.max(...weekly.map((week) => week.total), 1);

  return weekly.map((week, index) => {
    const normalized = week.total / maxTotal;
    const eased = Math.pow(normalized, 0.82);
    const height = Math.max(24, eased * scene.chartHeight);
    const width = slotWidth * 0.72;
    const x = scene.paddingX + slotWidth * index + (slotWidth - width) / 2;
    const topY = scene.chartFloorY - height;

    return {
      weekIndex: week.weekIndex,
      x,
      width,
      height,
      topY,
      total: week.total,
      intensity: normalized,
    };
  });
}

function buildSupportCenters(layout: WeekBarLayout[], horse: HorseConfig): Point[] {
  return layout.map((bar) => ({
    x: bar.weekIndex,
    y: bar.topY - horse.clearance - horse.bodyHeight * 0.42,
  }));
}

function smoothPoints(points: Point[], radius: number): Point[] {
  return points.map((point, index) => {
    let totalY = 0;
    let totalWeight = 0;

    for (let offset = -radius; offset <= radius; offset += 1) {
      const target = points[clamp(index + offset, 0, points.length - 1)];
      const weight = offset === 0 ? 3 : 1;
      totalY += target.y * weight;
      totalWeight += weight;
    }

    return { x: point.x, y: totalY / totalWeight };
  });
}

export function computeHorsePath(
  layout: WeekBarLayout[],
  scene: SceneConfig,
  horse: HorseConfig,
): Point[] {
  const supports = buildSupportCenters(layout, horse);
  const samples: Point[] = [];
  const totalSamples = (layout.length - 1) * horse.sampleRate;
  const slotWidth = (scene.width - scene.paddingX * 2) / layout.length;

  for (let sampleIndex = 0; sampleIndex <= totalSamples; sampleIndex += 1) {
    const weekPosition = sampleIndex / horse.sampleRate;
    const left = Math.floor(weekPosition);
    const right = Math.min(layout.length - 1, left + 1);
    const t = weekPosition - left;

    const x = lerp(
      layout[left].x + layout[left].width / 2,
      layout[right].x + layout[right].width / 2,
      t,
    );

    let y = lerp(supports[left].y, supports[right].y, t);
    const scanStart = Math.max(0, Math.floor(weekPosition - horse.anticipationWeeks));
    const scanEnd = Math.min(layout.length - 1, Math.ceil(weekPosition + horse.anticipationWeeks));

    for (let index = scanStart; index <= scanEnd; index += 1) {
      const distance = Math.abs(weekPosition - supports[index].x);
      const candidateY = supports[index].y + horse.jumpCurvature * distance * distance;
      y = Math.min(y, candidateY);
    }

    const terrainLock = lerp(
      layout[left].topY - horse.clearance - horse.bodyHeight * 0.42,
      layout[right].topY - horse.clearance - horse.bodyHeight * 0.42,
      t,
    );

    y = Math.min(y, terrainLock);
    samples.push({ x: x + slotWidth * 0.04, y });
  }

  return smoothPoints(samples, 2);
}

export function toBezierPath(points: Point[]): string {
  if (points.length === 0) {
    return "";
  }

  let path = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;

  for (let index = 0; index < points.length - 1; index += 1) {
    const p0 = points[Math.max(0, index - 1)];
    const p1 = points[index];
    const p2 = points[index + 1];
    const p3 = points[Math.min(points.length - 1, index + 2)];

    const cp1 = {
      x: p1.x + (p2.x - p0.x) / 6,
      y: p1.y + (p2.y - p0.y) / 6,
    };
    const cp2 = {
      x: p2.x - (p3.x - p1.x) / 6,
      y: p2.y - (p3.y - p1.y) / 6,
    };

    path += ` C ${cp1.x.toFixed(2)} ${cp1.y.toFixed(2)}, ${cp2.x.toFixed(2)} ${cp2.y.toFixed(
      2,
    )}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }

  return path;
}

export function buildTerrainRibbon(layout: WeekBarLayout[], floorY: number): string {
  if (layout.length === 0) {
    return "";
  }

  const points = layout.map((bar) => ({
    x: bar.x + bar.width / 2,
    y: bar.topY,
  }));

  let path = `M ${layout[0].x.toFixed(2)} ${floorY.toFixed(2)} L ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;

  for (let index = 0; index < points.length - 1; index += 1) {
    const p0 = points[Math.max(0, index - 1)];
    const p1 = points[index];
    const p2 = points[index + 1];
    const p3 = points[Math.min(points.length - 1, index + 2)];
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    path += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(
      2,
    )}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }

  const lastBar = layout[layout.length - 1];
  path += ` L ${(lastBar.x + lastBar.width).toFixed(2)} ${floorY.toFixed(2)} Z`;
  return path;
}
