# PS3 Digital Legacy

PS3 digital-only games and DLC that will become unobtainable after the PlayStation Store shuts down.

A fan project, not affiliated with Sony. The site sells nothing; it only shows what can still be bought.

## Stack

SvelteKit (static adapter) · TypeScript (strict) · Paraglide JS (en, pl) · Firebase (planned) · GitHub Pages.

## Getting started

Requires Node.js 22 or newer (`.nvmrc` pins the CI version).

```bash
npm install
npm run dev
```

| Command           | What it does                        |
| ----------------- | ----------------------------------- |
| `npm run dev`     | Start the dev server                |
| `npm run build`   | Build the static site into `build/` |
| `npm run preview` | Serve the production build locally  |
| `npm run check`   | Type-check Svelte and TypeScript    |
| `npm run lint`    | Prettier check and ESLint           |
| `npm run format`  | Format everything with Prettier     |
| `npm test`        | Run unit tests (Vitest)             |

To test the Pages base path locally: `BASE_PATH=/PS3DigitalLegacy npm run build && npm run preview`.

## Project layout

```text
data/       Source catalog (ps3-digital.json), generated, not shipped as-is
design/     Backup of the design canvas (reference only)
messages/   i18n catalogs (en.json is the source, pl.json)
scripts/    Build-time and data tooling
src/lib/    Application code (import via #lib/...)
src/routes/ SvelteKit routes
static/     Files served as-is
```

## Deployment

A push to `main` runs lint, type-check, tests and build, then publishes `build/` to GitHub Pages
(`.github/workflows/deploy.yml`). In the repository settings set Pages source to "GitHub Actions".

## License

MIT, see [LICENSE](LICENSE).
