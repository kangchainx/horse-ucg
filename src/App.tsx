import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { HorseSvgScene } from "./components/HorseSvgScene";

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

function contributionsApiUrl(username: string): string {
  const baseOrigin = (import.meta.env.VITE_SHARE_IMAGE_ORIGIN || window.location.origin).replace(/\/$/, "");
  const url = new URL(`${baseOrigin}/api/contributions`);
  url.searchParams.set("user", username.toLowerCase());
  return url.toString();
}

function avatarUrl(username: string): string {
  return `https://github.com/${username}.png?size=128`;
}

function githubUserApiUrl(username: string): string {
  return `https://api.github.com/users/${username}`;
}

function extractOfficialGraphHtml(html: string): string {
  const document = new DOMParser().parseFromString(html, "text/html");
  const graphRoot = document.querySelector(".js-yearly-contributions .border.py-2.graph-before-activity-overview");
  return graphRoot?.outerHTML ?? "";
}

function particleStyle(index: number): CSSProperties {
  return { ["--particle-index" as string]: index };
}

function MiniHorseIcon() {
  return (
    <svg className="mini-horse-icon" viewBox="0 0 64 64" aria-hidden="true">
      <g transform="translate(64 0) scale(-1 1)">
        <path fill="currentColor" d="M 0 0 L 16 0 L 16 4 L 20 4 L 20 8 L 24 8 L 24 24 L 32 24 L 32 28 L 36 28 L 36 24 L 52 24 L 52 28 L 56 28 L 56 32 L 52 32 L 52 60 L 48 60 L 48 40 L 44 40 L 44 56 L 40 56 L 40 40 L 36 40 L 36 36 L 24 36 L 24 40 L 16 40 L 16 60 L 12 60 L 12 44 L 8 44 L 8 40 L 4 40 L 4 36 L 8 36 L 8 28 L 12 28 L 12 16 L 8 16 L 8 20 L 0 20 L 0 12 L 4 12 L 4 4 L 0 4 Z" />
      </g>
    </svg>
  );
}

function dynamicShareImageUrl(username: string, color: string): string {
  const baseOrigin = (import.meta.env.VITE_SHARE_IMAGE_ORIGIN || window.location.origin).replace(/\/$/, "");
  const url = new URL(`${baseOrigin}/api/share-card`);
  url.searchParams.set("user", username.toLowerCase());
  url.searchParams.set("color", color.replace("#", "").toLowerCase());
  return url.toString();
}

const HORSE_COLOR_OPTIONS = [
  { label: "Red", slug: "red", value: "#ef4444" },
  { label: "Orange", slug: "orange", value: "#f97316" },
  { label: "Gold", slug: "gold", value: "#f5d300" },
  { label: "Green", slug: "green", value: "#39d353" },
  { label: "Teal", slug: "teal", value: "#14b8a6" },
  { label: "Blue", slug: "blue", value: "#3b82f6" },
  { label: "Purple", slug: "purple", value: "#8b5cf6" },
  { label: "Pink", slug: "pink", value: "#ec4899" },
  { label: "White", slug: "white", value: "#f3f4f6" },
  { label: "Black", slug: "black", value: "#111827" },
];

function readInitialState() {
  const params = new URLSearchParams(window.location.search);
  const initialUser = params.get("user")?.trim().toLowerCase() ?? "";
  const initialColor = params.get("color")?.trim() ?? "";
  const normalizedColor = /^#?[0-9a-fA-F]{6}$/.test(initialColor)
    ? (initialColor.startsWith("#") ? initialColor : `#${initialColor}`).toLowerCase()
    : "#ef4444";

  return {
    initialUser,
    initialColor: normalizedColor,
  };
}

function App() {
  const [{ initialUser, initialColor }] = useState(readInitialState);
  const [inputValue, setInputValue] = useState(initialUser);
  const [activeUser, setActiveUser] = useState(initialUser);
  const [dataset, setDataset] = useState<ContributionDataset | null>(null);
  const [officialGraphHtml, setOfficialGraphHtml] = useState("");
  const [isPaused, setIsPaused] = useState(false);
  const [sceneKey, setSceneKey] = useState(0);
  const [isUserValid, setIsUserValid] = useState(false);
  const [isCheckingUser, setIsCheckingUser] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState("Copy");
  const [showCopyBurst, setShowCopyBurst] = useState(false);
  const [horseColor, setHorseColor] = useState(initialColor);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    const normalized = inputValue.trim().toLowerCase();
    if (!normalized) {
      setIsCheckingUser(false);
      setIsUserValid(false);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setIsCheckingUser(true);

      try {
        const response = await fetch(githubUserApiUrl(normalized), {
          signal: controller.signal,
          headers: {
            Accept: "application/vnd.github+json",
          },
        });

        if (!controller.signal.aborted) {
          setIsUserValid(response.ok);
        }
      } catch {
        if (!controller.signal.aborted) {
          setIsUserValid(false);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsCheckingUser(false);
        }
      }
    }, 350);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [inputValue]);

  useEffect(() => {
    if (!activeUser) {
      setDataset(null);
      setOfficialGraphHtml("");
      setLoadError("");
      return;
    }

    let cancelled = false;

    async function loadUser(username: string) {
      if (!cancelled) {
        setLoadError("");
      }

      try {
        const response = await fetch(contributionsApiUrl(username), { cache: "no-store" });

        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as { error?: string } | null;
          throw new Error(payload?.error || `Failed to load contribution data for ${username}`);
        }

        const payload = (await response.json()) as {
          dataset?: ContributionDataset;
          officialHtml?: string;
        };

        if (!payload.dataset) {
          throw new Error(`No contribution data returned for ${username}`);
        }

        if (!cancelled) {
          setDataset(payload.dataset);
          setOfficialGraphHtml(payload.officialHtml ? extractOfficialGraphHtml(payload.officialHtml) : "");
          setLoadError("");
        }
      } catch (error) {
        if (!cancelled) {
          setDataset(null);
          setOfficialGraphHtml("");
          setLoadError(error instanceof Error ? error.message : "Failed to load contributions");
        }
      } finally {
        // no-op: loading state is intentionally silent
      }
    }

    void loadUser(activeUser);
    return () => {
      cancelled = true;
    };
  }, [activeUser]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    if (activeUser) {
      params.set("user", activeUser);
      params.set("color", horseColor.replace("#", ""));
    } else {
      params.delete("user");
      params.delete("color");
    }

    const nextQuery = params.toString();
    const nextUrl = `${window.location.pathname}${nextQuery ? `?${nextQuery}` : ""}`;
    window.history.replaceState({}, "", nextUrl);
  }, [activeUser, horseColor]);

  const liveAvatar = useMemo(() => (inputValue.trim() ? avatarUrl(inputValue.trim()) : ""), [inputValue]);
  const validationStateClass = isUserValid ? "user-check user-check--valid" : "user-check";
  const normalizedHorseColor = horseColor.toLowerCase();
  const selectedHorseColor = HORSE_COLOR_OPTIONS.some((option) => option.value === normalizedHorseColor) ? normalizedHorseColor : "custom";

  const handleConfirm = () => {
    const normalized = inputValue.trim().toLowerCase();
    if (!normalized || isCheckingUser) {
      return;
    }

    setIsPaused(false);
    setSceneKey((current) => current + 1);
    setActiveUser(normalized);
  };

  const handleCopy = async () => {
    setShowCopyBurst(false);
    window.setTimeout(() => setShowCopyBurst(true), 0);
    window.setTimeout(() => setShowCopyBurst(false), 900);

    try {
      if (!dataset) {
        return;
      }

      const shareText = `![${dataset.login} Year of the Horse contribution graph](${dynamicShareImageUrl(dataset.login, normalizedHorseColor)})`;
      await navigator.clipboard.writeText(shareText);
      setCopyFeedback("Copied image");
      window.setTimeout(() => setCopyFeedback("Copy"), 1200);
    } catch {
      setCopyFeedback("Copy failed");
      window.setTimeout(() => setCopyFeedback("Copy"), 1200);
    }
  };

  return (
    <main className="app-shell app-shell--compact">
      <section className="topbar">
        <div className="user-picker">
          {liveAvatar ? (
            <img className="avatar-preview" src={liveAvatar} alt={`${inputValue} avatar`} />
          ) : (
            <div className="avatar-preview avatar-preview--empty" />
          )}
          <div className="user-input-wrap">
            <input
              className="user-input"
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              placeholder="Enter GitHub username"
            />
            <span className={validationStateClass} aria-hidden="true">
              {isCheckingUser ? (
                <svg viewBox="0 0 16 16" className="user-check__icon user-check__icon--spinner">
                  <circle cx="8" cy="8" r="5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeDasharray="10 8" />
                </svg>
              ) : (
                <svg viewBox="0 0 16 16" className="user-check__icon">
                  <path d="M3.5 8.5 6.5 11.5 12.5 4.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </span>
          </div>
          <button type="button" onClick={handleConfirm}>
            Load
          </button>
          <a
            className="github-link github-link--inline"
            href="https://github.com/kangchainx/horse-ucg"
            target="_blank"
            rel="noreferrer"
            aria-label="Open horse-ucg on GitHub"
          >
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <path
                fill="currentColor"
                d="M8 0C3.58 0 0 3.58 0 8a8 8 0 0 0 5.47 7.59c.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.5-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82A7.5 7.5 0 0 1 8 3.8c.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8 8 0 0 0 16 8c0-4.42-3.58-8-8-8Z"
              />
            </svg>
          </a>
        </div>
      </section>

      <p className={`status-banner ${loadError ? "status-banner--error" : "status-banner--idle"}`}>
        {loadError || "\u00A0"}
      </p>

      <section className="graph-stack">
        {officialGraphHtml ? (
          <section
            className="official-graph-solo"
            dangerouslySetInnerHTML={{ __html: officialGraphHtml }}
          />
        ) : (
          <section className="graph-skeleton graph-skeleton--official graph-skeleton--with-label">
              <div className="graph-skeleton__label-row">
                <p className="graph-skeleton__label">Enter a username to fetch the GitHub contribution graph.</p>
              </div>
          </section>
        )}

        <article className="graph-card">
          {dataset ? (
            <>
              <button type="button" className="graph-card__copy" onClick={handleCopy}>
                {copyFeedback}
              </button>
              {showCopyBurst ? (
                <div className="copy-burst" aria-hidden="true">
                  {Array.from({ length: 10 }, (_, index) => (
                    <span
                      key={index}
                      className="copy-burst__particle"
                      style={particleStyle(index)}
                    />
                  ))}
                </div>
              ) : null}
              <HorseSvgScene dataset={dataset} isPaused={isPaused} sceneKey={sceneKey} horseColor={horseColor} />
              <div className="graph-card__controls">
                <label className="color-picker" aria-label="Horse color">
                  <span className="color-picker__label">Horse color</span>
                  <select
                    className="color-picker__select"
                    value={selectedHorseColor}
                    onChange={(event) => {
                      const nextValue = event.target.value;
                      if (nextValue !== "custom") {
                        setHorseColor(nextValue);
                      }
                    }}
                  >
                    {HORSE_COLOR_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                    <option value="custom">Custom</option>
                  </select>
                  <input
                    className="color-picker__input"
                    type="color"
                    value={horseColor}
                    onChange={(event) => setHorseColor(event.target.value)}
                  />
                </label>
              </div>
            </>
          ) : (
            <section className="graph-skeleton graph-skeleton--custom graph-skeleton--with-label">
              <div className="graph-skeleton__label-row">
                <p className="graph-skeleton__label">Enter a username to generate your Year of the Horse contribution graph.</p>
                <MiniHorseIcon />
              </div>
            </section>
          )}
        </article>
      </section>

    </main>
  );
}

export default App;
