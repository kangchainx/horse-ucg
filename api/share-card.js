import { renderShareCard, normalizeHorseColor } from "../scripts/share-card-renderer.mjs";

function resolveToken() {
  return process.env.GITHUB_TOKEN || process.env.GH_TOKEN || process.env.GITHUB_ACCESS_TOKEN || null;
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
      "User-Agent": "horse-ucg-share-card",
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

export default async function handler(request, response) {
  const token = resolveToken();
  if (!token) {
    response.status(500).setHeader("Content-Type", "text/plain; charset=utf-8").send("Missing GitHub token");
    return;
  }

  const login = String(request.query.user || "").trim().toLowerCase();
  if (!login) {
    response.status(400).setHeader("Content-Type", "text/plain; charset=utf-8").send("Missing user query parameter");
    return;
  }

  try {
    const dataset = await fetchContributions(login, token);
    const svg = renderShareCard(dataset, normalizeHorseColor(request.query.color));
    response.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
    response.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=86400");
    response.status(200).send(svg);
  } catch (error) {
    response.status(500).setHeader("Content-Type", "text/plain; charset=utf-8").send(error instanceof Error ? error.message : "Failed to render share card");
  }
}
