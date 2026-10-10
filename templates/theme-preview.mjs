#!/usr/bin/env node
/* Side-by-side preview of restaurant themes: palette, fonts, website and customer app,
   all styled from theme.mjs, the same code the template build and the app use.

     node theme-preview.mjs > preview.html
     node theme-preview.mjs a.json b.json > preview.html    (restaurant files or bare themes)

   Turn it into an image with headless Chrome:
     chrome --headless --hide-scrollbars --window-size=1600,2000 --virtual-time-budget=8000 \
            --screenshot=theme-preview.png preview.html
*/
import { readFileSync } from "node:fs";
import { resolveTheme, themeCss, fontsHref, themeWarnings } from "./theme.mjs";

const SAMPLES = [
  { name: "Brew & Leaf Café", place: "Baner, Pune", theme: {} },
  {
    name: "Chai Corner",
    place: "Koregaon Park, Pune",
    theme: { colors: { primary: "#9a3412", dark: "#1c1917", background: "#fffbf5" }, fonts: { heading: "Playfair Display", body: "Poppins", script: "Kalam" } },
  },
  {
    name: "Dakshin Tiffin",
    place: "Viman Nagar, Pune",
    theme: {
      colors: { primary: "#1d4e89", dark: "#0f1f36", background: "#f6f9fd", surface: "#eaf1f9", border: "#d5e1ef", accent: "#c8901a", accentDark: "#7a5410", muted: "#51607a" },
      fonts: { heading: "Lora", body: "Mukta", script: "Dancing Script" },
    },
  },
];

const files = process.argv.slice(2);
const items = files.length
  ? files.map((f) => {
      const d = JSON.parse(readFileSync(f, "utf8"));
      return d.theme ? { name: d.restaurant?.name || f, place: d.restaurant?.address?.city || "", theme: d.theme } : { name: f, place: "", theme: d };
    })
  : SAMPLES;

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const MENU = [
  ["veg", "Masala Chai Latte", 180],
  ["egg", "Avocado Egg Toast", 380],
  ["nonveg", "Chicken Pesto Panini", 380],
];
const LABELS = ["primary", "primaryLight", "primarySoft", "onDarkAccent", "dark", "text", "muted", "accent", "accentDark", "background", "surface", "border"];

const fontLinks = [...new Set(items.map((i) => fontsHref(i.theme)))].map((h) => `<link rel="stylesheet" href="${esc(h)}">`).join("\n");

function row(item, i) {
  const t = resolveTheme(item.theme);
  const cls = `t${i}`;
  const warn = themeWarnings(item.theme);
  const custom = new Set(Object.keys(item.theme.colors || {}));
  return `
<style>${themeCss(item.theme, "." + cls)}</style>
<section class="row ${cls}">
  <div class="spec">
    <h2>${esc(item.name)}</h2>
    <p class="place">${esc(item.place)}</p>
    <div class="swatches">
      ${LABELS.map((k) => `<div class="sw"><span class="chip" style="background:var(--color-${k.replace(/[A-Z]/g, (c) => "-" + c.toLowerCase())})"></span><b>${k}</b><code>${t.colors[k]}</code>${custom.has(k) ? '<i>set</i>' : ""}</div>`).join("")}
    </div>
    <p class="fonts"><span>Heading <b style="font-family:var(--font-heading)">${esc(t.fonts.heading)}</b></span><span>Body <b style="font-family:var(--font-body)">${esc(t.fonts.body)}</b></span><span>Script <b style="font-family:var(--font-script)">${esc(t.fonts.script)}</b></span></p>
    ${warn.length ? `<p class="warn">⚠ ${esc(warn.join(" "))}</p>` : `<p class="ok">✓ Readable: all contrast checks pass</p>`}
  </div>

  <div class="site">
    <div class="browser"><span></span><span></span><span></span><em>${esc(item.name.toLowerCase().replace(/[^a-z]+/g, ""))}.in</em></div>
    <div class="s-nav"><b class="brand"><i class="mark"></i>${esc(item.name)}</b><span>Menu</span><span>About</span><span class="btn">Book a table</span></div>
    <div class="s-hero">
      <small>Open now · until 9 pm</small>
      <h3>Good food.<br>Slow mornings.</h3>
      <p class="script">made fresh every day</p>
      <div><span class="btn">Book a table</span><span class="btn ghost">See the menu</span></div>
    </div>
    <div class="s-menu">
      ${MENU.map(([d, n, p]) => `<div class="s-item"><i class="fm ${d}"></i><b>${n}</b><span class="dots"></span><span class="price">₹${p}</span></div>`).join("")}
    </div>
    <div class="s-foot">© ${esc(item.name)} · FSSAI Lic. No. 000000</div>
  </div>

  <div class="phone">
    <div class="p-status">9:41<span>●●● ▮</span></div>
    <div class="p-bar"><i class="mark"></i><b>${esc(item.name)}</b></div>
    <div class="p-table">Table 7 · Dine-in</div>
    <div class="p-chips"><span class="on">All</span><span>Breakfast</span><span>Drinks</span></div>
    ${MENU.map(([d, n, p]) => `<div class="p-item"><div><i class="fm ${d}"></i><b>${n}</b><span class="price">₹${p}</span></div><span class="add">ADD</span></div>`).join("")}
    <div class="p-cart"><span>2 items · ₹560</span><b>View cart →</b></div>
  </div>
</section>`;
}

process.stdout.write(`<!doctype html><html><head><meta charset="utf-8"><title>Restaurant themes</title>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
${fontLinks}
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;600&family=IBM+Plex+Mono:wght@400&display=swap">
<style>
*{box-sizing:border-box} body{margin:0;background:#eceef1;color:#1d2228;font:14px/1.4 "IBM Plex Sans",system-ui,sans-serif;padding:36px 40px}
header{display:flex;align-items:baseline;gap:18px;margin-bottom:22px}
header h1{font-size:26px;margin:0} header p{margin:0;color:#5b6470}
.row{display:grid;grid-template-columns:400px 1fr 290px;gap:28px;align-items:center;background:#fff;border-radius:14px;padding:24px;margin-bottom:22px;box-shadow:0 1px 3px rgba(0,0,0,.06)}
.spec h2{margin:0;font-size:20px} .place{margin:2px 0 14px;color:#6b7380}
.swatches{display:grid;grid-template-columns:1fr 1fr;gap:6px 14px}
.sw{display:grid;grid-template-columns:22px 1fr auto;align-items:center;gap:8px;font-size:12px;position:relative}
.sw .chip{width:22px;height:22px;border-radius:6px;box-shadow:inset 0 0 0 1px rgba(0,0,0,.12)} .sw b{font-weight:600}
.sw code{font:11px "IBM Plex Mono",monospace;color:#5b6470} .sw i{position:absolute;left:-6px;top:-4px;font-style:normal;font-size:8px;background:#1d2228;color:#fff;border-radius:4px;padding:0 3px}
.fonts{display:flex;flex-wrap:wrap;gap:4px 14px;margin:14px 0 6px;font-size:12px;color:#5b6470} .fonts b{color:#1d2228;font-size:15px;font-weight:600}
.ok{color:#1b7a3d;font-size:12px;margin:6px 0 0} .warn{color:#a1560b;font-size:12px;margin:6px 0 0}

/* Website: only theme variables below */
.site{border-radius:10px;overflow:hidden;background:var(--color-background);color:var(--color-text);font-family:var(--font-body);box-shadow:0 0 0 1px var(--color-border)}
.browser{display:flex;gap:6px;align-items:center;padding:8px 12px;background:#dfe2e6}.browser span{width:9px;height:9px;border-radius:50%;background:#b9bec5}.browser em{margin-left:10px;font:11px "IBM Plex Mono",monospace;color:#5b6470;font-style:normal;background:#fff;border-radius:5px;padding:2px 10px}
.s-nav{display:flex;align-items:center;gap:18px;padding:12px 18px;font-size:13px;color:var(--color-accent-dark)}
.brand{display:flex;align-items:center;gap:8px;font-family:var(--font-heading);color:var(--color-text);font-size:17px;margin-right:auto}
.mark{width:22px;height:22px;border-radius:50%;background:var(--color-primary);display:inline-block;box-shadow:inset 0 0 0 5px var(--color-primary),inset 0 0 0 7px var(--color-on-dark-accent)}
.btn{background:var(--color-primary);color:#fff;border-radius:999px;padding:6px 14px;font-weight:600;font-size:12px;display:inline-block}
.btn.ghost{background:transparent;box-shadow:inset 0 0 0 1.5px currentColor;color:#fff;margin-left:8px}
.s-hero{background:linear-gradient(120deg,var(--color-dark) 40%,color-mix(in srgb,var(--color-dark) 70%,var(--color-primary)));color:#fff;padding:26px 22px}
.s-hero small{color:var(--color-on-dark-accent);font-size:11px;letter-spacing:.08em;text-transform:uppercase}
.s-hero h3{font-family:var(--font-heading);font-weight:600;font-size:30px;line-height:1.1;margin:6px 0 2px}
.script{font-family:var(--font-script);color:var(--color-on-dark-accent);font-size:22px;margin:0 0 12px}
.s-menu{padding:14px 20px;background:var(--color-surface);display:grid;gap:8px}
.s-item{display:flex;align-items:center;gap:8px;font-size:13px}.s-item b{font-weight:600}
.dots{flex:1;border-bottom:1.5px dotted var(--color-border);margin:0 4px}
.price{color:var(--color-primary);font-weight:700}
.s-foot{background:var(--color-dark);color:color-mix(in srgb,#fff 70%,var(--color-dark));font-size:11px;padding:9px 20px}
.fm{width:13px;height:13px;border:1.5px solid;border-radius:2px;display:inline-grid;place-items:center;flex:none;background:#fff}
.fm::after{content:"";width:6px;height:6px;border-radius:50%;background:currentColor}
.fm.veg{color:#0f8a3c}.fm.egg{color:#c27c0e}.fm.nonveg{color:#8b3a0e}.fm.nonveg::after{width:0;height:0;border-radius:0;background:none;border-left:3.5px solid transparent;border-right:3.5px solid transparent;border-bottom:6px solid currentColor}

/* Customer app: same variables */
.phone{width:270px;height:500px;justify-self:center;border-radius:34px;border:12px solid #1d2228;overflow:hidden;background:var(--color-background);box-shadow:0 10px 30px rgba(0,0,0,.18)}
.phone>*{background:var(--color-background)}
.p-status{display:flex;justify-content:space-between;padding:10px 18px 4px;font-size:11px;font-weight:600;color:var(--color-text);font-family:var(--font-body)}
.p-bar{display:flex;align-items:center;gap:8px;padding:8px 14px;font-family:var(--font-heading);font-size:16px;color:var(--color-text)}
.p-table{margin:0;padding:6px 14px;font:600 11px var(--font-body);color:var(--color-primary);background:var(--color-primary-soft)}
.p-chips{display:flex;gap:6px;padding:10px 14px;font:12px var(--font-body)}
.p-chips span{border:1.5px solid var(--color-border);border-radius:999px;padding:3px 10px;color:var(--color-text)}
.p-chips .on{background:var(--color-primary);border-color:var(--color-primary);color:#fff}
.p-item{display:flex;justify-content:space-between;align-items:center;padding:10px 14px;border-top:1px solid var(--color-border);font:13px var(--font-body);color:var(--color-text)}
.p-item>div{display:grid;grid-template-columns:auto 1fr;gap:2px 7px;align-items:center}.p-item .price{grid-column:2;font-size:12px}
.add{border:1.5px solid var(--color-primary);color:var(--color-primary);background:var(--color-background);border-radius:8px;padding:4px 12px;font-weight:700;font-size:11px}
.p-cart{display:flex;justify-content:space-between;align-items:center;margin-top:auto;padding:14px;font:12px var(--font-body);background:var(--color-primary)!important;color:#fff}
.phone{display:flex;flex-direction:column}.phone>.p-item:last-of-type{flex:1;align-items:flex-start}
.col-heads{display:grid;grid-template-columns:400px 1fr 290px;gap:28px;padding:0 24px 8px;color:#5b6470;font-size:12px;text-transform:uppercase;letter-spacing:.08em}
</style></head><body>
<header><h1>One theme, every screen</h1><p>Each restaurant sets its theme once. The website and the customer app read the same values (templates/THEME.md).</p></header>
<div class="col-heads"><span>Theme (set = chosen by owner, rest derived)</span><span>Restaurant website</span><span style="text-align:center">Customer app / QR menu</span></div>
${items.map(row).join("")}
</body></html>`);
