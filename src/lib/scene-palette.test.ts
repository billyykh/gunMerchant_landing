import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { SCENE_LIGHTS, SCENE_LIGHT_TOKENS } from "./scene-palette";

/**
 * The stylesheet is the ramp's home. Reading it here rather than restating any
 * of it is the whole point: a transcription that is never checked against its
 * source is just a hex literal with a comment attached.
 */
const CSS = readFileSync(join(__dirname, "../app/globals.css"), "utf8");

const declaredValueOf = (token: string) =>
  CSS.match(new RegExp(`${token}:\\s*(#[0-9a-fA-F]{3,8})\\s*;`))?.[1];

describe("the scene's lights", () => {
  it("match the ramp tokens they are transcribed from", () => {
    for (const [light, token] of Object.entries(SCENE_LIGHT_TOKENS)) {
      if (!token) continue;

      const declared = declaredValueOf(token);
      expect(declared, `${token} is not declared in globals.css`).toBeDefined();
      expect(
        SCENE_LIGHTS[light as keyof typeof SCENE_LIGHTS].toLowerCase()
      ).toBe(declared!.toLowerCase());
    }
  });

  it("reads the stylesheet it claims to", () => {
    // A regex that silently matched nothing would make the check above pass by
    // skipping every light.
    expect(declaredValueOf("--thermal-3")).toBeDefined();
    expect(declaredValueOf("--not-a-token")).toBeUndefined();
  });

  it("says which lights are on their own", () => {
    // The underside fill has no token, and should not be quietly attached to
    // one that happens to look similar.
    expect(SCENE_LIGHT_TOKENS.fill).toBe("");
  });
});
