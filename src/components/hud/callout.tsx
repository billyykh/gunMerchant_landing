import { CALLOUT_LEADER } from "@/lib/callout-placement";
import { cn } from "@/lib/utils";

interface CalloutProps {
  /** The product name, as it reads in the catalog. */
  name: string;
  /** The HUD index readout, `03/08`. Omitted where there is nothing to count. */
  index?: string;
  /** Which way the leader line runs out of the anchor dot. */
  side: "left" | "right";
  /** Whether it climbs or falls out of the anchor dot, to clear the subject. */
  rise: "up" | "down";
  /**
   * False while it is on its way out. The Callout stays mounted through its
   * exit — unmounting on `pointerleave` would mean it has no exit at all.
   */
  open: boolean;
  className?: string;
}

/**
 * A HUD Callout — anchor dot, leader line, bracketed label.
 *
 * Contract: `docs/design-system/MASTER.md` §5 (HUD language), §7 (Callout).
 *
 * Purely presentational, and `aria-hidden`: the label repeats the accessible
 * name of the hotspot it belongs to, so leaving it in the tree would announce
 * every Part twice. The keyboard path is the hotspot, not this.
 *
 * It draws itself outward from its own origin, which is the anchor point — so a
 * consumer only has to translate it to where the Part projected to.
 */
export function Callout({
  name,
  index,
  side,
  rise,
  open,
  className,
}: CalloutProps) {
  const radians = (CALLOUT_LEADER.degrees * Math.PI) / 180;
  const reachX =
    CALLOUT_LEADER.length * Math.cos(radians) * (side === "right" ? 1 : -1);
  const reachY =
    CALLOUT_LEADER.length * Math.sin(radians) * (rise === "up" ? -1 : 1);

  return (
    <div
      aria-hidden="true"
      data-side={side}
      data-rise={rise}
      data-open={open}
      className={cn("hud-callout pointer-events-none absolute top-0 left-0", className)}
    >
      {/* The 3px anchor dot, sitting on the Part itself. */}
      <span className="absolute size-[3px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-thermal-4" />

      {/*
       * The leader line. Rotated about the anchor end, so the gradient always
       * runs cold at the Part to hot at the label however it is angled.
       */}
      <span
        className="absolute top-0 left-0 h-px origin-left"
        style={{
          width: CALLOUT_LEADER.length,
          transform: `rotate(${(Math.atan2(reachY, reachX) * 180) / Math.PI}deg)`,
          background: "var(--gradient-thermal)",
        }}
      />

      {/*
       * One `hud` readout, index prefix and all (§5). Both halves sit at the
       * same weight and colour: §3.1 allows 11px only at >= 7:1, so dimming the
       * prefix to separate it visually would take it below the floor that
       * permits the size in the first place. The gap does that job.
       */}
      <span
        className="hud-brackets hud-label absolute flex gap-2 border border-thermal-3/40 bg-surface-1/90 px-2.5 py-1.5 whitespace-nowrap"
        style={{
          left: reachX,
          top: reachY,
          // Hangs off the end of the leader, on whichever side it arrived from.
          transform: `translate(${side === "right" ? "0" : "-100%"}, -50%)`,
        }}
      >
        {index ? <span>{index}</span> : null}
        <span>{name}</span>
      </span>
    </div>
  );
}
