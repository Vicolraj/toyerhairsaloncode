import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const SELECTOR = "main h1, main h2, main h3, main h4, main p, main li, main img, main .auto-reveal";

export function useAutoReveal() {
  const location = useLocation();
  useEffect(() => {
    const seen = new WeakSet();
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("reveal-in");
            io.unobserve(e.target);
          }
        });
      },
      { rootMargin: "0px 0px -5% 0px", threshold: 0.03 }
    );

    let queued = false;
    const scan = () => {
      queued = false;
      document.querySelectorAll(SELECTOR).forEach((el) => {
        if (seen.has(el)) return;
        seen.add(el);
        if (!el.classList.contains("reveal-in")) {
          el.classList.add("reveal-init");
          io.observe(el);
        }
      });
    };
    const queueScan = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(scan);
    };

    scan();
    const timers = [setTimeout(scan, 250), setTimeout(scan, 800), setTimeout(scan, 1600)];
    // Safety: never let anything stay hidden
    const safety = setTimeout(() => {
      document.querySelectorAll(".reveal-init:not(.reveal-in)").forEach((el) => el.classList.add("reveal-in"));
    }, 2200);

    const main = document.querySelector("main");
    const mo = new MutationObserver(queueScan);
    if (main) mo.observe(main, { childList: true, subtree: true });

    return () => {
      io.disconnect();
      mo.disconnect();
      timers.forEach(clearTimeout);
      clearTimeout(safety);
    };
  }, [location.pathname]);
}
