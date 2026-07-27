/**
 * The Act 1 loading line.
 *
 * The 3D assets total ~17.7 MB, so the page shows a determinate percentage
 * rather than a spinner (MASTER.md §7) — a visitor on a slow connection needs
 * to know the wait is finite and moving.
 */
export function formatLoadingReadout(percent: number): string {
  return `LOADING ASSETS ${wholePercent(percent)}%`;
}

/**
 * Rounds down, so 100% is reached only when loading has genuinely finished.
 * Rounding 99.6 up to 100 while bytes are still in flight is the one lie a
 * determinate readout cannot tell.
 */
function wholePercent(percent: number): number {
  if (!Number.isFinite(percent)) return 0;
  return Math.floor(Math.min(100, Math.max(0, percent)));
}
