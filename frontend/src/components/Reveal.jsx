import React, { useRef, useState, useEffect } from "react";
import { motion, useInView, useScroll, useSpring } from "framer-motion";

const EASE = [0.16, 1, 0.3, 1];
const offsets = {
  up: { y: 40, x: 0 }, down: { y: -40, x: 0 },
  left: { x: 60, y: 0 }, right: { x: -60, y: 0 }, scale: { x: 0, y: 0 },
};

export const Reveal = ({ children, delay = 0, dir = "up", className = "", ...props }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const o = offsets[dir] || offsets.up;
  const initial = { opacity: 0, ...o, ...(dir === "scale" ? { scale: 0.92 } : {}) };
  const shown = { opacity: 1, x: 0, y: 0, scale: 1 };
  return (
    <motion.div ref={ref} initial={initial} animate={inView ? shown : initial}
      transition={{ duration: 0.7, ease: EASE, delay }} className={className} {...props}>
      {children}
    </motion.div>
  );
};

export const SectionHeading = ({ overline, title, center, className = "" }) => (
  <div className={`${center ? "text-center mx-auto" : ""} ${className}`}>
    {overline && <p className="text-xs uppercase tracking-[0.25em] text-gold font-semibold mb-3">{overline}</p>}
    <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-medium text-ink leading-tight">{title}</h2>
  </div>
);

export const ScrollProgress = () => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.3 });
  return <motion.div style={{ scaleX }} className="fixed top-0 left-0 right-0 h-[3px] bg-gold origin-left z-[60]" />;
};

export const AnimatedCounter = ({ value, suffix = "", prefix = "", className = "" }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const target = parseFloat(value) || 0;
    const dur = 1400, start = performance.now();
    let raf;
    const tick = (t) => {
      const p = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(target * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, value]);
  const display = Number.isInteger(parseFloat(value)) ? Math.round(n) : n.toFixed(1);
  return <span ref={ref} className={className}>{prefix}{display}{suffix}</span>;
};

export const Marquee = ({ items = [], speed = 32, reverse = false, variant = "gold" }) => {
  const styles = variant === "gold"
    ? "bg-gold text-white"
    : variant === "dark" ? "bg-ink text-white" : "bg-white text-ink border-y border-greyc";
  const doubled = [...items, ...items];
  return (
    <div className={`${styles} overflow-hidden py-3 select-none`}>
      <div className="marquee-mask">
        <div className={`marquee-track ${reverse ? "reverse" : ""}`} style={{ animationDuration: `${speed}s` }}>
          {doubled.map((it, i) => (
            <span key={i} className="mx-6 inline-flex items-center gap-2 text-sm sm:text-base font-semibold tracking-wide">
              {it}<span className="text-gold-gradient opacity-60 mx-2">✦</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
