import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export function setupMotion(): void {
  gsap.registerPlugin(ScrollTrigger);
  const media = gsap.matchMedia();

  media.add("(prefers-reduced-motion: no-preference)", () => {
    const heroText = gsap.utils.toArray<HTMLElement>(".hero-inner > *");
    gsap.from(heroText, {
      y: 16, opacity: 0, duration: 0.85, stagger: 0.095, ease: "power3.out",
      clearProps: "opacity,transform",
    });

    gsap.utils.toArray<HTMLElement>(".services article, .project-grid article, .method li")
      .forEach((item) => {
        gsap.from(item, {
          y: 28, opacity: 0, duration: 0.8, ease: "power3.out",
          clearProps: "opacity,transform",
          scrollTrigger: { trigger: item, start: "top 93%", once: true },
        });
      });

    const tour = document.querySelector<HTMLElement>(".tour");
    const canvas = tour?.querySelector<HTMLCanvasElement>("canvas");
    if (!tour || !canvas) return;

    let active = true;
    let teardown: (() => void) | undefined;
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect();
      void import("./room").then(({ createRoom }) => {
        if (!active) return;
        const room = createRoom(canvas);
        if (!room) return;

        tour.setAttribute("data-active", "");
        const progress = { value: 0 };
        const indicator = tour.querySelector<HTMLElement>(".tour-track span");
        const number = tour.querySelector<HTMLElement>(".tour-number");
        const readout = () => {
          room.draw(progress.value);
          if (indicator) indicator.style.transform = `scaleX(${progress.value})`;
          if (number) number.textContent = `0${Math.min(3, 1 + Math.floor(progress.value * 3))}`;
        };
        room.resize();
        const flight = gsap.to(progress, {
          value: 1, ease: "none", onUpdate: readout,
          scrollTrigger: { trigger: tour, start: "top top", end: "bottom bottom", scrub: 0.8 },
        });
        const resize = new ResizeObserver(() => room.resize());
        resize.observe(canvas);
        ScrollTrigger.refresh();

        const handleContextLoss = () => teardown?.();
        teardown = () => {
          teardown = undefined;
          canvas.removeEventListener("webglcontextlost", handleContextLoss);
          resize.disconnect();
          flight.scrollTrigger?.kill();
          flight.kill();
          tour.removeAttribute("data-active");
          room.dispose();
          ScrollTrigger.refresh(true);
        };
        canvas.addEventListener("webglcontextlost", handleContextLoss, { once: true });
      }).catch((error: unknown) => console.warn("3D-weergave is niet beschikbaar.", error));
    }, { rootMargin: "350px 0px" });
    observer.observe(tour);

    return () => {
      active = false;
      observer.disconnect();
      teardown?.();
      teardown = undefined;
    };
  });
}
