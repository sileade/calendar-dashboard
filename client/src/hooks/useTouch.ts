/**
 * Touch Gestures Hook
 * Provides swipe, long press, pinch, and tap detection for touch interfaces
 */

import { useRef, useCallback, useEffect, useState } from 'react';

export type SwipeDirection = 'left' | 'right' | 'up' | 'down';

interface TouchPoint {
  x: number;
  y: number;
  time: number;
}

interface TouchState {
  startPoint: TouchPoint | null;
  currentPoint: TouchPoint | null;
  isLongPress: boolean;
  isPinching: boolean;
  initialPinchDistance: number | null;
}

interface UseTouchOptions {
  onSwipe?: (direction: SwipeDirection) => void;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onLongPress?: (x: number, y: number) => void;
  onTap?: (x: number, y: number) => void;
  onDoubleTap?: (x: number, y: number) => void;
  onPinch?: (scale: number) => void;
  onPinchEnd?: (scale: number) => void;
  swipeThreshold?: number; // Minimum distance for swipe (px)
  swipeVelocityThreshold?: number; // Minimum velocity for swipe (px/ms)
  longPressDelay?: number; // Time for long press (ms)
  doubleTapDelay?: number; // Max time between taps for double tap (ms)
  disabled?: boolean;
}

const DEFAULT_OPTIONS: Required<Omit<UseTouchOptions, 'onSwipe' | 'onSwipeLeft' | 'onSwipeRight' | 'onSwipeUp' | 'onSwipeDown' | 'onLongPress' | 'onTap' | 'onDoubleTap' | 'onPinch' | 'onPinchEnd'>> = {
  swipeThreshold: 50,
  swipeVelocityThreshold: 0.3,
  longPressDelay: 500,
  doubleTapDelay: 300,
  disabled: false,
};

export function useTouch<T extends HTMLElement = HTMLElement>(options: UseTouchOptions = {}) {
  const {
    onSwipe,
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    onLongPress,
    onTap,
    onDoubleTap,
    onPinch,
    onPinchEnd,
    swipeThreshold = DEFAULT_OPTIONS.swipeThreshold,
    swipeVelocityThreshold = DEFAULT_OPTIONS.swipeVelocityThreshold,
    longPressDelay = DEFAULT_OPTIONS.longPressDelay,
    doubleTapDelay = DEFAULT_OPTIONS.doubleTapDelay,
    disabled = DEFAULT_OPTIONS.disabled,
  } = options;

  const ref = useRef<T>(null);
  const touchState = useRef<TouchState>({
    startPoint: null,
    currentPoint: null,
    isLongPress: false,
    isPinching: false,
    initialPinchDistance: null,
  });
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTapTime = useRef<number>(0);
  const [isTouching, setIsTouching] = useState(false);

  // Calculate distance between two touch points
  const getDistance = useCallback((touch1: Touch, touch2: Touch): number => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }, []);

  // Clear long press timer
  const clearLongPressTimer = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  // Handle touch start
  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (disabled) return;

    const touch = e.touches[0];
    const now = Date.now();

    touchState.current.startPoint = {
      x: touch.clientX,
      y: touch.clientY,
      time: now,
    };
    touchState.current.currentPoint = touchState.current.startPoint;
    touchState.current.isLongPress = false;
    setIsTouching(true);

    // Handle pinch start
    if (e.touches.length === 2) {
      touchState.current.isPinching = true;
      touchState.current.initialPinchDistance = getDistance(e.touches[0], e.touches[1]);
    }

    // Start long press timer
    if (onLongPress && e.touches.length === 1) {
      clearLongPressTimer();
      longPressTimer.current = setTimeout(() => {
        touchState.current.isLongPress = true;
        onLongPress(touch.clientX, touch.clientY);
        // Vibrate if supported
        if (navigator.vibrate) {
          navigator.vibrate(50);
        }
      }, longPressDelay);
    }
  }, [disabled, onLongPress, longPressDelay, clearLongPressTimer, getDistance]);

  // Handle touch move
  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (disabled || !touchState.current.startPoint) return;

    const touch = e.touches[0];
    touchState.current.currentPoint = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    };

    // Cancel long press if moved too much
    const dx = touch.clientX - touchState.current.startPoint.x;
    const dy = touch.clientY - touchState.current.startPoint.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > 10) {
      clearLongPressTimer();
    }

    // Handle pinch
    if (touchState.current.isPinching && e.touches.length === 2 && touchState.current.initialPinchDistance) {
      const currentDistance = getDistance(e.touches[0], e.touches[1]);
      const scale = currentDistance / touchState.current.initialPinchDistance;
      onPinch?.(scale);
    }
  }, [disabled, clearLongPressTimer, getDistance, onPinch]);

  // Handle touch end
  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (disabled) return;

    clearLongPressTimer();
    setIsTouching(false);

    const { startPoint, currentPoint, isLongPress, isPinching, initialPinchDistance } = touchState.current;

    // Handle pinch end
    if (isPinching && initialPinchDistance && e.touches.length < 2) {
      touchState.current.isPinching = false;
      touchState.current.initialPinchDistance = null;
      if (currentPoint && startPoint) {
        // Calculate final scale if we have the last two-finger position
      }
      onPinchEnd?.(1);
    }

    if (!startPoint || !currentPoint || isLongPress) {
      touchState.current.startPoint = null;
      touchState.current.currentPoint = null;
      return;
    }

    const dx = currentPoint.x - startPoint.x;
    const dy = currentPoint.y - startPoint.y;
    const dt = currentPoint.time - startPoint.time;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const velocity = distance / dt;

    // Check for swipe
    if (distance >= swipeThreshold && velocity >= swipeVelocityThreshold) {
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);

      let direction: SwipeDirection;
      if (absDx > absDy) {
        direction = dx > 0 ? 'right' : 'left';
      } else {
        direction = dy > 0 ? 'down' : 'up';
      }

      onSwipe?.(direction);
      
      switch (direction) {
        case 'left':
          onSwipeLeft?.();
          break;
        case 'right':
          onSwipeRight?.();
          break;
        case 'up':
          onSwipeUp?.();
          break;
        case 'down':
          onSwipeDown?.();
          break;
      }
    } else if (distance < 10) {
      // Check for tap/double tap
      const now = Date.now();
      const timeSinceLastTap = now - lastTapTime.current;

      if (timeSinceLastTap < doubleTapDelay && onDoubleTap) {
        onDoubleTap(currentPoint.x, currentPoint.y);
        lastTapTime.current = 0;
      } else {
        onTap?.(currentPoint.x, currentPoint.y);
        lastTapTime.current = now;
      }
    }

    touchState.current.startPoint = null;
    touchState.current.currentPoint = null;
  }, [
    disabled,
    clearLongPressTimer,
    swipeThreshold,
    swipeVelocityThreshold,
    doubleTapDelay,
    onSwipe,
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    onTap,
    onDoubleTap,
    onPinchEnd,
  ]);

  // Handle touch cancel
  const handleTouchCancel = useCallback(() => {
    clearLongPressTimer();
    setIsTouching(false);
    touchState.current = {
      startPoint: null,
      currentPoint: null,
      isLongPress: false,
      isPinching: false,
      initialPinchDistance: null,
    };
  }, [clearLongPressTimer]);

  // Attach event listeners
  useEffect(() => {
    const element = ref.current;
    if (!element || disabled) return;

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });
    element.addEventListener('touchcancel', handleTouchCancel, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
      element.removeEventListener('touchcancel', handleTouchCancel);
      clearLongPressTimer();
    };
  }, [disabled, handleTouchStart, handleTouchMove, handleTouchEnd, handleTouchCancel, clearLongPressTimer]);

  return {
    ref,
    isTouching,
  };
}

/**
 * Hook for pull-to-refresh functionality
 */
interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void> | void;
  threshold?: number;
  disabled?: boolean;
}

export function usePullToRefresh<T extends HTMLElement = HTMLElement>(options: UsePullToRefreshOptions) {
  const { onRefresh, threshold = 80, disabled = false } = options;
  
  const ref = useRef<T>(null);
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startY = useRef<number>(0);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (disabled || isRefreshing) return;
    
    const element = ref.current;
    if (!element || element.scrollTop > 0) return;
    
    startY.current = e.touches[0].clientY;
    setIsPulling(true);
  }, [disabled, isRefreshing]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isPulling || disabled || isRefreshing) return;
    
    const currentY = e.touches[0].clientY;
    const distance = Math.max(0, currentY - startY.current);
    
    // Apply resistance
    const resistedDistance = Math.min(distance * 0.5, threshold * 1.5);
    setPullDistance(resistedDistance);
  }, [isPulling, disabled, isRefreshing, threshold]);

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling || disabled) return;
    
    setIsPulling(false);
    
    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      setPullDistance(threshold);
      
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  }, [isPulling, disabled, pullDistance, threshold, isRefreshing, onRefresh]);

  useEffect(() => {
    const element = ref.current;
    if (!element || disabled) return;

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [disabled, handleTouchStart, handleTouchMove, handleTouchEnd]);

  return {
    ref,
    isPulling,
    pullDistance,
    isRefreshing,
    progress: Math.min(pullDistance / threshold, 1),
  };
}

export default useTouch;
