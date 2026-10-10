/* Menu page: category tabs, search, veg filter and tag filters built from the data. */
import { html, raw, money } from "../lib.mjs";
import { icon } from "../icons.mjs";
import { img, dietMark, tagMarks, ctaBand, pageHero, DIETS, TAGS } from "../parts.mjs";

export default function menu(site) {
  const m = site.menu;
  const items = m.categories.flatMap((c) => c.items);
  const usedDiets = Object.keys(DIETS).filter((d) => items.some((i) => i.diet === d));
  const usedTags = Object.keys(TAGS).filter((t) => items.some((i) => i.tags?.includes(t)));

  const legend = html`<p class="food-legend">${usedDiets.map((d) => html`<span>${dietMark(d)}${DIETS[d]}</span>`)}${usedTags.map((t) => html`<span>${tagMarks([t])}${TAGS[t][1]}</span>`)}</p>`;

  const filters = [
    usedDiets.includes("veg") && usedDiets.length > 1 && ["veg", "Veg only"],
    ...usedTags.map((t) => [t, TAGS[t][1]]),
  ].filter(Boolean);

  const flags = (i) =>
    raw([`data-veg="${i.diet === "veg" ? 1 : 0}"`, ...usedTags.map((t) => `data-${t}="${i.tags?.includes(t) ? 1 : 0}"`)].join(" "));

  const sections = m.categories.map(
    (c) => html`    <section class="menu-section" id="${c.id}" data-cat="${c.id}" aria-labelledby="${c.id}-title">
      <div class="menu-section-head">
        ${img(c.image, { alt: "", width: 84, height: 84 })}
        <div><h2 id="${c.id}-title">${c.name}</h2>${c.blurb ? html`<p>${c.blurb}</p>` : ""}</div>
      </div>
      <ul class="menu-list">
${c.items.map(
  (i) => html`          <li class="menu-item" id="${i.id}" ${flags(i)}>
            <div class="menu-item-top">${dietMark(i.diet)}<span class="menu-item-name">${i.name}</span>${tagMarks(i.tags)}${i.popular ? html` <span class="badge-pop">Popular</span>` : ""}<span class="menu-item-dots"></span><span class="price">${money(i.price)}</span></div>
            ${i.description ? html`<p>${i.description}</p>` : ""}
          </li>
`
)}      </ul>
    </section>
`
  );

  const body = html`${pageHero(m.hero, { extra: legend })}
<div class="container">
  <div class="menu-tabs" role="tablist" aria-label="Menu categories">
    <button class="menu-tab" role="tab" data-cat="all" aria-selected="true">All</button>
${m.categories.map((c) => html`    <button class="menu-tab" role="tab" data-cat="${c.id}" aria-selected="false">${c.name}</button>\n`)}  </div>
  <div class="menu-tools">
    <label class="menu-search">${icon("search")}<span class="sr-only">Search the menu</span><input type="search" id="menu-search" placeholder="${m.searchPlaceholder || "Search dishes"}" autocomplete="off" /></label>
    ${filters.length
      ? html`<div class="diet-filters" role="group" aria-label="Dietary filters">
${filters.map(([key, label]) => html`      <label class="switch"><input type="checkbox" id="f-${key}" data-filter="${key}" /><span class="switch-track" aria-hidden="true"></span> ${label}</label>\n`)}    </div>`
      : ""}
  </div>
  <p class="menu-empty" id="menu-empty" hidden>No dishes match that. <button type="button" class="link-btn" id="menu-clear">Clear search</button></p>

  <div class="section" style="padding-top: 8px;">
${sections}    ${m.note ? html`<p class="menu-note">${m.note}</p>` : ""}
  </div>
</div>

<section class="section section--cream">
  <div class="container">
${ctaBand(site, m.cta, { delivery: true })}  </div>
</section>`;

  return { file: "menu.html", title: "Menu", description: m.description, body };
}
