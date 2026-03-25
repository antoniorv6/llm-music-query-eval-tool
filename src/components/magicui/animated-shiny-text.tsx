"use client";

import type { CSSProperties } from "react";
import { cn } from "../../lib/cn";

interface AnimatedShinyTextProps {
  children: React.ReactNode;
  className?: string;
  shimmerWidth?: number;
}

export function AnimatedShinyText({
  children,
  className,
  shimmerWidth = 100,
}: AnimatedShinyTextProps) {
  return (
    <span
      style={
        {
          "--shimmer-width": `${shimmerWidth}px`,
        } as CSSProperties
      }
      className={cn(
        "relative inline-block",
        "bg-clip-text text-transparent",
        "bg-[length:var(--shimmer-width)_100%] bg-no-repeat",
        "[background-image:linear-gradient(90deg,transparent_0%,currentColor_50%,transparent_100%),linear-gradient(currentColor,currentColor)]",
        "animate-shiny-text",
        className
      )}
    >
      {children}
    </span>
  );
}
