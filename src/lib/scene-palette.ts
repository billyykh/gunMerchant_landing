/**
 * The scene's lights, in the ramp's own terms.
 *
 * three.js takes colours as numbers, not as CSS custom properties, so the ramp
 * cannot simply be referenced here the way a class name references it. These
 * are transcriptions, and `scene-palette.test.ts` parses `globals.css` and
 * fails if any of them has drifted from the token it claims to be — the check
 * that stops this from becoming four hex literals nobody maintains.
 *
 * Why these three: the models are already dark (their materials were pulled to
 * a cool gunmetal at export, see `src/assets/ASSETS.md`), so lighting them to
 * "near-black" a second time leaves a silhouette with no surface. The keys are
 * the ramp's lightest step rather than pure white so the highlights sit inside
 * the palette; the rim is the brand red; the underside fill is a cool neutral
 * with no token of its own, because nothing else on the page is lit from below.
 */
export const SCENE_LIGHTS = {
  /** `--thermal-6` — the ramp's lightest step. Both white keys. */
  key: "#fff7ed",
  /** `--thermal-3` — the brand red, rimming the profile in Acts 2 and 3. */
  rim: "#dc2626",
  /** Cool fill from below, so the underside does not go solid black. */
  fill: "#7f8fa6",
} as const;

/** Which ramp token each light is a transcription of. Empty means none. */
export const SCENE_LIGHT_TOKENS = {
  key: "--thermal-6",
  rim: "--thermal-3",
  fill: "",
} as const satisfies Record<keyof typeof SCENE_LIGHTS, string>;
