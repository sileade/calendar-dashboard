import { useState, useEffect, useCallback } from 'react';

interface GeoLocation {
  lat: number;
  lon: number;
  accuracy?: number;
  timestamp?: number;
}

interface GeolocationState {
  location: GeoLocation | null;
  error: string | null;
  isLoading: boolean;
  isSupported: boolean;
  permissionStatus: PermissionState | null;
}

interface UseGeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  watchPosition?: boolean;
  defaultLocation?: GeoLocation;
}

const DEFAULT_LOCATION: GeoLocation = {
  lat: 59.9343,
  lon: 30.3351,
}; // St. Petersburg

const STORAGE_KEY = 'calendar-user-location';

export function useGeolocation(options: UseGeolocationOptions = {}) {
  const {
    enableHighAccuracy = true,
    timeout = 10000,
    maximumAge = 60000,
    watchPosition = false,
    defaultLocation = DEFAULT_LOCATION,
  } = options;

  const [state, setState] = useState<GeolocationState>(() => {
    // Try to load saved location
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          location: parsed,
          error: null,
          isLoading: false,
          isSupported: 'geolocation' in navigator,
          permissionStatus: null,
        };
      } catch {
        // Ignore parse errors
      }
    }
    
    return {
      location: null,
      error: null,
      isLoading: true,
      isSupported: 'geolocation' in navigator,
      permissionStatus: null,
    };
  });

  // Check permission status
  useEffect(() => {
    if (!state.isSupported) return;

    navigator.permissions?.query({ name: 'geolocation' }).then((result) => {
      setState((prev) => ({ ...prev, permissionStatus: result.state }));

      result.addEventListener('change', () => {
        setState((prev) => ({ ...prev, permissionStatus: result.state }));
      });
    });
  }, [state.isSupported]);

  // Success handler
  const handleSuccess = useCallback((position: GeolocationPosition) => {
    const newLocation: GeoLocation = {
      lat: position.coords.latitude,
      lon: position.coords.longitude,
      accuracy: position.coords.accuracy,
      timestamp: position.timestamp,
    };

    // Save to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newLocation));

    setState((prev) => ({
      ...prev,
      location: newLocation,
      error: null,
      isLoading: false,
    }));
  }, []);

  // Error handler
  const handleError = useCallback((error: GeolocationPositionError) => {
    let errorMessage: string;

    switch (error.code) {
      case error.PERMISSION_DENIED:
        errorMessage = 'Доступ к геолокации запрещён';
        break;
      case error.POSITION_UNAVAILABLE:
        errorMessage = 'Информация о местоположении недоступна';
        break;
      case error.TIMEOUT:
        errorMessage = 'Время ожидания истекло';
        break;
      default:
        errorMessage = 'Неизвестная ошибка геолокации';
    }

    setState((prev) => ({
      ...prev,
      error: errorMessage,
      isLoading: false,
      // Use default location on error
      location: prev.location || defaultLocation,
    }));
  }, [defaultLocation]);

  // Get current position
  const getCurrentPosition = useCallback(() => {
    if (!state.isSupported) {
      setState((prev) => ({
        ...prev,
        error: 'Геолокация не поддерживается',
        isLoading: false,
        location: defaultLocation,
      }));
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    navigator.geolocation.getCurrentPosition(handleSuccess, handleError, {
      enableHighAccuracy,
      timeout,
      maximumAge,
    });
  }, [state.isSupported, handleSuccess, handleError, enableHighAccuracy, timeout, maximumAge, defaultLocation]);

  // Watch position
  useEffect(() => {
    if (!watchPosition || !state.isSupported) return;

    const watchId = navigator.geolocation.watchPosition(
      handleSuccess,
      handleError,
      { enableHighAccuracy, timeout, maximumAge }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [watchPosition, state.isSupported, handleSuccess, handleError, enableHighAccuracy, timeout, maximumAge]);

  // Initial fetch
  useEffect(() => {
    if (state.location) return; // Already have location
    getCurrentPosition();
  }, []);

  // Set manual location
  const setManualLocation = useCallback((location: GeoLocation) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(location));
    setState((prev) => ({
      ...prev,
      location,
      error: null,
      isLoading: false,
    }));
  }, []);

  // Clear saved location
  const clearLocation = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setState((prev) => ({
      ...prev,
      location: null,
      isLoading: true,
    }));
    getCurrentPosition();
  }, [getCurrentPosition]);

  return {
    ...state,
    getCurrentPosition,
    setManualLocation,
    clearLocation,
    defaultLocation,
  };
}

export type { GeoLocation, GeolocationState, UseGeolocationOptions };
