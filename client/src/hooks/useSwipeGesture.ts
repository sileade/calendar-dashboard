import { useEffect, useRef, useCallback } from 'react';

interface SwipeGestureOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  minFingers?: number;
  maxFingers?: number;
  threshold?: number;
  timeout?: number;
  enabled?: boolean;
}

interface TouchPoint {
  x: number;
  y: number;
  timestamp: number;
}

export function useSwipeGesture(options: SwipeGestureOptions = {}) {
  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    minFingers = 3,
    maxFingers = 3,
    threshold = 100,
    timeout = 500,
    enabled = true,
  } = options;

  const touchStartRef = useRef<TouchPoint | null>(null);
  const touchCountRef = useRef<number>(0);
  const isSwipingRef = useRef<boolean>(false);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!enabled) return;
    
    const touchCount = e.touches.length;
    touchCountRef.current = touchCount;

    if (touchCount >= minFingers && touchCount <= maxFingers) {
      // Calculate center point of all touches
      let sumX = 0;
      let sumY = 0;
      for (let i = 0; i < touchCount; i++) {
        sumX += e.touches[i].clientX;
        sumY += e.touches[i].clientY;
      }
      
      touchStartRef.current = {
        x: sumX / touchCount,
        y: sumY / touchCount,
        timestamp: Date.now(),
      };
      isSwipingRef.current = true;
    }
  }, [enabled, minFingers, maxFingers]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!enabled || !isSwipingRef.current || !touchStartRef.current) return;

    const touchCount = e.touches.length;
    
    // Check if we still have the required number of fingers
    if (touchCount < minFingers || touchCount > maxFingers) {
      isSwipingRef.current = false;
      touchStartRef.current = null;
      return;
    }
  }, [enabled, minFingers, maxFingers]);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (!enabled || !isSwipingRef.current || !touchStartRef.current) return;

    const touchEnd = e.changedTouches[0];
    const timeDiff = Date.now() - touchStartRef.current.timestamp;

    // Check if the gesture was completed within the timeout
    if (timeDiff > timeout) {
      isSwipingRef.current = false;
      touchStartRef.current = null;
      return;
    }

    // Calculate center point of ending touches
    let sumX = 0;
    let sumY = 0;
    const touchCount = e.changedTouches.length;
    for (let i = 0; i < touchCount; i++) {
      sumX += e.changedTouches[i].clientX;
      sumY += e.changedTouches[i].clientY;
    }
    const endX = sumX / touchCount;
    const endY = sumY / touchCount;

    const deltaX = endX - touchStartRef.current.x;
    const deltaY = endY - touchStartRef.current.y;
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    // Determine swipe direction
    if (absX > absY && absX > threshold) {
      if (deltaX > 0) {
        onSwipeRight?.();
      } else {
        onSwipeLeft?.();
      }
    } else if (absY > absX && absY > threshold) {
      if (deltaY > 0) {
        onSwipeDown?.();
      } else {
        onSwipeUp?.();
      }
    }

    isSwipingRef.current = false;
    touchStartRef.current = null;
  }, [enabled, threshold, timeout, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown]);

  useEffect(() => {
    if (!enabled) return;

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [enabled, handleTouchStart, handleTouchMove, handleTouchEnd]);
}

// Hook for detecting three-finger swipe specifically for Homer navigation
export function useHomerSwipe(homerUrl: string | null, enabled: boolean = true) {
  const handleSwipeRight = useCallback(() => {
    if (homerUrl && enabled) {
      // Show visual feedback
      showSwipeFeedback('right');
      
      // Navigate to Homer after a brief delay for visual feedback
      setTimeout(() => {
        window.location.href = homerUrl;
      }, 300);
    }
  }, [homerUrl, enabled]);

  useSwipeGesture({
    onSwipeRight: handleSwipeRight,
    minFingers: 3,
    maxFingers: 3,
    threshold: 100,
    timeout: 500,
    enabled: enabled && !!homerUrl,
  });
}

// Visual feedback for swipe gestures
function showSwipeFeedback(direction: 'left' | 'right' | 'up' | 'down') {
  const feedback = document.createElement('div');
  feedback.className = 'swipe-feedback';
  feedback.innerHTML = `
    <div class="swipe-feedback-content">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        ${direction === 'right' ? '<path d="M5 12h14M12 5l7 7-7 7"/>' : ''}
        ${direction === 'left' ? '<path d="M19 12H5M12 19l-7-7 7-7"/>' : ''}
        ${direction === 'up' ? '<path d="M12 19V5M5 12l7-7 7 7"/>' : ''}
        ${direction === 'down' ? '<path d="M12 5v14M19 12l-7 7-7-7"/>' : ''}
      </svg>
      <span>Navigating to Homer...</span>
    </div>
  `;
  
  feedback.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    animation: fadeIn 0.2s ease-out;
  `;
  
  const content = feedback.querySelector('.swipe-feedback-content') as HTMLElement;
  if (content) {
    content.style.cssText = `
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      color: white;
      font-size: 18px;
      font-weight: 500;
    `;
  }
  
  document.body.appendChild(feedback);
  
  // Remove after animation
  setTimeout(() => {
    feedback.remove();
  }, 2000);
}

// CSS for animations (should be added to index.css)
export const swipeGestureStyles = `
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  @keyframes slideInRight {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  
  @keyframes slideInLeft {
    from { transform: translateX(-100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  
  .swipe-indicator {
    position: fixed;
    top: 50%;
    transform: translateY(-50%);
    width: 4px;
    height: 100px;
    background: linear-gradient(to bottom, transparent, rgba(0, 122, 255, 0.5), transparent);
    border-radius: 2px;
    pointer-events: none;
    z-index: 9999;
    transition: opacity 0.2s;
  }
  
  .swipe-indicator.left {
    left: 0;
  }
  
  .swipe-indicator.right {
    right: 0;
  }
`;
