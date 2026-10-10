/* Helpers shared by every page: safe HTML, money, links, hours.
   Restaurant data will come from owners (Business panel), so every value is escaped
   unless it is wrapped in raw() on purpose. */

class Raw {
  constructor(s) {
    this.s = s;
  }
  toString() {
    return this.s;
  }
}
export const raw = (s) => new Raw(String(s));

export const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

function show(v) {
  if (v === null || v === undefined || v === false) return "";
  if (Array.isArray(v)) return v.map(show).join("");
  if (v instanceof Raw) return v.s;
  return esc(v);
}

/** Tagged template: html`<p>${text}</p>` escapes text; arrays are joined; null/false print nothing. */
export function html(strings, ...vals) {
  let out = strings[0];
  vals.forEach((v, i) => (out += show(v) + strings[i + 1]));
  return raw(out);
}

/** JSON inside <script> tags: stop "</script>" in data from closing the tag. */
export const jsonScript = (data, pretty = false) =>
  raw(JSON.stringify(data, null, pretty ? 2 : 0).replace(/</g, "\\u003c"));

/** Only http(s), tel, mailto, in-page and relative links. Anything else (javascript:, data:) becomes "#". */
export function safeUrl(url) {
  const u = String(url ?? "").trim();
  if (/^(https?:|tel:|mailto:)/i.test(u)) return u;
  if (/^[a-z][a-z0-9+.-]*:/i.test(u) || u.startsWith("//")) return "#";
  return u;
}

// ---- Money ----
let moneyFmt = null;
export function setCurrency(currency = "INR", locale = "en-IN") {
  moneyFmt = { currency, locale };
}
export function money(amount) {
  const { currency, locale } = moneyFmt || { currency: "INR", locale: "en-IN" };
  const whole = Number.isInteger(Number(amount));
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

// ---- Contact links ----
export const telHref = (phone) => "tel:" + String(phone).replace(/[^\d+]/g, "");
export const waHref = (number, text) =>
  `https://wa.me/${String(number).replace(/\D/g, "")}${text ? "?text=" + encodeURIComponent(text) : ""}`;
export const mapsDirHref = (query) => `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(query)}`;
export const mapsSearchHref = (query) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
// Google reviews for one outlet, by its Place ID (outlets.google_place_id).
export const googleWriteReviewHref = (placeId) => `https://search.google.com/local/writereview?placeid=${encodeURIComponent(placeId)}`;
export const googleReviewsHref = (placeId) => `https://search.google.com/local/reviews?placeid=${encodeURIComponent(placeId)}`;
export const mapsEmbedSrc = (query) => `https://maps.google.com/maps?q=${encodeURIComponent(query)}&z=15&output=embed`;

// ---- Opening hours ----
// hours: { "0": ["09:00", "22:00"], ... "6": [...] }, 0 = Sunday, null = closed.
export const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const WEEK = [1, 2, 3, 4, 5, 6, 0]; // Monday first

export function fmtTime(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  const suffix = h >= 12 ? "pm" : "am";
  const hour = h % 12 || 12;
  return m ? `${hour}:${String(m).padStart(2, "0")} ${suffix}` : `${hour} ${suffix}`;
}
export const fmtRange = (pair) => (pair ? `${fmtTime(pair[0])} - ${fmtTime(pair[1])}` : "Closed");

/** Consecutive days with the same hours, Monday first: [{days:[1,2,3,4], hours:[...]}] */
export function groupHours(hours) {
  const groups = [];
  for (const d of WEEK) {
    const h = hours[d] ?? null;
    const last = groups[groups.length - 1];
    if (last && JSON.stringify(last.hours) === JSON.stringify(h)) last.days.push(d);
    else groups.push({ days: [d], hours: h });
  }
  return groups;
}
export const dayRangeLabel = (days) =>
  days.length === 1 ? SHORT[days[0]] : `${SHORT[days[0]]} - ${SHORT[days[days.length - 1]]}`;

/** One-line summary for the info strip, e.g. "8 am - 10:30 pm". */
export function hoursSpan(hours) {
  const open = WEEK.map((d) => hours[d]).filter(Boolean);
  if (!open.length) return "Closed";
  const first = open.map((h) => h[0]).sort()[0];
  const last = open.map((h) => h[1]).sort().at(-1);
  return `${fmtTime(first)} - ${fmtTime(last)}`;
}
export const openEveryDay = (hours) => WEEK.every((d) => hours[d]);

export function openingHoursSpec(hours) {
  return groupHours(hours)
    .filter((g) => g.hours)
    .map((g) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: g.days.length === 1 ? DAY_NAMES[g.days[0]] : g.days.map((d) => DAY_NAMES[d]),
      opens: g.hours[0],
      closes: g.hours[1],
    }));
}
export { WEEK };
