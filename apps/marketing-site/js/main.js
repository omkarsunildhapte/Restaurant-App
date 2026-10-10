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

  // ---- Self sign-up (free trial) ----
  var signupForm = document.getElementById("signup-form");
  if (signupForm) setUpSignup(signupForm);

  function setUpSignup(f) {
    var site = window.SITE || {};
    var box = f.querySelector(".form-error");
    var btn = f.querySelector('button[type="submit"]');
    var params = new URLSearchParams(location.search);
    var plan = params.get("plan");
    if (plan && f.elements.planId.querySelector('option[value="' + plan + '"]')) f.elements.planId.value = plan;
    // Where the visitor came from (an ad, a WhatsApp link), for the sales team.
    f.elements.source.value = (params.get("utm_source") || params.get("ref") || "").slice(0, 80);

    function fail(text, field) {
      box.textContent = text;
      box.hidden = false;
      if (field) field.focus();
    }

    f.addEventListener("submit", function (e) {
      e.preventDefault();
      box.hidden = true;
      var el = f.elements;
      var name = el.restaurantName.value.trim();
      var owner = el.ownerName.value.trim();
      var email = el.email.value.trim();
      if (name.length < 2) return fail("Please add your restaurant's name.", el.restaurantName);
      if (owner.length < 2) return fail("Please add your name.", el.ownerName);
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return fail("Please enter a valid email; we send your login link there.", el.email);
      var body = {
        restaurantName: name,
        ownerName: owner,
        email: email,
        planId: el.planId.value,
        website: el.website.value,
      };
      if (el.phone.value.trim()) body.phone = el.phone.value.trim();
      if (el.city.value.trim()) body.city = el.city.value.trim();
      if (el.source.value) body.source = el.source.value;

      btn.disabled = true;
      var label = btn.textContent;
      btn.textContent = "Starting…";
      fetch(site.signupApiUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
        .then(function (res) {
          return res.json().catch(function () { return {}; }).then(function (data) {
            if (res.status === 202 || res.ok) return;
            if (res.status === 409) {
              var err = new Error((data && data.error) || "This email already has an account.");
              err.signIn = true;
              throw err;
            }
            if (res.status === 429) throw new Error("Too many attempts from this connection. Please try again in an hour, or book a demo.");
            var detail = data && data.details && (Array.isArray(data.details) ? data.details[0] && (data.details[0].message || data.details[0]) : null);
            throw new Error(detail || (data && data.error) || "Something went wrong. Please try again.");
          });
        })
        .then(function () {
          document.getElementById("signup-email").textContent = email;
          f.hidden = true;
          var done = document.getElementById("signup-done");
          done.hidden = false;
          done.focus();
        })
        .catch(function (err) {
          if (err && err.signIn && site.businessPanelUrl) {
            box.innerHTML = "";
            box.appendChild(document.createTextNode(err.message + " "));
            var a = document.createElement("a");
            a.href = site.businessPanelUrl;
            a.textContent = "Sign in";
            box.appendChild(a);
            box.hidden = false;
            return;
          }
          fail(err && err.message && err.message !== "Failed to fetch" ? err.message : "We couldn't reach our server. Please check your internet and try again.");
        })
        .then(function () {
          btn.disabled = false;
          btn.textContent = label;
        });
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
