/* Parts shared by every page: <head>, announcement bar, header, footer, floating buttons. */
import { html, raw, jsonScript, safeUrl, telHref, waHref, mapsDirHref, googleWriteReviewHref, groupHours, dayRangeLabel, fmtRange } from "./lib.mjs";
import { icon } from "./icons.mjs";

const NAV = [
  ["index.html", "Home"],
  ["menu.html", "Menu"],
  ["about.html", "About"],
  ["contact.html", "Contact"],
];

const ext = (url) => ({ href: safeUrl(url), target: "_blank", rel: "noopener" });

export function brand(site) {
  const { restaurant: r, theme } = site;
  const mark = theme.logo
    ? html`<img src="${safeUrl(theme.logo)}" alt="" width="40" height="40" />`
    : icon("cup");
  return html`<a class="brand" href="index.html"><span class="brand-mark${theme.logo ? " brand-mark--logo" : ""}">${mark}</span>${r.shortName}</a>`;
}

/** Shared WhatsApp "I'd like to place an order" link. */
export const orderHref = (site) => waHref(site.restaurant.whatsapp, `Hi ${site.restaurant.shortName}, I'd like to place an order`);

function head(site, page) {
  const { restaurant: r, seo, theme } = site;
  const title = page.title ? `${page.title} · ${r.name}` : seo.title;
  const description = page.description || seo.description;
  const url = seo.url.replace(/\/$/, "") + "/" + (page.file === "index.html" ? "" : page.file);
  return html`<!doctype html>
<html lang="${seo.lang}" class="no-js">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <meta name="description" content="${description}" />
  <link rel="canonical" href="${url}" />
  <meta name="theme-color" content="${theme.colors.primary}" />
  <meta property="og:type" content="website" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:image" content="${new URL(seo.image, seo.url).href}" />
  <link rel="icon" href="${safeUrl(theme.favicon)}" />
  <link rel="apple-touch-icon" href="assets/icon-180.png" />
  <link rel="manifest" href="site.webmanifest" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="${site.fontsHref}" rel="stylesheet" />
  <link rel="stylesheet" href="css/style.css" />
  <style>${raw(site.themeCss)}</style>
${page.head || ""}</head>
<body>
<a class="skip-link" href="#main">Skip to content</a>
`;
}

function announcement(site) {
  const a = site.announcement;
  if (!a || !a.enabled) return "";
  const partners = a.showDelivery ? site.delivery : [];
  const lead = partners.length
    ? html`Now delivering on ${partners.map((p, i) => html`${i ? (i === partners.length - 1 ? raw(" &amp; ") : ", ") : ""}<a ${raw(attrs(ext(p.url)))}>${p.name}</a>`)}`
    : "";
  const extra = a.text ? html`${lead ? html` <span class="announce-sep">·</span> ` : ""}<span class="announce-extra">${a.text}</span>` : "";
  return html`<div class="announce" id="announce" role="region" aria-label="Announcement">
  <p>${lead}${extra}</p>
  <button type="button" class="announce-close" aria-label="Close announcement">${icon("close")}</button>
</div>
`;
}

const attrs = (o) => Object.entries(o).map(([k, v]) => `${k}="${String(v).replace(/&/g, "&amp;").replace(/"/g, "&quot;")}"`).join(" ");

function header(site, page) {
  return html`<header class="site-header">
  <nav class="container nav" aria-label="Main">
    ${brand(site)}
    <button class="nav-toggle" aria-expanded="false" aria-controls="nav-links" aria-label="Open menu">${icon("menu")}</button>
    <ul class="nav-links" id="nav-links">
${NAV.map(([href, label]) => html`        <li><a href="${href}"${page.file === href ? raw(' aria-current="page"') : ""}>${label}</a></li>\n`)}        <li class="mobile-only"><a class="btn btn--primary" href="book.html">${icon("calendar")} Book a table</a></li>
        <li class="mobile-only"><a class="btn btn--ghost" ${raw(attrs(ext(orderHref(site))))} style="margin-top:10px">${icon("whatsapp")} Order on WhatsApp</a></li>
    </ul>
    <a class="btn btn--primary nav-cta" href="book.html">${icon("calendar")} Book a table</a>
  </nav>
</header>
`;
}

function footer(site) {
  const { restaurant: r, footer: f } = site;
  const dir = mapsDirHref(r.mapsQuery);
  const socials = [
    r.social?.instagram && ["Instagram", r.social.instagram, "instagram"],
    r.social?.facebook && ["Facebook", r.social.facebook, "facebook"],
    ["WhatsApp", orderHref(site), "whatsapp"],
    ["Google Maps", dir, "map"],
  ].filter(Boolean);
  const offers = f.offersList?.enabled
    ? html`    <div class="footer-offers">
      <div>
        <h2 class="footer-offers-title">${f.offersList.title}</h2>
        <p>${f.offersList.text}</p>
      </div>
      <a class="btn btn--light" ${raw(attrs(ext(waHref(r.whatsapp, `Hi ${r.shortName}, please add me to your weekly offers list`))))}>${icon("whatsapp")} Join the offers list</a>
    </div>
`
    : "";
  return html`<footer class="site-footer">
  <div class="container">
${offers}    <div class="footer-grid">
      <div>
        ${brand(site)}
        <p>${f.tagline}</p>
        ${f.script ? html`<p class="script footer-script">${f.script}</p>` : ""}
        <div class="socials">
${socials.map(([label, url, ic]) => html`          <a ${raw(attrs(ext(url)))} aria-label="${label}">${icon(ic)}</a>\n`)}        </div>
      </div>
      <div>
        <h3 class="footer-title">Explore</h3>
        <ul>
          <li><a href="menu.html">Our menu</a></li>
          <li><a href="book.html">Book a table</a></li>
          <li><a href="about.html">Our story</a></li>
          <li><a href="contact.html">Find us</a></li>
        </ul>
      </div>
      <div>
        <h3 class="footer-title">Opening hours</h3>
        <ul>
${groupHours(r.hours).map((g) => html`          <li>${dayRangeLabel(g.days)} · ${fmtRange(g.hours)}</li>\n`)}        </ul>
      </div>
      <div>
        <h3 class="footer-title">Say hello</h3>
        <ul>
          <li><a href="${telHref(r.phone)}">${r.phone}</a></li>
          ${r.email ? html`<li><a href="mailto:${r.email}">${r.email}</a></li>` : ""}
          <li><a ${raw(attrs(ext(dir)))}>${r.address.line}</a></li>
          ${r.googlePlaceId ? html`<li><a class="footer-review" ${raw(attrs(ext(googleWriteReviewHref(r.googlePlaceId))))}>${icon("star")} Review us on Google</a></li>` : ""}
        </ul>
        ${r.fssai ? html`<p class="footer-licence">FSSAI Lic. No. ${r.fssai}</p>` : ""}
      </div>
    </div>
    <div class="footer-bottom">
      <span>&copy; <span data-year>${new Date().getFullYear()}</span> ${r.name}. All rights reserved.</span>
      ${f.signoff ? html`<span>${f.signoff}</span>` : ""}
      ${poweredBy(site)}
    </div>
  </div>
</footer>
`;
}

/** Small "Powered by Thaliyo" in the footer. The restaurant's own brand stays primary. */
function poweredBy(site) {
  const p = site.poweredBy;
  if (!p.show) return "";
  const mark = p.logo ? html`<img src="${p.logo}" alt="Thaliyo" width="72" height="56" loading="lazy" />` : html`<b>Thaliyo</b>`;
  const inner = html`<span class="powered-label">Powered by</span>${mark}`;
  return p.url ? html`<a class="powered-by" ${raw(attrs(ext(p.url)))}>${inner}</a>` : html`<span class="powered-by">${inner}</span>`;
}

function floating(site) {
  const r = site.restaurant;
  const order = orderHref(site);
  return html`<a class="wa-float" ${raw(attrs(ext(order)))} aria-label="Order on WhatsApp">${icon("whatsapp")}</a>
<nav class="m-actions" aria-label="Quick actions">
  <a href="${telHref(r.phone)}">${icon("phone")}<span>Call</span></a>
  <a ${raw(attrs(ext(mapsDirHref(r.mapsQuery))))}>${icon("pin")}<span>Directions</span></a>
  <a href="book.html" class="m-actions-main">${icon("calendar")}<span>Book</span></a>
  <a ${raw(attrs(ext(order)))}>${icon("whatsapp")}<span>Order</span></a>
</nav>
`;
}

/** Data main.js needs at runtime (hours, WhatsApp number, booking rules). */
function siteData(site) {
  const { restaurant: r, booking } = site;
  return {
    slug: site.slug,
    name: r.name,
    whatsapp: String(r.whatsapp).replace(/\D/g, ""),
    address: r.address.line,
    hours: r.hours,
    booking: {
      maxOnline: booking.maxOnline,
      lastBookingBeforeClose: booking.lastBookingBeforeClose,
      notice: booking.notice,
      durationMinutes: booking.durationMinutes,
    },
  };
}

/** Whole page: page = { file, title, description, head, body } */
export function page(site, p) {
  return html`${head(site, p)}${announcement(site)}${header(site, p)}<main id="main">
${p.body}
</main>
${footer(site)}${floating(site)}<script id="site-data" type="application/json">${jsonScript(siteData(site))}</script>
<script src="js/main.js" defer></script>
</body>
</html>
`;
}

export { attrs, ext };
