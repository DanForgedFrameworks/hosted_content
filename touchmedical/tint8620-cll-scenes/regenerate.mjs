// Regenerates the seven scene builds from the master. Run from the project root:
//   node visme/regenerate.mjs
// Each output differs from the master only by window.CLL_SCENE and two relative paths.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
const MASTER = "CLL Decision Making Scenes v5.dc.html";
const SLUGS = ["00-title", "01-considerations", "02-consider", "03-1l-options", "04-algorithm", "05-subsequent", "06-references"];
const src = readFileSync(MASTER, "utf8");
const need = ['<script src="./support.js"></script>', 'href="./lilly/styles.css"'];
for (const n of need) if (!src.includes(n)) throw new Error("master no longer contains " + n);
SLUGS.forEach((slug, i) => {
  const out = src
    .replace(need[0], '<script>window.CLL_SCENE = ' + i + ';</script>\n<script src="../support.js"></script>')
    .replace(need[1], 'href="../lilly/styles.css"');
  mkdirSync("visme/" + slug, { recursive: true });
  writeFileSync("visme/" + slug + "/index.html", out);
  console.log("wrote visme/" + slug + "/index.html");
});
console.log("Copy support.js and lilly/ from the project root into visme/ if either has changed.");
