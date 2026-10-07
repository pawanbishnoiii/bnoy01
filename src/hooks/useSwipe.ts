import { useRef } from 'react';

interface Opts {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  threshold?: number;
}

/** Lightweight touch swipe handler — returns props to spread on any element. */
export function useSwipe({ onSwipeLeft, onSwipeRight, threshold = 50 }: Opts) {
  const startX = useRef(0);
  const startY = useRef(0);
  return {
    onTouchStart: (e: React.TouchEvent) => {
      startX.current = e.touches[0].clientX;
      startY.current = e.touches[0].clientY;
    },
    onTouchEnd: (e: React.TouchEvent) => {
      const dx = e.changedTouches[0].clientX - startX.current;
      const dy = e.changedTouches[0].clientY - startY.current;
      if (Math.abs(dx) < threshold || Math.abs(dy) > Math.abs(dx)) return;
      if (dx < 0) onSwipeLeft?.();
      else onSwipeRight?.();
    },
  };
}
