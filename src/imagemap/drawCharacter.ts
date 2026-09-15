/**
 * The character, drawn on the 2D canvas over the map.
 *
 * Deliberately not a 3D figure composited on top: at the size this reads on
 * screen — forty-odd pixels — the whole of it is silhouette and stride, and
 * drawing it directly means there is no second renderer to keep in step with
 * the image's own projection.
 */

export interface DrawOptions {
  /** Centre of the feet, in canvas pixels. */
  x: number;
  y: number;
  /** Full height in canvas pixels. */
  height: number;
  /** Stride phase in radians. */
  phase: number;
  facing: 1 | -1;
  moving: boolean;
}

const SKIN = "#d9a273";
const HAIR = "#2e2724";
const SHIRT = "#c4543a";
const TROUSERS = "#37414f";
const SHOE = "#22282f";

export function drawCharacter(ctx: CanvasRenderingContext2D, o: DrawOptions) {
  const h = o.height;
  const swing = o.moving ? Math.sin(o.phase) : 0;
  // Two footfalls per stride, so the body dips twice a cycle.
  const bob = o.moving ? Math.abs(Math.cos(o.phase)) * h * 0.035 : 0;

  ctx.save();
  ctx.translate(o.x, o.y - bob);
  ctx.scale(o.facing, 1);

  // Contact shadow, on the ground rather than on the body.
  ctx.save();
  ctx.translate(0, bob);
  ctx.beginPath();
  ctx.ellipse(0, 0, h * 0.2, h * 0.07, 0, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(20, 28, 18, 0.35)";
  ctx.fill();
  ctx.restore();

  const hip = -h * 0.44;
  const shoulder = -h * 0.78;

  // Legs, swinging from the hip.
  ctx.lineCap = "round";
  ctx.strokeStyle = TROUSERS;
  ctx.lineWidth = h * 0.11;
  for (const side of [1, -1]) {
    const angle = swing * side * 0.5;
    ctx.beginPath();
    ctx.moveTo(0, hip);
    ctx.lineTo(Math.sin(angle) * h * 0.42, hip + Math.cos(angle) * h * 0.42);
    ctx.stroke();
  }

  // Feet.
  ctx.strokeStyle = SHOE;
  ctx.lineWidth = h * 0.09;
  for (const side of [1, -1]) {
    const angle = swing * side * 0.5;
    const fx = Math.sin(angle) * h * 0.42;
    const fy = hip + Math.cos(angle) * h * 0.42;
    ctx.beginPath();
    ctx.moveTo(fx, fy);
    ctx.lineTo(fx + h * 0.07, fy);
    ctx.stroke();
  }

  // Torso.
  ctx.strokeStyle = SHIRT;
  ctx.lineWidth = h * 0.26;
  ctx.beginPath();
  ctx.moveTo(0, hip);
  ctx.lineTo(0, shoulder);
  ctx.stroke();

  // Arms, counter-swinging.
  ctx.strokeStyle = SHIRT;
  ctx.lineWidth = h * 0.085;
  for (const side of [1, -1]) {
    const angle = -swing * side * 0.45;
    ctx.beginPath();
    ctx.moveTo(0, shoulder + h * 0.02);
    ctx.lineTo(Math.sin(angle) * h * 0.3, shoulder + h * 0.02 + Math.cos(angle) * h * 0.3);
    ctx.stroke();
  }

  // Head, then hair over the crown.
  const headY = shoulder - h * 0.12;
  ctx.beginPath();
  ctx.arc(0, headY, h * 0.13, 0, Math.PI * 2);
  ctx.fillStyle = SKIN;
  ctx.fill();

  ctx.beginPath();
  ctx.arc(0, headY - h * 0.015, h * 0.135, Math.PI * 1.05, Math.PI * 2.1);
  ctx.fillStyle = HAIR;
  ctx.fill();

  ctx.restore();
}
