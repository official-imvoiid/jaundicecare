import { readFileSync } from 'node:fs';

export interface ParityCase {
  name: string;
  width: number;
  height: number;
  rgb: string; // base64, 3 bytes per pixel
  features: number[] | null;
  skinCount: number;
  skinFound: boolean;
  mlp: number | null;
  gbt: number | null;
  probability: number | null;
}

function readJson<T>(relativePath: string): T {
  return JSON.parse(readFileSync(new URL(relativePath, import.meta.url), 'utf8')) as T;
}

/** Pixel buffers and the values the Python training code computed from them. */
export function loadParityCases(): ParityCase[] {
  return readJson<{ cases: ParityCase[] }>('./fixtures/parity.json').cases;
}

export function loadModelJson<T>(): T {
  return readJson<T>('../src/ml/model.json');
}

/** The fixture stores RGB; the engine reads canvas-style RGBA. */
export function rgbaOf(testCase: ParityCase): Uint8ClampedArray {
  const rgb = Buffer.from(testCase.rgb, 'base64');
  const rgba = new Uint8ClampedArray((rgb.length / 3) * 4);
  for (let p = 0; p < rgb.length / 3; p++) {
    rgba[p * 4] = rgb[p * 3];
    rgba[p * 4 + 1] = rgb[p * 3 + 1];
    rgba[p * 4 + 2] = rgb[p * 3 + 2];
    rgba[p * 4 + 3] = 255;
  }
  return rgba;
}

/** An RGBA image whose pixel colour is given by a function of (x, y). */
export function paint(width: number, height: number, colourAt: (x: number, y: number) => [number, number, number]): Uint8ClampedArray {
  const rgba = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const [r, g, b] = colourAt(x, y);
      const o = (y * width + x) * 4;
      rgba[o] = r;
      rgba[o + 1] = g;
      rgba[o + 2] = b;
      rgba[o + 3] = 255;
    }
  }
  return rgba;
}
