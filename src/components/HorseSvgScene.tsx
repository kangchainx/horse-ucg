interface ContributionDay {
  contributionCount: number;
  date: string;
  color: string;
  weekday: number;
}

interface ContributionDataset {
  login: string;
  totalContributions: number;
  startedAt: string | null;
  endedAt: string | null;
  generatedAt: string;
  days: ContributionDay[];
}

interface ContributionWeek {
  startDate: string;
  total: number;
  peakCount: number;
  color: string;
}

const WIDTH = 1000;
const HEIGHT = 180;
const STRIP_X = 50;
const STRIP_WIDTH = 900;
const STRIP_Y = 116;
const STRIP_HEIGHT = 8;
const BASE_Y = 110;

interface HorseSvgSceneProps {
  dataset: ContributionDataset;
  isPaused: boolean;
  sceneKey: number;
  horseColor: string;
}

function aggregateWeeks(days: ContributionDay[]): ContributionWeek[] {
  const weeks: ContributionWeek[] = [];

  for (let index = 0; index < days.length; index += 7) {
    const chunk = days.slice(index, index + 7);
    if (chunk.length === 0) {
      continue;
    }

    let total = 0;
    let peakCount = -1;
    let color = chunk[0].color;

    for (const day of chunk) {
      total += day.contributionCount;
      if (day.contributionCount > peakCount) {
        peakCount = day.contributionCount;
        color = day.color;
      }
    }

    weeks.push({
      startDate: chunk[0].date,
      total,
      peakCount,
      color,
    });
  }

  return weeks;
}

function monthMarkersForWeeks(weeks: ContributionWeek[]) {
  const labels: Array<{ label: string; index: number }> = [];
  const seen = new Set<string>();

  weeks.forEach((week, index) => {
    const month = new Date(week.startDate).toLocaleString("en-US", { month: "short" });
    if (!seen.has(month)) {
      seen.add(month);
      labels.push({ label: month, index });
    }
  });

  return labels;
}

function HorseSprite({ color }: { color: string }) {
  return (
    <g transform="translate(-28 -50) scale(0.07)">
      <g transform="translate(800 0) scale(-1 1)">
        <g>
          <animate attributeName="display" values="inline;none;inline" keyTimes="0;0.5;1" dur="0.4s" repeatCount="indefinite" calcMode="discrete" />
          <path fill={color} d="M 0 0 L 200 0 L 200 50 L 250 50 L 250 100 L 300 100 L 300 300 L 400 300 L 400 350 L 450 350 L 450 300 L 650 300 L 650 350 L 700 350 L 700 400 L 650 400 L 650 750 L 600 750 L 600 500 L 550 500 L 550 700 L 500 700 L 500 500 L 450 500 L 450 450 L 300 450 L 300 500 L 200 500 L 200 750 L 150 750 L 150 550 L 100 550 L 100 500 L 50 500 L 50 450 L 100 450 L 100 350 L 150 350 L 150 200 L 100 200 L 100 250 L 0 250 L 0 150 L 50 150 L 50 50 L 0 50 Z" />
          <path fill={color} d="M 700 400 L 750 400 L 750 700 L 700 700 Z" />
          <path fill={color} d="M 0 500 L 50 500 L 50 600 L 0 600 Z" />
          <g>
            <path fill={color} d="M 50 600 L 100 600 L 100 700 L 50 700 Z" />
            <path fill={color} d="M 450 700 L 500 700 L 500 750 L 450 750 Z" />
            <path fill={color} d="M 100 750 L 150 750 L 150 800 L 100 800 Z" />
            <path fill={color} d="M 550 750 L 600 750 L 600 800 L 550 800 Z" />
          </g>
        </g>
        <g display="none">
          <animate attributeName="display" values="none;inline;none" keyTimes="0;0.5;1" dur="0.4s" repeatCount="indefinite" calcMode="discrete" />
          <path fill={color} d="M 0 0 L 200 0 L 200 50 L 250 50 L 250 100 L 300 100 L 300 300 L 400 300 L 400 350 L 450 350 L 450 300 L 650 300 L 650 350 L 700 350 L 700 400 L 650 400 L 650 500 L 600 500 L 600 750 L 550 750 L 550 500 L 450 500 L 450 450 L 300 450 L 300 500 L 150 500 L 150 750 L 100 750 L 100 550 L 50 550 L 50 500 L 50 450 L 100 450 L 100 350 L 150 350 L 150 200 L 100 200 L 100 250 L 0 250 L 0 150 L 50 150 L 50 50 L 0 50 Z" />
          <path fill={color} d="M 700 400 L 750 400 L 750 700 L 700 700 Z" />
          <path fill={color} d="M 50 500 L 100 500 L 100 600 L 50 600 Z" />
          <g>
            <path fill={color} d="M 100 600 L 150 600 L 150 700 L 100 700 Z" />
            <path fill={color} d="M 500 700 L 550 700 L 550 750 L 500 750 Z" />
            <path fill={color} d="M 50 750 L 100 750 L 100 800 L 50 800 Z" />
            <path fill={color} d="M 500 750 L 550 750 L 550 800 L 500 800 Z" />
          </g>
        </g>
      </g>
    </g>
  );
}

export function HorseSvgScene({ dataset, isPaused, sceneKey, horseColor }: HorseSvgSceneProps) {
  const weeks = aggregateWeeks(dataset.days);
  const labels = monthMarkersForWeeks(weeks);
  const slotWidth = Math.floor(STRIP_WIDTH / Math.max(weeks.length, 1));
  const renderedWidth = slotWidth * weeks.length;
  const stripOffsetX = STRIP_X + Math.floor((STRIP_WIDTH - renderedWidth) / 2);

  return (
    <svg
      className={`race-scene ${isPaused ? "race-scene--paused" : ""}`}
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      role="img"
      aria-label={`${dataset.login} horse contribution graph`}
    >
      <defs>
        <linearGradient id={`horse-bg-${sceneKey}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#161b22" />
          <stop offset="100%" stopColor="#0d1117" />
        </linearGradient>
        <linearGradient id={`horse-glow-${sceneKey}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgba(57,211,83,0)" />
          <stop offset="50%" stopColor="rgba(57,211,83,0.18)" />
          <stop offset="100%" stopColor="rgba(57,211,83,0)" />
        </linearGradient>
      </defs>

      <rect width={WIDTH} height={HEIGHT} rx="12" fill={`url(#horse-bg-${sceneKey})`} />
      <path d={`M ${stripOffsetX} ${STRIP_Y - 6} H ${stripOffsetX + renderedWidth}`} stroke={`url(#horse-glow-${sceneKey})`} strokeWidth="18" />

      <g className="heat-strip">
        {weeks.map((week, index) => {
          const x = stripOffsetX + slotWidth * index;
          return (
            <rect
              key={week.startDate}
              x={x}
              y={STRIP_Y}
              width={slotWidth}
              height={STRIP_HEIGHT}
              fill={week.color}
            />
          );
        })}
      </g>

      <g className="month-labels">
        {labels.map((item) => {
          const x = stripOffsetX + slotWidth * item.index;
          return (
            <text key={`${item.label}-${item.index}`} x={x} y={STRIP_Y + 28}>
              {item.label}
            </text>
          );
        })}
      </g>

      <g className="horse-loop" key={sceneKey} transform={`translate(${stripOffsetX} ${BASE_Y})`}>
        <HorseSprite color={horseColor} />
        {!isPaused ? (
          <animateTransform
            attributeName="transform"
            type="translate"
            values={`${stripOffsetX} ${BASE_Y};${stripOffsetX + renderedWidth - 12} ${BASE_Y}`}
            dur="9s"
            repeatCount="indefinite"
          />
        ) : null}
      </g>
    </svg>
  );
}
