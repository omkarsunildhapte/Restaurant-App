#!/usr/bin/env node
/* Builds the marketing website (the platform's own site, for restaurant owners).

     node build.mjs              -> site.json -> dist/

   No dependencies. Not to be confused with templates/, which builds each restaurant's
   own website. */
import { readFileSync, writeFileSync, mkdirSync, cpSync, rmSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { page } from "./src/layout.mjs";
import home from "./src/pages/home.mjs";
import features from "./src/pages/features.mjs";
import pricing from "./src/pages/pricing.mjs";
import demo from "./src/pages/demo.mjs";
import contact from "./src/pages/contact.mjs";
import about from "./src/pages/about.mjs";
import { privacy, terms, refund, notFound } from "./src/pages/legal.mjs";

const ROOT = dirname(fileURLToPath(import.meta.url));
const OUT = join(ROOT, "dist");
const site = JSON.parse(readFileSync(join(ROOT, "site.json"), "utf8"));

// ---- Checks: stop on data that would publish a broken page ----
const errors = [];
for (const key of ["name", "product", "company", "tagline"]) if (!site.brand?.[key]) errors.push(`brand.${key} is required`);
if (!/^https?:\/\//.test(site.demoApiUrl || "")) errors.push("demoApiUrl must be the full URL of /api/v1/public/demo-requests");
if (!/^https?:\/\//.test(site.businessPanelUrl || "")) errors.push("businessPanelUrl must be the Business panel's address (where owners sign in)");
if (site.url && !/^https:\/\//.test(site.url)) errors.push("url must start with https:// (or be empty until the domain is chosen)");
for (const plan of site.pricing?.plans ?? []) {
  if (!plan.id || !plan.name || !(plan.price > 0)) errors.push(`pricing.plans: each plan needs id, name and a price (${JSON.stringify(plan.name)})`);
  if (plan.foundingPrice && plan.foundingPrice >= plan.price) errors.push(`pricing.plans.${plan.id}: foundingPrice must be lower than price`);
}
if (site.contact?.whatsapp && !/^\d{12}$/.test(site.contact.whatsapp)) errors.push("contact.whatsapp must be 12 digits with country code, e.g. 919822012345");
if (errors.length) {
  console.error("site.json has problems:\n- " + errors.join("\n- "));
  process.exit(1);
}

// ---- Pages ----
const pages = [home, features, pricing, demo, contact, about, privacy, terms, refund, notFound].map((p) => p(site));

// Empty dist/ rather than deleting it: on Windows a preview server running inside it locks the folder.
mkdirSync(OUT, { recursive: true });
for (const entry of readdirSync(OUT)) rmSync(join(OUT, entry), { recursive: true, force: true });
// Content-hash the stylesheet and script links so a browser never keeps last week's copy after a deploy.
const version = (file) => createHash("sha256").update(readFileSync(join(ROOT, file))).digest("hex").slice(0, 10);
const busted = { "css/style.css": version("css/style.css"), "js/main.js": version("js/main.js") };
const withVersions = (html) => html.replace(/(href|src)="(css\/style\.css|js\/main\.js)"/g, (_, attr, file) => `${attr}="${file}?v=${busted[file]}"`);
for (const p of pages) writeFileSync(join(OUT, p.file), withVersions(String(page(site, p))));
for (const dir of ["css", "js", "assets"]) cpSync(join(ROOT, dir), join(OUT, dir), { recursive: true });

// Search engines: list every indexable page once the real domain is set.
if (site.url) {
  const base = site.url.replace(/\/$/, "") + "/";
  const urls = pages.filter((p) => !p.noindex).map((p) => base + (p.file === "index.html" ? "" : p.file));
  writeFileSync(join(OUT, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${u}</loc></url>`).join("\n")}\n</urlset>\n`);
  writeFileSync(join(OUT, "robots.txt"), `User-agent: *\nAllow: /\nSitemap: ${base}sitemap.xml\n`);
} else {
  // No domain yet: keep preview deployments out of search results.
  writeFileSync(join(OUT, "robots.txt"), "User-agent: *\nDisallow: /\n");
}

console.log(`Built ${pages.length} pages into ${OUT}`);
