"use client";

import { useEffect, useRef, useState, CSSProperties } from "react";

type Props = {
  words: string[];
  sentenceBefore?: string;
  sentenceAfter?: string;
  intervalMs?: number;
  blurAmount?: number;
  dimOpacity?: number;
  focusColor?: string;
  className?: string;
  style?: CSSProperties;
};

export default function TrueFocus({
  words,
  sentenceBefore = "",
  sentenceAfter = "",
  intervalMs = 2200,
  blurAmount = 4,
  dimOpacity = 0.25,
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
      { threshold: 0.2 }
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

  return (
    <span ref={ref} className={className} style={style}>
      {sentenceBefore}
      {words.map((w, i) => {
        const active = i === activeIdx;
        return (
          <span
            key={i}
            className="inline-block transition-all duration-700"
            style={{
              color: active ? focusColor : "inherit",
              opacity: active ? 1 : dimOpacity,
              filter: active ? "blur(0px)" : `blur(${blurAmount}px)`,
              transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          >
            {w}
            {i < words.length - 1 ? " " : ""}
          </span>
        );
      })}
      {sentenceAfter}
    </span>
  );
}
