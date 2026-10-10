import { html, inr } from "../lib.mjs";
import { ctaBand } from "../layout.mjs";
import { FAQ, faqList, faqJsonLd } from "./faq.mjs";

const check = html`<svg class="icon-check" viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M16.7 5.3a1 1 0 0 1 0 1.4l-8 8a1 1 0 0 1-1.4 0l-4-4a1 1 0 1 1 1.4-1.4L8 12.6l7.3-7.3a1 1 0 0 1 1.4 0z"/></svg>`;

/** CSS-only picture of the product: the counter's POS bill, the waiter's phone and a kitchen ticket. */
const productMock = html`<div class="showcase" aria-hidden="true">
  <div class="device device--pos">
    <div class="mock-bar"><span></span><span></span><span></span><b>Counter · Billing</b></div>
    <div class="pos">
      <div class="pos-menu">
        <p class="pos-cats"><span class="is-on">Breakfast</span><span>Mains</span><span>Drinks</span></p>
        <div class="pos-items">
          <p><i class="veg"></i>Masala Dosa<b>₹120</b></p>
          <p><i class="veg"></i>Idli Vada<b>₹90</b></p>
          <p><i class="nonveg"></i>Chicken Roll<b>₹150</b></p>
          <p><i class="veg"></i>Filter Coffee<b>₹60</b></p>
        </div>
      </div>
      <div class="pos-bill">
        <p class="bill-title">Table 4 · GST bill</p>
        <p><span>2 × Masala Dosa</span><span>₹240</span></p>
        <p><span>1 × Chicken Roll</span><span>₹150</span></p>
        <p><span>2 × Filter Coffee</span><span>₹120</span></p>
        <p class="bill-tax"><span>CGST + SGST 5%</span><span>₹25.50</span></p>
        <p class="bill-total"><span>Total</span><span>₹536</span></p>
        <p class="bill-pay"><span>UPI</span><span>Cash</span><span>Card</span></p>
      </div>
    </div>
  </div>
  <div class="device device--phone">
    <p class="phone-head">Tables <span>Baner</span></p>
    <div class="phone-tables">
      <span class="t t--busy">T1</span><span class="t">T2</span><span class="t t--bill">T3</span>
      <span class="t t--busy">T4</span><span class="t">T5</span><span class="t t--busy">T6</span>
      <span class="t">T7</span><span class="t t--busy">T8</span><span class="t">T9</span>
    </div>
    <p class="phone-legend"><i class="lg lg--busy"></i>Occupied <i class="lg lg--bill"></i>Bill asked</p>
  </div>
  <div class="float-kot">
    <p class="kot-head"><b>KOT · Table 4</b><span>Round 2</span></p>
    <p class="float-kot-line"><i class="veg"></i>2 × Filter Coffee</p>
    <p class="float-kot-sent">Sent to kitchen ✓</p>
  </div>
</div>`;

const worksWith = ["UPI", "Cash and card", "58 mm and 80 mm thermal printers", "Android phones and tablets", "Any PC with a browser", "Works offline"];

/** One product module row: words on one side, a small screen on the other (they alternate). */
const module = (m, i) => html`<article class="module${i % 2 ? " module--flip" : ""}">
  <div class="module-text">
    <p class="kicker">${m.kicker}</p>
    <h3>${m.title}</h3>
    <p class="module-lead">${m.lead}</p>
    <ul class="checklist">${m.points.map((pt) => html`<li>${check} ${pt}</li>`)}</ul>
    <a class="link-arrow" href="features.html#${m.anchor}">More about ${m.short} →</a>
  </div>
  <div class="module-visual" aria-hidden="true">${m.visual}</div>
</article>`;

const MODULES = [
  {
    anchor: "billing",
    short: "billing",
    kicker: "At the counter",
    title: "GST bills in one tap",
    lead: "Dine-in, takeaway and phone orders on one screen. The bill works out CGST and SGST for you.",
    points: ["Split a bill by items or between payment methods", "Discounts, round-off and a packaging charge", "Close the day with a cash count and report"],
    visual: html`<div class="mini">
      <p class="mini-title">Table 9 · settle bill</p>
      <p class="mini-row"><span>Subtotal</span><span>₹1,240</span></p>
      <p class="mini-row"><span>Discount 10%</span><span>−₹124</span></p>
      <p class="mini-row"><span>CGST + SGST 5%</span><span>₹55.80</span></p>
      <p class="mini-row mini-total"><span>Total</span><span>₹1,172</span></p>
      <div class="mini-split"><p><b>UPI</b><span>₹800</span></p><p><b>Cash</b><span>₹372</span></p></div>
    </div>`,
  },
  {
    anchor: "kitchen",
    short: "the kitchen screen",
    kicker: "In the kitchen",
    title: "Every order on the kitchen screen",
    lead: "Orders arrive on a tablet or TV the moment the waiter sends them. No chits to read or lose.",
    points: ["New, preparing and ready, one tap each", "Timers show which order has waited longest", "Each new round for a table arrives as its own ticket"],
    visual: html`<div class="mini mini--kds">
      <div class="kot kot--new"><p class="kot-head"><b>Table 4</b><span>0:42</span></p><ul><li><i class="veg"></i>2 × Masala Dosa</li><li><i class="nonveg"></i>1 × Chicken Roll</li></ul><p class="kot-btn">Start</p></div>
      <div class="kot kot--cooking"><p class="kot-head"><b>Table 9</b><span>6:10</span></p><ul><li><i class="veg"></i>1 × Paneer Tikka</li><li><i class="veg"></i>3 × Naan</li></ul><p class="kot-btn">Ready</p></div>
    </div>`,
  },
  {
    anchor: "waiter",
    short: "the waiter app",
    kicker: "At the table",
    title: "Waiters order from their phone",
    lead: "Pick the table, tap the dishes, add a note like “less spicy” and send. The kitchen has it before the waiter turns around.",
    points: ["Every table's status at a glance", "Move or merge tables, ask for the bill", "Runs on the Android phones your staff already use"],
    visual: html`<div class="mini mini--phone">
      <p class="phone-head">Table 4 <span>2 guests</span></p>
      <p class="mini-row"><span><i class="veg"></i> Masala Dosa</span><span class="qty">− 2 +</span></p>
      <p class="mini-row"><span><i class="veg"></i> Filter Coffee</span><span class="qty">− 2 +</span></p>
      <p class="mini-row mini-note"><span>Note: less spicy</span></p>
      <p class="mini-send">Send to kitchen (4)</p>
    </div>`,
  },
  {
    anchor: "owner",
    short: "the owner panel",
    kicker: "For the owner",
    title: "Your restaurant on your phone",
    lead: "Today's sales, best sellers and busy hours for every outlet, even when you are not at the shop.",
    points: ["Change the menu once, every outlet updates", "Add staff and choose what each one can do", "Purchases and salaries in the same place"],
    visual: html`<div class="mini">
      <p class="mini-title">Today · all outlets</p>
      <p class="mini-big">₹48,320 <small>142 orders</small></p>
      <div class="bars"><i class="h30"></i><i class="h45"></i><i class="h80"></i><i class="h100"></i><i class="h55"></i><i class="h40"></i><i class="h70"></i><i class="h90"></i></div>
      <p class="mini-row"><span>Best seller</span><span>Masala Dosa</span></p>
    </div>`,
  },
];

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
        <a class="btn btn--outline btn--lg" href="pricing.html">See plans</a>
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

<section class="works-with" aria-label="Works with">
  <div class="container">
    <p class="works-title">Works with what you already have</p>
    <ul class="works-list">${worksWith.map((w) => html`<li>${w}</li>`)}</ul>
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
      <p>The counter, the kitchen, the waiters and you on one system. Everything updates live.</p>
    </div>
    <div class="modules">${MODULES.map(module)}</div>
    <p class="center"><a class="btn btn--outline" href="features.html">See all features</a></p>
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
