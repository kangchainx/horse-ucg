import {
  fetchContributions,
  fetchOfficialContributionHtml,
  resolveToken,
} from "../scripts/github-contributions.mjs";

export default async function handler(request, response) {
  const token = resolveToken();
  if (!token) {
    response.status(500).json({ error: "Missing GitHub token" });
    return;
  }

  const login = String(request.query.user || "").trim().toLowerCase();
  if (!login) {
    response.status(400).json({ error: "Missing user query parameter" });
    return;
  }

  try {
    const [dataset, officialHtml] = await Promise.all([
      fetchContributions(login, token),
      fetchOfficialContributionHtml(login),
    ]);

    response.setHeader("Cache-Control", "s-maxage=1800, stale-while-revalidate=86400");
    response.status(200).json({
      dataset,
      officialHtml,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load contributions";
    const isMissingUser =
      /404\b/.test(message) ||
      /Could not resolve to a User/i.test(message) ||
      /not found/i.test(message);

    response.status(500).json({
      error: isMissingUser
        ? `GitHub user "${login}" was not found.`
        : "Failed to load GitHub contributions right now. Please try again.",
    });
  }
}
