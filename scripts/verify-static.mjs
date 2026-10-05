import {existsSync,readFileSync,readdirSync} from "node:fs";
import {resolve} from "node:path";
const directory=resolve("dist/pages");
const html=readFileSync(resolve(directory,"index.html"),"utf8");
const base=process.env.NEXT_PUBLIC_BASE_PATH || "";
const assets=[...html.matchAll(/(?:src|href)="([^"]+)"/g)].map(m=>m[1]).filter(p=>!p.startsWith("http"));
for(const url of assets){
 const relative=url.startsWith(base+"/")?url.slice(base.length+1):url.replace(/^\.\//,"");
 if(!existsSync(resolve(directory,relative)))throw Error(`Missing static asset: ${url}`);
}
for(const file of ["brandmark.svg","favicon.svg","neighborhood.webp",".nojekyll"]){
 if(!existsSync(resolve(directory,file)))throw Error(`Missing product asset: ${file}`);
}
const chunks=readdirSync(resolve(directory,"assets")).filter(f=>f.endsWith(".js")).map(f=>readFileSync(resolve(directory,"assets",f),"utf8")).join("\n");
if(!chunks.includes("Make every drop count.")||!chunks.includes("TANK SIZING INSIGHT")||!chunks.includes("HydroLens AI")||!chunks.includes("Llama-3.2-1B-Instruct-q4f16_1-MLC"))throw Error("Product or AI model code missing from deployment.");
if(!chunks.includes(`${base}/`))throw Error("Deployment base path is missing.");
console.log(`Static entrypoint and ${assets.length} linked assets verified for ${base || "/"}.`);
