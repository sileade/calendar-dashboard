import { useState, useCallback } from 'react';
import { 
  Car, 
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Minus,
  ExternalLink,
  Loader2,
  Pause,
  Play,
  MapPin,
  Navigation,
  AlertCircle
} from 'lucide-react';
import { useAutoRefresh, REFRESH_INTERVALS, formatLastRefresh, formatTimeUntilRefresh } from '@/hooks/useAutoRefresh';
import { useGeolocation } from '@/hooks/useGeolocation';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface TrafficData {
  level: number;
  description: string;
  trend: 'up' | 'down' | 'stable';
  localTime: string;
}

const TRAFFIC_COLORS: Record<number, string> = {
  0: 'bg-green-500',
  1: 'bg-green-500',
  2: 'bg-green-400',
  3: 'bg-lime-500',
  4: 'bg-yellow-400',
  5: 'bg-yellow-500',
  6: 'bg-orange-400',
  7: 'bg-orange-500',
  8: 'bg-red-400',
  9: 'bg-red-500',
  10: 'bg-red-600',
};

const TRAFFIC_DESCRIPTIONS: Record<number, string> = {
  0: 'Свободно',
  1: 'Свободно',
  2: 'Почти свободно',
  3: 'Местами затруднения',
  4: 'Местами затруднения',
  5: 'Затруднено',
  6: 'Затруднено',
  7: 'Пробки',
  8: 'Пробки',
  9: 'Город стоит',
  10: 'Город стоит',
};

// Determine city name based on coordinates
function getCityName(lat: number, lon: number): string {
  // St. Petersburg area
  if (lat >= 59.7 && lat <= 60.2 && lon >= 29.5 && lon <= 31.0) {
    return 'Санкт-Петербург';
  }
  // Moscow area
  if (lat >= 55.5 && lat <= 56.0 && lon >= 37.0 && lon <= 38.0) {
    return 'Москва';
  }
  // Default
  return 'Ваш район';
}

export function TrafficWidgetCompact() {
  const [trafficData, setTrafficData] = useState<TrafficData | null>(null);
  
  // Geolocation hook
  const {
    location,
    error: geoError,
    isLoading: geoLoading,
    permissionStatus,
    getCurrentPosition,
    defaultLocation,
  } = useGeolocation({
    enableHighAccuracy: false,
    timeout: 5000,
    maximumAge: 300000, // 5 minutes cache
  });

  const currentLocation = location || defaultLocation;
  const cityName = getCityName(currentLocation.lat, currentLocation.lon);

  const fetchTrafficData = useCallback(async () => {
    try {
      // In production, this would use Yandex Maps API with current location
      // const response = await fetch(`/api/traffic?lat=${currentLocation.lat}&lon=${currentLocation.lon}`);
      
      // Simulated data - varies slightly based on location
      const baseLevelForLocation = Math.abs(Math.round(currentLocation.lat * 10) % 5);
      const level = Math.min(10, Math.max(0, baseLevelForLocation + Math.floor(Math.random() * 4)));
      
      const mockData: TrafficData = {
        level,
        localTime: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
        description: TRAFFIC_DESCRIPTIONS[level],
        trend: ['up', 'down', 'stable'][Math.floor(Math.random() * 3)] as 'up' | 'down' | 'stable',
      };
      
      setTrafficData(mockData);
    } catch (err) {
      console.error('Failed to fetch traffic data:', err);
    }
  }, [currentLocation.lat, currentLocation.lon]);

  const {
    isRefreshing,
    lastRefresh,
    isPaused,
    timeUntilRefresh,
    refresh,
    toggle,
  } = useAutoRefresh({
    interval: REFRESH_INTERVALS.TRAFFIC,
    onRefresh: fetchTrafficData,
    immediate: true,
    pauseOnHidden: true,
  });

  const getTrendIcon = () => {
    if (!trafficData) return null;
    
    switch (trafficData.trend) {
      case 'up':
        return <TrendingUp className="h-3 w-3 text-red-500" />;
      case 'down':
        return <TrendingDown className="h-3 w-3 text-green-500" />;
      default:
        return <Minus className="h-3 w-3 text-muted-foreground" />;
    }
  };

  const getTrafficColor = (level: number) => {
    return TRAFFIC_COLORS[Math.min(Math.max(level, 0), 10)];
  };

  const getLocationStatusIcon = () => {
    if (geoLoading) {
      return <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />;
    }
    if (geoError || permissionStatus === 'denied') {
      return <AlertCircle className="h-3 w-3 text-yellow-500" />;
    }
    if (location) {
      return <Navigation className="h-3 w-3 text-green-500" />;
    }
    return <MapPin className="h-3 w-3 text-muted-foreground" />;
  };

  const getLocationTooltip = () => {
    if (geoLoading) return 'Определение местоположения...';
    if (geoError) return `Ошибка: ${geoError}. Используется СПб по умолчанию`;
    if (permissionStatus === 'denied') return 'Доступ к геолокации запрещён. Используется СПб по умолчанию';
    if (location) {
      const accuracy = location.accuracy ? ` (±${Math.round(location.accuracy)}м)` : '';
      return `${cityName}${accuracy}`;
    }
    return 'Нажмите для определения местоположения';
  };

  // Build Yandex Maps URL with current coordinates
  const yandexMapsUrl = `https://yandex.ru/maps/?ll=${currentLocation.lon},${currentLocation.lat}&z=12&l=trf`;

  if (isRefreshing && !trafficData) {
    return (
      <div className="p-3 rounded-xl bg-muted/30 flex items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!trafficData) return null;

  return (
    <div className="rounded-xl bg-muted/30 overflow-hidden">
      {/* Header */}
      <div className="px-3 py-2 flex items-center justify-between border-b border-border/50">
        <div className="flex items-center gap-2">
          <Car className="h-4 w-4 text-orange-500" />
          <span className="text-xs font-medium">Пробки</span>
          {/* Location indicator */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={getCurrentPosition}
                className="p-0.5 hover:bg-secondary rounded transition-colors"
                disabled={geoLoading}
              >
                {getLocationStatusIcon()}
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs max-w-[200px]">
              {getLocationTooltip()}
            </TooltipContent>
          </Tooltip>
        </div>
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={toggle}
                className="p-1 hover:bg-secondary rounded-md transition-colors"
              >
                {isPaused ? (
                  <Play className="h-3 w-3 text-muted-foreground" />
                ) : (
                  <Pause className="h-3 w-3 text-muted-foreground" />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              {isPaused ? 'Возобновить авто-обновление' : 'Приостановить авто-обновление'}
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={refresh}
                className="p-1 hover:bg-secondary rounded-md transition-colors"
                disabled={isRefreshing}
              >
                <RefreshCw className={`h-3 w-3 text-muted-foreground ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              Обновить сейчас
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Traffic Score */}
      <div className="p-3">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${getTrafficColor(trafficData.level)} text-white font-bold text-lg shadow-md`}>
            {trafficData.level}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-medium truncate">{trafficData.description}</span>
              {getTrendIcon()}
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
              <MapPin className="h-3 w-3" />
              <span className="truncate">{cityName}</span>
              <span>•</span>
              <span>{trafficData.localTime}</span>
            </div>
          </div>
        </div>

        {/* Traffic Scale */}
        <div className="flex gap-0.5 h-1.5 rounded-full overflow-hidden mt-3">
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((level) => (
            <div
              key={level}
              className={`flex-1 ${getTrafficColor(level)} ${level === trafficData.level ? 'ring-1 ring-foreground ring-offset-1' : 'opacity-30'}`}
            />
          ))}
        </div>

        {/* Auto-refresh indicator */}
        <div className="flex items-center justify-between text-[10px] text-muted-foreground mt-2">
          <span>{formatLastRefresh(lastRefresh)}</span>
          {!isPaused && (
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              {formatTimeUntilRefresh(timeUntilRefresh)}
            </span>
          )}
          {isPaused && (
            <span className="text-yellow-500">Приостановлено</span>
          )}
        </div>

        {/* Link to Yandex Maps with current location */}
        <a
          href={yandexMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mt-2 py-1"
        >
          <ExternalLink className="h-3 w-3" />
          Яндекс.Карты
        </a>
      </div>
    </div>
  );
}

export default TrafficWidgetCompact;
