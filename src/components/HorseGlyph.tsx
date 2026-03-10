import type { CSSProperties } from "react";

interface HorseGlyphProps {
  animated?: boolean;
}

export function HorseGlyph({ animated = true }: HorseGlyphProps) {
  const style = { "--gallop-speed": "720ms" } as CSSProperties;

  return (
    <g className={animated ? "horse horse--animated" : "horse"} style={style}>
      <g className="horse-shadow" transform="translate(0, 24)">
        <ellipse cx="0" cy="0" rx="34" ry="7" fill="rgba(67, 33, 17, 0.14)" />
      </g>
      <g className="horse-core">
        <path
          d="M -54 2 C -38 -5 -28 -10 -18 -19 C -10 -27 6 -31 21 -26 C 32 -23 42 -14 45 -2 C 53 2 56 7 55 14 C 50 15 46 13 40 10 C 30 17 19 20 6 18 C -6 16 -18 14 -28 11 C -35 18 -43 24 -57 23 C -64 17 -64 8 -54 2 Z"
          fill="#814923"
        />
        <path
          d="M 26 -22 C 34 -37 50 -44 66 -42 C 74 -39 79 -33 78 -25 C 72 -16 63 -13 56 -8 L 49 5 C 43 2 39 -2 36 -9 C 33 -13 30 -16 26 -22 Z"
          fill="#925129"
        />
        <path
          d="M 60 -40 C 62 -49 67 -56 73 -58 C 77 -55 76 -48 72 -38 Z"
          fill="#5c2c15"
        />
        <path
          d="M 48 -39 C 47 -47 49 -53 54 -57 C 59 -53 58 -45 56 -37 Z"
          fill="#5c2c15"
        />
        <path
          d="M -58 -1 C -72 -10 -81 -20 -88 -34 C -83 -37 -77 -35 -70 -30 C -62 -25 -54 -19 -49 -9 Z"
          fill="#5f3017"
        />
        <path
          d="M 66 -30 C 71 -29 75 -26 78 -21 C 74 -16 70 -14 65 -16 C 63 -20 63 -25 66 -30 Z"
          fill="#f4ead8"
        />
        <circle cx="67" cy="-25" r="2.2" fill="#1d120b" />
        <path d="M 75 -18 C 83 -15 86 -12 90 -7 C 86 -4 81 -4 75 -7" fill="#6f381b" />
        <path d="M -10 -8 C 5 -14 19 -14 33 -9" stroke="#6e351a" strokeWidth="3" strokeLinecap="round" fill="none" />
        <g className="horse-leg horse-leg--rear">
          <path d="M -30 12 C -33 24 -35 37 -38 53 C -40 62 -42 70 -47 82" stroke="#4b2513" strokeWidth="6" strokeLinecap="round" fill="none" />
          <path d="M -36 46 C -28 56 -26 67 -30 83" stroke="#5b2c16" strokeWidth="5" strokeLinecap="round" fill="none" />
        </g>
        <g className="horse-leg horse-leg--rear-alt">
          <path d="M -10 13 C -11 28 -9 44 -8 56 C -7 66 -9 75 -13 83" stroke="#4b2513" strokeWidth="6" strokeLinecap="round" fill="none" />
          <path d="M -7 46 C 1 55 5 65 2 82" stroke="#5b2c16" strokeWidth="5" strokeLinecap="round" fill="none" />
        </g>
        <g className="horse-leg horse-leg--front">
          <path d="M 18 12 C 24 26 25 41 26 55 C 28 65 31 73 37 81" stroke="#4b2513" strokeWidth="6" strokeLinecap="round" fill="none" />
          <path d="M 26 48 C 35 55 39 66 39 82" stroke="#5b2c16" strokeWidth="5" strokeLinecap="round" fill="none" />
        </g>
        <g className="horse-leg horse-leg--front-alt">
          <path d="M 36 8 C 42 21 49 34 58 46 C 63 55 66 66 66 81" stroke="#4b2513" strokeWidth="6" strokeLinecap="round" fill="none" />
          <path d="M 57 45 C 66 51 71 61 72 78" stroke="#5b2c16" strokeWidth="5" strokeLinecap="round" fill="none" />
        </g>
      </g>
    </g>
  );
}
