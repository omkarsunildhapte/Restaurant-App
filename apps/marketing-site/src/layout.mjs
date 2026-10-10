/* Parts shared by every page: <head>, header, footer. */
import { html, raw, safeUrl, waHref } from "./lib.mjs";

export const NAV = [
  ["index.html", "Home"],
  ["features.html", "Features"],
  ["pricing.html", "Pricing"],
  ["about.html", "About"],
  ["contact.html", "Contact"],
];

const logo = (site) =>
  html`<a class="brand" href="index.html" aria-label="${site.brand.name} home"><img class="brand-mark" src="assets/brand/thaliyo-emblem-256.png" alt="" width="40" height="40" /><span>${site.brand.name}<small>${site.brand.product}</small></span></a>`;

function head(site, page) {
  const title = page.title ? `${page.title} · ${site.brand.name}` : `${site.brand.name} — ${site.brand.product}`;
  const url = site.url ? site.url.replace(/\/$/, "") + "/" + (page.file === "index.html" ? "" : page.file) : null;
  return html`<!doctype html>
<html lang="${site.lang}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <meta name="description" content="${page.description}" />
  ${url ? html`<link rel="canonical" href="${url}" />` : ""}
  <meta name="theme-color" content="#E8891F" />
  <meta property="og:type" content="website" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${page.description}" />
  <meta property="og:image" content="${site.url ? site.url.replace(/\/$/, "") + "/" : ""}assets/brand/thaliyo-logo-600.png" />
  <link rel="icon" href="assets/brand/favicon.ico" sizes="any" />
  <link rel="icon" type="image/png" href="assets/brand/favicon-32.png" sizes="32x32" />
  <link rel="apple-touch-icon" href="assets/brand/icon-180.png" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="css/style.css" />
  ${page.noindex ? raw('<meta name="robots" content="noindex" />') : ""}
${page.head || ""}</head>
<body>
<a class="skip-link" href="#main">Skip to content</a>
`;
}

function header(site, page) {
  return html`<header class="site-header">
  <nav class="container nav" aria-label="Main">
    ${logo(site)}
    <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="nav-links" aria-label="Open menu">
      <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
    </button>
    <div class="nav-panel" id="nav-links">
      <ul class="nav-links">
${NAV.map(([href, label]) => html`        <li><a href="${href}"${page.file === href ? raw(' aria-current="page"') : ""}>${label}</a></li>\n`)}      </ul>
      <a class="nav-signin" href="${site.businessPanelUrl}">Sign in</a>
      <a class="btn btn--primary btn--sm" href="demo.html">Book a free demo</a>
    </div>
  </nav>
</header>
`;
}

function footer(site) {
  const c = site.contact;
  return html`<footer class="site-footer">
  <div class="container footer-grid">
    <div>
      ${logo(site)}
      <p class="footer-tagline">${site.brand.tagline}</p>
      <p class="footer-small">${site.brand.company} · ${c.city}</p>
    </div>
    <div>
      <h2 class="footer-title">Product</h2>
      <ul>
        <li><a href="features.html">Features</a></li>
        <li><a href="pricing.html">Pricing</a></li>
        <li><a href="demo.html">Book a demo</a></li>
        <li><a href="${site.businessPanelUrl}">Owner sign in</a></li>
      </ul>
    </div>
    <div>
      <h2 class="footer-title">Company</h2>
      <ul>
        <li><a href="about.html">About us</a></li>
        <li><a href="contact.html">Contact</a></li>
      </ul>
    </div>
    <div>
      <h2 class="footer-title">Legal</h2>
      <ul>
        <li><a href="privacy.html">Privacy policy</a></li>
        <li><a href="terms.html">Terms of service</a></li>
        <li><a href="refund.html">Refund &amp; cancellation</a></li>
      </ul>
    </div>
    <div>
      <h2 class="footer-title">Talk to us</h2>
      <ul>
        ${c.phone ? html`<li><a href="${safeUrl("tel:" + c.phone.replace(/\s/g, ""))}">${c.phone}</a></li>` : ""}
        ${c.whatsapp ? html`<li><a href="${waHref(c.whatsapp, `Hi, I'd like to know more about ${site.brand.name}`)}" target="_blank" rel="noopener">WhatsApp us</a></li>` : ""}
        ${c.email ? html`<li><a href="${safeUrl("mailto:" + c.email)}">${c.email}</a></li>` : ""}
        <li>${c.hours}</li>
      </ul>
    </div>
  </div>
  <div class="container footer-bottom">
    <p>© ${new Date().getFullYear()} ${site.brand.company}. Made in Pune.</p>
  </div>
</footer>
`;
}

/** One complete page: head + header + <main> + footer + script. */
export function page(site, p) {
  return html`${head(site, p)}${header(site, p)}<main id="main">
${p.body}
</main>
${footer(site)}<script>window.SITE=${raw(JSON.stringify({ demoApiUrl: site.demoApiUrl, whatsapp: site.contact.whatsapp }).replace(/</g, "\\u003c"))};</script>
<script src="js/main.js" defer></script>
</body>
</html>
`;
}

/** Closing call-to-action band used on most pages. */
export function ctaBand(site) {
  const f = site.pricing.founding;
  return html`<section class="cta-band">
  <div class="container cta-inner">
    <div>
      <h2>See it working in your own restaurant</h2>
      <p>A 10-minute demo at your counter: take an order on the waiter app, watch it reach the kitchen, print a GST bill.${f.enabled ? ` Founding price for the first ${f.spots} restaurants.` : ""}</p>
    </div>
    <div class="cta-actions">
      <a class="btn btn--light" href="demo.html">Book a free demo</a>
      <a class="btn btn--ghost-light" href="pricing.html">See pricing</a>
    </div>
  </div>
</section>`;
}
