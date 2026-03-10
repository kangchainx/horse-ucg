import { HorseGlyph } from "./HorseGlyph";
import { buildTerrainRibbon, buildWeekBarLayout, computeHorsePath, toBezierPath } from "../lib/horseScene";
import type { HorseConfig, SceneConfig, WeeklyContribution } from "../types";

const monthLabels = [
  { name: "Jan", week: 0 },
  { name: "Feb", week: 4 },
  { name: "Mar", week: 8 },
  { name: "Apr", week: 13 },
  { name: "May", week: 17 },
  { name: "Jun", week: 21 },
  { name: "Jul", week: 26 },
  { name: "Aug", week: 30 },
  { name: "Sep", week: 35 },
  { name: "Oct", week: 39 },
  { name: "Nov", week: 43 },
  { name: "Dec", week: 48 },
];

interface HorseSceneProps {
  weekly: WeeklyContribution[];
  scene: SceneConfig;
  horse: HorseConfig;
}

function toneForIntensity(intensity: number): string {
  if (intensity > 0.88) {
    return "#f97316";
  }
  if (intensity > 0.72) {
    return "#fb923c";
  }
  if (intensity > 0.54) {
    return "#fdba74";
  }
  if (intensity > 0.32) {
    return "#fde68a";
  }
  return "#fef3c7";
}

export function HorseScene({ weekly, scene, horse }: HorseSceneProps) {
  const layout = buildWeekBarLayout(weekly, scene);
  const horsePathPoints = computeHorsePath(layout, scene, horse);
  const horsePath = toBezierPath(horsePathPoints);
  const terrainRibbon = buildTerrainRibbon(layout, scene.chartFloorY);
  const pathId = "horse-track";
  const maxWeekTotal = Math.max(...weekly.map((item) => item.total), 1);

  return (
    <svg
      className="horse-scene"
      viewBox={`0 0 ${scene.width} ${scene.height}`}
      role="img"
      aria-label="A horse running across weekly GitHub contribution peaks"
    >
      <defs>
        <linearGradient id="sky-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#fff5d6" />
          <stop offset="35%" stopColor="#ffd89c" />
          <stop offset="100%" stopColor="#ffedd5" />
        </linearGradient>
        <linearGradient id="terrain-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#fed7aa" />
          <stop offset="100%" stopColor="#fb923c" />
        </linearGradient>
        <linearGradient id="bar-shade" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.34)" />
          <stop offset="100%" stopColor="rgba(120,53,15,0.08)" />
        </linearGradient>
        <filter id="soft-blur" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="18" />
        </filter>
        <filter id="bar-shadow" x="-20%" y="-20%" width="140%" height="160%">
          <feDropShadow dx="0" dy="8" stdDeviation="8" floodColor="#9a3412" floodOpacity="0.16" />
        </filter>
      </defs>

      <rect width={scene.width} height={scene.height} rx="36" fill="url(#sky-gradient)" />
      <circle cx={scene.width - 120} cy={90} r={56} fill="#fff1b6" opacity="0.86" />
      <circle cx={scene.width - 120} cy={90} r={84} fill="#fff1b6" opacity="0.25" filter="url(#soft-blur)" />
      <path
        d={`M 0 ${scene.horizonY + 28} C 210 ${scene.horizonY - 12}, 380 ${scene.horizonY + 14}, 560 ${scene.horizonY + 2}
            S 980 ${scene.horizonY - 4}, ${scene.width} ${scene.horizonY + 18}
            L ${scene.width} ${scene.height} L 0 ${scene.height} Z`}
        fill="#ffedd5"
        opacity="0.7"
      />
      <path
        d={`M 0 ${scene.groundY - 16} C 220 ${scene.groundY - 46}, 420 ${scene.groundY - 2}, 620 ${scene.groundY - 22}
            S 1040 ${scene.groundY - 56}, ${scene.width} ${scene.groundY - 18}
            L ${scene.width} ${scene.height} L 0 ${scene.height} Z`}
        fill="#fdba74"
        opacity="0.48"
      />

      <path d={terrainRibbon} fill="url(#terrain-gradient)" opacity="0.48" />
      <rect
        x={scene.paddingX - 8}
        y={scene.chartFloorY}
        width={scene.width - scene.paddingX * 2 + 16}
        height={scene.height - scene.chartFloorY}
        rx="18"
        fill="#8d4f1e"
        opacity="0.14"
      />

      <g className="week-bars">
        {layout.map((bar) => (
          <g key={bar.weekIndex} filter="url(#bar-shadow)">
            <rect
              x={bar.x}
              y={bar.topY}
              width={bar.width}
              height={bar.height}
              rx={Math.min(14, bar.width / 2)}
              fill={toneForIntensity(bar.intensity)}
            />
            <rect
              x={bar.x}
              y={bar.topY}
              width={bar.width}
              height={bar.height}
              rx={Math.min(14, bar.width / 2)}
              fill="url(#bar-shade)"
            />
            <text x={bar.x + bar.width / 2} y={bar.topY - 10} textAnchor="middle" className="bar-value">
              {bar.total}
            </text>
          </g>
        ))}
      </g>

      <g className="axis">
        <path
          d={`M ${scene.paddingX - 4} ${scene.chartFloorY} H ${scene.width - scene.paddingX + 4}`}
          stroke="#7c2d12"
          strokeWidth="2.5"
          opacity="0.28"
        />
        {monthLabels.map((label) => {
          const bar = layout[Math.min(label.week, layout.length - 1)];
          return (
            <g key={label.name}>
              <line
                x1={bar.x + bar.width / 2}
                y1={scene.chartFloorY + 6}
                x2={bar.x + bar.width / 2}
                y2={scene.chartFloorY + 16}
                stroke="#7c2d12"
                opacity="0.4"
              />
              <text x={bar.x + bar.width / 2} y={scene.chartFloorY + 40} textAnchor="middle" className="month-label">
                {label.name}
              </text>
            </g>
          );
        })}
      </g>

      <path id={pathId} d={horsePath} fill="none" stroke="none" />

      <g className="horse-runner">
        <HorseGlyph />
        <animateMotion dur={`${horse.durationSeconds}s`} repeatCount="indefinite" rotate="auto" calcMode="paced">
          <mpath href={`#${pathId}`} />
        </animateMotion>
      </g>

      <g className="scene-copy">
        <text x={scene.paddingX} y="64" className="scene-kicker">
          Weekly terrain from GitHub contributions
        </text>
        <text x={scene.paddingX} y="116" className="scene-title">
          Year of the Horse
        </text>
        <text x={scene.paddingX} y="154" className="scene-subtitle">
          53 weekly peaks, one uninterrupted gallop. High weeks become cliffs, quiet weeks become plains.
        </text>
        <text x={scene.width - scene.paddingX} y="64" textAnchor="end" className="scene-stat-label">
          Peak week
        </text>
        <text x={scene.width - scene.paddingX} y="114" textAnchor="end" className="scene-stat-value">
          {maxWeekTotal} commits
        </text>
      </g>
    </svg>
  );
}
