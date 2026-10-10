import { html, jsonScript } from "../lib.mjs";

/** Shared questions: the first six show on Home, all of them on Pricing. */
export const FAQ = [
  ["Do I need to buy new hardware?", "Usually not. Billing runs on the PC, laptop, tablet or Android POS machine you already have. The kitchen screen can be any tablet or a TV with a browser, and the waiter app runs on a normal Android phone. If you need a thermal printer, we can suggest one that works."],
  ["Who sets it up?", "We do. Our team uploads your menu, sets up tables, taxes and printers, and trains your staff at your restaurant. Setup takes about one visit."],
  ["Do you take a commission on orders?", "No. You pay one fixed monthly plan. We never take a share of your orders."],
  ["What happens when the internet goes down?", "Billing keeps working offline and syncs automatically when the connection comes back."],
  ["Can I try it before paying?", "Yes. Every restaurant gets a free trial with no card needed. If it doesn't suit you, you simply stop."],
  ["I already use Petpooja or another billing software. Can I switch?", "Yes. Send us your current menu (export or photos) and we move it over for free, so you don't retype anything."],
  ["Does it make GST-compliant bills?", "Yes. Each item carries its GST rate, and bills show CGST and SGST with your GSTIN. Day-end and monthly GST reports are included."],
  ["Is there a contract?", "No long contract. Plans are monthly and you can cancel anytime. Founding prices stay locked for the period shown on the pricing page."],
  ["Is my data safe? Who can see it?", "Each restaurant's data is kept separate, and only your own staff can see it. Your menu, sales and customer data belong to you, not to us."],
  ["Do you support delivery and online orders?", "Phone and takeaway orders are supported from day one. Our own delivery riders app, partner riders and your own online ordering website are on the way — see what's ready and what's next on the home page."],
];

export function faqList(items) {
  return html`<div class="faq">
${items.map(([q, a]) => html`  <details class="faq-item"><summary>${q}</summary><p>${a}</p></details>\n`)}</div>`;
}

export function faqJsonLd(items) {
  const data = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
  };
  return html`  <script type="application/ld+json">${jsonScript(data)}</script>\n`;
}
