<p align="center"><img src="public/brandmark.svg" width="88" alt="HydroLens roof and lens logo"></p>

# HydroLens
### AI water advisor for rooftop rainwater planning

A practical rainwater harvesting feasibility and awareness tool for **PS 53**. Define a roof, explore rainfall, compare storage, and take a clear water plan away.

**[Open the live website on Render](https://hydrolens-water-planner.onrender.com/)** · [GitHub Pages backup](https://rithvik-7.github.io/HydroLens/) · **[90-second demo guide](docs/DEMO.md)** · **[Model and assumptions](docs/MODEL.md)**

## What works

- **Roof workspace:** local image upload, manual boundary editing, measured area input, zoom controls, keyboard and tap alternatives, and rejection of crossing outlines.
- **Water balance:** dimensionally correct collection estimates and a 365-day storage simulation separating collection, supply, overflow and unmet demand.
- **Storage insight:** 29 capacity simulations with a transparent recommendation targeting 95% of the best supply in the tested range.
- **Rainfall explorer:** three labeled synthetic location profiles, twelve editable monthly values, rainfall/harvest charts, and a monthly calculation table.
- **Scenario portability:** automatic device-local saving, validated JSON import/export, and a downloadable printable report.
- **Google Gemini AI advisor:** API-powered questions and answers grounded in the current plan. No model download. A Node.js server on Render keeps the API key private and recomputes the scenario before calling Gemini.
- **Accessible glass interface:** responsive layouts, visible focus, labeled range controls, reduced-motion support, and mobile bottom navigation.

**Data honesty:** the neighborhood image is AI-generated, roof boundaries are manual, and sample rainfall/storm timing are synthetic. The AI advisor is a general language model grounded with the current plan; it does not detect roofs, fetch live weather or replace the deterministic water-balance calculation. [Model details](docs/MODEL.md).

Chat and numeric plan inputs are sent through the backend to Google Gemini. Roof images stay in your browser. AI availability depends on provider quota; a free Render server may take a minute to wake after inactivity.

## Run locally

Use Node.js **24** and npm.

```bash
npm ci
npm run dev
```

The existing Vinext development server prints its local address. For the GitHub Pages build:

```bash
npm run build:pages
npm run preview:pages
```

The browser build uses the same `app/page.tsx` and planning components as the original Worker build. Hash-based sections work without server rewrites.

## Validate

```bash
npm run typecheck
npm test
npm run build:pages
node scripts/verify-static.mjs
```

Ten tests check water conservation, unit conversion, dry scenarios, storage monotonicity, recommendation minimality, scenario round trips and rejection of malformed inputs and roof outlines.

## Deploy on GitHub Pages

The repository includes [a GitHub Actions workflow](.github/workflows/pages.yml) that installs the lockfile, runs type checks/tests, builds, validates assets, and deploys to Pages.

1. Enable **Settings → Pages → Source → GitHub Actions**.
2. Push to `main`, or run **Validate and deploy HydroLens** under Actions.
3. The workflow sets `NEXT_PUBLIC_BASE_PATH` to the repository name so scripts, styles, logo and imagery load under the Pages URL.

GitHub Pages deployment needs no deployment secret, API key, or database.

## Deploy on Render

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/Rithvik-7/HydroLens)

The repository includes [`render.yaml`](render.yaml), which configures a free Render Static Site, builds the root-hosted app, and publishes `dist/pages/`. Sign in to Render, choose **Deploy to Render**, and authorize the GitHub repository when asked. Later pushes to `main` deploy automatically. No API key or database is used by the app.

## Deploy elsewhere

`npm run build:pages` with no base-path environment variable produces a root-hosted static website in **`dist/pages/`**. Upload that directory to any static host. Serve it over HTTP; opening the HTML directly with `file://` is not supported for JavaScript modules.

For a subdirectory host, set `NEXT_PUBLIC_BASE_PATH` before building (for example, `/HydroLens`). On PowerShell:

```powershell
$env:NEXT_PUBLIC_BASE_PATH = '/HydroLens'
npm run build:pages
```

The original server target remains available through `npm run build` for Sites/Cloudflare-compatible hosting. It is separate from the GitHub Pages target.

## Architecture

```text
React interface
  ├── Roof + rainfall + demand assumptions
  ├── Pure TypeScript water-balance engine (lib/hydrology.ts)
  ├── Capacity search and comparison
  ├── Validated device-local scenario storage (lib/scenario.ts)
  └── HTML report + JSON portability

GitHub Actions → type check → model tests → Vite browser build → GitHub Pages
```

- UI: React 19, TypeScript, Tailwind 4, Radix/shadcn primitives, Lucide.
- Browser deployment: Vite 8, shared React entry, GitHub Pages.
- Retained server target: Vinext and Cloudflare Worker integration.
- Storage: browser localStorage for numeric scenarios; uploaded images remain in memory.
- Asset: fictional neighborhood illustration, encoded as WebP for a smaller download.
- Brand: original roof-and-lens SVG mark.

## Submission

Follow the [90-second demo guide](docs/DEMO.md). Show changes to measured area, rainfall and capacity, then explain why collected water differs from usable water. Keep the [model assumptions](docs/MODEL.md) visible.

## Privacy and resilience

Planning calculations run on the device. Images are not uploaded to a server, stored in localStorage, or included in scenario exports. If local saving is unavailable, export JSON to keep your assumptions. Device-local storage is not cloud synchronization. Exported reports disclose data limitations.

## Next research stage

Supervised roof segmentation, geospatial calibration, and forecast-based scenarios require licensed imagery, ground truth, suitable datasets, and evaluation on unseen data. These are future extensions and are not presented as implemented capabilities.

## Gemini server deployment

The Render Blueprint deploys the static planner and a free Node.js API service. Set `GEMINI_API_KEY` in the API service environment when syncing the Blueprint. Never put this secret in a public build variable or Git. `npm run start:api` starts the API locally on port 3001. Configure `NEXT_PUBLIC_ADVISOR_API_URL` at frontend build time if your backend URL differs from the default. `ALLOWED_ORIGINS` is an optional comma-separated origin allowlist. `/health` reports readiness; `/api/chat` accepts validated scenario inputs and conversation history. Requests have body/history limits, bounded concurrency, rate limits and a provider timeout.
