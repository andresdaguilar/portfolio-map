import { CanvasTexture, LinearFilter, SRGBColorSpace } from "three";

/**
 * Renders a string into a texture using the browser's own font stack.
 *
 * Signs need real words on them, and pulling a webfont into WebGL means a
 * network fetch that can fail and a parser we do not otherwise need. A 2D
 * canvas already has text rendering, costs nothing, and works offline.
 */
export function makeTextTexture(
  text: string,
  {
    color = "#ffffff",
    font = "600 64px ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif",
    padding = 32,
    letterSpacing = "0.08em",
  } = {},
): { texture: CanvasTexture; aspect: number } {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;

  ctx.font = font;
  ctx.letterSpacing = letterSpacing;
  const metrics = ctx.measureText(text);
  const width = Math.ceil(metrics.width) + padding * 2;
  const height = 64 + padding * 2;

  canvas.width = width;
  canvas.height = height;

  // Resizing the canvas resets the context, so the font has to be set again.
  ctx.font = font;
  ctx.letterSpacing = letterSpacing;
  ctx.textBaseline = "middle";
  ctx.fillStyle = color;
  ctx.fillText(text, padding, height / 2);

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.minFilter = LinearFilter;
  texture.magFilter = LinearFilter;
  texture.anisotropy = 4;

  return { texture, aspect: width / height };
}
