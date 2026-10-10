/* Marketing site: mobile menu, and the demo / call-back form.
   The form posts JSON to the marketing API (backend/marketing), which creates a lead in
   the Sales CRM. window.SITE is written into each page by the build. */
(function () {
  "use strict";

  // ---- Mobile menu ----
  var toggle = document.querySelector(".nav-toggle");
  var panel = document.getElementById("nav-links");
  if (toggle && panel) {
    toggle.addEventListener("click", function () {
      var open = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!open));
      toggle.setAttribute("aria-label", open ? "Open menu" : "Close menu");
      panel.classList.toggle("is-open", !open);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && panel.classList.contains("is-open")) toggle.click();
    });
  }

  // ---- Demo form ----
  var form = document.getElementById("demo-form");
  if (!form) return;
  var done = document.getElementById("demo-done");
  var errorBox = form.querySelector(".form-error");
  var button = form.querySelector('button[type="submit"]');
  var site = window.SITE || {};

  // ?plan=pro from a pricing card is kept and sent with the message.
  var plan = new URLSearchParams(location.search).get("plan");
  if (plan && /^[a-z]{2,20}$/.test(plan)) form.elements.plan.value = plan;

  function showError(text) {
    errorBox.textContent = text;
    errorBox.hidden = false;
  }

  /** 10-digit Indian mobile, from any common spelling (+91, spaces, leading 0). */
  function mobileDigits(value) {
    var d = String(value).replace(/\D/g, "");
    if (d.length === 12 && d.indexOf("91") === 0) d = d.slice(2);
    else if (d.length === 11 && d.charAt(0) === "0") d = d.slice(1);
    return /^[6-9]\d{9}$/.test(d) ? d : null;
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    errorBox.hidden = true;
    var f = form.elements;
    var restaurantName = f.restaurantName.value.trim();
    var ownerName = f.ownerName.value.trim();
    var phone = mobileDigits(f.phone.value);
    if (!restaurantName) return showError("Please add your restaurant's name."), f.restaurantName.focus();
    if (!ownerName) return showError("Please add your name."), f.ownerName.focus();
    if (!phone) return showError("Please enter a 10-digit mobile number."), f.phone.focus();
    var email = f.email.value.trim();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return showError("That email doesn't look right."), f.email.focus();

    var message = f.message ? f.message.value.trim() : "";
    if (f.plan.value) message = ("Interested in the " + f.plan.value + " plan. " + message).trim();

    var body = {
      restaurantName: restaurantName,
      ownerName: ownerName,
      phone: phone,
      email: email || null,
      restaurantType: f.restaurantType.value,
      area: f.area.value.trim() || null,
      city: f.city.value,
      message: message || null,
      website: f.website.value,
    };

    button.disabled = true;
    var label = button.textContent;
    button.textContent = "Sending…";

    fetch(site.demoApiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
      .then(function (res) {
        return res.json().catch(function () { return {}; }).then(function (data) {
          if (res.ok) return;
          if (res.status === 429) throw new Error("Too many attempts. Please try again in a few minutes.");
          var detail = data && data.details && data.details[0] && data.details[0].message;
          throw new Error(detail || data.message || "Something went wrong. Please try again.");
        });
      })
      .then(function () {
        form.hidden = true;
        done.hidden = false;
        done.focus();
      })
      .catch(function (err) {
        var text = err && err.message && err.message !== "Failed to fetch" ? err.message : "We couldn't send the form. Please check your internet and try again.";
        if (site.whatsapp) text += " You can also WhatsApp us.";
        showError(text);
      })
      .then(function () {
        button.disabled = false;
        button.textContent = label;
      });
  });
})();
