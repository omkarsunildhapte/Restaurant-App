import { html } from "../lib.mjs";

const TYPES = [
  ["cafe", "Café"],
  ["family_restaurant", "Family restaurant"],
  ["qsr", "QSR / fast food"],
  ["cloud_kitchen", "Cloud kitchen"],
  ["bakery", "Bakery"],
  ["bar", "Bar / lounge"],
  ["chain", "Chain (2+ outlets)"],
  ["other", "Other"],
];

/** The demo / free-trial form. main.js posts it to the marketing API (backend/marketing),
    which creates a lead in the Sales CRM with source "website". */
export function demoForm(site, { compact = false } = {}) {
  return html`<form class="form" id="demo-form" novalidate>
  <div class="form-grid">
    <div class="field">
      <label for="f-restaurant">Restaurant name *</label>
      <input id="f-restaurant" name="restaurantName" required maxlength="160" autocomplete="organization" />
    </div>
    <div class="field">
      <label for="f-owner">Your name *</label>
      <input id="f-owner" name="ownerName" required maxlength="120" autocomplete="name" />
    </div>
    <div class="field">
      <label for="f-phone">Mobile number *</label>
      <input id="f-phone" name="phone" type="tel" inputmode="tel" required autocomplete="tel" placeholder="98220 12345" />
    </div>
    <div class="field">
      <label for="f-email">Email</label>
      <input id="f-email" name="email" type="email" autocomplete="email" />
    </div>
    <div class="field">
      <label for="f-type">Type</label>
      <select id="f-type" name="restaurantType">
        ${TYPES.map(([v, l]) => html`<option value="${v}">${l}</option>`)}
      </select>
    </div>
    <div class="field">
      <label for="f-area">Area</label>
      <input id="f-area" name="area" maxlength="120" placeholder="Baner, Kothrud…" />
    </div>
    ${compact ? "" : html`<div class="field field--full">
      <label for="f-message">Anything we should know? <span class="optional">(optional)</span></label>
      <textarea id="f-message" name="message" rows="3" maxlength="1000" placeholder="Current billing software, number of tables, best time to visit…"></textarea>
    </div>`}
    <input type="hidden" name="city" value="Pune" />
    <input type="hidden" name="plan" value="" />
    <div class="hp" aria-hidden="true"><label for="f-website">Website</label><input id="f-website" name="website" tabindex="-1" autocomplete="off" /></div>
  </div>
  <p class="form-error" role="alert" hidden></p>
  <button class="btn btn--primary btn--lg btn--block" type="submit">Book my free demo</button>
  <p class="form-fine">We'll call you within one working day to fix a time. No spam, and we never share your number.</p>
</form>
<div class="form-done" id="demo-done" hidden tabindex="-1">
  <h2>Thank you — we'll call you shortly</h2>
  <p>Someone from our team will call you within one working day to fix a demo time at your restaurant.</p>
</div>`;
}

export default function demo(site) {
  return {
    file: "demo.html",
    title: "Book a free demo",
    description: `Book a free 10-minute demo of ${site.brand.name} at your restaurant in Pune, and start a ${site.pricing.trialDays}-day free trial.`,
    body: html`
<section class="page-hero page-hero--split">
  <div class="container demo-grid">
    <div>
      <p class="kicker">Free demo</p>
      <h1>See it working at your counter in 10 minutes</h1>
      <p class="lead">We come to your restaurant at a time that suits you — usually between 3 and 5 pm, before the evening rush.</p>
      <ol class="demo-steps">
        <li><b>Take an order</b> on the waiter app, at one of your tables.</li>
        <li><b>Watch it arrive</b> on the kitchen screen, with a sound.</li>
        <li><b>Print a GST bill</b> and split it.</li>
        <li><b>See today's sales</b> on the owner dashboard.</li>
      </ol>
      <p class="demo-after">Like it? We set up your menu, printer and staff, and your ${site.pricing.trialDays}-day free trial starts.</p>
    </div>
    <div class="card">${demoForm(site)}</div>
  </div>
</section>`,
  };
}
