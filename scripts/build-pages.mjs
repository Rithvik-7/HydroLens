import { build } from "vite";
import { existsSync, writeFileSync } from "node:fs";

// The browser-only planner is the same React product used by the Worker build.
// A dedicated static entry avoids requiring RSC endpoints on GitHub Pages.
await build({ configFile: "vite.pages.config.ts" });
if (!existsSync("dist/pages/index.html")) throw new Error("Missing static entrypoint.");
writeFileSync("dist/pages/.nojekyll", "");
console.log("Deployable static website: dist/pages");
