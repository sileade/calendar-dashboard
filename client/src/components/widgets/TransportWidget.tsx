import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Bus, 
  Train, 
  TrainFront,
  MapPin,
  RefreshCw,
  Plus,
  X,
  Clock,
  Navigation,
  Star,
  StarOff,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { trpc } from '@/lib/trpc';

interface TransportStop {
  id: string;
  name: string;
  lat: number;
  lon: number;
  distance?: number;
}

interface TransportArrival {
  routeId: string;
  routeName: string;
  routeType: 'bus' | 'tram' | 'trolleybus' | 'metro';
  arrivalTime: number; // minutes
  destination: string;
}

interface FavoriteStop {
  id: string;
  name: string;
}

const TRANSPORT_ICONS = {
  bus: Bus,
  tram: TrainFront,
  trolleybus: Bus,
  metro: Train,
};

const TRANSPORT_COLORS = {
  bus: 'bg-blue-500',
  tram: 'bg-red-500',
  trolleybus: 'bg-green-500',
  metro: 'bg-purple-500',
};

export function TransportWidget() {
  const [selectedStop, setSelectedStop] = useState<TransportStop | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [favoriteStops, setFavoriteStops] = useState<FavoriteStop[]>(() => {
    const saved = localStorage.getItem('spb-transport-favorites');
    return saved ? JSON.parse(saved) : [];
  });
  const [arrivals, setArrivals] = useState<TransportArrival[]>([]);
  const [nearbyStops, setNearbyStops] = useState<TransportStop[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{lat: number, lon: number} | null>(null);

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude
          });
        },
        () => {
          // Default to St. Petersburg center if geolocation fails
          setUserLocation({ lat: 59.9343, lon: 30.3351 });
        }
      );
    } else {
      setUserLocation({ lat: 59.9343, lon: 30.3351 });
    }
  }, []);

  // Fetch nearby stops
  const fetchNearbyStops = useCallback(async () => {
    if (!userLocation) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Simulated API call - in production, this would call the actual API
      const mockStops: TransportStop[] = [
        { id: '1', name: 'Невский проспект', lat: 59.9356, lon: 30.3271, distance: 150 },
        { id: '2', name: 'Гостиный двор', lat: 59.9330, lon: 30.3328, distance: 200 },
        { id: '3', name: 'Площадь Восстания', lat: 59.9310, lon: 30.3608, distance: 350 },
        { id: '4', name: 'Маяковская', lat: 59.9320, lon: 30.3548, distance: 400 },
        { id: '5', name: 'Адмиралтейская', lat: 59.9362, lon: 30.3145, distance: 500 },
      ];
      
      setNearbyStops(mockStops);
    } catch (err) {
      setError('Не удалось загрузить остановки');
    } finally {
      setIsLoading(false);
    }
  }, [userLocation]);

  useEffect(() => {
    fetchNearbyStops();
  }, [fetchNearbyStops]);

  // Fetch arrivals for selected stop
  const fetchArrivals = useCallback(async (stopId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Simulated API call - in production, this would call transport.orgp.spb.ru
      const mockArrivals: TransportArrival[] = [
        { routeId: '1', routeName: '3', routeType: 'bus', arrivalTime: 2, destination: 'Площадь Ленина' },
        { routeId: '2', routeName: '7', routeType: 'trolleybus', arrivalTime: 5, destination: 'Финляндский вокзал' },
        { routeId: '3', routeName: '22', routeType: 'tram', arrivalTime: 8, destination: 'Купчино' },
        { routeId: '4', routeName: '27', routeType: 'bus', arrivalTime: 12, destination: 'Проспект Просвещения' },
        { routeId: '5', routeName: 'М2', routeType: 'metro', arrivalTime: 3, destination: 'Парнас' },
      ];
      
      setArrivals(mockArrivals);
    } catch (err) {
      setError('Не удалось загрузить расписание');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedStop) {
      fetchArrivals(selectedStop.id);
      
      // Auto-refresh every 30 seconds
      const interval = setInterval(() => {
        fetchArrivals(selectedStop.id);
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [selectedStop, fetchArrivals]);

  // Save favorites to localStorage
  useEffect(() => {
    localStorage.setItem('spb-transport-favorites', JSON.stringify(favoriteStops));
  }, [favoriteStops]);

  const toggleFavorite = (stop: TransportStop) => {
    setFavoriteStops(prev => {
      const exists = prev.find(s => s.id === stop.id);
      if (exists) {
        return prev.filter(s => s.id !== stop.id);
      }
      return [...prev, { id: stop.id, name: stop.name }];
    });
  };

  const isFavorite = (stopId: string) => {
    return favoriteStops.some(s => s.id === stopId);
  };

  const filteredStops = nearbyStops.filter(stop =>
    stop.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getArrivalColor = (minutes: number) => {
    if (minutes <= 3) return 'text-green-600 dark:text-green-400';
    if (minutes <= 7) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-foreground/70';
  };

  return (
    <Card className="w-full h-full flex flex-col overflow-hidden">
      <CardHeader className="pb-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Bus className="h-5 w-5 text-blue-500" />
            Транспорт СПб
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={fetchNearbyStops}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 overflow-hidden flex flex-col gap-3 pt-0">
        {/* Search */}
        <div className="relative">
          <Input
            placeholder="Поиск остановки..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-8"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
              onClick={() => setSearchQuery('')}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        {/* Error State */}
        {error && (
          <div className="flex items-center gap-2 text-destructive text-sm p-2 bg-destructive/10 rounded-md">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        {/* Selected Stop Arrivals */}
        {selectedStop ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <span className="font-medium text-sm truncate">{selectedStop.name}</span>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => toggleFavorite(selectedStop)}
                >
                  {isFavorite(selectedStop.id) ? (
                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                  ) : (
                    <StarOff className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setSelectedStop(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <ScrollArea className="flex-1">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : arrivals.length > 0 ? (
                <div className="space-y-2">
                  {arrivals.map((arrival) => {
                    const Icon = TRANSPORT_ICONS[arrival.routeType];
                    return (
                      <div
                        key={arrival.routeId}
                        className="flex items-center gap-3 p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                      >
                        <div className={`p-1.5 rounded ${TRANSPORT_COLORS[arrival.routeType]}`}>
                          <Icon className="h-4 w-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="font-mono">
                              {arrival.routeName}
                            </Badge>
                            <span className="text-xs text-muted-foreground truncate">
                              → {arrival.destination}
                            </span>
                          </div>
                        </div>
                        <div className={`font-semibold text-sm ${getArrivalColor(arrival.arrivalTime)}`}>
                          {arrival.arrivalTime} мин
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  Нет данных о прибытии
                </div>
              )}
            </ScrollArea>
          </div>
        ) : (
          <>
            {/* Favorites */}
            {favoriteStops.length > 0 && (
              <div className="space-y-1">
                <div className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <Star className="h-3 w-3" />
                  Избранное
                </div>
                <div className="flex flex-wrap gap-1">
                  {favoriteStops.map((stop) => (
                    <Badge
                      key={stop.id}
                      variant="secondary"
                      className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                      onClick={() => {
                        const fullStop = nearbyStops.find(s => s.id === stop.id);
                        if (fullStop) {
                          setSelectedStop(fullStop);
                        } else {
                          setSelectedStop({ id: stop.id, name: stop.name, lat: 0, lon: 0 });
                        }
                      }}
                    >
                      {stop.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Nearby Stops */}
            <div className="flex-1 overflow-hidden flex flex-col">
              <div className="text-xs font-medium text-muted-foreground flex items-center gap-1 mb-1">
                <Navigation className="h-3 w-3" />
                Ближайшие остановки
              </div>
              <ScrollArea className="flex-1">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredStops.length > 0 ? (
                  <div className="space-y-1">
                    {filteredStops.map((stop) => (
                      <div
                        key={stop.id}
                        className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted cursor-pointer transition-colors"
                        onClick={() => setSelectedStop(stop)}
                      >
                        <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="flex-1 text-sm truncate">{stop.name}</span>
                        {stop.distance && (
                          <span className="text-xs text-muted-foreground">
                            {stop.distance} м
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    {searchQuery ? 'Остановки не найдены' : 'Нет ближайших остановок'}
                  </div>
                )}
              </ScrollArea>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default TransportWidget;
