"use client";

import { useProgress } from "@react-three/drei";
import { formatLoadingReadout } from "@/lib/loading-readout";

/**
 * Determinate loading line for Act 1.
 *
 * The models total ~17.7 MB, so this is an honest percentage rather than a
 * spinner (MASTER.md §7). It is fixed-positioned, so nothing on the page moves
 * when it goes away.
 */
export function LoadingReadout() {
  const { active, progress } = useProgress();

  if (!active) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-8 z-20 flex flex-col items-center gap-2 px-6"
      role="status"
      aria-live="polite"
    >
      <p className="hud-label">{formatLoadingReadout(progress)}</p>

      <div className="h-px w-48 max-w-full bg-thermal-1">
        <div
          className="h-px origin-left"
          style={{
            background: "var(--gradient-thermal)",
            transform: `scaleX(${Math.min(1, Math.max(0, progress / 100))})`,
          }}
        />
      </div>
    </div>
  );
}
