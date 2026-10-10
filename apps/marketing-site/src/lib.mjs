/* Safe HTML helpers, copied from templates/modern-cafe/src/lib.mjs. Every value is
   escaped unless it is wrapped in raw() on purpose. */

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
export const jsonScript = (data) => raw(JSON.stringify(data).replace(/</g, "\u003c"));

/** Only http(s), tel, mailto, in-page and relative links. Anything else becomes "#". */
export function safeUrl(url) {
  const u = String(url ?? "").trim();
  if (/^(https?:|tel:|mailto:)/i.test(u)) return u;
  if (/^[a-z][a-z0-9+.-]*:/i.test(u) || u.startsWith("//")) return "#";
  return u;
}

export const inr = (n) => "₹" + Number(n).toLocaleString("en-IN");

export const waHref = (number, text) =>
  "https://wa.me/" + String(number).replace(/\D/g, "") + (text ? "?text=" + encodeURIComponent(text) : "");
