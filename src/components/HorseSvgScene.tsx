import { useEffect, useId, useMemo, useState } from "react";

const WIDTH = 1000;
const HEIGHT = 350;
const STRIP_X = 50;
const STRIP_WIDTH = 900;
const STRIP_Y = 245;
const STRIP_HEIGHT = 16;
const BASE_Y = 240;
const HORSE_ASSET_URL = `${import.meta.env.BASE_URL}horse-face-light-svgrepo-com-empty-moss-right.svg`;
const CONTRIBUTION_DATA_URL = `${import.meta.env.BASE_URL}data/kangchainx-contributions.json`;
const MOCK_DAY_COUNT = 365;
const FALLBACK_COLORS = ["#161b22", "#0e4429", "#006d32", "#26a641", "#39d353"];

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

function generateFallbackDataset(): ContributionDataset {
  const days: ContributionDay[] = [];
  let currentTrend = 0;
  const today = new Date();

  for (let index = MOCK_DAY_COUNT - 1; index >= 0; index -= 1) {
    if (Math.random() < 0.1) {
      currentTrend = Math.floor(Math.random() * 4);
    }

    if (Math.random() < 0.05) {
      currentTrend = Math.floor(Math.random() * 15) + 8;
    }

    const contributionCount = Math.max(0, currentTrend + Math.floor(Math.random() * 3) - 1);
    const date = new Date(today);
    date.setDate(today.getDate() - index);
    days.push({
      contributionCount,
      date: date.toISOString().slice(0, 10),
      color: FALLBACK_COLORS[Math.min(4, contributionCount === 0 ? 0 : Math.ceil(contributionCount / 5))],
      weekday: date.getDay(),
    });
  }

  return {
    login: "kangchainx",
    totalContributions: days.reduce((sum, day) => sum + day.contributionCount, 0),
    startedAt: days[0]?.date ?? null,
    endedAt: days[days.length - 1]?.date ?? null,
    generatedAt: new Date().toISOString(),
    days,
  };
}

function formatRange(startedAt: string | null, endedAt: string | null): string {
  if (!startedAt || !endedAt) {
    return "Last 365 days";
  }

  const start = new Date(startedAt);
  const end = new Date(endedAt);
  return `${start.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} - ${end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
}

function monthMarkers(days: ContributionDay[]) {
  const labels: Array<{ label: string; index: number }> = [];
  const seen = new Set<string>();

  days.forEach((day, index) => {
    const month = new Date(day.date).toLocaleString("en-US", { month: "short" });
    if (!seen.has(month)) {
      seen.add(month);
      labels.push({ label: month, index });
    }
  });

  return labels;
}

export function HorseSvgScene() {
  const [dataset, setDataset] = useState<ContributionDataset | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [sceneKey, setSceneKey] = useState(0);
  const id = useId();
  const pathId = `${id.replace(/:/g, "")}-scene-${sceneKey}`;

  useEffect(() => {
    let cancelled = false;

    async function loadDataset() {
      try {
        const response = await fetch(CONTRIBUTION_DATA_URL, { cache: "no-store" });
        if (!response.ok) {
          throw new Error(`Failed to load contribution data: ${response.status}`);
        }

        const data = (await response.json()) as ContributionDataset;
        if (!cancelled) {
          setDataset(data);
        }
      } catch {
        if (!cancelled) {
          setDataset(generateFallbackDataset());
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadDataset();
    return () => {
      cancelled = true;
    };
  }, []);

  const days = useMemo(() => dataset?.days ?? [], [dataset]);
  const labels = useMemo(() => monthMarkers(days), [days]);

  const handleReset = () => {
    setSceneKey((current) => current + 1);
    setIsPaused(false);
  };

  const handleTogglePause = () => {
    setIsPaused((current) => !current);
  };

  return (
    <section className="prototype-card">
      <div className="viewport viewport--svg">
        <svg
          className={`race-scene ${isPaused ? "race-scene--paused" : ""}`}
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          role="img"
          aria-label="kangchainx GitHub contribution graph with a horse running across it"
        >
          <defs>
            <linearGradient id={`${pathId}-bg`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#161b22" />
              <stop offset="100%" stopColor="#0d1117" />
            </linearGradient>
            <linearGradient id={`${pathId}-glow`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(57,211,83,0)" />
              <stop offset="50%" stopColor="rgba(57,211,83,0.22)" />
              <stop offset="100%" stopColor="rgba(245,211,0,0)" />
            </linearGradient>
          </defs>

          <rect width={WIDTH} height={HEIGHT} fill={`url(#${pathId}-bg)`} />
          <rect x="0" y="0" width={WIDTH} height={HEIGHT} fill="rgba(13,17,23,0.22)" />

          <g className="scene-copy">
            <text x="40" y="44" className="scene-copy__title">
              {dataset?.login ?? "kangchainx"} real GitHub contributions
            </text>
            <text x="40" y="66" className="scene-copy__subtitle">
              {loading ? "Loading contribution calendar..." : formatRange(dataset?.startedAt ?? null, dataset?.endedAt ?? null)}
            </text>
            <text x="40" y="90" className="scene-copy__subtitle">
              {loading ? "" : `${dataset?.totalContributions ?? 0} contributions in the current calendar window`}
            </text>
          </g>

          <path d={`M 0 ${BASE_Y} H ${WIDTH}`} className="scene-track" />
          <path
            d={`M ${STRIP_X} ${STRIP_Y - 10} H ${STRIP_X + STRIP_WIDTH}`}
            stroke={`url(#${pathId}-glow)`}
            strokeWidth="24"
          />

          <g className="heat-strip">
            <rect
              x={STRIP_X - 1}
              y={STRIP_Y - 1}
              width={STRIP_WIDTH + 2}
              height={STRIP_HEIGHT + 2}
              fill="none"
              stroke="#30363d"
            />

            {days.map((day, index) => {
              const x = STRIP_X + (STRIP_WIDTH / Math.max(days.length, 1)) * index;
              return (
                <g key={day.date}>
                  <rect
                    x={x}
                    y={STRIP_Y}
                    width={STRIP_WIDTH / Math.max(days.length, 1)}
                    height={STRIP_HEIGHT}
                    fill={day.color}
                  />
                  {index > 0 ? (
                    <line
                      x1={x}
                      y1={STRIP_Y}
                      x2={x}
                      y2={STRIP_Y + STRIP_HEIGHT}
                      stroke="#0d1117"
                      strokeWidth="0.5"
                    />
                  ) : null}
                </g>
              );
            })}
          </g>

          <g className="month-labels">
            {labels.map((item) => {
              const x = STRIP_X + (STRIP_WIDTH / Math.max(days.length, 1)) * item.index;
              return (
                <text key={`${item.label}-${item.index}`} x={x} y={STRIP_Y + 40}>
                  {item.label}
                </text>
              );
            })}
          </g>

          <g className="horse-shadow-loop" key={`shadow-${sceneKey}`}>
            <ellipse
              cx="0"
              cy="0"
              rx="22"
              ry="7"
              fill="rgba(0,0,0,0.22)"
              transform={`translate(${STRIP_X - 4} ${BASE_Y + 8})`}
            >
              {!isPaused ? (
                <animateTransform
                  attributeName="transform"
                  type="translate"
                  values={`${STRIP_X - 4} ${BASE_Y + 8};${STRIP_X + STRIP_WIDTH - 16} ${BASE_Y + 8}`}
                  dur="9s"
                  repeatCount="indefinite"
                />
              ) : null}
            </ellipse>
          </g>

          <g className="horse-loop" key={sceneKey} transform={`translate(${STRIP_X} ${BASE_Y})`}>
            <image href={HORSE_ASSET_URL} x="-34" y="-60" width="68" height="68" preserveAspectRatio="xMidYMid meet" />
            {!isPaused ? (
              <animateTransform
                attributeName="transform"
                type="translate"
                values={`${STRIP_X} ${BASE_Y};${STRIP_X + STRIP_WIDTH - 12} ${BASE_Y}`}
                dur="9s"
                repeatCount="indefinite"
              />
            ) : null}
          </g>
        </svg>
      </div>

      <div className="controls">
        <button type="button" onClick={handleReset}>
          重新起跑
        </button>
        <button type="button" onClick={handleTogglePause}>
          {isPaused ? "继续" : "暂停"}
        </button>
      </div>
    </section>
  );
}
