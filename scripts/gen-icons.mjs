// Generates icons/icon{16,48,128}.png with zero dependencies.
// A Netflix-red rounded tile with a white "window" (title bar + dots) and a
// red play triangle inside it — i.e. a windowed game.
import zlib from "node:zlib";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "icons");
const SS = 4; // supersample factor for anti-aliasing

const RED = [229, 9, 20];
const WHITE = [255, 255, 255];
const TITLE = [228, 228, 234];
const DOT = [150, 150, 160];

function roundRectSDF(u, v, x0, y0, x1, y1, r) {
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  const hx = (x1 - x0) / 2, hy = (y1 - y0) / 2;
  const qx = Math.abs(u - cx) - hx + r;
  const qy = Math.abs(v - cy) - hy + r;
  const ox = Math.max(qx, 0), oy = Math.max(qy, 0);
  return Math.hypot(ox, oy) + Math.min(Math.max(qx, qy), 0) - r;
}

function inTriangle(px, py, ax, ay, bx, by, cx, cy) {
  const d1 = (px - bx) * (ay - by) - (ax - bx) * (py - by);
  const d2 = (px - cx) * (by - cy) - (bx - cx) * (py - cy);
  const d3 = (px - ax) * (cy - ay) - (cx - ax) * (py - ay);
  const neg = d1 < 0 || d2 < 0 || d3 < 0;
  const pos = d1 > 0 || d2 > 0 || d3 > 0;
  return !(neg && pos);
}

function sample(u, v) {
  // returns [r,g,b,a] at normalized point
  if (roundRectSDF(u, v, 0, 0, 1, 1, 0.18) > 0) return [0, 0, 0, 0];
  let col = [...RED];
  const inWindow = roundRectSDF(u, v, 0.2, 0.3, 0.8, 0.74, 0.07) <= 0;
  if (inWindow) {
    col = v < 0.42 ? [...TITLE] : [...WHITE];
    if (v < 0.42) {
      for (const du of [0.265, 0.315, 0.365]) {
        if (Math.hypot(u - du, v - 0.36) < 0.018) col = [...DOT];
      }
    } else if (inTriangle(u, v, 0.445, 0.48, 0.445, 0.68, 0.63, 0.58)) {
      col = [...RED];
    }
  }
  return [col[0], col[1], col[2], 255];
}

function render(size) {
  const hi = size * SS;
  const buf = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const u = (x * SS + sx + 0.5) / hi;
          const v = (y * SS + sy + 0.5) / hi;
          const [pr, pg, pb, pa] = sample(u, v);
          const af = pa / 255;
          r += pr * af; g += pg * af; b += pb * af; a += pa;
        }
      }
      const n = SS * SS;
      const af = a / (n * 255);
      const i = (y * size + x) * 4;
      buf[i] = af > 0 ? Math.round(r / (n * af)) : 0;
      buf[i + 1] = af > 0 ? Math.round(g / (n * af)) : 0;
      buf[i + 2] = af > 0 ? Math.round(b / (n * af)) : 0;
      buf[i + 3] = Math.round(a / n);
    }
  }
  return buf;
}

// Minimal PNG encoder (8-bit RGBA)
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const typeBuf = Buffer.from(type, "ascii");
  const body = Buffer.concat([typeBuf, data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}
function encodePNG(size, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const stride = size * 4;
  const raw = Buffer.alloc((stride + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (stride + 1)] = 0; // filter: none
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }
  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([sig, chunk("IHDR", ihdr), chunk("IDAT", idat), chunk("IEND", Buffer.alloc(0))]);
}

fs.mkdirSync(OUT, { recursive: true });
for (const size of [16, 48, 128]) {
  const png = encodePNG(size, render(size));
  fs.writeFileSync(path.join(OUT, `icon${size}.png`), png);
  console.log(`wrote icons/icon${size}.png (${png.length} bytes)`);
}
