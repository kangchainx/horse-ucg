import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import {
  fetchContributions,
  fetchOfficialContributionHtml,
  resolveToken,
} from "./scripts/github-contributions.mjs";
import {
  normalizeHorseColor,
  renderShareCard,
} from "./scripts/share-card-renderer.mjs";

function localApiPlugin(): Plugin {
  return {
    name: "local-api-plugin",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const requestUrl = (req as { url?: string }).url;

        if (!requestUrl?.startsWith("/api/")) {
          next();
          return;
        }

        const url = new URL(requestUrl, "http://localhost");
        const token = resolveToken();

        if (!token) {
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json; charset=utf-8");
          res.end(JSON.stringify({ error: "Missing GitHub token" }));
          return;
        }

        const login = url.searchParams.get("user")?.trim().toLowerCase();
        if (!login) {
          res.statusCode = 400;
          res.setHeader("Content-Type", "application/json; charset=utf-8");
          res.end(JSON.stringify({ error: "Missing user query parameter" }));
          return;
        }

        try {
          if (url.pathname === "/api/contributions") {
            const [dataset, officialHtml] = await Promise.all([
              fetchContributions(login, token),
              fetchOfficialContributionHtml(login),
            ]);

            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json; charset=utf-8");
            res.end(JSON.stringify({ dataset, officialHtml }));
            return;
          }

          if (url.pathname === "/api/share-card") {
            const dataset = await fetchContributions(login, token);
            const svg = renderShareCard(dataset, normalizeHorseColor(url.searchParams.get("color")));

            res.statusCode = 200;
            res.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
            res.end(svg);
            return;
          }
        } catch (error) {
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json; charset=utf-8");
          res.end(JSON.stringify({ error: error instanceof Error ? error.message : "Failed to load API response" }));
          return;
        }

        next();
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");

  return {
    plugins: [react(), localApiPlugin()],
    base: env.VITE_BASE_PATH || "/",
  };
});
