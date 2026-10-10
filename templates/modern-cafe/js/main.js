/* Modern Café template - shared behaviour for every page.
   Everything here is progressive: the site reads fine with JavaScript off. */

// ---- Restaurant details: written into every page by build.mjs from restaurant.json ----
const CAFE = JSON.parse(document.getElementById("site-data")?.textContent || "{}");
// hours: 0 = Sunday ... 6 = Saturday. [open, close] in 24h "HH:MM"; null = closed all day.
CAFE.hours ||= {};
CAFE.booking ||= {};
const KEY = (name) => `${CAFE.slug || "site"}-${name}`;

document.documentElement.classList.remove("no-js");

// ---- Header: tighter with a shadow once the page scrolls ----
const siteHeader = document.querySelector(".site-header");
if (siteHeader) {
  const onScroll = () => siteHeader.classList.toggle("scrolled", window.scrollY > 12);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
}

// ---- Mobile navigation ----
const toggle = document.querySelector(".nav-toggle");
const links = document.querySelector(".nav-links");
if (toggle && links) {
  toggle.addEventListener("click", () => {
    const open = links.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(open));
  });
  links.addEventListener("click", (e) => {
    if (e.target.closest("a")) {
      links.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
    }
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && links.classList.contains("open")) {
      links.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.focus();
    }
  });
}

// ---- Open now / closed (uses the visitor's clock) ----
function toMinutes(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}
function format(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  const suffix = h >= 12 ? "pm" : "am";
  const hour = h % 12 || 12;
  return m ? `${hour}:${String(m).padStart(2, "0")} ${suffix}` : `${hour} ${suffix}`;
}
function openStatus(now = new Date()) {
  const day = now.getDay();
  const mins = now.getHours() * 60 + now.getMinutes();
  const today = CAFE.hours[day];
  if (today && mins >= toMinutes(today[0]) && mins < toMinutes(today[1])) {
    return { open: true, text: `Open now · until ${format(today[1])}` };
  }
  if (today && mins < toMinutes(today[0])) {
    return { open: false, text: `Closed · opens today at ${format(today[0])}` };
  }
  for (let i = 1; i <= 7; i++) {
    const next = CAFE.hours[(day + i) % 7];
    if (next) {
      const label = i === 1 ? "tomorrow" : ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][(day + i) % 7];
      return { open: false, text: `Closed · opens ${label} at ${format(next[0])}` };
    }
  }
  return { open: false, text: "Closed" };
}
const status = openStatus();
document.querySelectorAll("[data-open-status]").forEach((el) => {
  el.querySelector(".status-dot")?.classList.add(status.open ? "open" : "closed");
  const label = el.querySelector(".status-text");
  if (label) label.textContent = status.text;
  el.classList.remove("status-pending");
});
document.querySelectorAll(".hours tr[data-day]").forEach((row) => {
  if (Number(row.dataset.day) === new Date().getDay()) row.classList.add("today");
});

// ---- Scroll reveal ----
const revealEls = document.querySelectorAll(".reveal");
if ("IntersectionObserver" in window && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          io.unobserve(entry.target);
        }
      });
    },
    { rootMargin: "0px 0px -8% 0px" }
  );
  revealEls.forEach((el) => io.observe(el));
} else {
  revealEls.forEach((el) => el.classList.add("visible"));
}

// ---- Menu category tabs (menu.html) ----
const tabs = document.querySelectorAll(".menu-tab");
if (tabs.length) {
  const sections = document.querySelectorAll(".menu-section");
  const show = (cat) => {
    tabs.forEach((t) => t.setAttribute("aria-selected", String(t.dataset.cat === cat)));
    sections.forEach((s) => (s.hidden = cat !== "all" && s.dataset.cat !== cat));
  };
  tabs.forEach((t) => t.addEventListener("click", () => show(t.dataset.cat)));
  const fromHash = () => {
    const cat = location.hash.replace("#", "");
    if ([...tabs].some((t) => t.dataset.cat === cat)) show(cat);
  };
  fromHash();
  window.addEventListener("hashchange", fromHash);
}

// ---- Contact form → WhatsApp (no server needed) ----
// A static site can't send email by itself. The message opens in WhatsApp, already
// written, and the visitor just taps send.
const form = document.querySelector("#contact-form");
if (form) {
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    const lines = [
      `Hi ${CAFE.name}!`,
      `Name: ${data.get("name")}`,
      data.get("phone") ? `Phone: ${data.get("phone")}` : null,
      `About: ${data.get("topic")}`,
      "",
      String(data.get("message")).trim(),
    ].filter((l) => l !== null);
    const url = `https://wa.me/${CAFE.whatsapp}?text=${encodeURIComponent(lines.join("\n"))}`;
    window.open(url, "_blank", "noopener");
    const note = form.querySelector(".form-status");
    if (note) note.textContent = "WhatsApp has opened with your message - just tap send. Thank you!";
    form.reset();
  });
}

// ---- Footer year ----
document.querySelectorAll("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));

// ---- Announcement bar: closable, stays closed for this visitor ----
const announce = document.querySelector("#announce");
if (announce) {
  let closed = false;
  try {
    closed = localStorage.getItem(KEY("announce-closed")) === "1";
  } catch (err) {
    /* storage blocked - show the bar */
  }
  if (closed) announce.hidden = true;
  announce.querySelector(".announce-close").addEventListener("click", () => {
    announce.hidden = true;
    try {
      localStorage.setItem(KEY("announce-closed"), "1");
    } catch (err) {
      /* fine - it just shows again next visit */
    }
  });
}

// ---- Menu search + diet filters (menu.html) ----
// Works together with the category tabs: a dish shows when it matches the search, every
// ticked diet filter, and the selected tab. Sections with nothing left are hidden.
const menuSearch = document.querySelector("#menu-search");
if (menuSearch) {
  const filters = [...document.querySelectorAll(".diet-filters input")];
  const empty = document.querySelector("#menu-empty");
  const items = [...document.querySelectorAll(".menu-item")];
  const norm = (t) => t.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  items.forEach((li) => (li.dataset.text = norm(li.textContent)));

  function filterMenu() {
    const q = norm(menuSearch.value.trim());
    const need = filters.filter((f) => f.checked).map((f) => f.dataset.filter);
    const activeTab = document.querySelector('.menu-tab[aria-selected="true"]')?.dataset.cat || "all";
    let shown = 0;
    document.querySelectorAll(".menu-section").forEach((sec) => {
      const inTab = activeTab === "all" || sec.dataset.cat === activeTab;
      let visible = 0;
      sec.querySelectorAll(".menu-item").forEach((li) => {
        const ok = (!q || li.dataset.text.includes(q)) && need.every((k) => li.dataset[k] === "1");
        li.hidden = !ok;
        if (ok) visible++;
      });
      sec.hidden = !inTab || visible === 0;
      if (!sec.hidden) shown += visible;
    });
    empty.hidden = shown > 0;
  }

  menuSearch.addEventListener("input", () => {
    // Searching looks across the whole menu, not just the open tab.
    if (menuSearch.value.trim()) {
      const all = document.querySelector('.menu-tab[data-cat="all"]');
      if (all && all.getAttribute("aria-selected") !== "true") all.click();
    }
    filterMenu();
  });
  filters.forEach((f) => f.addEventListener("change", filterMenu));
  document.querySelectorAll(".menu-tab").forEach((t) => t.addEventListener("click", () => setTimeout(filterMenu)));
  document.querySelector("#menu-clear").addEventListener("click", () => {
    menuSearch.value = "";
    filters.forEach((f) => (f.checked = false));
    filterMenu();
    menuSearch.focus();
  });
}

// ---- Table booking (book.html) ----
// Days and time slots come from CAFE.hours, so changing the hours in restaurant.json changes what
// can be booked. Nothing is stored on a server: the booking goes out as a WhatsApp
// message the café confirms by hand.
const booking = document.querySelector("#booking-form");
if (booking) {
  const $ = (sel) => document.querySelector(sel);
  const MAX_ONLINE = CAFE.booking.maxOnline ?? 10;
  const LAST_BOOKING_BEFORE_CLOSE = CAFE.booking.lastBookingBeforeClose ?? 60; // minutes
  const NOTICE = CAFE.booking.notice ?? 30; // minutes ahead for same-day bookings
  const DURATION = CAFE.booking.durationMinutes ?? 90; // length of the calendar entry
  const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const state = { size: 2, date: null, time: null, mins: null };

  const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const fromIso = (s) => {
    const [y, m, d] = s.split("-").map(Number);
    return new Date(y, m - 1, d);
  };
  const label = (mins) => format(`${Math.floor(mins / 60)}:${String(mins % 60).padStart(2, "0")}`);
  const guests = (n) => (n === 1 ? "1 guest" : `${n} guests`);
  const longDate = (d) => d.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" });

  /** Bookable slots for a day: [{mins, label}] - empty when closed or fully past. */
  function slotsFor(day) {
    const hours = CAFE.hours[day.getDay()];
    if (!hours) return [];
    let start = toMinutes(hours[0]);
    const end = toMinutes(hours[1]) - LAST_BOOKING_BEFORE_CLOSE;
    if (iso(day) === iso(new Date())) {
      const now = new Date();
      start = Math.max(start, Math.ceil((now.getHours() * 60 + now.getMinutes() + NOTICE) / 30) * 30);
    }
    const out = [];
    for (let t = start; t <= end; t += 30) out.push({ mins: t, label: label(t) });
    return out;
  }

  // ---- Guests ----
  const sizeInput = $("#b-size");
  function setSize(n) {
    state.size = Math.min(20, Math.max(1, n));
    sizeInput.value = state.size;
    $("#b-size-out").textContent = guests(state.size);
    document.querySelectorAll("#b-size-chips .chip").forEach((c) => c.setAttribute("aria-pressed", String(Number(c.dataset.size) === state.size)));
    $("#b-big-group").hidden = state.size <= MAX_ONLINE;
    update();
  }
  document.querySelectorAll("#b-size-chips .chip").forEach((c) => c.addEventListener("click", () => setSize(Number(c.dataset.size))));
  $("#b-minus").addEventListener("click", () => setSize(state.size - 1));
  $("#b-plus").addEventListener("click", () => setSize(state.size + 1));

  // ---- Day chips: the next 7 days; closed days (or today once it's too late) disabled ----
  const daysBox = $("#b-days");
  const dateInput = $("#b-date");
  const max = new Date();
  max.setDate(max.getDate() + 30);
  dateInput.min = iso(new Date());
  dateInput.max = iso(max);

  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const open = slotsFor(d).length > 0;
    const top = i === 0 ? "Today" : i === 1 ? "Tomorrow" : DAY_NAMES[d.getDay()];
    const month = d.toLocaleDateString(undefined, { month: "short" });
    daysBox.insertAdjacentHTML(
      "beforeend",
      `<button type="button" class="chip chip--day" data-date="${iso(d)}" ${open ? "" : "disabled"} aria-pressed="false">` +
        `<span>${top}</span><b>${d.getDate()} ${month}</b>${open ? "" : "<small>Closed</small>"}</button>`
    );
  }
  daysBox.addEventListener("click", (e) => {
    const chip = e.target.closest(".chip--day");
    if (!chip || chip.disabled) return;
    $("#b-date-wrap").hidden = true;
    $("#b-other-date").setAttribute("aria-expanded", "false");
    setDate(chip.dataset.date);
  });
  $("#b-other-date").addEventListener("click", (e) => {
    const wrap = $("#b-date-wrap");
    wrap.hidden = !wrap.hidden;
    e.currentTarget.setAttribute("aria-expanded", String(!wrap.hidden));
    if (!wrap.hidden) dateInput.focus();
  });
  dateInput.addEventListener("change", () => {
    if (dateInput.value) setDate(dateInput.value);
  });

  function setDate(value) {
    state.date = value;
    state.time = null;
    state.mins = null;
    daysBox.querySelectorAll(".chip--day").forEach((c) => c.setAttribute("aria-pressed", String(c.dataset.date === value)));
    renderSlots();
    update();
  }

  // ---- Time slots, grouped by part of the day ----
  const slotsBox = $("#b-slots");
  function renderSlots() {
    slotsBox.innerHTML = "";
    if (!state.date) {
      slotsBox.innerHTML = '<p class="slot-empty">Pick a day to see times.</p>';
      return;
    }
    const day = fromIso(state.date);
    const slots = slotsFor(day);
    if (!slots.length) {
      const msg = CAFE.hours[day.getDay()] ? "No more tables that day - try another day." : "We are closed that day - please pick another.";
      slotsBox.innerHTML = `<p class="slot-empty">${msg}</p>`;
      return;
    }
    const groups = [
      ["Morning", slots.filter((s) => s.mins < 12 * 60)],
      ["Afternoon", slots.filter((s) => s.mins >= 12 * 60 && s.mins < 17 * 60)],
      ["Evening", slots.filter((s) => s.mins >= 17 * 60)],
    ];
    for (const [name, list] of groups) {
      if (!list.length) continue;
      const radios = list
        .map((s) => `<input type="radio" name="time" id="slot-${s.mins}" value="${s.label}" data-mins="${s.mins}" /><label class="slot" for="slot-${s.mins}">${s.label}</label>`)
        .join("");
      slotsBox.insertAdjacentHTML(
        "beforeend",
        `<div class="slot-group"><p class="slot-group-name">${name}</p><div class="slots" role="radiogroup" aria-label="${name}">${radios}</div></div>`
      );
    }
  }
  slotsBox.addEventListener("change", (e) => {
    state.time = e.target.value;
    state.mins = Number(e.target.dataset.mins);
    $("#b-time-error").hidden = true;
    update();
  });

  // ---- Live summary (side card on desktop, bottom bar on phones) ----
  const occasion = $("#b-occasion");
  occasion.addEventListener("change", update);
  function update() {
    const set = (key, text) => document.querySelectorAll(`[data-sum="${key}"]`).forEach((el) => (el.textContent = text));
    const d = state.date ? fromIso(state.date) : null;
    set("size", guests(state.size));
    set("date", d ? longDate(d) : "-");
    set("time", state.time || "Pick a time");
    document.querySelector('[data-sum="time"]').classList.toggle("muted", !state.time);
    set("occasion", occasion.value);
    document.querySelector('[data-sum-row="occasion"]').hidden = occasion.value === "None";
    set("short", guests(state.size) + (d ? ` · ${DAY_NAMES[d.getDay()]} ${d.getDate()}` : ""));
    set("bar-sub", state.time ? `at ${state.time}` : d ? "Pick a time" : "Pick a day and time");
    const tooBig = state.size > MAX_ONLINE;
    document.querySelectorAll('button[form="booking-form"]').forEach((b) => (b.disabled = tooBig));
  }

  // ---- Remembered details (this device only) ----
  const remember = $("#b-remember");
  try {
    const saved = JSON.parse(localStorage.getItem(KEY("guest")) || "null");
    if (saved) {
      $("#b-name").value = saved.name || "";
      $("#b-phone").value = saved.phone || "";
    }
  } catch (err) {
    /* storage blocked - nothing to prefill */
  }

  // ---- Validation ----
  // International numbers: 8-15 digits once spaces, dashes and brackets are removed.
  const phoneOk = (v) => /^\+?\d{8,15}$/.test(v.replace(/[\s().-]/g, ""));
  function showError(input, bad) {
    input.setAttribute("aria-invalid", String(bad));
    const err = input.parentElement.querySelector(".field-error");
    if (err) err.hidden = !bad;
  }
  $("#b-name").addEventListener("input", (e) => showError(e.target, false));
  $("#b-phone").addEventListener("input", (e) => {
    if (phoneOk(e.target.value)) showError(e.target, false);
  });
  $("#b-phone").addEventListener("blur", (e) => {
    if (e.target.value) showError(e.target, !phoneOk(e.target.value));
  });

  // ---- Submit ----
  booking.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = $("#b-name").value.trim();
    const phone = $("#b-phone").value.trim();
    const problems = [];
    if (!state.date) problems.push(daysBox);
    if (!state.time) {
      $("#b-time-error").hidden = false;
      problems.push(slotsBox);
    }
    showError($("#b-name"), !name);
    if (!name) problems.push($("#b-name"));
    showError($("#b-phone"), !phoneOk(phone));
    if (!phoneOk(phone)) problems.push($("#b-phone"));
    if (problems.length) {
      problems[0].scrollIntoView({ behavior: "smooth", block: "center" });
      if (problems[0].matches("input")) problems[0].focus({ preventScroll: true });
      return;
    }
    try {
      if (remember.checked) localStorage.setItem(KEY("guest"), JSON.stringify({ name, phone }));
      else localStorage.removeItem(KEY("guest"));
    } catch (err) {
      /* storage blocked - booking still goes out */
    }

    const d = fromIso(state.date);
    const seating = $("#b-seating").value;
    const notes = $("#b-notes").value.trim();
    const lines = [
      `Hi ${CAFE.name}, I'd like to book a table.`,
      "",
      `Table for ${guests(state.size)}, ${longDate(d)} at ${state.time}`,
      `Name: ${name}`,
      `Phone: ${phone}`,
      occasion.value !== "None" ? `Occasion: ${occasion.value}` : null,
      seating !== "No preference" ? `Seating: ${seating}` : null,
      notes ? `Notes: ${notes}` : null,
    ].filter((l) => l !== null);
    window.open(`https://wa.me/${CAFE.whatsapp}?text=${encodeURIComponent(lines.join("\n"))}`, "_blank", "noopener");

    $("#b-done-line").textContent = `Table for ${guests(state.size)}, ${longDate(d)} at ${state.time}`;
    $("#b-summary-card").hidden = true;
    $("#b-done").hidden = false;
    $("#b-bar").hidden = true;
    $("#b-done").scrollIntoView({ behavior: "smooth", block: "center" });
  });

  // ---- Add to calendar (.ics works with Google, Apple and Outlook calendars) ----
  $("#b-ics").addEventListener("click", () => {
    const d = fromIso(state.date);
    const pad = (n) => String(n).padStart(2, "0");
    const stamp = (date, mins) =>
      `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}T${pad(Math.floor(mins / 60))}${pad(mins % 60)}00`;
    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      `PRODID:-//${CAFE.slug}//Booking//EN`,
      "BEGIN:VEVENT",
      `UID:${Date.now()}@${CAFE.slug}`,
      `DTSTART:${stamp(d, state.mins)}`,
      `DTEND:${stamp(d, state.mins + DURATION)}`,
      `SUMMARY:Table at ${CAFE.name} (${guests(state.size)})`,
      `LOCATION:${String(CAFE.address || "").replace(/[\\,;]/g, (c) => "\\" + c)}`,
      "DESCRIPTION:Booked via WhatsApp. Reply there to change or cancel.",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }));
    a.download = `${CAFE.slug}-booking.ics`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  });

  $("#b-again").addEventListener("click", () => {
    $("#b-done").hidden = true;
    $("#b-summary-card").hidden = false;
    $("#b-bar").hidden = false;
    setDate(state.date);
    window.scrollTo({ top: booking.getBoundingClientRect().top + window.scrollY - 90, behavior: "smooth" });
  });

  // Start with 2 guests on the first open day.
  document.body.classList.add("has-book-bar");
  setSize(2);
  const firstOpen = daysBox.querySelector(".chip--day:not([disabled])");
  if (firstOpen) setDate(firstOpen.dataset.date);
  else renderSlots();
}
