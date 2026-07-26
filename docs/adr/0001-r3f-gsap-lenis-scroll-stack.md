# React Three Fiber + GSAP ScrollTrigger + Lenis for the scroll-driven 3D experience

The whole page is one scroll-driven 3D story, so the animation stack is the project's spine and would cost a full rewrite to swap. We chose React Three Fiber (+ drei) so the 3D scene composes as React components alongside shadcn UI, with GSAP ScrollTrigger scrubbed timelines + Lenis smooth scrolling mapping scroll progress onto Assembly, camera moves, and Act transitions.

## Considered Options

- **drei ScrollControls** — stays inside the R3F ecosystem, but orchestrating DOM sections and HTML overlays in sync with the 3D timeline is weaker than ScrollTrigger.
- **Vanilla three.js with hand-rolled scroll handling** — lightest dependency footprint, but poor fit with React/shadcn and re-implements what GSAP provides.
