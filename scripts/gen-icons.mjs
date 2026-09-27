import { deflateSync } from 'zlib';
import { writeFileSync, mkdirSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(__dirname, '../public/icons');
mkdirSync(outDir, { recursive: true });

const crcTable = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  crcTable[n] = c >>> 0;
}
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}
function png(width, height, pixelFn) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  const raw = Buffer.alloc(height * (1 + width * 3));
  let o = 0;
  for (let y = 0; y < height; y++) {
    raw[o++] = 0;
    for (let x = 0; x < width; x++) {
      const [r, g, b] = pixelFn(x, y);
      raw[o++] = r;
      raw[o++] = g;
      raw[o++] = b;
    }
  }
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}

function iconArt(size) {
  const s = size / 512;
  const dist = (x, y, cx, cy) => Math.hypot(x - cx, y - cy);
  const inCircle = (x, y, cx, cy, r) => dist(x, y, cx, cy) <= r;
  const inTriangle = (x, y) => {
    const a = [146 * s, 232 * s];
    const b = [366 * s, 232 * s];
    const c = [256 * s, 424 * s];
    const sign = (p, q, r) =>
      Math.sign((q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]));
    const as = sign(a, b, [x, y]);
    const bs = sign(b, c, [x, y]);
    const cs = sign(c, a, [x, y]);
    return as === bs && bs === cs && as !== 0;
  };
  return (x, y) => {
    if (inCircle(x, y, 256 * s, 178 * s, 116 * s) || inTriangle(x, y)) {
      if (inCircle(x, y, 256 * s, 178 * s, 46 * s)) return [0x0a, 0x1f, 0x44];
      return [0xff, 0xff, 0xff];
    }
    return [0xea, 0x58, 0x0c];
  };
}

for (const size of [192, 512]) {
  writeFileSync(resolve(outDir, `icon-${size}.png`), png(size, size, iconArt(size)));
  console.log(`wrote public/icons/icon-${size}.png`);
}