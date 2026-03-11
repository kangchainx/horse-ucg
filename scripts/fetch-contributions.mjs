import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  fetchContributions,
  fetchOfficialContributionHtml,
  resolveToken,
} from "./github-contributions.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..");
const outputDir = join(rootDir, "public", "data");

const username = process.argv[2] || process.env.TARGET_GITHUB_USER || "kangchainx";

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
  const officialHtml = await fetchOfficialContributionHtml(username);
  mkdirSync(outputDir, { recursive: true });
  const jsonOutputPath = join(outputDir, `${username}-contributions.json`);
  const htmlOutputPath = join(outputDir, `${username}-official-contributions.html`);
  writeFileSync(jsonOutputPath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  writeFileSync(htmlOutputPath, officialHtml, "utf8");
  console.log(`Wrote ${jsonOutputPath}`);
  console.log(`Wrote ${htmlOutputPath}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
