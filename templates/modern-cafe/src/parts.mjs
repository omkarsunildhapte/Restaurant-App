/* Small pieces used by more than one page: images, diet marks, CTA band. */
import { html, raw, safeUrl, money, waHref } from "./lib.mjs";
import { icon } from "./icons.mjs";
import { attrs, ext, orderHref } from "./layout.mjs";

/**
 * Image from data: { src, large?, smallWidth?, alt, width, height }.
 * `large` adds a srcset (src at smallWidth px, large at width px).
 */
export function img(image, { cls, sizes = "100vw", lazy = true, priority = false, alt, width, height } = {}) {
  if (!image) return "";
  const srcset = image.large ? `${safeUrl(image.src)} ${image.smallWidth || 600}w, ${safeUrl(image.large)} ${image.width}w` : null;
  return html`<img${cls ? html` class="${cls}"` : ""} src="${safeUrl(image.src)}"${srcset ? html` srcset="${srcset}" sizes="${sizes}"` : ""} alt="${alt ?? image.alt ?? ""}" width="${width || image.width || 600}" height="${height || image.height || 450}"${lazy && !priority ? raw(' loading="lazy"') : ""}${priority ? raw(' fetchpriority="high"') : ""} />`;
}

// ---- Food type marks (FSSAI style) and diet tags ----
export const DIETS = {
  veg: "Vegetarian",
  egg: "Contains egg",
  nonveg: "Non-vegetarian",
};
export const TAGS = {
  vegan: ["VG", "Vegan"],
  jain: ["J", "Jain"],
  gf: ["GF", "Gluten-free"],
};

export function dietMark(diet) {
  if (!DIETS[diet]) throw new Error(`Unknown diet "${diet}". Use veg, egg or nonveg.`);
  return html`<span class="food-mark food-mark--${diet}" role="img" aria-label="${DIETS[diet]}" title="${DIETS[diet]}"></span>`;
}
export function tagMarks(tags = []) {
  return tags.map((t) => {
    if (!TAGS[t]) throw new Error(`Unknown tag "${t}". Use one of: ${Object.keys(TAGS).join(", ")}`);
    return html`<abbr class="diet diet--${t}" title="${TAGS[t][1]}">${TAGS[t][0]}</abbr>`;
  });
}

export const itemOrderHref = (site, item) =>
  waHref(site.restaurant.whatsapp, `Hi ${site.restaurant.shortName}, I would like to order: 1 x ${item.name}`);

export function foodCard(site, item, category) {
  return html`        <article class="food-card reveal">
          <a href="menu.html#${item.id}" class="food-card-media" tabindex="-1" aria-hidden="true">${img(item.image, { alt: "" })}</a>
          <div class="food-card-body">
            <span class="tag">${category.short || category.name}</span>
            <h3>${dietMark(item.diet)} <a href="menu.html#${item.id}" class="food-card-link">${item.name}</a></h3>
            <p>${item.description}</p>
            <div class="food-card-foot">
              <span class="price">${money(item.price)}</span>
              <a class="order-item" ${raw(attrs(ext(itemOrderHref(site, item))))} aria-label="Order ${item.name} on WhatsApp">${icon("whatsapp")} Order</a>
            </div>
          </div>
        </article>
`;
}

export function deliveryLinks(site) {
  if (!site.delivery.length) return "";
  return html`<div class="delivery"><span>Delivery:</span>${site.delivery.map((p) => html`<a ${raw(attrs(ext(p.url)))}>${icon("bag")} ${p.name}</a>`)}</div>`;
}

/** Green call-to-action band. actions: "book" | "order" | "menu" | "contact" | "call" */
export function ctaBand(site, cta, { delivery = false } = {}) {
  const r = site.restaurant;
  const btn = (kind, first) => {
    const cls = first ? "btn btn--light" : "btn btn--ghost";
    switch (kind) {
      case "book":
        return html`<a class="${cls}" href="book.html">${icon("calendar")} Book a table</a>`;
      case "order":
        return html`<a class="${cls}" ${raw(attrs(ext(orderHref(site))))}>${icon("whatsapp")} Order on WhatsApp</a>`;
      case "menu":
        return html`<a class="${cls}" href="menu.html">See the menu</a>`;
      case "contact":
        return html`<a class="${cls}" href="contact.html">Find us</a>`;
      case "call":
        return html`<a class="${cls}" href="tel:${r.phone.replace(/[^\d+]/g, "")}">Call ${r.phone}</a>`;
      default:
        throw new Error(`Unknown CTA action "${kind}"`);
    }
  };
  return html`    <div class="cta-band reveal">
      <div>
        <h2>${cta.title}</h2>
        <p>${cta.text}</p>
      </div>
      <div class="actions">
        ${cta.actions.map((a, i) => btn(a, i === 0))}
        ${delivery ? deliveryLinks(site) : ""}
      </div>
    </div>
`;
}

export function valueCards(items) {
  return items.map(
    (v) => html`      <div class="value reveal"><div class="icon">${icon(v.icon)}</div><h3>${v.title}</h3><p>${v.text}</p></div>\n`
  );
}

export function pageHero(h, { short = false, extra = "" } = {}) {
  return html`<section class="page-hero page-hero--image${short ? " page-hero--short" : ""}">
  ${img(h.image, { cls: "page-hero-bg", priority: true })}
  <div class="container">
    <span class="eyebrow">${h.eyebrow}</span>
    <h1>${h.title}</h1>
    <p>${h.text}</p>
    ${extra}
  </div>
</section>
`;
}

export const statusPill = raw(
  '<p class="status-pill status-pending" data-open-status><span class="status-dot"></span><span class="status-text">Checking hours…</span></p>'
);
