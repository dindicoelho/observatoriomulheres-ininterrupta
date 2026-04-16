"use client";

import { useEffect, useRef, useState, ElementType, ReactNode } from "react";

type Props = {
  children?: ReactNode;
  text?: string;
  as?: ElementType;
  className?: string;
  stagger?: number;
  delay?: number;
  distance?: number;
  scale?: boolean;
  byWord?: boolean;
};

export default function ScrollFloat({
  children,
  text: textProp,
  as: Tag = "span",
  className = "",
  stagger = 40,
  delay = 0,
  distance = 40,
  scale = false,
  byWord = false,
}: Props) {
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
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Extract text from children or text prop
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
          opacity: visible ? 1 : 0,
          transform: visible
            ? "translateY(0) scale(1)"
            : `translateY(${distance}px) ${scale ? "scale(0.9)" : ""}`,
          transition: `opacity 0.9s cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform 0.9s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
        }}
      >
        {children}
      </Tag>
    );
  }

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
            className="inline-block"
            style={{
              opacity: visible ? 1 : 0,
              transform: visible
                ? "translateY(0) scale(1)"
                : `translateY(${distance}px) ${scale ? "scale(0.9)" : ""}`,
              transition: `opacity 0.9s cubic-bezier(0.16,1,0.3,1), transform 0.9s cubic-bezier(0.16,1,0.3,1)`,
              transitionDelay: `${delay + i * stagger}ms`,
            }}
          >
            {unit}
          </span>
        );
      })}
    </Tag>
  );
}
