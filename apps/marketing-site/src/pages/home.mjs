import { html, inr } from "../lib.mjs";
import { ctaBand } from "../layout.mjs";
import { FAQ, faqList, faqJsonLd } from "./faq.mjs";

const check = html`<svg class="icon-check" viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M16.7 5.3a1 1 0 0 1 0 1.4l-8 8a1 1 0 0 1-1.4 0l-4-4a1 1 0 1 1 1.4-1.4L8 12.6l7.3-7.3a1 1 0 0 1 1.4 0z"/></svg>`;

/** A small, CSS-only picture of the product: a KOT on the kitchen screen and the bill. */
const productMock = html`<div class="mock" aria-hidden="true">
  <div class="mock-window">
    <div class="mock-bar"><span></span><span></span><span></span><b>Kitchen display</b></div>
    <div class="mock-kds">
      <div class="kot kot--new">
        <p class="kot-head"><b>Table 4</b><span>New · 0:42</span></p>
        <ul><li><i class="veg"></i>2 × Masala Dosa</li><li><i class="veg"></i>1 × Filter Coffee</li><li><i class="nonveg"></i>1 × Chicken Roll</li></ul>
        <p class="kot-btn">Start preparing</p>
      </div>
      <div class="kot kot--cooking">
        <p class="kot-head"><b>Table 9</b><span>Preparing · 6:10</span></p>
        <ul><li><i class="veg"></i>1 × Paneer Tikka</li><li><i class="veg"></i>3 × Butter Naan</li></ul>
        <p class="kot-btn">Mark ready</p>
      </div>
      <div class="kot kot--ready">
        <p class="kot-head"><b>Parcel #27</b><span>Ready</span></p>
        <ul><li><i class="veg"></i>2 × Veg Biryani</li></ul>
        <p class="kot-btn">Served</p>
      </div>
    </div>
  </div>
  <div class="mock-bill">
    <p class="bill-title">Table 4 · GST invoice</p>
    <p><span>Subtotal</span><span>₹540</span></p>
    <p><span>CGST 2.5%</span><span>₹13.50</span></p>
    <p><span>SGST 2.5%</span><span>₹13.50</span></p>
    <p class="bill-total"><span>Total</span><span>₹567</span></p>
    <p class="bill-pay"><span>UPI</span><span>Cash</span><span>Card</span></p>
  </div>
</div>`;

export default function home(site) {
  const f = site.pricing.founding;
  const starter = site.pricing.plans.find((p) => p.id === "starter");
  return {
    file: "index.html",
    title: "",
    description: `${site.brand.name} is billing (POS), kitchen display and waiter app software for Indian cafés and restaurants. 0% commission, GST bills, setup done for you. Now onboarding in Pune.`,
    head: faqJsonLd(FAQ.slice(0, 6)),
    body: html`
<section class="hero">
  <div class="container hero-grid">
    <div>
      <p class="eyebrow"><span class="dot"></span> Now onboarding cafés and restaurants in Pune</p>
      <h1>Run your restaurant from order to bill — <span class="hl">without paying commission</span></h1>
      <p class="lead">Waiter app, kitchen screen and GST billing in one system. Orders reach the kitchen in seconds, bills print in one tap, and you see today's sales on your phone.</p>
      <div class="hero-actions">
        <a class="btn btn--primary btn--lg" href="demo.html">Book a free demo</a>
        <a class="btn btn--outline btn--lg" href="signup.html">Start free trial</a>
      </div>
      <ul class="hero-points">
        <li>${check} ${site.pricing.trialDays}-day free trial</li>
        <li>${check} We set it up for you</li>
        <li>${check} Plans from ${inr(f.enabled && starter.foundingPrice ? starter.foundingPrice : starter.price)}/month</li>
      </ul>
    </div>
    ${productMock}
  </div>
</section>

<section class="section section--tight stats">
  <div class="container stats-grid">
    <div class="stat"><p class="stat-num">25–35%</p><p>of each Zomato / Swiggy order can go to the aggregator once ads, discounts and GST are added.</p></div>
    <div class="stat"><p class="stat-num">~13%</p><p>of listed restaurants in India have their own website (Rentech, April 2026). Most depend on apps they don't control.</p></div>
    <div class="stat"><p class="stat-num">0%</p><p>commission with ${site.brand.name}. One fixed monthly plan, and your customer data stays yours.</p></div>
  </div>
</section>

<section class="section">
  <div class="container">
    <div class="section-head">
      <p class="kicker">How it works</p>
      <h2>One order, from table to bill</h2>
      <p>No more shouting orders into the kitchen or rewriting chits at the counter.</p>
    </div>
    <ol class="steps">
      <li class="step"><span class="step-num">1</span><h3>Waiter takes the order</h3><p>Pick the table on the phone app, tap the dishes, add notes like "less spicy". Send.</p></li>
      <li class="step"><span class="step-num">2</span><h3>Kitchen sees it instantly</h3><p>The order (KOT) appears on the kitchen screen with a sound. Cooks mark it preparing, then ready.</p></li>
      <li class="step"><span class="step-num">3</span><h3>Counter prints the bill</h3><p>GST bill in one tap. Split it, add a discount, take UPI, cash or card. Close the day with a cash report.</p></li>
      <li class="step"><span class="step-num">4</span><h3>Owner sees everything</h3><p>Today's sales, best sellers and peak hours on your phone, even when you are not at the shop.</p></li>
    </ol>
  </div>
</section>

<section class="section section--alt">
  <div class="container">
    <div class="section-head">
      <p class="kicker">Everything in one system</p>
      <h2>Built for how Indian restaurants actually work</h2>
    </div>
    <div class="feature-grid">
      <article class="feature"><h3>POS billing</h3><p>GST invoices, discounts, split bills, dine-in, takeaway and phone orders. Works on a PC, tablet or Android POS machine.</p></article>
      <article class="feature"><h3>Kitchen display (KDS)</h3><p>Live orders on a tablet or TV in the kitchen, with sound alerts and timers. No lost chits.</p></article>
      <article class="feature"><h3>Waiter app</h3><p>Captains take orders at the table on an Android phone and send them straight to the kitchen.</p></article>
      <article class="feature"><h3>Thermal printers</h3><p>58 mm and 80 mm printers and cash drawers. Our team sets them up on site.</p></article>
      <article class="feature"><h3>Owner dashboard</h3><p>Sales, best sellers, peak hours and staff, per outlet. Change the menu once, it updates everywhere.</p></article>
      <article class="feature"><h3>Works when the internet doesn't</h3><p>Billing keeps running offline and syncs when the connection is back.</p></article>
    </div>
    <p class="center"><a class="link-arrow" href="features.html">All features →</a></p>
  </div>
</section>

<section class="section">
  <div class="container">
    <div class="section-head">
      <p class="kicker">Made for</p>
      <h2>Cafés, family restaurants, QSRs and cloud kitchens</h2>
    </div>
    <div class="segments">
      <div class="segment"><h3>Cafés</h3><p>20–60 seats, quick table turns, counter plus table service.</p></div>
      <div class="segment"><h3>Family restaurants</h3><p>Big menus, busy weekends, still on paper or old billing software.</p></div>
      <div class="segment"><h3>QSR &amp; fast food</h3><p>Fast counter billing and kitchen tickets for momos, rolls, pizza, chaat.</p></div>
      <div class="segment"><h3>Cloud kitchens</h3><p>Heavy delivery volume and aggregator commission that eats the margin.</p></div>
    </div>
  </div>
</section>

<section class="section section--alt">
  <div class="container">
    <div class="section-head">
      <p class="kicker">What's ready, what's next</p>
      <h2>We're building in the open</h2>
      <p>We launch with what a dine-in restaurant needs every day, then add delivery and online ordering.</p>
    </div>
    <div class="roadmap">
      <div class="roadmap-col">
        <p class="badge badge--now">At launch</p>
        <ul class="checklist">
          <li>${check} POS billing with GST invoices</li>
          <li>${check} Kitchen display (KDS)</li>
          <li>${check} Waiter / captain app</li>
          <li>${check} Thermal printer and cash drawer</li>
          <li>${check} Owner panel: menu, tables, staff, reports</li>
        </ul>
      </div>
      <div class="roadmap-col">
        <p class="badge badge--next">Coming next</p>
        <ul class="checklist checklist--muted">
          <li>${check} Own delivery riders app, plus one-tap partner riders</li>
          <li>${check} Inventory and stock alerts</li>
          <li>${check} Multi-outlet chains</li>
          <li>${check} Your own website, QR table ordering and online payments</li>
          <li>${check} Your own branded customer app</li>
        </ul>
      </div>
    </div>
  </div>
</section>

${f.enabled ? html`<section class="section">
  <div class="container">
    <div class="offer">
      <div>
        <p class="kicker">Founding offer</p>
        <h2>First ${f.spots} restaurants: lower price, locked for ${f.lockMonths} months</h2>
        <p>${site.pricing.plans.filter((p) => p.foundingPrice).map((p, i) => html`${i ? " · " : ""}${p.name} <s>${inr(p.price)}</s> <b>${inr(p.foundingPrice)}</b>/month`)}. ${site.pricing.trialDays}-day free trial, no card needed. Switching from Petpooja? We move your menu over for free.</p>
      </div>
      <a class="btn btn--primary btn--lg" href="demo.html">Claim a founding spot</a>
    </div>
  </div>
</section>` : ""}

<section class="section section--alt">
  <div class="container narrow">
    <div class="section-head"><p class="kicker">Questions</p><h2>Frequently asked</h2></div>
    ${faqList(FAQ.slice(0, 6))}
    <p class="center"><a class="link-arrow" href="pricing.html#faq">More questions on the pricing page →</a></p>
  </div>
</section>

${ctaBand(site)}`,
  };
}
