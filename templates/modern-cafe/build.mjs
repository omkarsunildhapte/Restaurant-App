#!/usr/bin/env node
/* Builds one restaurant's website from this template.

     node build.mjs                                  -> restaurant.json  -> dist/
     node build.mjs restaurants/chai-point.json --out out/chai-point

   No dependencies. The output folder is not emptied first, so files that are not part
   of the site (dist/videos/, dist/_headers) are left alone. */
import { readFileSync, writeFileSync, mkdirSync, cpSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { setCurrency } from "./src/lib.mjs";
import { validateTheme, resolveTheme, themeCss, themeWarnings, fontsHref } from "../theme.mjs";
import { page } from "./src/layout.mjs";
import { HOME_SECTIONS } from "./src/pages/home.mjs";
import home from "./src/pages/home.mjs";
import menu from "./src/pages/menu.mjs";
import about from "./src/pages/about.mjs";
import contact from "./src/pages/contact.mjs";
import book from "./src/pages/book.mjs";
import notFound from "./src/pages/notfound.mjs";

const ROOT = dirname(fileURLToPath(import.meta.url));

// ---- Arguments ----
const args = process.argv.slice(2);
const outIdx = args.indexOf("--out");
const out = resolve(outIdx >= 0 ? args[outIdx + 1] : join(ROOT, "dist"));
const dataPath = resolve(args.find((a, i) => !a.startsWith("--") && i !== outIdx + 1) || join(ROOT, "restaurant.json"));

const site = JSON.parse(readFileSync(dataPath, "utf8"));
const errors = [];
const need = (cond, msg) => cond || errors.push(msg);

// ---- Theme: colours, fonts, logo (shared shape, see ../THEME.md) ----
// ../theme.mjs fills in defaults and derived shades and emits the shared --color-* / --font-*
// variables (the same ones the customer app uses). This template's own variables point at them.
const TEMPLATE_VARS = {
  "--green-700": "--color-primary",
  "--green-600": "--color-primary-light",
  "--green-100": "--color-primary-soft",
  "--on-dark-accent": "--color-on-dark-accent",
  "--brown-900": "--color-dark",
  "--ink": "--color-text",
  "--muted": "--color-muted",
  "--brown-500": "--color-accent",
  "--brown-700": "--color-accent-dark",
  "--cream-50": "--color-background",
  "--cream-100": "--color-surface",
  "--cream-200": "--color-border",
  "--font-head": "--font-heading",
};
errors.push(...validateTheme(site.theme || {}));
const theme = (site.theme = resolveTheme(site.theme || {}));
theme.favicon = theme.logo || "assets/favicon.svg";
site.fontsHref = fontsHref(theme);
site.themeCss =
  themeCss(theme) + `:root{${Object.entries(TEMPLATE_VARS).map(([mine, shared]) => `${mine}:var(${shared})`).join(";")}}`;
for (const w of themeWarnings(theme)) console.warn(`Theme warning: ${w}`);

// ---- Defaults and checks ----
const r = site.restaurant || {};
need(r.name, "restaurant.name is required");
need(r.phone, "restaurant.phone is required");
need(r.whatsapp, "restaurant.whatsapp is required (country code + number, digits only)");
need(r.address?.line, "restaurant.address.line is required");
need(r.hours && [0, 1, 2, 3, 4, 5, 6].every((d) => d in r.hours), "restaurant.hours needs all 7 days (0 = Sunday ... 6 = Saturday; null = closed)");
for (const [d, h] of Object.entries(r.hours || {})) {
  need(h === null || (Array.isArray(h) && h.length === 2 && h.every((t) => /^([01]\d|2[0-3]):[0-5]\d$/.test(t)) && h[0] < h[1]), `restaurant.hours.${d}: use ["HH:MM", "HH:MM"] (opening before closing) or null`);
}
r.shortName ||= r.name;
// Google Place ID of this site's outlet (outlets.google_place_id, 10-300 chars as in migration 0016).
// Optional: review buttons hide without it.
need(r.googlePlaceId == null || /^[A-Za-z0-9_-]{10,300}$/.test(r.googlePlaceId), "restaurant.googlePlaceId: looks wrong. Copy the Place ID from Google (it starts with \"ChIJ\" for most places)");
r.mapsQuery ||= r.address?.line;
site.slug ||= String(r.name || "site").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
site.seo = { lang: "en-IN", ...site.seo };
need(site.seo.url, "seo.url is required (the site's address, e.g. https://brewandleaf.in/)");
site.delivery ||= [];
site.faq ||= [];
site.footer ||= { tagline: "" };
site.booking = {
  maxOnline: 10,
  lastBookingBeforeClose: 60,
  notice: 30,
  durationMinutes: 90,
  occasions: [],
  seating: [],
  rules: [],
  phonePlaceholder: "+91 98xxx xxxxx",
  confirmNote: "",
  ...site.booking,
};
setCurrency(r.currency || "INR", site.seo.lang);
// Footer credit. Set "poweredBy": { "show": false } to hide it; "url" once Thaliyo's site is live.
const poweredLogo = [join(ROOT, "..", "..", "brand", "thaliyo-logo-on-dark-160.webp")].find((f) => existsSync(f));
site.poweredBy = { show: true, url: null, ...site.poweredBy };
site.poweredBy.logo = poweredLogo ? "assets/brand/thaliyo-on-dark.webp" : null;

const sections = site.home?.sections || [];
for (const key of sections) {
  need(HOME_SECTIONS.includes(key), `home.sections: unknown section "${key}". Use: ${HOME_SECTIONS.join(", ")}`);
  need(key === "info" || key === "categories" || site.home[key], `home.sections lists "${key}" but home.${key} is missing`);
}

const ids = new Set();
for (const c of site.menu?.categories || []) {
  need(/^[a-z0-9-]+$/.test(c.id), `menu category "${c.name}": id must be lowercase letters, digits and dashes`);
  for (const i of c.items || []) {
    need(/^[a-z0-9-]+$/.test(i.id || ""), `menu item "${i.name}": id must be lowercase letters, digits and dashes`);
    need(!ids.has(i.id), `menu item id "${i.id}" is used twice`);
    ids.add(i.id);
    need(typeof i.price === "number" && i.price >= 0, `menu item "${i.name}": price must be a number`);
    need(["veg", "egg", "nonveg"].includes(i.diet), `menu item "${i.name}": diet must be veg, egg or nonveg`);
  }
}

if (errors.length) {
  console.error(`\n${dataPath} has ${errors.length} problem(s):\n  - ${errors.join("\n  - ")}\n`);
  process.exit(1);
}

// ---- Render ----
mkdirSync(out, { recursive: true });
const pages = [home, menu, about, contact, book, notFound];
for (const make of pages) {
  const p = make(site);
  writeFileSync(join(out, p.file), String(page(site, p)));
}

writeFileSync(
  join(out, "site.webmanifest"),
  JSON.stringify(
    {
      name: r.name,
      short_name: r.shortName,
      start_url: "/index.html",
      display: "standalone",
      background_color: theme.colors.background,
      theme_color: theme.colors.primary,
      icons: [
        { src: "assets/icon-192.png", sizes: "192x192", type: "image/png" },
        { src: "assets/icon-512.png", sizes: "512x512", type: "image/png" },
        { src: "assets/favicon.svg", sizes: "any", type: "image/svg+xml" },
      ],
    },
    null,
    2
  ) + "\n"
);

// Static files: template css/js/images, plus the restaurant's own images folder when it has one.
for (const dir of ["css", "js", "assets"]) cpSync(join(ROOT, dir), join(out, dir), { recursive: true });
const ownAssets = join(dirname(dataPath), site.assetsDir || "__none__");
if (site.assetsDir && existsSync(ownAssets)) cpSync(ownAssets, join(out, "assets"), { recursive: true });

// "Powered by Thaliyo": small logo copied from the shared brand/ folder when the small size exists
// (the footer is dark, so the on-dark version). Plain text otherwise.
if (site.poweredBy.show && poweredLogo) cpSync(poweredLogo, join(out, "assets", "brand", "thaliyo-on-dark.webp"));

console.log(`Built ${r.name}: ${pages.length} pages -> ${out}`);
