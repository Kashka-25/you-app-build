import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

// Writes precache.json: every file a build makes, plus the public images
// and icons, so the service worker (public/sw.js) can keep them all and
// YOU opens with no signal, on any screen (Oct 25).
function precacheList() {
  const MAX_BYTES = 1.5 * 1024 * 1024; // leave out anything very large
  const SKIP = new Set(["sw.js", "precache.json"]);
  function walk(dir, root, out = []) {
    for (const name of readdirSync(dir)) {
      const full = join(dir, name);
      const st = statSync(full);
      if (st.isDirectory()) walk(full, root, out);
      else if (st.size <= MAX_BYTES && !SKIP.has(name) && !name.startsWith(".")) out.push("/" + relative(root, full).split(sep).join("/"));
    }
    return out;
  }
  let publicDir;
  return {
    name: "you-precache-list",
    apply: "build",
    configResolved(config) { publicDir = config.publicDir; },
    generateBundle(_, bundle) {
      const files = ["/", ...Object.keys(bundle).map(f => "/" + f), ...(publicDir ? walk(publicDir, publicDir) : [])];
      this.emitFile({ type: "asset", fileName: "precache.json", source: JSON.stringify([...new Set(files)]) });
    }
  };
}

export default defineConfig({
  plugins: [react(), precacheList()],
  server: { port: 5173 }
});
