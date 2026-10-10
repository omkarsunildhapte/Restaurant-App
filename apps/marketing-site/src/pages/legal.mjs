import { html, safeUrl } from "../lib.mjs";

/* Privacy, terms and refund pages. These are working drafts written from how the product
   is planned to work; they carry a visible "draft" note until reviewed by a lawyer.
   Payment gateways (Razorpay) need all three pages live before they approve an account. */

const UPDATED = "10 October 2026";

function legalPage(site, file, title, description, sections) {
  const c = site.contact;
  const contactLine = c.email
    ? html`email <a href="${safeUrl("mailto:" + c.email)}">${c.email}</a>`
    : html`use the form on our <a href="contact.html">contact page</a>`;
  return {
    file,
    title,
    description,
    body: html`
<section class="page-hero page-hero--plain">
  <div class="container narrow">
    <h1>${title}</h1>
    <p class="muted">Last updated ${UPDATED}</p>
    <p class="draft-note">Draft: this page is being reviewed before launch and may change.</p>
  </div>
</section>
<section class="section section--tight">
  <div class="container narrow prose">
    ${sections(site)}
    <h2>Contact</h2>
    <p>${site.brand.company}, ${c.city}, India. For any question about this page, ${contactLine}.</p>
  </div>
</section>`,
  };
}

export const privacy = (site) =>
  legalPage(site, "privacy.html", "Privacy policy", `How ${site.brand.company} collects, uses and protects data on ${site.brand.name}.`, (s) => html`
    <p>This policy explains what personal data ${s.brand.company} ("we") collects through this website and the ${s.brand.name} software, why, and what choices you have. We follow India's Digital Personal Data Protection Act, 2023.</p>
    <h2>Data we collect</h2>
    <ul>
      <li><b>Demo and contact forms:</b> your name, restaurant name, mobile number, email, area and any message you write.</li>
      <li><b>Restaurant accounts:</b> business details (name, GSTIN, FSSAI number, address), and the names, phone numbers and emails of the owner and staff who use the software.</li>
      <li><b>Restaurant operations data:</b> menus, tables, orders, bills and payments recorded in the software.</li>
      <li><b>Technical data:</b> basic logs such as IP address and browser type, used to keep the service secure.</li>
    </ul>
    <h2>How we use it</h2>
    <ul>
      <li>To call you back, arrange a demo and set up your account.</li>
      <li>To run the software for your restaurant and provide support.</li>
      <li>To send service messages (for example trial and billing reminders) by phone, WhatsApp or email.</li>
    </ul>
    <p>We do not sell personal data, and we do not use your restaurant's customer or sales data for advertising.</p>
    <h2>Restaurant data belongs to the restaurant</h2>
    <p>Orders, bills, menus and any customer details a restaurant records belong to that restaurant. We process them only to provide the service, and each restaurant's data is kept separate from every other restaurant's.</p>
    <h2>Sharing</h2>
    <p>We share data only with service providers we need to run the service (for example cloud hosting, SMS/WhatsApp and payment providers), under agreements that protect it, or when the law requires it.</p>
    <h2>Storage and security</h2>
    <p>Data is stored with reputable cloud providers, protected in transit with HTTPS, and access is limited to people who need it. We keep data while your account is active and for as long as tax and accounting laws require afterwards.</p>
    <h2>Your rights</h2>
    <p>You can ask us to see, correct or delete your personal data, or withdraw consent for marketing messages, at any time.</p>`);

export const terms = (site) =>
  legalPage(site, "terms.html", "Terms of service", `Terms for using ${site.brand.name} by ${site.brand.company}.`, (s) => html`
    <p>These terms apply when a restaurant ("you") uses ${s.brand.name}, provided by ${s.brand.company} ("we"). By starting a trial or a paid plan you agree to them.</p>
    <h2>The service</h2>
    <p>${s.brand.name} is software for running a restaurant: billing, kitchen display, waiter app, owner panel and related features described on our <a href="features.html">features page</a>. Features marked "coming next" are not yet part of the service.</p>
    <h2>Trial and plans</h2>
    <ul>
      <li>New restaurants get a ${s.pricing.trialDays}-day free trial. No payment details are needed for the trial.</li>
      <li>After the trial, the chosen plan is billed monthly in advance at the price on our <a href="pricing.html">pricing page</a>, plus GST.</li>
      <li>A one-time setup fee covers menu upload, printer setup and staff training.</li>
      <li>Founding prices stay fixed for the period stated when you sign up, as long as the plan is paid without a break.</li>
    </ul>
    <h2>Your responsibilities</h2>
    <ul>
      <li>Keep logins private and remove staff who leave.</li>
      <li>Make sure prices, tax rates and bill details you enter are correct. You remain responsible for your GST filings and other legal obligations.</li>
      <li>Use the service only for lawful business.</li>
    </ul>
    <h2>Availability</h2>
    <p>We work to keep the service running at all times, and billing continues offline during internet outages. We may need short maintenance windows, which we schedule outside busy hours where possible.</p>
    <h2>Your data</h2>
    <p>Your restaurant's data belongs to you. See our <a href="privacy.html">privacy policy</a>.</p>
    <h2>Ending the service</h2>
    <p>You can cancel anytime; see our <a href="refund.html">refund and cancellation policy</a>. We may suspend an account for unpaid bills after reminders, or for misuse.</p>
    <h2>Liability</h2>
    <p>Our total liability for any claim is limited to the fees you paid us in the three months before the claim. We are not liable for indirect losses such as lost profits.</p>
    <h2>Law</h2>
    <p>These terms are governed by Indian law, and courts in Pune have jurisdiction.</p>`);

export const refund = (site) =>
  legalPage(site, "refund.html", "Refund and cancellation policy", `How cancellations and refunds work for ${site.brand.name} plans.`, (s) => html`
    <h2>Free trial</h2>
    <p>The ${s.pricing.trialDays}-day trial is free. If you don't continue, nothing is charged.</p>
    <h2>Cancelling a plan</h2>
    <ul>
      <li>Plans are monthly. You can cancel anytime by calling or messaging us.</li>
      <li>Cancellation takes effect at the end of the month already paid for; you keep access until then.</li>
      <li>There is no cancellation fee and no long-term contract.</li>
    </ul>
    <h2>Refunds</h2>
    <ul>
      <li>Monthly plan fees already paid are not refunded for a partly used month.</li>
      <li>If you were charged twice or charged by mistake, we refund the extra amount in full to the original payment method within 7 working days of confirming it.</li>
      <li>The one-time setup fee is refundable only if we have not yet visited your restaurant to do the setup.</li>
    </ul>
    <h2>Hardware</h2>
    <p>Printers, tablets or other hardware bought from third parties follow the seller's own warranty and return policy.</p>`);

export const notFound = (site) => ({
  file: "404.html",
  title: "Page not found",
  description: "This page does not exist.",
  noindex: true,
  body: html`
<section class="page-hero">
  <div class="container narrow center">
    <p class="kicker">404</p>
    <h1>This page isn't on the menu</h1>
    <p class="lead">The link may be old or mistyped.</p>
    <p class="hero-actions hero-actions--center"><a class="btn btn--primary" href="index.html">Go to home</a> <a class="btn btn--outline" href="demo.html">Book a demo</a></p>
  </div>
</section>`,
});
