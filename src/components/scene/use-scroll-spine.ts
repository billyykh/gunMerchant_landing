"use client";

import * as React from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/**
 * The scroll spine: turns real page scroll into the single 0–1 progress value
 * the Scene State seam consumes.
 *
 * Progress lands in a ref rather than React state on purpose. It changes every
 * frame while scrolling, and re-rendering the tree at 60fps to move a rifle is
 * how this page would become the janky thing it is trying not to be. The
 * canvas reads the ref inside `useFrame`.
 *
 * Does nothing when `enabled` is false — that is the reduced-motion path,
 * which runs on native scrolling with no pin, no scrub and no Lenis
 * (MASTER.md §6.3).
 */
export function useScrollSpine(enabled: boolean): React.RefObject<number> {
  const progressRef = React.useRef(0);

  useGSAP(
    () => {
      if (!enabled) {
        progressRef.current = 0;
        return;
      }

      const lenis = new Lenis();

      // One ticker for both. Two independent RAF loops means Lenis and
      // ScrollTrigger disagree about where the page is on any given frame.
      lenis.on("scroll", ScrollTrigger.update);
      const advanceLenis = (time: number) => lenis.raf(time * 1000);
      gsap.ticker.add(advanceLenis);
      gsap.ticker.lagSmoothing(0);

      // Tweening a proxy rather than reading `self.progress` directly is what
      // makes `scrub: 1` mean anything: the 1s catch-up smooths raw scroll
      // input, which is the pairing MASTER.md §6.1 calls for.
      const scrubbed = { value: 0 };

      const tween = gsap.to(scrubbed, {
        value: 1,
        ease: "none",
        scrollTrigger: {
          // The whole document is the runway. `start: 0, end: "max"` is the
          // canonical whole-page form; expressing it as a trigger element with
          // "top top" / "bottom bottom" resolves to a zero-length range on the
          // documentElement and the tween never advances.
          start: 0,
          end: "max",
          scrub: 1,
        },
        onUpdate: () => {
          progressRef.current = scrubbed.value;
        },
      });

      return () => {
        tween.scrollTrigger?.kill();
        tween.kill();
        gsap.ticker.remove(advanceLenis);
        lenis.destroy();
      };
    },
    { dependencies: [enabled] }
  );

  return progressRef;
}
