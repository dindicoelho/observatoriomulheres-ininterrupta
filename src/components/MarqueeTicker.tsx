"use client";

import { ReactNode } from "react";

export default function MarqueeTicker({
  items,
  separator = "·",
  className = "",
  dark = false,
  duration = 40,
}: {
  items: ReactNode[];
  separator?: string;
  className?: string;
  dark?: boolean;
  duration?: number;
}) {
  // Duplicate content for seamless loop
  const content = (
    <div className="flex items-center gap-8 px-4">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-8">
          {item}
          <span
            className={
              dark ? "text-white/30" : "text-[var(--color-text-tertiary)]"
            }
          >
            {separator}
          </span>
        </span>
      ))}
    </div>
  );

  return (
    <div
      className={`overflow-hidden ${className}`}
      style={{ maskImage: "linear-gradient(to right, transparent, black 10%, black 90%, transparent)", WebkitMaskImage: "linear-gradient(to right, transparent, black 10%, black 90%, transparent)" }}
    >
      <div
        className="marquee-track"
        style={{ animationDuration: `${duration}s` }}
      >
        {content}
        {content}
      </div>
    </div>
  );
}
