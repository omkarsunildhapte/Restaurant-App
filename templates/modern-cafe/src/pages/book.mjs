/* Table booking page. Days and slots are built in the browser from the opening hours
   (js/main.js); the booking goes out as a WhatsApp message until the backend exists. */
import { html, telHref } from "../lib.mjs";
import { icon } from "../icons.mjs";
import { pageHero, statusPill } from "../parts.mjs";

export default function book(site) {
  const r = site.restaurant;
  const b = site.booking;
  const call = html`<a href="${telHref(r.phone)}">${r.phone}</a>`;
  const body = html`${pageHero(b.hero, { short: true, extra: statusPill })}
<section class="section book-section">
  <div class="container book-grid">
    <form id="booking-form" class="contact-card book-form" novalidate>
      <fieldset class="book-step">
        <legend class="step-label"><span class="step-num">1</span>How many guests?</legend>
        <div class="guest-row">
          <div class="chips" id="b-size-chips" role="radiogroup" aria-label="Guests">
${[1, 2, 3, 4, 5, 6].map((n) => html`            <button type="button" class="chip" data-size="${n}">${n}</button>\n`)}          </div>
          <div class="stepper" aria-label="More guests">
            <button type="button" id="b-minus" aria-label="One less guest">&minus;</button>
            <output id="b-size-out" aria-live="polite">2 guests</output>
            <button type="button" id="b-plus" aria-label="One more guest">+</button>
          </div>
        </div>
        <input type="hidden" id="b-size" name="size" value="2" />
        <p class="notice" id="b-big-group" hidden>${icon("people")}<span>For more than ${b.maxOnline} guests, please call ${call} - we'll set up the space for you.</span></p>
      </fieldset>

      <fieldset class="book-step">
        <legend class="step-label"><span class="step-num">2</span>Which day?</legend>
        <div class="chips chips--days" id="b-days" role="radiogroup" aria-label="Day"></div>
        <button type="button" class="link-btn" id="b-other-date" aria-expanded="false">${icon("calendar")} Pick another date</button>
        <div class="field other-date" id="b-date-wrap" hidden>
          <label for="b-date">Date (up to 30 days ahead)</label>
          <input type="date" id="b-date" name="date" />
        </div>
      </fieldset>

      <fieldset class="book-step">
        <legend class="step-label"><span class="step-num">3</span>What time?</legend>
        <div id="b-slots" aria-label="Available times"></div>
        <p class="field-error" id="b-time-error" hidden>Please pick a time.</p>
      </fieldset>

      <fieldset class="book-step">
        <legend class="step-label"><span class="step-num">4</span>Your details</legend>
        <div class="form-row">
          <div class="field"><label for="b-name">Name</label><input id="b-name" name="name" autocomplete="name" required /><p class="field-error" hidden>Please tell us your name.</p></div>
          <div class="field"><label for="b-phone">WhatsApp number</label><input id="b-phone" name="phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="${b.phonePlaceholder}" required /><p class="field-error" hidden>Enter a valid phone number, including the country code.</p></div>
        </div>
        <div class="form-row">
          <div class="field">
            <label for="b-occasion">Occasion</label>
            <select id="b-occasion" name="occasion"><option>None</option>${b.occasions.map((o) => html`<option>${o}</option>`)}</select>
          </div>
          <div class="field">
            <label for="b-seating">Seating</label>
            <select id="b-seating" name="seating"><option>No preference</option>${b.seating.map((o) => html`<option>${o}</option>`)}</select>
          </div>
        </div>
        <div class="field"><label for="b-notes">Anything we should know? <span class="optional">(optional)</span></label><textarea id="b-notes" name="notes" style="min-height:84px" placeholder="High chair, allergies, a cake for the table..."></textarea></div>
        <label class="check"><input type="checkbox" id="b-remember" checked /> Remember my name and number on this device</label>
      </fieldset>
    </form>

    <aside class="book-side">
      <div class="contact-card summary-card" id="b-summary-card">
        <h2 class="summary-title">Your booking</h2>
        <dl class="summary-list">
          <div><dt>${icon("people")} Guests</dt><dd data-sum="size">2 guests</dd></div>
          <div><dt>${icon("calendar")} Day</dt><dd data-sum="date">-</dd></div>
          <div><dt>${icon("clock")} Time</dt><dd data-sum="time" class="muted">Pick a time</dd></div>
          <div data-sum-row="occasion" hidden><dt>${icon("heart")} Occasion</dt><dd data-sum="occasion"></dd></div>
        </dl>
        <button class="btn btn--primary btn--block" type="submit" form="booking-form">${icon("whatsapp")} Confirm on WhatsApp</button>
        <p class="form-hint">Opens WhatsApp with your booking written out - just tap send. ${b.confirmNote}</p>
      </div>

      <div class="contact-card book-done" id="b-done" hidden>
        <div class="done-icon">${icon("cup")}</div>
        <h2 class="summary-title">Almost there!</h2>
        <p>Tap <strong>send</strong> in WhatsApp and we'll confirm your table shortly.</p>
        <p class="done-line" id="b-done-line"></p>
        <button type="button" class="btn btn--ghost btn--block" id="b-ics">${icon("calendar")} Add to calendar</button>
        <button type="button" class="link-btn" id="b-again">Make another booking</button>
      </div>

      <div class="contact-card">
        <h3>Good to know</h3>
        <ul class="tick-list">
${b.rules.map((t) => html`          <li>${t}</li>\n`)}        </ul>
        <a class="btn btn--ghost btn--block" href="${telHref(r.phone)}" style="margin-top:16px">${icon("phone")} Prefer to call? ${r.phone}</a>
      </div>
    </aside>
  </div>
</section>
<div class="book-bar" id="b-bar">
  <div class="book-bar-text"><strong data-sum="short">2 guests</strong><span data-sum="bar-sub">Pick a day and time</span></div>
  <button class="btn btn--primary" type="submit" form="booking-form">${icon("whatsapp")} Confirm</button>
</div>
`;
  return { file: "book.html", title: "Book a table", description: b.description, body };
}
