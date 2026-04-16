"use client";

import { useEffect, useRef, useState, CSSProperties } from "react";

type Props = {
  words: string[];
  intervalMs?: number;
  focusColor?: string;
  className?: string;
  style?: CSSProperties;
};

/**
 * Cycles through words, showing one at a time with a smooth transition.
 * Only the active word is visible (others fade out). Uses longest word
 * as invisible placeholder to reserve width.
 */
export default function TrueFocus({
  words,
  intervalMs = 2400,
  focusColor = "var(--color-neon)",
  className = "",
  style,
}: Props) {
  const [activeIdx, setActiveIdx] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!inView) return;
    const id = setInterval(() => {
      setActiveIdx((i) => (i + 1) % words.length);
    }, intervalMs);
    return () => clearInterval(id);
  }, [inView, intervalMs, words.length]);

  const longest = words.reduce((a, b) => (a.length >= b.length ? a : b), "");

  return (
    <span
      ref={ref}
      className={`relative inline-block align-baseline ${className}`}
      style={style}
    >
      {/* Placeholder to reserve the space of the longest word */}
      <span aria-hidden="true" className="invisible whitespace-nowrap">
        {longest}
      </span>
      {words.map((w, i) => {
        const active = i === activeIdx;
        return (
          <span
            key={i}
            className="absolute left-0 top-0 whitespace-nowrap transition-all duration-700"
            style={{
              color: focusColor,
              opacity: active ? 1 : 0,
              transform: active
                ? "translateY(0)"
                : activeIdx > i
                ? "translateY(-30%)"
                : "translateY(30%)",
              transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          >
            {w}
          </span>
        );
      })}
    </span>
  );
}
