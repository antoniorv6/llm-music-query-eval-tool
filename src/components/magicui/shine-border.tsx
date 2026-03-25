"use client";

import type { CSSProperties } from "react";
import { cn } from "../../lib/cn";

interface ShineBorderProps {
  children: React.ReactNode;
  className?: string;
  borderRadius?: number;
  borderWidth?: number;
  duration?: number;
  shineColor?: string | string[];
}

export function ShineBorder({
  children,
  className,
  borderRadius = 8,
  borderWidth = 2,
  duration = 14,
  shineColor = "#000000",
}: ShineBorderProps) {
  const colorValue = Array.isArray(shineColor)
    ? shineColor.join(", ")
    : shineColor;

  return (
    <div
      style={
        {
          "--border-radius": `${borderRadius}px`,
          "--border-width": `${borderWidth}px`,
          "--duration": `${duration}s`,
          "--shine-color": colorValue,
          "--background": `radial-gradient(ellipse, ${colorValue})`,
          borderRadius: `${borderRadius}px`,
          padding: `${borderWidth}px`,
        } as CSSProperties
      }
      className={cn(
        "relative grid place-items-stretch",
        "before:absolute before:inset-0 before:rounded-[var(--border-radius)]",
        "before:bg-[conic-gradient(from_0deg,transparent_0%,var(--shine-color)_10%,transparent_20%)]",
        "before:animate-shine-border",
        "after:absolute after:inset-[var(--border-width)] after:rounded-[calc(var(--border-radius)-var(--border-width))]",
        "after:bg-surface-900",
        className
      )}
    >
      <div className="relative z-10 rounded-[calc(var(--border-radius)-var(--border-width))] overflow-hidden">
        {children}
      </div>
    </div>
  );
}
