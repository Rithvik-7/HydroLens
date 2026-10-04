import {defineConfig} from "vite";
import {fileURLToPath} from "node:url";

const basePath=process.env.NEXT_PUBLIC_BASE_PATH || "";
export default defineConfig({
 base:`${basePath}/`,
 resolve:{alias:{"@":fileURLToPath(new URL(".",import.meta.url))}},
 define:{"process.env.NEXT_PUBLIC_BASE_PATH":JSON.stringify(basePath)},
 build:{outDir:"dist/pages",emptyOutDir:true,rollupOptions:{input:"index.html"}},
});
