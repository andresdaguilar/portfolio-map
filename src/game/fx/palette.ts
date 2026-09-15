/**
 * The Inside palette, for three.js.
 *
 * The key relationship is counter-intuitive: the *background* is the lightest
 * thing on screen and everything near the camera is nearly black. Silhouettes
 * only read when there is lit haze behind them, so the fog colour is a dim
 * blue-grey glow rather than darkness. Get this backwards and the frame is
 * black on black.
 */
export const PALETTE = {
  /** Fog and sky. The lightest value in the scene, and the one to tune first. */
  haze: "#465966",
  /** Distant structures — barely separated from the haze. */
  far: "#2b3842",
  /** Level geometry near the play plane. Reads as silhouette. */
  geometry: "#1a242c",
  /** Foreground occluders, closest to camera. Effectively black. */
  fore: "#080c10",
  /** The character is never pure black — that would kill the rim light. */
  silhouette: "#05070a",
  /**
   * The building's mass below floor level. Lighter than `fore` on purpose: at
   * pure black a cut-away building reads as a room floating over an abyss
   * rather than as a storey with more storeys beneath it.
   */
  basement: "#18212a",
  /** The only warm colour in the game. Practical lights and signs. */
  accent: "#e8a33d",
  /** Cold rim light from behind. */
  rim: "#9fb4c7",
} as const;

export const FOG = {
  color: PALETTE.haze,
  /**
   * Exponential falloff. At the camera's 30-unit distance this leaves the play
   * plane mostly unfogged while burying anything past ~60 units in haze.
   */
  density: 0.019,
} as const;
