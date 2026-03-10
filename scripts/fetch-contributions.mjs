import { execSync } from "node:child_process";
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..");
const outputDir = join(rootDir, "public", "data");

const username = process.argv[2] || process.env.TARGET_GITHUB_USER || "kangchainx";

function resolveToken() {
  const envToken =
    process.env.GITHUB_TOKEN ||
    process.env.GH_TOKEN ||
    process.env.GITHUB_ACCESS_TOKEN;

  if (envToken) {
    return envToken;
  }

  try {
    return execSync("gh auth token", { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return null;
  }
}

async function fetchContributions(login, token) {
  const query = `
    query($login: String!) {
      user(login: $login) {
        login
        contributionsCollection {
          contributionCalendar {
            totalContributions
            weeks {
              firstDay
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

async function main() {
  const token = resolveToken();
  if (!token) {
    const fallbackPath = join(outputDir, `${username}-contributions.json`);
    if (existsSync(fallbackPath)) {
      console.warn(`No GitHub token available. Reusing existing ${fallbackPath}`);
      return;
    }

    throw new Error(
      "Missing GitHub token. Set GITHUB_TOKEN/GH_TOKEN or login with `gh auth login` before building.",
    );
  }

  const data = await fetchContributions(username, token);
  mkdirSync(outputDir, { recursive: true });
  const outputPath = join(outputDir, `${username}-contributions.json`);
  writeFileSync(outputPath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  console.log(`Wrote ${outputPath}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
