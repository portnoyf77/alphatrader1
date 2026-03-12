import { useState, useEffect, useRef } from 'react';

export function useCountUp(end: number, duration = 600, decimals = 0) {
  const [value, setValue] = useState(0);
  const prevEnd = useRef(end);
  const rafRef = useRef<number>();

  useEffect(() => {
    const start = prevEnd.current !== end ? prevEnd.current : 0;
    prevEnd.current = end;
    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(start + (end - start) * eased);
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [end, duration]);

  return decimals > 0 ? parseFloat(value.toFixed(decimals)) : Math.round(value);
}
