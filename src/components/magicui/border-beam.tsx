"use client";

import type { CSSProperties } from "react";
import { cn } from "../../lib/cn";

interface BorderBeamProps {
  className?: string;
  size?: number;
  duration?: number;
  delay?: number;
  colorFrom?: string;
  colorTo?: string;
  borderWidth?: number;
  reverse?: boolean;
}

export function BorderBeam({
  className,
  size = 200,
  duration = 8,
  delay = 0,
  colorFrom = "#ffaa40",
  colorTo = "#9c40ff",
  borderWidth = 1.5,
  reverse = false,
}: BorderBeamProps) {
  return (
    <div
      style={
        {
          "--size": size,
          "--duration": `${duration}s`,
          "--delay": `${delay}s`,
          "--color-from": colorFrom,
          "--color-to": colorTo,
          border: `${borderWidth}px solid transparent`,
        } as CSSProperties
      }
      className={cn(
        "pointer-events-none absolute inset-0 rounded-[inherit]",
        "[background:linear-gradient(transparent,transparent)_padding-box,conic-gradient(from_var(--border-beam-angle,0deg),transparent_10%,var(--color-from)_40%,var(--color-to)_60%,transparent_90%)_border-box]",
        reverse ? "animate-border-beam-reverse" : "animate-border-beam",
        className
      )}
    />
  );
}
