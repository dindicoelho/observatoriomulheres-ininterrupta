"use client";

import { useEffect, useRef, useState, ElementType, ReactNode } from "react";

type Props = {
  children?: ReactNode;
  text?: string;
  as?: ElementType;
  className?: string;
  /** How fast letters reveal as user scrolls (higher = slower reveal) */
  spreadFactor?: number;
  /** Final opacity of non-revealed characters */
  baseOpacity?: number;
  /** Final opacity of fully revealed characters */
  finalOpacity?: number;
  /** Blur in px of non-revealed chars */
  baseBlur?: number;
};

/**
 * Reveals text character by character (or word by word) based on
 * scroll progress of the element through the viewport. Progressive
 * reveal — not "jumps to visible" when entering viewport.
 */
export default function ScrollReveal({
  children,
  text: textProp,
  as: Tag = "span",
  className = "",
  spreadFactor = 0.6,
  baseOpacity = 0.15,
  finalOpacity = 1,
  baseBlur = 3,
}: Props) {
  const ref = useRef<HTMLElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const handler = () => {
      const rect = el.getBoundingClientRect();
      const windowH = window.innerHeight;
      // Start revealing when element's top enters the bottom 80% of viewport
      // Finish when element's bottom hits the top 30% of viewport
      const startOffset = windowH * 0.85;
      const endOffset = windowH * 0.15;
      const totalTravel = startOffset - endOffset + rect.height;
      const traveled = startOffset - rect.top;
      const p = Math.max(0, Math.min(1, traveled / totalTravel));
      setProgress(p);
    };

    handler();
    window.addEventListener("scroll", handler, { passive: true });
    window.addEventListener("resize", handler);
    return () => {
      window.removeEventListener("scroll", handler);
      window.removeEventListener("resize", handler);
    };
  }, []);

  const text =
    textProp ??
    (typeof children === "string"
      ? children
      : typeof children === "number"
      ? String(children)
      : "");

  if (!text) {
    return (
      <Tag
        ref={ref as React.Ref<HTMLElement>}
        className={className}
        style={{
          opacity: baseOpacity + (finalOpacity - baseOpacity) * progress,
          filter: `blur(${baseBlur * (1 - progress)}px)`,
          transition: "opacity 0.1s, filter 0.1s",
        }}
      >
        {children}
      </Tag>
    );
  }

  const words = text.split(/(\s+)/);
  const total = words.length;

  return (
    <Tag
      ref={ref as React.Ref<HTMLElement>}
      className={className}
      aria-label={text}
    >
      {words.map((w, i) => {
        if (w.match(/^\s+$/)) {
          return <span key={i}>{w}</span>;
        }
        // Each word has its own threshold: index / total * spreadFactor
        const threshold = (i / Math.max(total - 1, 1)) * spreadFactor;
        const range = 0.25; // how much progress to go from base to final
        const localP = Math.max(0, Math.min(1, (progress - threshold) / range));
        const opacity = baseOpacity + (finalOpacity - baseOpacity) * localP;
        const blur = baseBlur * (1 - localP);
        return (
          <span
            key={i}
            aria-hidden="true"
            className="inline-block"
            style={{
              opacity,
              filter: `blur(${blur}px)`,
              transition: "opacity 0.15s linear, filter 0.15s linear",
            }}
          >
            {w}
          </span>
        );
      })}
    </Tag>
  );
}
