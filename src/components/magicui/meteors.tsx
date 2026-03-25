"use client";

import { useMemo } from "react";
import { cn } from "../../lib/cn";

interface MeteorsProps {
  number?: number;
  minDelay?: number;
  maxDelay?: number;
  minDuration?: number;
  maxDuration?: number;
  angle?: number;
  className?: string;
}

export function Meteors({
  number = 20,
  minDelay = 0.2,
  maxDelay = 1.2,
  minDuration = 2,
  maxDuration = 10,
  angle = 215,
  className,
}: MeteorsProps) {
  const meteors = useMemo(() => {
    return Array.from({ length: number }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      delay: `${Math.random() * (maxDelay - minDelay) + minDelay}s`,
      duration: `${Math.random() * (maxDuration - minDuration) + minDuration}s`,
      size: `${Math.random() * 60 + 40}px`,
    }));
  }, [number, minDelay, maxDelay, minDuration, maxDuration]);

  return (
    <>
      {meteors.map((m) => (
        <span
          key={m.id}
          style={{
            top: "-20px",
            left: m.left,
            animationDelay: m.delay,
            animationDuration: m.duration,
            width: m.size,
            transform: `rotate(${angle}deg)`,
          }}
          className={cn(
            "pointer-events-none absolute h-px bg-gradient-to-r from-transparent via-accent-400/60 to-transparent",
            "animate-meteor",
            className
          )}
        />
      ))}
    </>
  );
}
