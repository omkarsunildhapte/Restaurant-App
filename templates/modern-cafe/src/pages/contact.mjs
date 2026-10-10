/* Contact page: address, phone, WhatsApp, email, hours table, message form, map. */
import { html, raw, telHref, mapsDirHref, mapsEmbedSrc, googleWriteReviewHref, WEEK, DAY_NAMES, fmtRange } from "../lib.mjs";
import { qrSvg, QR_MAX_BYTES } from "../qr.mjs";
import { icon } from "../icons.mjs";
import { attrs, ext, orderHref } from "../layout.mjs";
import { pageHero, statusPill } from "../parts.mjs";

export default function contact(site) {
  const r = site.restaurant;
  const c = site.contact;
  const reviewHref = r.googlePlaceId && googleWriteReviewHref(r.googlePlaceId);
  // Button for phones; QR of the same link for desktop visitors to scan with their phone.
  // The QR holds up to 213 bytes (Place IDs up to ~160 chars); longer ones get the button only.
  const reviewQr = reviewHref && new TextEncoder().encode(reviewHref).length <= QR_MAX_BYTES ? qrSvg(reviewHref, { label: `QR code: review ${r.name} on Google`, size: 132 }) : null;
  const review = reviewHref
    ? html`<div class="review-box">
        <div>
          <h3>Enjoyed your visit?</h3>
          <p>A Google review helps other people find us.</p>
          <a class="btn btn--primary" ${raw(attrs(ext(reviewHref)))}>${icon("star")} Review us on Google</a>
        </div>
        ${reviewQr ? html`<figure class="review-qr">${raw(reviewQr)}<figcaption>Scan with your phone</figcaption></figure>` : ""}
      </div>`
    : "";
  const body = html`${pageHero(c.hero, { extra: html`<p>Want a table? <a href="book.html" class="hero-link">Book it here</a>.</p>
    ${statusPill}` })}
<section class="section">
  <div class="container contact-grid">
    <div class="contact-card reveal">
      <h2 style="font-size:1.6rem;">Find us</h2>
      <ul class="contact-list">
        <li>${icon("pin")}<div><strong>Address</strong><a ${raw(attrs(ext(mapsDirHref(r.mapsQuery))))}>${r.address.line}</a></div></li>
        <li>${icon("phone")}<div><strong>Phone</strong><a href="${telHref(r.phone)}">${r.phone}</a></div></li>
        <li>${icon("whatsapp")}<div><strong>WhatsApp</strong><a ${raw(attrs(ext(orderHref(site))))}>Message us</a></div></li>
        ${r.email ? html`<li>${icon("mail")}<div><strong>Email</strong><a href="mailto:${r.email}">${r.email}</a></div></li>` : ""}
      </ul>
      ${review}
      <h3 style="margin-top:18px;">Opening hours</h3>
      <table class="hours">
        <tbody>
${WEEK.map((d) => html`            <tr data-day="${d}"><td>${DAY_NAMES[d]}</td><td>${fmtRange(r.hours[d])}</td></tr>\n`)}        </tbody>
      </table>
    </div>

    <div class="contact-card reveal">
      <h2 style="font-size:1.6rem;">Send us a message</h2>
      <form id="contact-form" novalidate>
        <div class="form-row">
          <div class="field"><label for="name">Your name</label><input id="name" name="name" autocomplete="name" required /></div>
          <div class="field"><label for="phone">Phone (optional)</label><input id="phone" name="phone" type="tel" autocomplete="tel" inputmode="tel" /></div>
        </div>
        <div class="field">
          <label for="topic">What is it about?</label>
          <select id="topic" name="topic">
${c.topics.map((t) => html`            <option>${t}</option>\n`)}          </select>
        </div>
        <div class="field"><label for="message">Message</label><textarea id="message" name="message" required></textarea></div>
        <button class="btn btn--primary" type="submit">${icon("whatsapp")} Send via WhatsApp</button>
        <p class="form-hint">Your message opens in WhatsApp, ready to send.${r.email ? html` Prefer email? Write to <a href="mailto:${r.email}">${r.email}</a>.` : ""}</p>
        <p class="form-status" role="status" aria-live="polite"></p>
      </form>
    </div>
  </div>

  <div class="container">
    <div class="map-wrap reveal">
      <iframe title="Map showing ${r.name}" src="${mapsEmbedSrc(r.mapsQuery)}" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
    </div>
  </div>
</section>`;
  return { file: "contact.html", title: "Contact", description: c.description, body };
}
