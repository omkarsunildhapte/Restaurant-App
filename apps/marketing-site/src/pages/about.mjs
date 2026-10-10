import { html } from "../lib.mjs";
import { ctaBand } from "../layout.mjs";

export default function about(site) {
  return {
    file: "about.html",
    title: "About us",
    description: `${site.brand.company} builds ${site.brand.name}, restaurant software made in Pune for Indian cafés and restaurants.`,
    body: html`
<section class="page-hero">
  <div class="container narrow center">
    <p class="kicker">About us</p>
    <h1>Restaurant software, built in Pune for Indian restaurants</h1>
    <p class="lead">${site.brand.company} is a small software company in ${site.contact.city}. We build ${site.brand.name} so that independent cafés and restaurants get the same tools as big chains — at a price that makes sense for one outlet.</p>
  </div>
</section>

<section class="section section--tight">
  <div class="container narrow prose">
    <h2>Why we're building this</h2>
    <p>Most restaurant owners we meet run their day on paper chits, an old billing machine and a phone full of WhatsApp orders. Delivery apps bring customers, but they can take a quarter or more of every order, and the customer relationship stays with the app.</p>
    <p>We think a restaurant should own its orders, its customers and its numbers. ${site.brand.name} starts with the basics every restaurant needs daily — billing, the kitchen screen and the waiter app — and grows into delivery and direct online ordering, all at 0% commission.</p>

    <h2>How we work</h2>
    <ul>
      <li><b>We set it up for you.</b> Menu, printers and staff training are done by our team, at your restaurant.</li>
      <li><b>Local support.</b> We're in Pune, so when something needs fixing, we can come over.</li>
      <li><b>Fair pricing.</b> A fixed monthly plan. No commission, no long contract.</li>
      <li><b>Built with restaurants.</b> Our first cafés use it free during the pilot and tell us what to fix before anyone else pays.</li>
    </ul>
  </div>
</section>

<section class="section section--alt">
  <div class="container">
    <div class="values">
      <div class="value"><p class="value-num">0%</p><p>commission, on every order</p></div>
      <div class="value"><p class="value-num">1 visit</p><p>to set up menu, printer and staff</p></div>
      <div class="value"><p class="value-num">${site.pricing.trialDays} days</p><p>free trial before you pay anything</p></div>
    </div>
  </div>
</section>

${ctaBand(site)}`,
  };
}
