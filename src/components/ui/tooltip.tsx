/**
 * Minimal Tooltip stubs for shadcn/ui compatibility.
 * Replace with full shadcn/ui install when ready.
 */
import React from 'react';

export function TooltipProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function Tooltip({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function TooltipTrigger({ children, ...props }: React.HTMLAttributes<HTMLDivElement> & { asChild?: boolean }) {
  return <div {...props}>{children}</div>;
}

export function TooltipContent({ children }: { children: React.ReactNode }) {
  return null;
}
