/* About page: hero, story blocks (image + text, alternating), promises, call to action. */
import { html, raw } from "../lib.mjs";
import { SPRIG } from "../icons.mjs";
import { img, ctaBand, valueCards, pageHero } from "../parts.mjs";

export default function about(site) {
  const a = site.about;
  const blocks = a.blocks.map((b, i) => {
    const reverse = i % 2 === 1;
    return html`<section class="section${reverse ? " section--cream" : " has-sprig has-sprig--left"}">
  ${reverse ? "" : SPRIG}
  <div class="container split${reverse ? " split--reverse" : ""}">
    <div class="split-media reveal">
      ${img(b.image, { sizes: "(max-width: 860px) 100vw, 560px" })}
      ${b.badge ? html`<div class="badge-float"><b>${b.badge.big}</b>${b.badge.small}</div>` : ""}
    </div>
    <div class="reveal">
      <span class="eyebrow">${b.eyebrow}</span>
      ${b.script ? html`<p class="script script--green" style="margin-top:-4px">${b.script}</p>` : ""}
      <h2>${b.title}</h2>
      ${b.paragraphs.map((p) => html`<p>${p}</p>\n      `)}
    </div>
  </div>
</section>
`;
  });

  const body = html`${pageHero(a.hero)}
${blocks}
${a.values
  ? html`<section class="section">
  <div class="container">
    <div class="center reveal">
      <span class="eyebrow">${a.values.eyebrow}</span>
      <h2>${a.values.title}</h2>
    </div>
    <div class="values">
${valueCards(a.values.items)}    </div>
  </div>
</section>
`
  : ""}
<section class="section section--cream">
  <div class="container">
${ctaBand(site, a.cta)}  </div>
</section>`;
  return { file: "about.html", title: "Our story", description: a.description, body };
}
