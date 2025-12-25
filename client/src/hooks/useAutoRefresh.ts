import { useEffect, useRef, useState, useCallback } from 'react';

interface AutoRefreshOptions {
  /** Interval in milliseconds */
  interval: number;
  /** Whether auto-refresh is enabled */
  enabled?: boolean;
  /** Pause when tab is not visible */
  pauseOnHidden?: boolean;
  /** Callback to execute on each refresh */
  onRefresh: () => void | Promise<void>;
  /** Immediate refresh on mount */
  immediate?: boolean;
}

interface AutoRefreshState {
  lastRefresh: Date | null;
  isRefreshing: boolean;
  nextRefresh: Date | null;
  isPaused: boolean;
}

interface AutoRefreshReturn extends AutoRefreshState {
  /** Manually trigger a refresh */
  refresh: () => Promise<void>;
  /** Pause auto-refresh */
  pause: () => void;
  /** Resume auto-refresh */
  resume: () => void;
  /** Toggle auto-refresh */
  toggle: () => void;
  /** Time until next refresh in seconds */
  timeUntilRefresh: number;
}

export function useAutoRefresh({
  interval,
  enabled = true,
  pauseOnHidden = true,
  onRefresh,
  immediate = false,
}: AutoRefreshOptions): AutoRefreshReturn {
  const [state, setState] = useState<AutoRefreshState>({
    lastRefresh: null,
    isRefreshing: false,
    nextRefresh: null,
    isPaused: false,
  });
  
  const [timeUntilRefresh, setTimeUntilRefresh] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const onRefreshRef = useRef(onRefresh);
  
  // Keep callback ref updated
  useEffect(() => {
    onRefreshRef.current = onRefresh;
  }, [onRefresh]);

  const refresh = useCallback(async () => {
    setState(prev => ({ ...prev, isRefreshing: true }));
    try {
      await onRefreshRef.current();
      const now = new Date();
      setState(prev => ({
        ...prev,
        lastRefresh: now,
        isRefreshing: false,
        nextRefresh: new Date(now.getTime() + interval),
      }));
    } catch (error) {
      console.error('Auto-refresh error:', error);
      setState(prev => ({ ...prev, isRefreshing: false }));
    }
  }, [interval]);

  const pause = useCallback(() => {
    setState(prev => ({ ...prev, isPaused: true }));
  }, []);

  const resume = useCallback(() => {
    setState(prev => ({ ...prev, isPaused: false }));
  }, []);

  const toggle = useCallback(() => {
    setState(prev => ({ ...prev, isPaused: !prev.isPaused }));
  }, []);

  // Handle visibility change
  useEffect(() => {
    if (!pauseOnHidden) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        pause();
      } else {
        resume();
        // Refresh immediately when tab becomes visible
        refresh();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [pauseOnHidden, pause, resume, refresh]);

  // Main interval effect
  useEffect(() => {
    if (!enabled || state.isPaused) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Immediate refresh on mount if requested
    if (immediate && !state.lastRefresh) {
      refresh();
    }

    // Set up interval
    intervalRef.current = setInterval(refresh, interval);

    // Set initial next refresh time
    setState(prev => ({
      ...prev,
      nextRefresh: new Date(Date.now() + interval),
    }));

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, state.isPaused, interval, immediate, refresh, state.lastRefresh]);

  // Countdown timer
  useEffect(() => {
    if (!state.nextRefresh || state.isPaused || !enabled) {
      setTimeUntilRefresh(0);
      return;
    }

    const updateCountdown = () => {
      const now = Date.now();
      const next = state.nextRefresh?.getTime() || now;
      const remaining = Math.max(0, Math.ceil((next - now) / 1000));
      setTimeUntilRefresh(remaining);
    };

    updateCountdown();
    countdownRef.current = setInterval(updateCountdown, 1000);

    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
    };
  }, [state.nextRefresh, state.isPaused, enabled]);

  return {
    ...state,
    refresh,
    pause,
    resume,
    toggle,
    timeUntilRefresh,
  };
}

// Preset intervals
export const REFRESH_INTERVALS = {
  TRAFFIC: 2 * 60 * 1000,      // 2 minutes
  WEATHER: 10 * 60 * 1000,     // 10 minutes
  CALENDAR: 5 * 60 * 1000,     // 5 minutes
  TRANSPORT: 30 * 1000,        // 30 seconds
} as const;

// Format time until refresh
export function formatTimeUntilRefresh(seconds: number): string {
  if (seconds <= 0) return 'Обновление...';
  if (seconds < 60) return `${seconds} сек`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (remainingSeconds === 0) return `${minutes} мин`;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// Format last refresh time
export function formatLastRefresh(date: Date | null): string {
  if (!date) return 'Никогда';
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diff < 10) return 'Только что';
  if (diff < 60) return `${diff} сек назад`;
  if (diff < 3600) return `${Math.floor(diff / 60)} мин назад`;
  
  return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}
