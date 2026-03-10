import { useEffect, useEffectEvent, useRef, useState } from "react";

const DAYS = 365;
const TOTAL_WIDTH = 1000;
const TOTAL_HEIGHT = 350;
const STRIP_X = 50;
const STRIP_WIDTH = 900;
const DAY_WIDTH = STRIP_WIDTH / DAYS;
const STRIP_HEIGHT = 16;
const BASE_Y = 240;
const STRIP_Y = 245;
const COLORS = ["#161b22", "#0e4429", "#006d32", "#26a641", "#39d353"];
const HORSE_ASSET_URL = `${import.meta.env.BASE_URL}horse-face-light-svgrepo-com-empty-moss-right.svg`;

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
  decay: number;
}

interface HorseState {
  x: number;
  y: number;
  baseSpeed: number;
  vx: number;
  runCycle: number;
  size: number;
}

function generateData(): number[] {
  const data: number[] = [];
  let currentTrend = 0;

  for (let index = 0; index < DAYS; index += 1) {
    if (Math.random() < 0.1) {
      currentTrend = Math.floor(Math.random() * 4);
    }

    if (Math.random() < 0.05) {
      currentTrend = Math.floor(Math.random() * 15) + 8;
    }

    const commits = Math.max(0, currentTrend + Math.floor(Math.random() * 3) - 1);
    data.push(commits);
  }

  return data;
}

function getColorIndex(commits: number): number {
  if (commits > 15) {
    return 4;
  }

  if (commits > 8) {
    return 3;
  }

  if (commits > 3) {
    return 2;
  }

  if (commits > 0) {
    return 1;
  }

  return 0;
}

export function HorseCanvasScene() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const particleRef = useRef<Particle[]>([]);
  const dataRef = useRef<number[]>(generateData());
  const spriteRef = useRef<HTMLImageElement | null>(null);
  const pausedRef = useRef(false);
  const horseRef = useRef<HorseState>({
    x: STRIP_X,
    y: BASE_Y,
    baseSpeed: 1.5,
    vx: 1.5,
    runCycle: 0,
    size: 60,
  });
  const [isPaused, setIsPaused] = useState(false);

  const resetSimulation = useEffectEvent((regenData = true) => {
    if (regenData) {
      dataRef.current = generateData();
    }

    const horse = horseRef.current;
    horse.x = STRIP_X;
    horse.y = BASE_Y;
    horse.vx = horse.baseSpeed;
    horse.runCycle = 0;
    particleRef.current = [];
  });

  const getCurrentCommits = useEffectEvent((x: number) => {
    if (x < STRIP_X || x >= STRIP_X + STRIP_WIDTH) {
      return 0;
    }

    const index = Math.floor((x - STRIP_X) / DAY_WIDTH);
    return dataRef.current[index] ?? 0;
  });

  const drawHeatmapStrip = useEffectEvent((ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = "#0d1117";
    ctx.fillRect(0, 0, TOTAL_WIDTH, TOTAL_HEIGHT);

    const gradient = ctx.createLinearGradient(0, 0, 0, TOTAL_HEIGHT);
    gradient.addColorStop(0, "#161b22");
    gradient.addColorStop(1, "#0d1117");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, TOTAL_WIDTH, TOTAL_HEIGHT);

    ctx.strokeStyle = "#30363d";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, BASE_Y);
    ctx.lineTo(TOTAL_WIDTH, BASE_Y);
    ctx.stroke();

    ctx.strokeStyle = "#30363d";
    ctx.lineWidth = 1;
    ctx.strokeRect(STRIP_X - 1, STRIP_Y - 1, STRIP_WIDTH + 2, STRIP_HEIGHT + 2);

    dataRef.current.forEach((commits, index) => {
      const x = STRIP_X + index * DAY_WIDTH;
      const colorIndex = getColorIndex(commits);

      ctx.fillStyle = COLORS[colorIndex];
      ctx.fillRect(x, STRIP_Y, DAY_WIDTH, STRIP_HEIGHT);

      if (index > 0) {
        ctx.beginPath();
        ctx.strokeStyle = "#0d1117";
        ctx.lineWidth = 0.5;
        ctx.moveTo(x, STRIP_Y);
        ctx.lineTo(x, STRIP_Y + STRIP_HEIGHT);
        ctx.stroke();
      }
    });

    ctx.fillStyle = "#8b949e";
    ctx.font = '600 12px "Segoe UI", sans-serif';
    ctx.fillText("Jan", STRIP_X, STRIP_Y + 40);
    ctx.fillText("Jun", STRIP_X + STRIP_WIDTH * 0.42, STRIP_Y + 40);
    ctx.fillText("Dec", STRIP_X + STRIP_WIDTH - 24, STRIP_Y + 40);
  });

  const drawParticles = useEffectEvent((ctx: CanvasRenderingContext2D) => {
    const particles = particleRef.current;

    for (let index = particles.length - 1; index >= 0; index -= 1) {
      const particle = particles[index];
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();

      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.life -= particle.decay;

      if (particle.life <= 0) {
        particles.splice(index, 1);
      }
    }
  });

  const drawHorse = useEffectEvent((ctx: CanvasRenderingContext2D) => {
    const horse = horseRef.current;
    const sprite = spriteRef.current;

    if (!sprite) {
      return;
    }

    ctx.save();
    ctx.imageSmoothingEnabled = true;

    const bounceY = Math.abs(Math.sin(horse.runCycle)) * -12;
    const pitch = Math.sin(horse.runCycle) * 0.08;

    ctx.translate(horse.x, horse.y + bounceY);
    ctx.rotate(pitch);

    const width = horse.size * 1.26;
    const height = horse.size * 1.26;
    ctx.drawImage(sprite, -width / 2 + 12, -height + 14, width, height);

    ctx.restore();
  });

  const updateFrame = useEffectEvent(() => {
    if (pausedRef.current) {
      return;
    }

    const horse = horseRef.current;
    const commitsUnderFoot = getCurrentCommits(horse.x);

    if (commitsUnderFoot > 8) {
      horse.vx = horse.baseSpeed + 2;

      if (Math.random() < 0.3) {
        particleRef.current.push({
          x: horse.x - 20,
          y: horse.y - 5,
          vx: -Math.random() * 2 - 1,
          vy: -Math.random() * 2,
          size: Math.random() * 3 + 1,
          color: `rgba(245, 211, 0, ${Math.random() * 0.5 + 0.5})`,
          life: 1,
          decay: 0.05,
        });
      }
    } else {
      horse.vx = horse.baseSpeed;

      if (Math.random() < 0.2) {
        particleRef.current.push({
          x: horse.x - 15,
          y: horse.y,
          vx: -Math.random() * 1.5,
          vy: -Math.random() * 0.5,
          size: Math.random() * 2 + 1,
          color: `rgba(139, 148, 158, ${Math.random() * 0.4})`,
          life: 1,
          decay: 0.03,
        });
      }
    }

    horse.x += horse.vx;
    horse.runCycle += 0.3 * (horse.vx / horse.baseSpeed);

    if (horse.x > STRIP_X + STRIP_WIDTH + 60) {
      resetSimulation(false);
    }
  });

  const loop = useEffectEvent(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");

    if (!canvas || !ctx) {
      return;
    }

    updateFrame();
    drawHeatmapStrip(ctx);
    drawParticles(ctx);
    drawHorse(ctx);

    animationFrameRef.current = window.requestAnimationFrame(loop);
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const pixelRatio = window.devicePixelRatio || 1;
    canvas.width = TOTAL_WIDTH * pixelRatio;
    canvas.height = TOTAL_HEIGHT * pixelRatio;
    canvas.style.width = `${TOTAL_WIDTH}px`;
    canvas.style.height = `${TOTAL_HEIGHT}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }

    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    const sprite = new Image();
    sprite.decoding = "async";
    sprite.src = HORSE_ASSET_URL;
    sprite.onload = () => {
      spriteRef.current = sprite;
      resetSimulation(true);
      animationFrameRef.current = window.requestAnimationFrame(loop);
    };

    return () => {
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }

      sprite.onload = null;
    };
  }, [loop, resetSimulation]);

  const handleReset = () => {
    resetSimulation(true);
  };

  const handleTogglePause = () => {
    setIsPaused((current) => {
      const next = !current;
      pausedRef.current = next;
      return next;
    });
  };

  return (
    <section className="prototype-card">
      <div className="viewport">
        <canvas ref={canvasRef} id="graphCanvas" />
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
