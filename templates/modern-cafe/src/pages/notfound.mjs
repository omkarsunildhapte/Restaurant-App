/* 404 page (Cloudflare serves it for unknown paths: not_found_handling = "404-page"). */
import { html } from "../lib.mjs";
import { img } from "../parts.mjs";

export default function notFound(site) {
  const n = site.notFound;
  const body = html`<section class="page-hero page-hero--image nf">
  ${img(n.image, { cls: "page-hero-bg", lazy: false })}
  <div class="container">
    <span class="eyebrow">Error 404</span>
    <h1>${n.title}</h1>
    <p>The page you're looking for isn't here - it may have moved. Let's get you somewhere useful.</p>
    <div class="hero-actions" style="margin-top:24px">
      <a class="btn btn--primary" href="index.html">Back to home</a>
      <a class="btn btn--ghost" href="menu.html">See the menu</a>
    </div>
  </div>
</section>`;
  return { file: "404.html", title: "Page not found", description: "This page does not exist. Find our menu, book a table or get directions.", body };
}
