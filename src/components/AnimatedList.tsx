"use client";

import { useEffect, useRef, useState, ReactNode, ElementType } from "react";

type Props = {
  children: ReactNode[];
  as?: ElementType;
  className?: string;
  /** ms delay between each item */
  stagger?: number;
  /** initial Y offset in px */
  distance?: number;
  /** Start animating when this much of the list is visible */
  threshold?: number;
};

export default function AnimatedList({
  children,
  as: Tag = "div",
  className = "",
  stagger = 60,
  distance = 20,
  threshold = 0.05,
}: Props) {
  const ref = useRef<HTMLElement>(null);
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const items = el.querySelectorAll<HTMLElement>("[data-list-item]");
    const total = items.length;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleCount(total);
            observer.disconnect();
          }
        });
      },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  const childArray = Array.isArray(children) ? children : [children];

  return (
    <Tag ref={ref as React.Ref<HTMLElement>} className={className}>
      {childArray.map((child, i) => (
        <div
          key={i}
          data-list-item
          style={{
            opacity: i < visibleCount ? 1 : 0,
            transform:
              i < visibleCount ? "translateY(0)" : `translateY(${distance}px)`,
            transition: `opacity 0.6s cubic-bezier(0.16,1,0.3,1), transform 0.6s cubic-bezier(0.16,1,0.3,1)`,
            transitionDelay: `${i * stagger}ms`,
          }}
        >
          {child}
        </div>
      ))}
    </Tag>
  );
}
