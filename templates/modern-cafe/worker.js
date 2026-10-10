/**
 * Serves /videos/* with byte-range support. Static assets on their own answer every
 * request with the whole file (200), and Safari on iPhone will not play a video unless
 * the server returns 206 Partial Content for its Range requests. Everything else is
 * plain static assets (see wrangler.jsonc: the worker only runs for /videos/*).
 */
export default {
  async fetch(request, env) {
    const range = request.headers.get("Range");
    const asset = await env.ASSETS.fetch(new Request(request.url, { method: "GET" }));
    if (!asset.ok) return asset;

    const headers = new Headers(asset.headers);
    headers.set("Accept-Ranges", "bytes");
    headers.set("Cache-Control", "public, max-age=604800");
    headers.set("X-Robots-Tag", "noindex, nofollow");
    if (!range) return new Response(request.method === "HEAD" ? null : asset.body, { status: 200, headers });

    const body = await asset.arrayBuffer();
    const size = body.byteLength;
    const m = /^bytes=(\d*)-(\d*)$/.exec(range.trim());
    if (!m) return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${size}` } });

    let start = m[1] === "" ? size - Number(m[2]) : Number(m[1]);
    let end = m[1] === "" || m[2] === "" ? size - 1 : Math.min(Number(m[2]), size - 1);
    if (Number.isNaN(start) || start < 0 || start >= size || end < start) {
      return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${size}` } });
    }
    headers.set("Content-Range", `bytes ${start}-${end}/${size}`);
    headers.set("Content-Length", String(end - start + 1));
    return new Response(request.method === "HEAD" ? null : body.slice(start, end + 1), { status: 206, headers });
  },
};
