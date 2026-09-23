// scripts/generate-favicons.mjs
// Generates the favicon set + OG image from public/favicon-source.svg using sharp.
// Run: node scripts/generate-favicons.mjs
import sharp from 'sharp';
import { readFileSync, existsSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Normalise to forward slashes — sharp's libvips path handling chokes on
// Windows backslashes when the path is passed as a string.
const ROOT = resolve(fileURLToPath(import.meta.url), '..', '..').replace(/\\/g, '/');
const SRC = `${ROOT}/public/favicon-source.svg`;
const OUT = `${ROOT}/public`;

if (!existsSync(SRC)) {
  console.error(`missing source: ${SRC}`);
  process.exit(1);
}

// Rasterize the SVG to a 512x512 square.
const png512 = await sharp(readFileSync(SRC)).resize(512, 512).png().toBuffer();

// Modern SVG favicon — layout.tsx references /favicon.svg. Reuse the
// source asset verbatim so the generator owns every public/favicon* file.
writeFileSync(`${OUT}/favicon.svg`, readFileSync(SRC));

await sharp(png512).resize(48, 48).png().toFile(`${OUT}/favicon-48.png`);
await sharp(png512).resize(32, 32).png().toFile(`${OUT}/favicon-32.png`);
await sharp(png512).resize(16, 16).png().toFile(`${OUT}/favicon-16.png`);

// Apple touch icon (180x180 — iOS requests this exact size).
await sharp(png512).resize(180, 180).png().toFile(`${OUT}/apple-touch-icon.png`);

// Build the ICO container manually. sharp's composite() rejects buffer
// inputs for the .ico format on this libvips build, so we assemble the
// ICONDIR + ICONDIRENTRY + PNG payloads directly. ICO format:
//   - 6-byte header (reserved + image count)
//   - 16-byte directory entry per image (w/h/bpp/size/offset)
//   - concatenated image payloads
const layers = [
  await sharp(png512).resize(48, 48).png().toBuffer(),
  await sharp(png512).resize(32, 32).png().toBuffer(),
  await sharp(png512).resize(16, 16).png().toBuffer(),
];

const sizes = [48, 32, 16];
const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0); // reserved
header.writeUInt16LE(1, 2); // image type: 1 = ICO
header.writeUInt16LE(layers.length, 4); // count

const entries = Buffer.alloc(16 * layers.length);
let offset = 6 + 16 * layers.length;
const payloads = [];
layers.forEach((buf, i) => {
  const base = i * 16;
    // Canonical ICO directory entry layout (16 bytes per image):
  //   0: width(1), 1: height(1), 2: colorCount(1), 3: reserved(1),
  //   4: planes(2), 6: bitCount(2), 8: bytesInRes(4), 12: imageOffset(4)
  entries.writeUInt8(sizes[i], base + 0); // width (0 = 256)
  entries.writeUInt8(sizes[i], base + 1); // height
  entries.writeUInt8(0, base + 2); // color count (0 = none)
  entries.writeUInt8(0, base + 3); // reserved
  entries.writeUInt16LE(1, base + 4); // planes
  entries.writeUInt16LE(32, base + 6); // bpp
  entries.writeUInt32LE(buf.length, base + 8); // size
  entries.writeUInt32LE(offset, base + 12); // offset
  payloads.push(buf);
  offset += buf.length;
});

writeFileSync(`${OUT}/favicon.ico`, Buffer.concat([header, entries, ...payloads]));

// OG / social preview image (1200x630).
const logo = await sharp(readFileSync(SRC)).resize(320, 320).png().toBuffer();
const og = await sharp({
  create: {
    width: 1200,
    height: 630,
    background: { r: 43, g: 30, b: 25, alpha: 1 }, // #2b1e19
    channels: 4,
  },
})
  .composite([
    {
      input: await sharp({
        create: {
          width: 1200,
          height: 630,
          background: { r: 200, g: 16, b: 46, alpha: 0.10 }, // rasta red wash
          channels: 4,
        },
      }).png().toBuffer(),
      blend: 'over',
    },
    { input: logo, top: 155, left: 440, blend: 'over' },
  ])
  .png()
  .toBuffer();

await sharp(og).png().toFile(`${OUT}/og-image.png`);

console.log('favicons + og-image written to public/');