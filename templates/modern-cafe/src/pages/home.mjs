/* Home page. Sections come from home.sections in restaurant.json, in that order;
   leave a key out to hide that section. */
import { html, raw, jsonScript, safeUrl, telHref, waHref, mapsDirHref, mapsSearchHref, googleWriteReviewHref, googleReviewsHref, money, hoursSpan, openEveryDay, openingHoursSpec } from "../lib.mjs";
import { icon, SPRIG } from "../icons.mjs";
import { attrs, ext } from "../layout.mjs";
import { img, foodCard, ctaBand, valueCards, statusPill } from "../parts.mjs";

const SECTIONS = {
  hero(site, h) {
    const emblem = h.emblem
      ? html`<svg class="emblem" viewBox="0 0 200 200" aria-hidden="true"><defs><path id="emblem-ring" d="M100,100 m-74,0 a74,74 0 1,1 148,0 a74,74 0 1,1 -148,0"/></defs><circle cx="100" cy="100" r="97" class="emblem-disc"/><g class="emblem-spin"><text class="emblem-text"><textPath href="#emblem-ring" startOffset="0">${h.emblem}</textPath></text></g><circle cx="100" cy="100" r="52" class="emblem-core"/><g transform="translate(70 70) scale(2.5)" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M17 8h1a4 4 0 1 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/><path d="M7 2c0 1 .6 1.6 1 2.2M11 2c0 1 .6 1.6 1 2.2"/></g></svg>`
      : "";
    return html`<section class="hero">
  ${img(h.image, { cls: "hero-bg", priority: true })}
  <div class="container">
    <div class="hero-content">
      <span class="eyebrow">${h.eyebrow}</span>
      <h1>${h.title.map((line, i) => html`${i ? raw("<br />") : ""}${line}`)}</h1>
      ${h.script ? html`<p class="script hero-script">${h.script}</p>` : ""}
      <p>${h.text}</p>
      <div class="hero-actions">
        <a class="btn btn--primary" href="book.html">${icon("calendar")} Book a table</a>
        <a class="btn btn--ghost" href="menu.html">See the menu</a>
      </div>
      ${statusPill}
    </div>
    ${emblem}
  </div>
</section>
`;
  },

  info(site) {
    const r = site.restaurant;
    return html`<section class="info-strip" aria-label="Quick information">
  <div class="container">
    <div class="info-item">${icon("clock")}<div><strong>${openEveryDay(r.hours) ? "Open daily" : "Opening hours"}</strong><span>${hoursSpan(r.hours)}</span></div></div>
    <div class="info-item">${icon("pin")}<div><strong>Find us</strong><a ${raw(attrs(ext(mapsDirHref(r.mapsQuery))))}>${r.address.short}</a></div></div>
    <div class="info-item">${icon("phone")}<div><strong>Call us</strong><a href="${telHref(r.phone)}">${r.phone}</a></div></div>
  </div>
</section>
`;
  },

  categories(site) {
    const cats = site.menu.categories.filter((c) => c.image);
    return html`<nav class="cats-wrap" aria-label="Browse the menu">
  <div class="container cats">
${cats.map((c) => html`      <a class="cat" href="menu.html#${c.id}">${img(c.image, { alt: "" })}<span>${c.short || c.name}</span></a>\n`)}  </div>
</nav>
`;
  },

  ribbon(site, words) {
    const run = words.map((w) => html`<span>${w}</span><i>✦</i>`);
    return html`<div class="ribbon" aria-hidden="true">
  <div class="ribbon-track">
    ${run}
    ${run}
  </div>
</div>
`;
  },

  welcome(site, w) {
    return html`<section class="section has-sprig">
  ${SPRIG}
  <div class="container split">
    <div class="split-media reveal">
      ${img(w.image, { sizes: "(max-width: 860px) 100vw, 560px" })}
      ${w.badge ? html`<div class="badge-float"><b>${w.badge.big}</b>${w.badge.small}</div>` : ""}
    </div>
    <div class="reveal">
      <span class="eyebrow">${w.eyebrow}</span>
      <h2>${w.title}</h2>
      ${w.script ? html`<p class="script script--green">${w.script}</p>` : ""}
      ${w.paragraphs.map((p, i) => html`<p${i === 0 ? raw(' class="lead"') : ""}>${p}</p>\n      `)}
      <a class="btn btn--ghost" href="about.html">Our story &rarr;</a>
    </div>
  </div>
</section>
`;
  },

  popular(site, p) {
    const picks = [];
    for (const c of site.menu.categories) for (const item of c.items) if (item.popular && item.image) picks.push([item, c]);
    if (!picks.length) return "";
    return html`<section class="section section--cream">
  <div class="container">
    <div class="center reveal">
      <span class="eyebrow">${p.eyebrow}</span>
      <h2>${p.title}</h2>
      <p class="lead">${p.text}</p>
    </div>
    <div class="card-grid">
${picks.slice(0, p.limit || 4).map(([item, c]) => foodCard(site, item, c))}    </div>
    <p class="center" style="margin-top: 36px;"><a class="btn btn--primary" href="menu.html">View the full menu</a></p>
  </div>
</section>
`;
  },

  values(site, v) {
    return html`<section class="section section--green">
  <div class="container">
    <div class="center reveal">
      <span class="eyebrow">${v.eyebrow}</span>
      <h2 style="color:#fff;">${v.title}</h2>
    </div>
    <div class="values">
${valueCards(v.items)}    </div>
  </div>
</section>
`;
  },

  reviews(site, rv) {
    if (!rv.items?.length && !rv.googleQuery) return "";
    const placeId = site.restaurant.googlePlaceId;
    const google = placeId ? googleReviewsHref(placeId) : mapsSearchHref(rv.googleQuery || `${site.restaurant.name} ${site.restaurant.address.line}`);
    return html`${rv.sample ? raw("<!-- SAMPLE REVIEWS: replace with real guest reviews (with permission) before launch. -->\n") : ""}<section class="section section--cream"${rv.sample ? raw(' data-demo="reviews"') : ""}>
  <div class="container">
    <div class="center reveal">
      <span class="eyebrow">${rv.eyebrow}</span>
      <h2>${rv.title}</h2>
      ${rv.sample ? html`<p class="demo-note">Sample reviews for preview - real guest reviews go here at launch.</p>` : ""}
    </div>
    ${rv.items?.length
      ? html`<div class="reviews">
${rv.items.map(
  (q) => html`      <figure class="review-card reveal">
        <div class="stars" aria-hidden="true">${"★".repeat(q.stars || 5)}</div>
        <blockquote>“${q.text}”</blockquote>
        <figcaption><span class="review-avatar" aria-hidden="true">${q.name[0]}</span><span><strong>${q.name}</strong><small>${q.note}</small></span></figcaption>
      </figure>
`
)}    </div>`
      : ""}
    <div class="reviews-cta reveal">
      <p>Been in? We'd love to hear how it was.</p>
      <div class="actions">
        <a class="btn btn--primary" ${raw(attrs(ext(google)))}>Read reviews on Google</a>
        ${placeId ? html`<a class="btn btn--ghost" ${raw(attrs(ext(googleWriteReviewHref(placeId))))}>${icon("star")} Leave a review</a>` : ""}
      </div>
    </div>
  </div>
</section>
`;
  },

  gallery(site, g) {
    const link = site.restaurant.social?.instagram || "#";
    return html`<section class="section">
  <div class="container">
    <div class="center reveal">
      <span class="eyebrow">${g.eyebrow}</span>
      <h2>${g.title}</h2>
      <p class="lead">${g.text}</p>
    </div>
    <div class="gallery">
${g.images.map((im) => html`      <a ${raw(attrs(ext(link)))} aria-label="See this photo on our Instagram">${img({ ...im, width: 600, height: 600 }, { alt: "" })}</a>\n`)}    </div>
  </div>
</section>
`;
  },

  faq(site, f) {
    return html`<section class="section section--cream">
  <div class="container">
    <div class="center reveal">
      <span class="eyebrow">${f.eyebrow}</span>
      <h2>${f.title}</h2>
    </div>
    <div class="faq">
${site.faq.map((q) => html`      <details><summary>${q.q}</summary><p>${q.a}</p></details>\n`)}    </div>
  </div>
</section>
`;
  },

  events(site, e) {
    if (!e.items?.length) return "";
    const r = site.restaurant;
    return html`${e.sample ? raw("<!-- SAMPLE EVENTS: replace with the restaurant's real programme. -->\n") : ""}<section class="section">
  <div class="container">
    <div class="center reveal">
      <span class="eyebrow">${e.eyebrow}</span>
      <h2>${e.title}</h2>
      <p class="lead">${e.text}</p>
    </div>
    <div class="events">
${e.items.map(
  (ev) => html`      <article class="event-card reveal">
        ${img(ev.image, { alt: "" })}
        <div class="event-body">
          <span class="event-when">${ev.when}</span>
          <h3>${ev.title}</h3>
          <p>${ev.text}</p>
          <div class="event-foot"><span class="event-price">${typeof ev.price === "number" ? money(ev.price) : ev.price}</span><a class="link-arrow" ${raw(attrs(ext(waHref(r.whatsapp, `Hi ${r.shortName}, I would like to join: ${ev.title}`))))}>Reserve a spot &rarr;</a></div>
        </div>
      </article>
`
)}    </div>
  </div>
</section>
`;
  },

  cta(site, c) {
    return html`<section class="section">
  <div class="container">
${ctaBand(site, c, { delivery: true })}  </div>
</section>
`;
  },
};

export const HOME_SECTIONS = Object.keys(SECTIONS);

export default function home(site) {
  const h = site.home;
  const r = site.restaurant;
  const ld = {
    "@context": "https://schema.org",
    "@type": r.schemaType || "Restaurant",
    name: r.name,
    image: new URL(site.seo.image, site.seo.url).href,
    url: site.seo.url,
    telephone: r.phone.replace(/[^\d+]/g, ""),
    ...(r.email && { email: r.email }),
    servesCuisine: r.cuisines,
    priceRange: r.priceRange,
    menu: new URL("menu.html", site.seo.url).href,
    acceptsReservations: true,
    address: {
      "@type": "PostalAddress",
      streetAddress: r.address.street,
      addressLocality: r.address.city,
      addressRegion: r.address.state,
      postalCode: r.address.postalCode,
      addressCountry: r.address.country,
    },
    openingHoursSpecification: openingHoursSpec(r.hours),
  };
  const hasFaq = h.sections.includes("faq") && site.faq.length;
  const faqLd = hasFaq && {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: site.faq.map((q) => ({ "@type": "Question", name: q.q, acceptedAnswer: { "@type": "Answer", text: q.a } })),
  };
  const hero = h.hero.image;
  const headExtra = html`  <script type="application/ld+json">${jsonScript(ld, true)}</script>
${faqLd ? html`  <script type="application/ld+json">${jsonScript(faqLd, true)}</script>\n` : ""}${hero?.large ? html`  <link rel="preload" as="image" href="${safeUrl(hero.src)}" imagesrcset="${safeUrl(hero.src)} ${hero.smallWidth || 600}w, ${safeUrl(hero.large)} ${hero.width}w" imagesizes="100vw" />\n` : ""}`;

  const body = h.sections.map((key) => {
    if (!SECTIONS[key]) throw new Error(`home.sections: unknown section "${key}". Use: ${HOME_SECTIONS.join(", ")}`);
    return SECTIONS[key](site, h[key]);
  });
  return { file: "index.html", title: null, head: headExtra, body: html`${body}` };
}
