import { useState, useEffect, useCallback, useRef } from 'react';

type ThemeMode = 'light' | 'dark' | 'auto';
type ThemeSource = 'manual' | 'time' | 'ambient' | 'system';

interface AdaptiveThemeConfig {
  mode: ThemeMode;
  sunriseTime: string; // HH:MM format
  sunsetTime: string;  // HH:MM format
  useAmbientLight: boolean;
  ambientLightThreshold: number; // lux value (0-1000)
  transitionDuration: number; // ms
}

interface AdaptiveThemeState {
  currentTheme: 'light' | 'dark';
  source: ThemeSource;
  ambientLight: number | null;
  isTransitioning: boolean;
}

const DEFAULT_CONFIG: AdaptiveThemeConfig = {
  mode: 'auto',
  sunriseTime: '07:00',
  sunsetTime: '19:00',
  useAmbientLight: true,
  ambientLightThreshold: 50,
  transitionDuration: 500,
};

const STORAGE_KEY = 'calendar-adaptive-theme';

export function useAdaptiveTheme(initialConfig?: Partial<AdaptiveThemeConfig>) {
  const [config, setConfig] = useState<AdaptiveThemeConfig>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return { ...DEFAULT_CONFIG, ...JSON.parse(saved), ...initialConfig };
      } catch {
        // Ignore parse errors
      }
    }
    return { ...DEFAULT_CONFIG, ...initialConfig };
  });

  const [state, setState] = useState<AdaptiveThemeState>({
    currentTheme: 'light',
    source: 'manual',
    ambientLight: null,
    isTransitioning: false,
  });

  const sensorRef = useRef<any>(null);
  const transitionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Save config to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  }, [config]);

  // Parse time string to minutes since midnight
  const parseTime = useCallback((timeStr: string): number => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  }, []);

  // Check if current time is during day hours
  const isDayTime = useCallback((): boolean => {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const sunriseMinutes = parseTime(config.sunriseTime);
    const sunsetMinutes = parseTime(config.sunsetTime);
    
    return currentMinutes >= sunriseMinutes && currentMinutes < sunsetMinutes;
  }, [config.sunriseTime, config.sunsetTime, parseTime]);

  // Determine theme based on ambient light
  const getThemeFromAmbientLight = useCallback((lux: number): 'light' | 'dark' => {
    return lux >= config.ambientLightThreshold ? 'light' : 'dark';
  }, [config.ambientLightThreshold]);

  // Apply theme to document
  const applyTheme = useCallback((theme: 'light' | 'dark', source: ThemeSource) => {
    setState(prev => ({ ...prev, isTransitioning: true }));

    // Add transition class
    document.documentElement.style.transition = `background-color ${config.transitionDuration}ms ease, color ${config.transitionDuration}ms ease`;

    // Apply theme
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Clear previous timeout
    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current);
    }

    // Remove transition after animation
    transitionTimeoutRef.current = setTimeout(() => {
      document.documentElement.style.transition = '';
      setState(prev => ({ ...prev, isTransitioning: false }));
    }, config.transitionDuration);

    setState(prev => ({
      ...prev,
      currentTheme: theme,
      source,
    }));
  }, [config.transitionDuration]);

  // Update theme based on current conditions
  const updateTheme = useCallback(() => {
    if (config.mode === 'light') {
      applyTheme('light', 'manual');
      return;
    }

    if (config.mode === 'dark') {
      applyTheme('dark', 'manual');
      return;
    }

    // Auto mode
    if (config.useAmbientLight && state.ambientLight !== null) {
      const theme = getThemeFromAmbientLight(state.ambientLight);
      applyTheme(theme, 'ambient');
      return;
    }

    // Fall back to time-based
    const theme = isDayTime() ? 'light' : 'dark';
    applyTheme(theme, 'time');
  }, [config.mode, config.useAmbientLight, state.ambientLight, isDayTime, getThemeFromAmbientLight, applyTheme]);

  // Initialize ambient light sensor
  useEffect(() => {
    if (!config.useAmbientLight || config.mode !== 'auto') {
      return;
    }

    // Check for AmbientLightSensor API
    if ('AmbientLightSensor' in window) {
      try {
        // @ts-ignore - AmbientLightSensor is not in TypeScript types
        const sensor = new AmbientLightSensor();
        sensorRef.current = sensor;

        sensor.addEventListener('reading', () => {
          const lux = sensor.illuminance;
          setState(prev => ({ ...prev, ambientLight: lux }));
        });

        sensor.addEventListener('error', (event: any) => {
          console.warn('Ambient light sensor error:', event.error);
          setState(prev => ({ ...prev, ambientLight: null }));
        });

        sensor.start();

        return () => {
          sensor.stop();
        };
      } catch (error) {
        console.warn('Could not initialize ambient light sensor:', error);
      }
    }

    // Fallback: use device light event (deprecated but still works in some browsers)
    const handleDeviceLight = (event: any) => {
      setState(prev => ({ ...prev, ambientLight: event.value }));
    };

    window.addEventListener('devicelight', handleDeviceLight);

    return () => {
      window.removeEventListener('devicelight', handleDeviceLight);
    };
  }, [config.useAmbientLight, config.mode]);

  // Listen for system theme changes
  useEffect(() => {
    if (config.mode !== 'auto') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      if (!config.useAmbientLight || state.ambientLight === null) {
        applyTheme(e.matches ? 'dark' : 'light', 'system');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [config.mode, config.useAmbientLight, state.ambientLight, applyTheme]);

  // Update theme when conditions change
  useEffect(() => {
    updateTheme();
  }, [updateTheme]);

  // Time-based theme update interval
  useEffect(() => {
    if (config.mode !== 'auto') return;

    // Check every minute for time-based theme changes
    const interval = setInterval(() => {
      if (!config.useAmbientLight || state.ambientLight === null) {
        updateTheme();
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [config.mode, config.useAmbientLight, state.ambientLight, updateTheme]);

  // Manual theme setters
  const setThemeMode = useCallback((mode: ThemeMode) => {
    setConfig(prev => ({ ...prev, mode }));
  }, []);

  const setSunriseTime = useCallback((time: string) => {
    setConfig(prev => ({ ...prev, sunriseTime: time }));
  }, []);

  const setSunsetTime = useCallback((time: string) => {
    setConfig(prev => ({ ...prev, sunsetTime: time }));
  }, []);

  const setUseAmbientLight = useCallback((use: boolean) => {
    setConfig(prev => ({ ...prev, useAmbientLight: use }));
  }, []);

  const setAmbientLightThreshold = useCallback((threshold: number) => {
    setConfig(prev => ({ ...prev, ambientLightThreshold: threshold }));
  }, []);

  const toggleTheme = useCallback(() => {
    const newTheme = state.currentTheme === 'light' ? 'dark' : 'light';
    setConfig(prev => ({ ...prev, mode: newTheme }));
  }, [state.currentTheme]);

  // Check if ambient light sensor is available
  const isAmbientLightSupported = 'AmbientLightSensor' in window || 'ondevicelight' in window;

  return {
    ...state,
    config,
    isAmbientLightSupported,
    setThemeMode,
    setSunriseTime,
    setSunsetTime,
    setUseAmbientLight,
    setAmbientLightThreshold,
    toggleTheme,
    updateTheme,
  };
}

export type { ThemeMode, ThemeSource, AdaptiveThemeConfig, AdaptiveThemeState };
