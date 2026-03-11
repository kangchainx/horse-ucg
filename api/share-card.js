import { renderShareCard, normalizeHorseColor } from "../scripts/share-card-renderer.mjs";
import { fetchContributions, resolveToken } from "../scripts/github-contributions.mjs";

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
