import { html, inr } from "../lib.mjs";

/** Self sign-up: the restaurant owner starts a free trial without talking to us first. The form
    posts to the platform API (POST /public/v1/signups); Supabase then emails a link to set a
    password, and the Business panel's setup wizard takes over. */
export default function signup(site) {
  const p = site.pricing;
  const f = p.founding;
  return {
    file: "signup.html",
    title: "Start your free trial",
    description: `Start a ${p.trialDays}-day free trial of ${site.brand.name}: billing, kitchen display and waiter app for your restaurant. No card needed.`,
    body: html`
<section class="page-hero page-hero--split">
  <div class="container demo-grid">
    <div>
      <p class="kicker">Free trial</p>
      <h1>Start your ${p.trialDays}-day free trial</h1>
      <p class="lead">Set up your menu, tables and staff yourself in a few minutes, or let our team do it for you. No card needed.</p>
      <ol class="demo-steps">
        <li><b>Fill in this form</b> — takes a minute.</li>
        <li><b>Check your email</b> and set your password.</li>
        <li><b>The setup wizard</b> walks you through menu, tables, GST and staff.</li>
        <li><b>Start billing</b> on any PC, tablet or Android POS.</li>
      </ol>
      <p class="demo-after">Prefer to see it first? <a href="demo.html">Book a free demo</a> and we'll come to you.</p>
    </div>
    <div class="card">
      <form class="form" id="signup-form" novalidate>
        <div class="form-grid">
          <div class="field">
            <label for="s-restaurant">Restaurant name *</label>
            <input id="s-restaurant" name="restaurantName" required minlength="2" maxlength="120" autocomplete="organization" />
          </div>
          <div class="field">
            <label for="s-owner">Your name *</label>
            <input id="s-owner" name="ownerName" required minlength="2" maxlength="120" autocomplete="name" />
          </div>
          <div class="field">
            <label for="s-email">Email *</label>
            <input id="s-email" name="email" type="email" required autocomplete="email" />
          </div>
          <div class="field">
            <label for="s-phone">Mobile</label>
            <input id="s-phone" name="phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="98220 12345" />
          </div>
          <div class="field">
            <label for="s-city">City</label>
            <input id="s-city" name="city" maxlength="80" value="Pune" autocomplete="address-level2" />
          </div>
          <div class="field">
            <label for="s-plan">Plan</label>
            <select id="s-plan" name="planId">
              ${p.plans.map((plan) => html`<option value="${plan.id}"${plan.popular ? html` selected` : ""}>${plan.name} · ${inr(f.enabled && plan.foundingPrice ? plan.foundingPrice : plan.price)}/month</option>`)}
            </select>
          </div>
          <input type="hidden" name="source" value="" />
          <div class="hp" aria-hidden="true"><label for="s-website">Website</label><input id="s-website" name="website" tabindex="-1" autocomplete="off" /></div>
        </div>
        <p class="form-error" role="alert" hidden></p>
        <button class="btn btn--primary btn--lg btn--block" type="submit">Start free trial</button>
        <p class="form-fine">Free for ${p.trialDays} days. You choose to continue after that; nothing is charged automatically. By starting you accept our <a href="terms.html">terms</a> and <a href="privacy.html">privacy policy</a>.</p>
      </form>
      <div class="form-done" id="signup-done" hidden tabindex="-1">
        <h2>Check your email</h2>
        <p>We've sent a link to <b id="signup-email"></b>. Open it to set your password, then the setup wizard takes you through your menu, tables and staff.</p>
        <p class="form-fine">No email after a few minutes? Check spam, or <a href="contact.html">contact us</a>.</p>
      </div>
    </div>
  </div>
</section>`,
  };
}
