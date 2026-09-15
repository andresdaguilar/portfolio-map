/**
 * Where the artwork lives.
 *
 * One constant rather than a string in each file: the viewer and the
 * calibrator have to agree on the image, and a layout traced against one
 * picture is meaningless against another.
 */
export const MAP_IMAGE = "/map/IsoMAP.jpg";

/**
 * The character's description, if one has been supplied. It names its own
 * sheets, so poses and the walk cycle can come from separate renders.
 * See `sprite.ts`.
 */
export const CHARACTER_META = "/map/character.json";
