import { useState, useEffect, useCallback } from 'react';
import { 
  Car, 
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Minus,
  ExternalLink,
  Loader2
} from 'lucide-react';

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

export function TrafficWidgetCompact() {
  const [trafficData, setTrafficData] = useState<TrafficData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTrafficData = useCallback(async () => {
    setIsLoading(true);
    
    try {
      // Simulated data - in production this would use Yandex Maps API
      const level = Math.floor(Math.random() * 6) + 3;
      const mockData: TrafficData = {
        level,
        localTime: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
        description: TRAFFIC_DESCRIPTIONS[level],
        trend: ['up', 'down', 'stable'][Math.floor(Math.random() * 3)] as 'up' | 'down' | 'stable',
      };
      
      setTrafficData(mockData);
    } catch (err) {
      console.error('Failed to fetch traffic data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTrafficData();
    const interval = setInterval(fetchTrafficData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchTrafficData]);

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

  if (isLoading && !trafficData) {
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
          <span className="text-xs font-medium">Пробки СПб</span>
        </div>
        <button
          onClick={fetchTrafficData}
          className="p-1 hover:bg-secondary rounded-md transition-colors"
          disabled={isLoading}
        >
          <RefreshCw className={`h-3 w-3 text-muted-foreground ${isLoading ? 'animate-spin' : ''}`} />
        </button>
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
            <div className="text-xs text-muted-foreground mt-0.5">
              {trafficData.localTime}
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

        {/* Link to Yandex Maps */}
        <a
          href="https://yandex.ru/maps/2/saint-petersburg/probki"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mt-3 py-1"
        >
          <ExternalLink className="h-3 w-3" />
          Яндекс.Карты
        </a>
      </div>
    </div>
  );
}

export default TrafficWidgetCompact;
