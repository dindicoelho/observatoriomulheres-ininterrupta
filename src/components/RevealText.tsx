"use client";

import { useEffect, useRef, useState, ElementType } from "react";

export default function RevealText({
  text,
  as: Tag = "span",
  className = "",
  delay = 0,
  stagger = 24,
  byWord = false,
}: {
  text: string;
  as?: ElementType;
  className?: string;
  delay?: number;
  stagger?: number;
  byWord?: boolean;
}) {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const units = byWord ? text.split(/(\s+)/) : Array.from(text);

  return (
    <Tag
      ref={ref as React.Ref<HTMLElement>}
      className={className}
      aria-label={text}
    >
      {units.map((unit, i) => {
        if (unit.match(/^\s+$/)) {
          return <span key={i}>{unit}</span>;
        }
        return (
          <span
            key={i}
            aria-hidden="true"
            className="reveal-char"
            style={{
              animationDelay: visible
                ? `${delay + i * stagger}ms`
                : "999s",
              animationPlayState: visible ? "running" : "paused",
            }}
          >
            {unit}
          </span>
        );
      })}
    </Tag>
  );
}
