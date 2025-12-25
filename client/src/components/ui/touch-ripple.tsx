/**
 * Touch Ripple Component
 * Provides Material Design-like ripple effect for touch interactions
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface Ripple {
  id: number;
  x: number;
  y: number;
  size: number;
}

interface TouchRippleProps {
  className?: string;
  color?: string;
  duration?: number;
  disabled?: boolean;
}

export function TouchRipple({
  className,
  color = 'currentColor',
  duration = 600,
  disabled = false,
}: TouchRippleProps) {
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const nextId = useRef(0);

  const addRipple = useCallback((event: React.TouchEvent | React.MouseEvent) => {
    if (disabled) return;

    const element = event.currentTarget as HTMLElement;
    const rect = element.getBoundingClientRect();
    
    let clientX: number;
    let clientY: number;
    
    if ('touches' in event) {
      clientX = event.touches[0].clientX;
      clientY = event.touches[0].clientY;
    } else {
      clientX = event.clientX;
      clientY = event.clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    // Calculate ripple size to cover the entire element
    const size = Math.max(rect.width, rect.height) * 2;

    const newRipple: Ripple = {
      id: nextId.current++,
      x,
      y,
      size,
    };

    setRipples((prev) => [...prev, newRipple]);

    // Remove ripple after animation
    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== newRipple.id));
    }, duration);
  }, [disabled, duration]);

  return (
    <span
      className={cn(
        'absolute inset-0 overflow-hidden rounded-[inherit] pointer-events-none',
        className
      )}
      onTouchStart={addRipple}
      onMouseDown={addRipple}
    >
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="absolute rounded-full animate-ripple opacity-30"
          style={{
            left: ripple.x - ripple.size / 2,
            top: ripple.y - ripple.size / 2,
            width: ripple.size,
            height: ripple.size,
            backgroundColor: color,
            animationDuration: `${duration}ms`,
          }}
        />
      ))}
    </span>
  );
}

/**
 * TouchFeedback wrapper component
 * Wraps children with touch feedback (ripple + active state)
 */
interface TouchFeedbackProps {
  children: React.ReactNode;
  className?: string;
  activeClassName?: string;
  rippleColor?: string;
  disabled?: boolean;
  onPress?: () => void;
  onLongPress?: () => void;
}

export function TouchFeedback({
  children,
  className,
  activeClassName = 'bg-foreground/10',
  rippleColor,
  disabled = false,
  onPress,
  onLongPress,
}: TouchFeedbackProps) {
  const [isActive, setIsActive] = useState(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPress = useRef(false);

  const handleTouchStart = useCallback(() => {
    if (disabled) return;
    
    setIsActive(true);
    isLongPress.current = false;

    if (onLongPress) {
      longPressTimer.current = setTimeout(() => {
        isLongPress.current = true;
        onLongPress();
        // Haptic feedback
        if (navigator.vibrate) {
          navigator.vibrate(50);
        }
      }, 500);
    }
  }, [disabled, onLongPress]);

  const handleTouchEnd = useCallback(() => {
    setIsActive(false);
    
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    if (!isLongPress.current && onPress && !disabled) {
      onPress();
    }
  }, [disabled, onPress]);

  const handleTouchCancel = useCallback(() => {
    setIsActive(false);
    
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
      }
    };
  }, []);

  return (
    <div
      className={cn(
        'relative touch-manipulation select-none transition-colors duration-150',
        isActive && activeClassName,
        disabled && 'opacity-50 pointer-events-none',
        className
      )}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
      onMouseDown={handleTouchStart}
      onMouseUp={handleTouchEnd}
      onMouseLeave={handleTouchCancel}
    >
      {children}
      <TouchRipple color={rippleColor} disabled={disabled} />
    </div>
  );
}

/**
 * Swipeable component for swipe-to-action functionality
 */
interface SwipeableProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  leftAction?: React.ReactNode;
  rightAction?: React.ReactNode;
  threshold?: number;
  className?: string;
}

export function Swipeable({
  children,
  onSwipeLeft,
  onSwipeRight,
  leftAction,
  rightAction,
  threshold = 80,
  className,
}: SwipeableProps) {
  const [translateX, setTranslateX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    setIsDragging(true);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging) return;
    
    const currentX = e.touches[0].clientX;
    const diff = currentX - startX.current;
    
    // Apply resistance at edges
    const maxTranslate = threshold * 1.5;
    const resistedDiff = Math.sign(diff) * Math.min(Math.abs(diff) * 0.5, maxTranslate);
    
    setTranslateX(resistedDiff);
  }, [isDragging, threshold]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
    
    if (translateX > threshold && onSwipeRight) {
      onSwipeRight();
    } else if (translateX < -threshold && onSwipeLeft) {
      onSwipeLeft();
    }
    
    setTranslateX(0);
  }, [translateX, threshold, onSwipeLeft, onSwipeRight]);

  return (
    <div className={cn('relative overflow-hidden', className)}>
      {/* Left action background */}
      {leftAction && translateX > 0 && (
        <div 
          className="absolute inset-y-0 left-0 flex items-center justify-start px-4 bg-green-500"
          style={{ width: Math.abs(translateX) }}
        >
          {leftAction}
        </div>
      )}
      
      {/* Right action background */}
      {rightAction && translateX < 0 && (
        <div 
          className="absolute inset-y-0 right-0 flex items-center justify-end px-4 bg-red-500"
          style={{ width: Math.abs(translateX) }}
        >
          {rightAction}
        </div>
      )}
      
      {/* Main content */}
      <div
        className={cn(
          'relative bg-background',
          isDragging ? '' : 'transition-transform duration-200'
        )}
        style={{ transform: `translateX(${translateX}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </div>
    </div>
  );
}

export default TouchRipple;
