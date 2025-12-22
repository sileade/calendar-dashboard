import { useState, useEffect, useCallback, useMemo } from 'react';

type DeviceType = 'mobile' | 'tablet' | 'desktop' | 'tv';
type Orientation = 'portrait' | 'landscape';

interface ScreenInfo {
  width: number;
  height: number;
  devicePixelRatio: number;
  orientation: Orientation;
  deviceType: DeviceType;
  isTouch: boolean;
  isRetina: boolean;
}

interface LayoutConfig {
  // Calendar grid
  calendarCellHeight: number;
  calendarCellPadding: number;
  eventFontSize: number;
  maxVisibleEvents: number;
  
  // Sidebar
  sidebarWidth: number;
  sidebarCollapsed: boolean;
  
  // Widgets
  widgetPanelWidth: number;
  widgetMinHeight: number;
  
  // Typography
  baseFontSize: number;
  headingScale: number;
  
  // Spacing
  containerPadding: number;
  cardPadding: number;
  gap: number;
  
  // Touch
  minTouchTarget: number;
  
  // Kiosk specific
  showClock: boolean;
  clockSize: 'small' | 'medium' | 'large';
  autoHideControls: boolean;
  controlsHideDelay: number;
}

interface ResponsiveBreakpoints {
  mobile: number;
  tablet: number;
  desktop: number;
  tv: number;
}

const DEFAULT_BREAKPOINTS: ResponsiveBreakpoints = {
  mobile: 640,
  tablet: 1024,
  desktop: 1440,
  tv: 1920,
};

const STORAGE_KEY = 'calendar-responsive-layout';

// Predefined layouts for different devices
const DEVICE_LAYOUTS: Record<DeviceType, Partial<LayoutConfig>> = {
  mobile: {
    calendarCellHeight: 80,
    calendarCellPadding: 4,
    eventFontSize: 11,
    maxVisibleEvents: 2,
    sidebarWidth: 0,
    sidebarCollapsed: true,
    widgetPanelWidth: 0,
    widgetMinHeight: 150,
    baseFontSize: 14,
    headingScale: 1.2,
    containerPadding: 8,
    cardPadding: 12,
    gap: 8,
    minTouchTarget: 44,
    showClock: false,
    clockSize: 'small',
    autoHideControls: true,
    controlsHideDelay: 3000,
  },
  tablet: {
    calendarCellHeight: 100,
    calendarCellPadding: 8,
    eventFontSize: 12,
    maxVisibleEvents: 3,
    sidebarWidth: 240,
    sidebarCollapsed: false,
    widgetPanelWidth: 280,
    widgetMinHeight: 180,
    baseFontSize: 15,
    headingScale: 1.3,
    containerPadding: 16,
    cardPadding: 16,
    gap: 12,
    minTouchTarget: 44,
    showClock: true,
    clockSize: 'medium',
    autoHideControls: true,
    controlsHideDelay: 5000,
  },
  desktop: {
    calendarCellHeight: 120,
    calendarCellPadding: 12,
    eventFontSize: 13,
    maxVisibleEvents: 4,
    sidebarWidth: 280,
    sidebarCollapsed: false,
    widgetPanelWidth: 320,
    widgetMinHeight: 200,
    baseFontSize: 16,
    headingScale: 1.4,
    containerPadding: 24,
    cardPadding: 20,
    gap: 16,
    minTouchTarget: 32,
    showClock: true,
    clockSize: 'medium',
    autoHideControls: false,
    controlsHideDelay: 0,
  },
  tv: {
    calendarCellHeight: 160,
    calendarCellPadding: 16,
    eventFontSize: 18,
    maxVisibleEvents: 5,
    sidebarWidth: 360,
    sidebarCollapsed: false,
    widgetPanelWidth: 400,
    widgetMinHeight: 250,
    baseFontSize: 20,
    headingScale: 1.5,
    containerPadding: 32,
    cardPadding: 24,
    gap: 24,
    minTouchTarget: 48,
    showClock: true,
    clockSize: 'large',
    autoHideControls: true,
    controlsHideDelay: 10000,
  },
};

export function useResponsiveLayout(customBreakpoints?: Partial<ResponsiveBreakpoints>) {
  const breakpoints = useMemo(
    () => ({ ...DEFAULT_BREAKPOINTS, ...customBreakpoints }),
    [customBreakpoints]
  );

  const [screenInfo, setScreenInfo] = useState<ScreenInfo>(() => ({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768,
    devicePixelRatio: typeof window !== 'undefined' ? window.devicePixelRatio : 1,
    orientation: 'landscape',
    deviceType: 'desktop',
    isTouch: false,
    isRetina: false,
  }));

  const [customConfig, setCustomConfig] = useState<Partial<LayoutConfig>>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // Ignore parse errors
      }
    }
    return {};
  });

  // Determine device type based on screen width
  const getDeviceType = useCallback((width: number): DeviceType => {
    if (width < breakpoints.mobile) return 'mobile';
    if (width < breakpoints.tablet) return 'tablet';
    if (width < breakpoints.tv) return 'desktop';
    return 'tv';
  }, [breakpoints]);

  // Determine orientation
  const getOrientation = useCallback((width: number, height: number): Orientation => {
    return width >= height ? 'landscape' : 'portrait';
  }, []);

  // Check if device has touch capability
  const checkTouch = useCallback((): boolean => {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }, []);

  // Update screen info
  const updateScreenInfo = useCallback(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const devicePixelRatio = window.devicePixelRatio;

    setScreenInfo({
      width,
      height,
      devicePixelRatio,
      orientation: getOrientation(width, height),
      deviceType: getDeviceType(width),
      isTouch: checkTouch(),
      isRetina: devicePixelRatio >= 2,
    });
  }, [getDeviceType, getOrientation, checkTouch]);

  // Listen for resize and orientation changes
  useEffect(() => {
    updateScreenInfo();

    const handleResize = () => {
      updateScreenInfo();
    };

    const handleOrientationChange = () => {
      // Small delay to ensure dimensions are updated
      setTimeout(updateScreenInfo, 100);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);

    // Also listen for fullscreen changes
    document.addEventListener('fullscreenchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
      document.removeEventListener('fullscreenchange', handleResize);
    };
  }, [updateScreenInfo]);

  // Calculate layout config based on device type and custom overrides
  const layoutConfig = useMemo<LayoutConfig>(() => {
    const deviceLayout = DEVICE_LAYOUTS[screenInfo.deviceType];
    
    // Adjust for orientation
    let orientationAdjustments: Partial<LayoutConfig> = {};
    if (screenInfo.orientation === 'portrait' && screenInfo.deviceType !== 'mobile') {
      orientationAdjustments = {
        sidebarCollapsed: true,
        sidebarWidth: 0,
        widgetPanelWidth: 0,
        calendarCellHeight: deviceLayout.calendarCellHeight! * 0.8,
      };
    }

    // Merge all configs
    return {
      ...DEVICE_LAYOUTS.desktop, // Base defaults
      ...deviceLayout,
      ...orientationAdjustments,
      ...customConfig,
    } as LayoutConfig;
  }, [screenInfo.deviceType, screenInfo.orientation, customConfig]);

  // Save custom config
  const updateCustomConfig = useCallback((updates: Partial<LayoutConfig>) => {
    setCustomConfig(prev => {
      const newConfig = { ...prev, ...updates };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig));
      return newConfig;
    });
  }, []);

  // Reset to device defaults
  const resetToDefaults = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setCustomConfig({});
  }, []);

  // Apply CSS custom properties
  useEffect(() => {
    const root = document.documentElement;
    
    root.style.setProperty('--calendar-cell-height', `${layoutConfig.calendarCellHeight}px`);
    root.style.setProperty('--calendar-cell-padding', `${layoutConfig.calendarCellPadding}px`);
    root.style.setProperty('--event-font-size', `${layoutConfig.eventFontSize}px`);
    root.style.setProperty('--sidebar-width', `${layoutConfig.sidebarWidth}px`);
    root.style.setProperty('--widget-panel-width', `${layoutConfig.widgetPanelWidth}px`);
    root.style.setProperty('--base-font-size', `${layoutConfig.baseFontSize}px`);
    root.style.setProperty('--container-padding', `${layoutConfig.containerPadding}px`);
    root.style.setProperty('--card-padding', `${layoutConfig.cardPadding}px`);
    root.style.setProperty('--gap', `${layoutConfig.gap}px`);
    root.style.setProperty('--min-touch-target', `${layoutConfig.minTouchTarget}px`);
  }, [layoutConfig]);

  // Generate responsive class names
  const getResponsiveClasses = useCallback((baseClass: string) => {
    const classes = [baseClass];
    classes.push(`${baseClass}--${screenInfo.deviceType}`);
    classes.push(`${baseClass}--${screenInfo.orientation}`);
    if (screenInfo.isTouch) classes.push(`${baseClass}--touch`);
    if (screenInfo.isRetina) classes.push(`${baseClass}--retina`);
    return classes.join(' ');
  }, [screenInfo]);

  return {
    screenInfo,
    layoutConfig,
    breakpoints,
    updateCustomConfig,
    resetToDefaults,
    getResponsiveClasses,
    // Convenience booleans
    isMobile: screenInfo.deviceType === 'mobile',
    isTablet: screenInfo.deviceType === 'tablet',
    isDesktop: screenInfo.deviceType === 'desktop',
    isTV: screenInfo.deviceType === 'tv',
    isPortrait: screenInfo.orientation === 'portrait',
    isLandscape: screenInfo.orientation === 'landscape',
    isTouch: screenInfo.isTouch,
  };
}

export type { DeviceType, Orientation, ScreenInfo, LayoutConfig, ResponsiveBreakpoints };
