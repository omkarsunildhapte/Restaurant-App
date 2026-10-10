import { html, inr } from "../lib.mjs";
import { ctaBand } from "../layout.mjs";
import { FAQ, faqList, faqJsonLd } from "./faq.mjs";

const check = html`<svg class="icon-check" viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M16.7 5.3a1 1 0 0 1 0 1.4l-8 8a1 1 0 0 1-1.4 0l-4-4a1 1 0 1 1 1.4-1.4L8 12.6l7.3-7.3a1 1 0 0 1 1.4 0z"/></svg>`;

export default function pricing(site) {
  const p = site.pricing;
  const f = p.founding;
  return {
    file: "pricing.html",
    title: "Pricing",
    description: `Simple monthly plans for restaurants and cafés, from ${inr(p.plans[0].foundingPrice && f.enabled ? p.plans[0].foundingPrice : p.plans[0].price)}/month. 0% commission, ${p.trialDays}-day free trial, setup done by our team.`,
    head: faqJsonLd(FAQ),
    body: html`
<section class="page-hero">
  <div class="container narrow center">
    <p class="kicker">Pricing</p>
    <h1>One fixed monthly price. 0% commission.</h1>
    <p class="lead">${p.trialDays}-day free trial, no card needed. Monthly plans, cancel anytime. Prices exclude GST.</p>
    ${f.enabled ? html`<p class="founding-note">Founding offer: the first ${f.spots} restaurants get the lower price below, locked for ${f.lockMonths} months.</p>` : ""}
  </div>
</section>

<section class="section section--tight">
  <div class="container plans">
    ${p.plans.map(
      (plan) => html`<article class="plan${plan.popular ? " plan--popular" : ""}">
      ${plan.popular ? html`<p class="plan-flag">Most popular</p>` : ""}
      <h2>${plan.name}</h2>
      <p class="plan-for">${plan.for}</p>
      <p class="plan-price">
        ${f.enabled && plan.foundingPrice
          ? html`<s>${inr(plan.price)}</s> <b>${inr(plan.foundingPrice)}</b>`
          : html`<b>${plan.pricePrefix || ""}${inr(plan.price)}</b>`}<span>/month</span>
      </p>
      ${f.enabled && plan.foundingPrice ? html`<p class="plan-note">Founding price for ${f.lockMonths} months</p>` : html`<p class="plan-note">&nbsp;</p>`}
      <a class="btn ${plan.popular ? "btn--primary" : "btn--outline"} btn--block" href="signup.html?plan=${plan.id}">Start free trial</a>
      <ul class="checklist">
        ${plan.features.map((x) => html`<li>${check} ${x}</li>`)}
      </ul>
    </article>`,
    )}
  </div>
  <div class="container">
    <div class="setup-box">
      <div>
        <h2>One-time setup: ${p.setupFee}</h2>
        <p>Done by our team at your restaurant, so you start billing from day one.</p>
      </div>
      <ul class="checklist checklist--row">
        ${p.setupIncludes.map((x) => html`<li>${check} ${x}</li>`)}
      </ul>
    </div>
  </div>
</section>

<section class="section section--alt">
  <div class="container narrow">
    <div class="section-head"><h2>What you pay today vs with us</h2><p>A rough comparison for a café doing about ₹3 lakh a month on delivery apps.</p></div>
    <div class="compare">
      <div class="compare-row compare-head"><span></span><span>Aggregator commission</span><span>${site.brand.name} Pro</span></div>
      <div class="compare-row"><span>Monthly cost</span><span>₹75,000 – ₹1,05,000<small>at 25–35% of ₹3 lakh</small></span><span><b>${inr(p.plans.find((x) => x.id === "pro").price)}</b><small>fixed, any number of orders</small></span></div>
      <div class="compare-row"><span>Customer data</span><span>Stays with the app</span><span><b>Yours</b></span></div>
      <div class="compare-row"><span>Billing, kitchen, waiter app</span><span>Not included</span><span><b>Included</b></span></div>
    </div>
    <p class="fine">Aggregators still bring you new customers. ${site.brand.name} runs your restaurant, and with online ordering (coming next) lets your regulars order from you directly.</p>
  </div>
</section>

<section class="section" id="faq">
  <div class="container narrow">
    <div class="section-head"><h2>Questions about plans</h2></div>
    ${faqList(FAQ)}
  </div>
</section>

${ctaBand(site)}`,
  };
}
