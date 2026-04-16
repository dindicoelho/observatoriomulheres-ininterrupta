"use client";

import { useEffect, useRef, useState, CSSProperties } from "react";

type Props = {
  to: number;
  from?: number;
  duration?: number;
  decimals?: number;
  suffix?: string;
  prefix?: string;
  separator?: string;
  className?: string;
  style?: CSSProperties;
  startOnView?: boolean;
};

export default function Counter({
  to,
  from = 0,
  duration = 1800,
  decimals = 0,
  suffix = "",
  prefix = "",
  separator = ".",
  className = "",
  style,
  startOnView = true,
}: Props) {
  const [value, setValue] = useState(from);
  const ref = useRef<HTMLSpanElement>(null);
  const hasStarted = useRef(false);

  useEffect(() => {
    const startCount = () => {
      if (hasStarted.current) return;
      hasStarted.current = true;
      const t0 = performance.now();
      const tick = (now: number) => {
        const p = Math.min((now - t0) / duration, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        setValue(from + (to - from) * eased);
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };

    if (!startOnView) {
      startCount();
      return;
    }

    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          startCount();
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [from, to, duration, startOnView]);

  const formatted = (() => {
    const rounded = decimals > 0 ? value.toFixed(decimals) : Math.round(value).toString();
    if (separator && decimals === 0) {
      // Add thousand separator
      return rounded.replace(/\B(?=(\d{3})+(?!\d))/g, separator);
    }
    return rounded;
  })();

  return (
    <span ref={ref} className={className} style={style}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}
