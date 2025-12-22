import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Car, 
  RefreshCw,
  MapPin,
  Clock,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  Loader2,
  ExternalLink
} from 'lucide-react';

interface TrafficData {
  level: number; // 0-10
  localTime: string;
  description: string;
  trend: 'up' | 'down' | 'stable';
  events: TrafficEvent[];
}

interface TrafficEvent {
  id: string;
  type: 'accident' | 'roadwork' | 'closure' | 'event';
  description: string;
  location: string;
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
  0: 'Дороги свободны',
  1: 'Дороги свободны',
  2: 'Почти свободно',
  3: 'Местами затруднения',
  4: 'Местами затруднения',
  5: 'Затруднённое движение',
  6: 'Затруднённое движение',
  7: 'Серьёзные пробки',
  8: 'Серьёзные пробки',
  9: 'Город стоит',
  10: 'Город стоит',
};

const EVENT_ICONS = {
  accident: AlertTriangle,
  roadwork: Car,
  closure: AlertTriangle,
  event: MapPin,
};

export function TrafficWidget() {
  const [trafficData, setTrafficData] = useState<TrafficData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showMap, setShowMap] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const ymapsRef = useRef<any>(null);

  // Fetch traffic data
  const fetchTrafficData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Simulated data - in production this would use Yandex Maps API
      const mockData: TrafficData = {
        level: Math.floor(Math.random() * 6) + 3, // Random 3-8 for demo
        localTime: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
        description: '',
        trend: ['up', 'down', 'stable'][Math.floor(Math.random() * 3)] as 'up' | 'down' | 'stable',
        events: [
          { id: '1', type: 'accident', description: 'ДТП', location: 'Невский пр., д. 100' },
          { id: '2', type: 'roadwork', description: 'Дорожные работы', location: 'Лиговский пр.' },
        ],
      };
      
      mockData.description = TRAFFIC_DESCRIPTIONS[mockData.level];
      setTrafficData(mockData);
    } catch (err) {
      setError('Не удалось загрузить данные о пробках');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTrafficData();
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchTrafficData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchTrafficData]);

  // Initialize Yandex Map with traffic layer
  useEffect(() => {
    if (!showMap || !mapRef.current) return;

    // Load Yandex Maps API
    const loadYandexMaps = () => {
      if (window.ymaps) {
        initMap();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://api-maps.yandex.ru/2.1/?apikey=demo&lang=ru_RU';
      script.async = true;
      script.onload = () => {
        window.ymaps.ready(initMap);
      };
      document.head.appendChild(script);
    };

    const initMap = () => {
      if (!mapRef.current || ymapsRef.current) return;

      const map = new window.ymaps.Map(mapRef.current, {
        center: [59.9343, 30.3351], // St. Petersburg
        zoom: 11,
        controls: ['zoomControl'],
      });

      // Add traffic layer
      const actualProvider = new window.ymaps.traffic.provider.Actual({}, { infoLayerShown: true });
      actualProvider.setMap(map);

      // Update traffic level from provider
      actualProvider.state.events.add('change', () => {
        const level = actualProvider.state.get('level');
        if (level !== undefined && trafficData) {
          setTrafficData(prev => prev ? { ...prev, level } : null);
        }
      });

      ymapsRef.current = map;
    };

    loadYandexMaps();

    return () => {
      if (ymapsRef.current) {
        ymapsRef.current.destroy();
        ymapsRef.current = null;
      }
    };
  }, [showMap]);

  const getTrendIcon = () => {
    if (!trafficData) return null;
    
    switch (trafficData.trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-red-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-green-500" />;
      default:
        return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getTrafficColor = (level: number) => {
    return TRAFFIC_COLORS[Math.min(Math.max(level, 0), 10)];
  };

  return (
    <Card className="w-full h-full flex flex-col overflow-hidden">
      <CardHeader className="pb-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Car className="h-5 w-5 text-orange-500" />
            Пробки СПб
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowMap(!showMap)}
              title={showMap ? 'Скрыть карту' : 'Показать карту'}
            >
              <MapPin className={`h-4 w-4 ${showMap ? 'text-primary' : ''}`} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={fetchTrafficData}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 overflow-hidden flex flex-col gap-3 pt-0">
        {error ? (
          <div className="flex items-center gap-2 text-destructive text-sm p-2 bg-destructive/10 rounded-md">
            <AlertTriangle className="h-4 w-4" />
            {error}
          </div>
        ) : isLoading && !trafficData ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : trafficData ? (
          <>
            {/* Traffic Score */}
            <div className="flex items-center gap-4 p-3 rounded-xl bg-muted/50">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center ${getTrafficColor(trafficData.level)} text-white font-bold text-2xl shadow-lg`}>
                {trafficData.level}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{trafficData.description}</span>
                  {getTrendIcon()}
                </div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                  <Clock className="h-3 w-3" />
                  Обновлено в {trafficData.localTime}
                </div>
              </div>
            </div>

            {/* Traffic Scale */}
            <div className="flex gap-0.5 h-2 rounded-full overflow-hidden">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((level) => (
                <div
                  key={level}
                  className={`flex-1 ${getTrafficColor(level)} ${level === trafficData.level ? 'ring-2 ring-foreground ring-offset-1' : 'opacity-40'}`}
                />
              ))}
            </div>

            {/* Map */}
            {showMap && (
              <div 
                ref={mapRef} 
                className="flex-1 min-h-[200px] rounded-lg overflow-hidden border"
              />
            )}

            {/* Traffic Events */}
            {!showMap && trafficData.events.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  События на дорогах
                </div>
                <div className="space-y-1">
                  {trafficData.events.map((event) => {
                    const Icon = EVENT_ICONS[event.type];
                    return (
                      <div
                        key={event.id}
                        className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 text-sm"
                      >
                        <Icon className="h-4 w-4 text-orange-500 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <span className="font-medium">{event.description}</span>
                          <span className="text-muted-foreground"> — {event.location}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Link to Yandex Maps */}
            <a
              href="https://yandex.ru/maps/2/saint-petersburg/probki"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
            >
              <ExternalLink className="h-3 w-3" />
              Открыть в Яндекс.Картах
            </a>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}

// Declare ymaps on window
declare global {
  interface Window {
    ymaps: any;
  }
}

export default TrafficWidget;
