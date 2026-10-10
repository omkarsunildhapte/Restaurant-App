import { html, safeUrl, waHref } from "../lib.mjs";
import { demoForm } from "./demo.mjs";

export default function contact(site) {
  const c = site.contact;
  const ways = [
    c.phone && html`<a class="contact-way" href="${safeUrl("tel:" + c.phone.replace(/\s/g, ""))}"><b>Call</b><span>${c.phone}</span></a>`,
    c.whatsapp && html`<a class="contact-way" href="${waHref(c.whatsapp, `Hi, I'd like to know more about ${site.brand.name}`)}" target="_blank" rel="noopener"><b>WhatsApp</b><span>Message us any time</span></a>`,
    c.email && html`<a class="contact-way" href="${safeUrl("mailto:" + c.email)}"><b>Email</b><span>${c.email}</span></a>`,
  ].filter(Boolean);
  return {
    file: "contact.html",
    title: "Contact",
    description: `Contact ${site.brand.company} in ${c.city}: questions, demos and support for ${site.brand.name}.`,
    body: html`
<section class="page-hero page-hero--split">
  <div class="container demo-grid">
    <div>
      <p class="kicker">Contact</p>
      <h1>Talk to a real person in Pune</h1>
      <p class="lead">Questions about plans, switching from your current software, or support for your restaurant — leave your number and we'll call you back.</p>
      ${ways.length ? html`<div class="contact-ways">${ways}</div>` : ""}
      <dl class="contact-facts">
        <div><dt>Office</dt><dd>${site.brand.company}, ${c.city}</dd></div>
        <div><dt>Hours</dt><dd>${c.hours}</dd></div>
      </dl>
    </div>
    <div class="card">
      <h2 class="card-title">Request a call back</h2>
      ${demoForm(site, { compact: false })}
    </div>
  </div>
</section>`,
  };
}
