"use client";

import { cn } from "../../lib/cn";

interface BentoGridProps {
  children: React.ReactNode;
  className?: string;
}

export function BentoGrid({ children, className }: BentoGridProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 lg:grid-cols-4 gap-3 auto-rows-[180px] [grid-auto-flow:dense]",
        className
      )}
    >
      {children}
    </div>
  );
}
