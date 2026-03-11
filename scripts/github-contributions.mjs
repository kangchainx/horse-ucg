import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..");
let hasLoadedLocalEnv = false;

function loadLocalEnvFile(filename) {
  const filePath = join(rootDir, filename);
  if (!existsSync(filePath)) {
    return;
  }

  const source = readFileSync(filePath, "utf8");
  for (const rawLine of source.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const equalIndex = line.indexOf("=");
    if (equalIndex <= 0) {
      continue;
    }

    const key = line.slice(0, equalIndex).trim();
    let value = line.slice(equalIndex + 1).trim();

    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

function loadLocalEnv() {
  if (hasLoadedLocalEnv) {
    return;
  }

  loadLocalEnvFile(".env");
  loadLocalEnvFile(".env.local");
  hasLoadedLocalEnv = true;
}

export function resolveToken() {
  loadLocalEnv();

  const envToken =
    process.env.GITHUB_TOKEN ||
    process.env.GH_TOKEN ||
    process.env.GITHUB_ACCESS_TOKEN;

  if (envToken) {
    return envToken;
  }

  try {
    return execSync("gh auth token", {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return null;
  }
}

export async function fetchContributions(login, token) {
  const query = `
    query($login: String!) {
      user(login: $login) {
        login
        contributionsCollection {
          contributionCalendar {
            totalContributions
            weeks {
              contributionDays {
                contributionCount
                date
                color
                weekday
              }
            }
          }
        }
      }
    }
  `;

  const response = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "User-Agent": "horse-ucg",
    },
    body: JSON.stringify({
      query,
      variables: { login },
    }),
  });

  if (!response.ok) {
    throw new Error(`GitHub GraphQL request failed: ${response.status} ${response.statusText}`);
  }

  const payload = await response.json();
  if (payload.errors?.length) {
    throw new Error(payload.errors.map((error) => error.message).join("; "));
  }

  const user = payload.data?.user;
  if (!user?.contributionsCollection?.contributionCalendar) {
    throw new Error(`No contribution calendar returned for ${login}`);
  }

  const calendar = user.contributionsCollection.contributionCalendar;
  const days = calendar.weeks.flatMap((week) => week.contributionDays);

  return {
    login: user.login,
    totalContributions: calendar.totalContributions,
    startedAt: days[0]?.date ?? null,
    endedAt: days[days.length - 1]?.date ?? null,
    generatedAt: new Date().toISOString(),
    days,
  };
}

export async function fetchOfficialContributionHtml(login) {
  const response = await fetch(`https://github.com/users/${login}/contributions`, {
    headers: {
      "User-Agent": "horse-ucg",
    },
  });

  if (!response.ok) {
    throw new Error(`GitHub contributions page request failed: ${response.status} ${response.statusText}`);
  }

  return response.text();
}
