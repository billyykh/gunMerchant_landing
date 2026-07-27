import { describe, expect, it } from "vitest";
import { formatLoadingReadout } from "./loading-readout";

describe("the loading readout", () => {
  it("reads as a HUD line, not a bare number", () => {
    expect(formatLoadingReadout(0)).toBe("LOADING ASSETS 0%");
  });

  it("reports whole percent", () => {
    expect(formatLoadingReadout(42)).toBe("LOADING ASSETS 42%");
  });

  it("rounds down, never up — 100% must mean finished", () => {
    // The assets total ~17.7 MB. Showing 100% while bytes are still in flight
    // is the one thing a determinate readout must never do.
    expect(formatLoadingReadout(42.9)).toBe("LOADING ASSETS 42%");
    expect(formatLoadingReadout(99.9)).toBe("LOADING ASSETS 99%");
  });

  it("reaches 100% only at 100", () => {
    expect(formatLoadingReadout(100)).toBe("LOADING ASSETS 100%");
  });

  it("survives values outside the range rather than printing nonsense", () => {
    expect(formatLoadingReadout(-5)).toBe("LOADING ASSETS 0%");
    expect(formatLoadingReadout(140)).toBe("LOADING ASSETS 100%");
    expect(formatLoadingReadout(Number.NaN)).toBe("LOADING ASSETS 0%");
  });
});
