import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const clientDir = fileURLToPath(new URL("../dist/client/", import.meta.url));
const outputDir = fileURLToPath(new URL("../netlify-dist/", import.meta.url));
const siteUrl = process.env.SITE_URL || "https://comfix-computer-lab-demo.netlify.app";
const { default: worker } = await import(new URL("../dist/server/index.js", import.meta.url));

const routes = ["/", "/repairs", "/new-computers", "/refurbished", "/accessories", "/contact"];

await rm(outputDir, { recursive: true, force: true });
await cp(clientDir, outputDir, { recursive: true });

for (const route of routes) {
  const url = new URL(route, siteUrl);
  const response = await worker.fetch(
    new Request(url, {
      headers: {
        accept: "text/html",
        "x-forwarded-host": url.host,
        "x-forwarded-proto": url.protocol.slice(0, -1),
      },
    }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );

  if (!response.ok) throw new Error(`Failed to render ${route}: ${response.status}`);

  const routeDir = route === "/" ? outputDir : `${outputDir}${route}`;
  await mkdir(routeDir, { recursive: true });
  await writeFile(`${routeDir}/index.html`, await response.text());
}

await writeFile(`${outputDir}/_redirects`, "/index.html /index.html 200\n");
console.log(`Static Netlify build created at ${outputDir.replace(projectRoot, "")}`);
