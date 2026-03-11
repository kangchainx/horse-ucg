const WIDTH = 1000;
const HEIGHT = 180;
const STRIP_X = 50;
const STRIP_WIDTH = 900;
const STRIP_Y = 116;
const STRIP_HEIGHT = 8;
const BASE_Y = 110;

function aggregateWeeks(days) {
  const weeks = [];

  for (let index = 0; index < days.length; index += 7) {
    const chunk = days.slice(index, index + 7);
    if (chunk.length === 0) {
      continue;
    }

    let peakCount = -1;
    let color = chunk[0].color;

    for (const day of chunk) {
      if (day.contributionCount > peakCount) {
        peakCount = day.contributionCount;
        color = day.color;
      }
    }

    weeks.push({
      startDate: chunk[0].date,
      color,
    });
  }

  return weeks;
}

function monthMarkersForWeeks(weeks) {
  const labels = [];
  const seen = new Set();

  weeks.forEach((week, index) => {
    const month = new Date(week.startDate).toLocaleString("en-US", { month: "short" });
    if (!seen.has(month)) {
      seen.add(month);
      labels.push({ label: month, index });
    }
  });

  return labels;
}

function escapeXml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function renderHorseSprite(color, startX, endX, translateY) {
  return `
    <g transform="translate(${startX} ${translateY})">
      <animateTransform
        attributeName="transform"
        type="translate"
        values="${startX} ${translateY};${endX} ${translateY}"
        dur="9s"
        repeatCount="indefinite"
      />
      <g transform="translate(-28 -50) scale(0.07)">
        <g transform="translate(800 0) scale(-1 1)">
          <g>
            <animate attributeName="display" values="inline;none;inline" keyTimes="0;0.5;1" dur="0.4s" repeatCount="indefinite" calcMode="discrete" />
            <path fill="${color}" d="M 0 0 L 200 0 L 200 50 L 250 50 L 250 100 L 300 100 L 300 300 L 400 300 L 400 350 L 450 350 L 450 300 L 650 300 L 650 350 L 700 350 L 700 400 L 650 400 L 650 750 L 600 750 L 600 500 L 550 500 L 550 700 L 500 700 L 500 500 L 450 500 L 450 450 L 300 450 L 300 500 L 200 500 L 200 750 L 150 750 L 150 550 L 100 550 L 100 500 L 50 500 L 50 450 L 100 450 L 100 350 L 150 350 L 150 200 L 100 200 L 100 250 L 0 250 L 0 150 L 50 150 L 50 50 L 0 50 Z" />
            <path fill="${color}" d="M 700 400 L 750 400 L 750 700 L 700 700 Z" />
            <path fill="${color}" d="M 0 500 L 50 500 L 50 600 L 0 600 Z" />
            <g>
              <path fill="${color}" d="M 50 600 L 100 600 L 100 700 L 50 700 Z" />
              <path fill="${color}" d="M 450 700 L 500 700 L 500 750 L 450 750 Z" />
              <path fill="${color}" d="M 100 750 L 150 750 L 150 800 L 100 800 Z" />
              <path fill="${color}" d="M 550 750 L 600 750 L 600 800 L 550 800 Z" />
            </g>
          </g>
          <g display="none">
            <animate attributeName="display" values="none;inline;none" keyTimes="0;0.5;1" dur="0.4s" repeatCount="indefinite" calcMode="discrete" />
            <path fill="${color}" d="M 0 0 L 200 0 L 200 50 L 250 50 L 250 100 L 300 100 L 300 300 L 400 300 L 400 350 L 450 350 L 450 300 L 650 300 L 650 350 L 700 350 L 700 400 L 650 400 L 650 500 L 600 500 L 600 750 L 550 750 L 550 500 L 450 500 L 450 450 L 300 450 L 300 500 L 150 500 L 150 750 L 100 750 L 100 550 L 50 550 L 50 500 L 50 450 L 100 450 L 100 350 L 150 350 L 150 200 L 100 200 L 100 250 L 0 250 L 0 150 L 50 150 L 50 50 L 0 50 Z" />
            <path fill="${color}" d="M 700 400 L 750 400 L 750 700 L 700 700 Z" />
            <path fill="${color}" d="M 50 500 L 100 500 L 100 600 L 50 600 Z" />
            <g>
              <path fill="${color}" d="M 100 600 L 150 600 L 150 700 L 100 700 Z" />
              <path fill="${color}" d="M 500 700 L 550 700 L 550 750 L 500 750 Z" />
              <path fill="${color}" d="M 50 750 L 100 750 L 100 800 L 50 800 Z" />
              <path fill="${color}" d="M 500 750 L 550 750 L 550 800 L 500 800 Z" />
            </g>
          </g>
        </g>
      </g>
    </g>
  `.trim();
}

export function normalizeHorseColor(input) {
  if (!input) {
    return "#ef4444";
  }

  const normalized = String(input).trim();
  if (/^#[0-9a-fA-F]{6}$/.test(normalized)) {
    return normalized.toLowerCase();
  }

  if (/^[0-9a-fA-F]{6}$/.test(normalized)) {
    return `#${normalized.toLowerCase()}`;
  }

  return "#ef4444";
}

export function renderShareCard(dataset, horseColor) {
  const weeks = aggregateWeeks(dataset.days);
  const labels = monthMarkersForWeeks(weeks);
  const slotWidth = Math.floor(STRIP_WIDTH / Math.max(weeks.length, 1));
  const renderedWidth = slotWidth * weeks.length;
  const stripOffsetX = STRIP_X + Math.floor((STRIP_WIDTH - renderedWidth) / 2);
  const monthLabels = labels
    .map((item) => {
      const x = stripOffsetX + slotWidth * item.index;
      return `<text x="${x}" y="${STRIP_Y + 28}">${escapeXml(item.label)}</text>`;
    })
    .join("");
  const weekRects = weeks
    .map((week, index) => {
      const x = stripOffsetX + slotWidth * index;
      return `<rect x="${x}" y="${STRIP_Y}" width="${slotWidth}" height="${STRIP_HEIGHT}" fill="${week.color}" />`;
    })
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${escapeXml(dataset.login)} horse contribution graph">
  <defs>
    <linearGradient id="horse-glow" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="rgba(57,211,83,0)" />
      <stop offset="50%" stop-color="rgba(57,211,83,0.18)" />
      <stop offset="100%" stop-color="rgba(57,211,83,0)" />
    </linearGradient>
    <style>
      text {
        fill: #8b949e;
        font-size: 12px;
        font-weight: 600;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
      }
    </style>
  </defs>
  <path d="M ${stripOffsetX} ${STRIP_Y - 6} H ${stripOffsetX + renderedWidth}" stroke="url(#horse-glow)" stroke-width="18" />
  <g>
    <rect x="${stripOffsetX - 1}" y="${STRIP_Y - 1}" width="${renderedWidth + 2}" height="${STRIP_HEIGHT + 2}" fill="none" stroke="#30363d" />
    ${weekRects}
  </g>
  <g>${monthLabels}</g>
  ${renderHorseSprite(normalizeHorseColor(horseColor), stripOffsetX, stripOffsetX + renderedWidth - 12, BASE_Y)}
</svg>
`;
}
