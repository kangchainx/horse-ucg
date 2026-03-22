# Horse UCG

A React + TypeScript prototype for a GitHub contribution animation in the spirit of `Platane/snk`, redesigned for 2026 as a horse galloping across weekly contribution peaks.

## Stack

- React
- TypeScript
- Vite
- Native SVG motion with `animateMotion`

## Local development

```bash
cp .env.example .env
npm install
npm run dev
```

## Production build

```bash
npm run build
```

## Vercel deployment

This project is intended to be deployed as a single Vercel app:

- the frontend is served by Vite
- the dynamic share image is served by `api/share-card.js`

### Required environment variables

- `GITHUB_TOKEN`
  - a GitHub token that can call the GraphQL API
  - used by the build step and the dynamic share card endpoint

### Recommended Vercel settings

- Framework Preset: `Vite`
- Build Command: `npm run build`
- Output Directory: `dist`

If you deploy the frontend and API from the same Vercel project, no extra frontend env vars are required.

### Optional base path override

By default the app uses `/` as the Vite base path, which is correct for Vercel.

If you ever need to deploy under a subpath, set:

- `VITE_BASE_PATH`