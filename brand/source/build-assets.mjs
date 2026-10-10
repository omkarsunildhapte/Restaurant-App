import sharp from 'sharp';
const [,, src, out] = process.argv;

// White -> transparent ("colour to alpha"), so the logo works on any background without a white box.
async function whiteToAlpha(input) {
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += 4) {
    const [r, g, b] = [data[i], data[i + 1], data[i + 2]];
    const a = Math.max(255 - r, 255 - g, 255 - b) / 255;
    if (a <= 0.02) { data[i + 3] = 0; continue; }
    data[i] = Math.round(255 - (255 - r) / a);
    data[i + 1] = Math.round(255 - (255 - g) / a);
    data[i + 2] = Math.round(255 - (255 - b) / a);
    data[i + 3] = Math.round(a * 255);
  }
  return sharp(data, { raw: info }).png().toBuffer();
}

// 1. Full logo, trimmed, transparent
const full = await sharp(src).trim({ threshold: 12 }).toBuffer();
const fullT = await whiteToAlpha(full);
await sharp(fullT).toFile(`${out}/thaliyo-logo.png`);
await sharp(fullT).webp({ quality: 92, alphaQuality: 100 }).toFile(`${out}/thaliyo-logo.webp`);
await sharp(fullT).resize({ width: 600 }).png().toFile(`${out}/thaliyo-logo-600.png`);

// 2. Emblem (cloche + cutlery + arc + leaves), trimmed, transparent
const whiteout = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="650" height="445"><rect x="0" y="415" width="500" height="30" fill="#fff"/></svg>');
const emblemRaw = await sharp(await sharp(src).extract({ left: 490, top: 120, width: 650, height: 445 }).toBuffer()).composite([{ input: whiteout }]).png().toBuffer();
const emblem = await whiteToAlpha(await sharp(emblemRaw).trim({ threshold: 12 }).toBuffer());
await sharp(emblem).toFile(`${out}/thaliyo-emblem.png`);

// 3. App icon: emblem centred on a white rounded square (85% box) and a full-bleed maskable version (66% box)
async function icon(size, boxRatio, rounded) {
  const box = Math.round(size * boxRatio);
  const art = await sharp(emblem).resize(box, box, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).toBuffer();
  const bg = rounded
    ? Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${size * 0.22}" fill="#ffffff"/></svg>`)
    : Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><rect width="${size}" height="${size}" fill="#ffffff"/></svg>`);
  return sharp(bg).composite([{ input: art, gravity: 'center' }]).png().toBuffer();
}
for (const s of [180, 192, 512]) await sharp(await icon(s, 0.86, true)).toFile(`${out}/icon-${s}.png`);
await sharp(await icon(512, 0.66, false)).toFile(`${out}/icon-maskable-512.png`);
await sharp(await icon(1024, 0.66, false)).toFile(`${out}/icon-maskable-1024.png`);

// 4. Cup circle ("o" of the wordmark), masked to a clean circle: candidate small favicon
const cupSq = await sharp(src).extract({ left: 1111, top: 616, width: 160, height: 160 }).toBuffer();
const mask = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160"><circle cx="80" cy="80" r="77" fill="#fff"/></svg>');
const cup = await sharp(cupSq).ensureAlpha().composite([{ input: mask, blend: 'dest-in' }]).png().toBuffer();
await sharp(cup).toFile(`${out}/thaliyo-cup.png`);
for (const s of [16, 32, 48, 64]) await sharp(cup).resize(s, s).png().toFile(`${out}/favicon-${s}.png`);
// favicon.ico (PNG-in-ICO, 16/32/48)
{
  const imgs = await Promise.all([16, 32, 48].map((s) => sharp(cup).resize(s, s).png().toBuffer()));
  const head = Buffer.alloc(6 + 16 * imgs.length);
  head.writeUInt16LE(0, 0); head.writeUInt16LE(1, 2); head.writeUInt16LE(imgs.length, 4);
  let offset = head.length;
  imgs.forEach((buf, i) => {
    const s = [16, 32, 48][i], e = 6 + 16 * i;
    head.writeUInt8(s, e); head.writeUInt8(s, e + 1); head.writeUInt8(0, e + 2); head.writeUInt8(0, e + 3);
    head.writeUInt16LE(1, e + 4); head.writeUInt16LE(32, e + 6); head.writeUInt32LE(buf.length, e + 8); head.writeUInt32LE(offset, e + 12);
    offset += buf.length;
  });
  const { writeFileSync } = await import('node:fs');
  writeFileSync(`${out}/favicon.ico`, Buffer.concat([head, ...imgs]));
}
// On-dark logo: dark-brown pixels -> cream (outside the cup circle), alpha kept
{
  const { data, info } = await sharp(fullT).raw().toBuffer({ resolveWithObject: true });
  const cupBox = { x0: 845, x1: 1005, y0: 489, y1: 649 };
  for (let y = 0; y < info.height; y++) for (let x = 0; x < info.width; x++) {
    const i = (y * info.width + x) * 4;
    if (data[i + 3] === 0) continue;
    if (x >= cupBox.x0 && x <= cupBox.x1 && y >= cupBox.y0 && y <= cupBox.y1) continue;
    const [r, g, b] = [data[i], data[i + 1], data[i + 2]];
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    if (lum < 120 && r >= g && g >= b - 10 && r - b < 90) { data[i] = 0xff; data[i + 1] = 0xf6; data[i + 2] = 0xea; }
  }
  const dark = await sharp(data, { raw: info }).png().toBuffer();
  await sharp(dark).toFile(`${out}/thaliyo-logo-on-dark.png`);
  await sharp(dark).webp({ quality: 92, alphaQuality: 100 }).toFile(`${out}/thaliyo-logo-on-dark.webp`);
  globalThis.__dark = dark;
  // Small "Powered by Thaliyo" badge sizes (2x for an ~80 px footer badge)
  await sharp(dark).resize({ width: 160 }).webp({ quality: 88, alphaQuality: 100, effort: 6 }).toFile(`${out}/thaliyo-logo-on-dark-160.webp`);
  await sharp(fullT).resize({ width: 160 }).webp({ quality: 88, alphaQuality: 100, effort: 6 }).toFile(`${out}/thaliyo-logo-160.webp`);
}

// preview sheet: icons at real sizes on light and dark
const tiles = [];
let x = 20;
for (const s of [16, 32, 48]) { tiles.push({ input: `${out}/favicon-${s}.png`, left: x, top: 20 }); x += s + 30; }
for (const s of [192]) { tiles.push({ input: `${out}/icon-${s}.png`, left: x, top: 20 }); x += s + 30; }
tiles.push({ input: await sharp(`${out}/icon-maskable-512.png`).resize(192).toBuffer(), left: x, top: 20 });
tiles.push({ input: await sharp(fullT).resize({ width: 380 }).toBuffer(), left: 20, top: 240 });
tiles.push({ input: await sharp(globalThis.__dark).resize({ width: 380 }).toBuffer(), left: 420, top: 240 });
const sheet = sharp({ create: { width: 820, height: 560, channels: 4, background: '#f3f4f6' } })
  .composite([{ input: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="320"><rect width="400" height="320" fill="#1f1a17"/></svg>'), left: 410, top: 230 }, ...tiles]);
await sheet.png().toFile(`${out}/_preview.png`);
console.log('done');
