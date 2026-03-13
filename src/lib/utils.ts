import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Convert internal risk level to user-facing label */
export function riskDisplayLabel(level: string): string {
  switch (level) {
    case 'Low': return 'Conservative';
    case 'Medium': return 'Moderate';
    case 'High': return 'Aggressive';
    default: return level;
  }
}
