import { html } from "../lib.mjs";
import { ctaBand } from "../layout.mjs";

const NOW = "At launch";
const NEXT = "Coming next";

/** Feature groups. `status` keeps the page honest about what exists today. */
const GROUPS = [
  {
    id: "billing",
    title: "POS billing",
    lead: "Fast counter billing for dine-in, takeaway and phone orders.",
    status: NOW,
    items: [
      ["GST invoices", "Item-wise GST rates, CGST/SGST split, your GSTIN and FSSAI number on every bill."],
      ["Discounts and split bills", "Percentage or flat discounts, split by items or equally between guests."],
      ["UPI, cash and card", "Record each payment type. Static UPI QR at the counter."],
      ["Day open and close", "Opening cash, closing cash and a day-end report that shows any difference."],
      ["Thermal printers", "58 mm and 80 mm printers and cash drawers, set up by our team."],
      ["Offline mode", "Billing keeps running without internet and syncs when it's back."],
    ],
  },
  {
    id: "kitchen",
    title: "Kitchen display (KDS)",
    lead: "Every order on a screen in the kitchen, in the order it came in.",
    status: NOW,
    items: [
      ["Sound alerts", "A new order rings, so nobody misses a ticket during the rush."],
      ["Preparing → ready → served", "Cooks tap to update. The counter and waiters see the status live."],
      ["Timers", "Each order shows how long it has been waiting."],
      ["Any screen", "A tablet or a TV with a browser is enough."],
    ],
  },
  {
    id: "waiter",
    title: "Waiter / captain app",
    lead: "Take orders at the table on an Android phone.",
    status: NOW,
    items: [
      ["Table view", "See which tables are free, ordering, eating or waiting for the bill."],
      ["Send KOT in one tap", "Dishes, quantities and notes go straight to the kitchen screen."],
      ["Add more items", "Extra rounds are added to the same table's bill."],
    ],
  },
  {
    id: "owner",
    title: "Owner panel",
    lead: "Set up and watch your restaurant from anywhere.",
    status: NOW,
    items: [
      ["Menu in one place", "Categories, variants, add-ons, prices and GST. Change once, it updates on billing and kitchen."],
      ["Tables and staff", "Set up tables per floor, invite managers, cashiers, waiters and cooks with their own logins."],
      ["Reports", "Today's sales, best sellers, peak hours and payment-wise totals."],
      ["Sold out switch", "Mark an item unavailable and it disappears from the waiter app."],
    ],
  },
  {
    id: "delivery",
    title: "Delivery",
    lead: "Deliver phone orders with your own riders, or book a partner rider when yours are busy.",
    status: NEXT,
    items: [
      ["Rider app", "Your riders accept orders, mark pickup and delivery, and collect cash on delivery."],
      ["Partner riders in one tap", "Price and ETA from delivery partners, booked from the counter."],
      ["Live tracking and proof", "Rider location for the owner, delivery confirmed by OTP or photo."],
    ],
  },
  {
    id: "growth",
    title: "Growing restaurants",
    lead: "For busier kitchens and more than one outlet.",
    status: NEXT,
    items: [
      ["Inventory", "Stock deducted per dish sold, with low-stock alerts."],
      ["Chains", "Central menu for every outlet, with reports per outlet and combined."],
      ["Staff attendance", "Shifts and attendance alongside sales."],
    ],
  },
  {
    id: "online",
    title: "Your own online ordering",
    lead: "Take orders directly, without paying aggregator commission.",
    status: NEXT,
    items: [
      ["Your own website", "A ready-made design with your logo, colours, photos and menu."],
      ["QR table ordering", "Guests scan, order and pay from the table; the order reaches the kitchen."],
      ["Online payments", "UPI and card checkout, plus pay at counter and cash on delivery."],
      ["Branded customer app", "Your restaurant's own app on Android and iPhone."],
    ],
  },
];

export default function features(site) {
  return {
    file: "features.html",
    title: "Features",
    description: `Everything in ${site.brand.name}: POS billing with GST, kitchen display, waiter app, owner panel and reports — plus delivery and online ordering coming next.`,
    body: html`
<section class="page-hero">
  <div class="container narrow center">
    <p class="kicker">Features</p>
    <h1>Everything between "order taken" and "bill paid"</h1>
    <p class="lead">One system for the counter, the kitchen, the waiters and the owner. Items marked <span class="badge badge--next badge--inline">${NEXT}</span> are being built after launch.</p>
  </div>
  <nav class="container chips" aria-label="Feature groups">
    ${GROUPS.map((g) => html`<a class="chip" href="#${g.id}">${g.title}</a>`)}
  </nav>
</section>

${GROUPS.map(
  (g, i) => html`<section class="section${i % 2 ? " section--alt" : ""}" id="${g.id}">
  <div class="container feature-block">
    <div class="feature-block-head">
      <p class="badge ${g.status === NOW ? "badge--now" : "badge--next"}">${g.status}</p>
      <h2>${g.title}</h2>
      <p>${g.lead}</p>
    </div>
    <div class="feature-list">
      ${g.items.map(([t, d]) => html`<div class="feature-item"><h3>${t}</h3><p>${d}</p></div>`)}
    </div>
  </div>
</section>
`,
)}

${ctaBand(site)}`,
  };
}
