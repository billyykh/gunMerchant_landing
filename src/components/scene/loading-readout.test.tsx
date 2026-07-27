import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Characterisation, not TDD: the component was already written when these were
 * added. They exist because the acceptance criterion — "a loading indicator
 * displays until initial 3D assets are ready" — could not be confirmed in the
 * browser, where a 10 MB GLB over localhost resolves faster than the page can
 * be inspected.
 *
 * drei is mocked so the assertions are about the readout's own behaviour and
 * the test does not drag three.js into a DOM-only suite.
 */
const useProgress = vi.hoisted(() => vi.fn());
vi.mock("@react-three/drei", () => ({ useProgress }));

const { LoadingReadout } = await import("./loading-readout");

beforeEach(() => {
  useProgress.mockReset();
});

describe("the loading readout", () => {
  it("announces progress while assets are still loading", () => {
    useProgress.mockReturnValue({ active: true, progress: 42 });
    render(<LoadingReadout />);

    expect(screen.getByRole("status")).toHaveTextContent("LOADING ASSETS 42%");
  });

  it("is announced politely rather than interrupting", () => {
    useProgress.mockReturnValue({ active: true, progress: 42 });
    render(<LoadingReadout />);

    expect(screen.getByRole("status")).toHaveAttribute("aria-live", "polite");
  });

  it("disappears once loading finishes", () => {
    useProgress.mockReturnValue({ active: false, progress: 100 });
    render(<LoadingReadout />);

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("fills its rule in step with the percentage", () => {
    useProgress.mockReturnValue({ active: true, progress: 25 });
    const { container } = render(<LoadingReadout />);

    const rule = container.querySelector<HTMLElement>("[style*='scaleX']");
    expect(rule?.style.transform).toBe("scaleX(0.25)");
  });
});
