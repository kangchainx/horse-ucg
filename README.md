# Horse UCG

A React + TypeScript prototype for a GitHub contribution animation in the spirit of `Platane/snk`, redesigned for 2026 as a horse galloping across weekly contribution peaks.

## Stack

- React
- TypeScript
- Vite
- Native SVG motion with `animateMotion`

## Local development

```bash
npm install
npm run dev
```

## Production build

```bash
npm run build
```

## GitHub Pages

The project is configured with `base: "/horse-ucg/"` in `vite.config.ts`, which matches a repository named `horse-ucg`.

Deploy the built site with:

```bash
npm run deploy
```

If your repository name changes, update the `base` field in `vite.config.ts`.
