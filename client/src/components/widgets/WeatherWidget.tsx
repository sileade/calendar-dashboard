import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Cloud, 
  Sun, 
  CloudRain, 
  CloudSnow, 
  Wind,
  Droplets,
  Thermometer,
  RefreshCw,
  Sunrise,
  Sunset,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { trpc } from '@/lib/trpc';

interface WeatherData {
  current: {
    temp: number;
    feelsLike: number;
    humidity: number;
    windSpeed: number;
    description: string;
    icon: string;
    sunrise: number;
    sunset: number;
  };
  forecast: Array<{
    date: number;
    tempMin: number;
    tempMax: number;
    description: string;
    icon: string;
  }>;
}

const WEATHER_ICONS: Record<string, React.ReactNode> = {
  '01d': <Sun className="h-8 w-8 text-yellow-500" />,
  '01n': <Sun className="h-8 w-8 text-yellow-300" />,
  '02d': <Cloud className="h-8 w-8 text-gray-400" />,
  '02n': <Cloud className="h-8 w-8 text-gray-500" />,
  '03d': <Cloud className="h-8 w-8 text-gray-400" />,
  '03n': <Cloud className="h-8 w-8 text-gray-500" />,
  '04d': <Cloud className="h-8 w-8 text-gray-500" />,
  '04n': <Cloud className="h-8 w-8 text-gray-600" />,
  '09d': <CloudRain className="h-8 w-8 text-blue-400" />,
  '09n': <CloudRain className="h-8 w-8 text-blue-500" />,
  '10d': <CloudRain className="h-8 w-8 text-blue-400" />,
  '10n': <CloudRain className="h-8 w-8 text-blue-500" />,
  '11d': <CloudRain className="h-8 w-8 text-purple-500" />,
  '11n': <CloudRain className="h-8 w-8 text-purple-600" />,
  '13d': <CloudSnow className="h-8 w-8 text-blue-200" />,
  '13n': <CloudSnow className="h-8 w-8 text-blue-300" />,
  '50d': <Cloud className="h-8 w-8 text-gray-300" />,
  '50n': <Cloud className="h-8 w-8 text-gray-400" />,
};

const SMALL_WEATHER_ICONS: Record<string, React.ReactNode> = {
  '01d': <Sun className="h-5 w-5 text-yellow-500" />,
  '01n': <Sun className="h-5 w-5 text-yellow-300" />,
  '02d': <Cloud className="h-5 w-5 text-gray-400" />,
  '02n': <Cloud className="h-5 w-5 text-gray-500" />,
  '03d': <Cloud className="h-5 w-5 text-gray-400" />,
  '03n': <Cloud className="h-5 w-5 text-gray-500" />,
  '04d': <Cloud className="h-5 w-5 text-gray-500" />,
  '04n': <Cloud className="h-5 w-5 text-gray-600" />,
  '09d': <CloudRain className="h-5 w-5 text-blue-400" />,
  '09n': <CloudRain className="h-5 w-5 text-blue-500" />,
  '10d': <CloudRain className="h-5 w-5 text-blue-400" />,
  '10n': <CloudRain className="h-5 w-5 text-blue-500" />,
  '11d': <CloudRain className="h-5 w-5 text-purple-500" />,
  '11n': <CloudRain className="h-5 w-5 text-purple-600" />,
  '13d': <CloudSnow className="h-5 w-5 text-blue-200" />,
  '13n': <CloudSnow className="h-5 w-5 text-blue-300" />,
  '50d': <Cloud className="h-5 w-5 text-gray-300" />,
  '50n': <Cloud className="h-5 w-5 text-gray-400" />,
};

export function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [useCelsius, setUseCelsius] = useState(true);

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          });
        },
        () => {
          // Default to St. Petersburg
          setLocation({ lat: 59.9343, lon: 30.3351 });
        }
      );
    } else {
      setLocation({ lat: 59.9343, lon: 30.3351 });
    }
  }, []);

  // Fetch weather data
  const fetchWeather = useCallback(async () => {
    if (!location) return;

    setIsLoading(true);
    setError(null);

    try {
      // Simulated API call - in production this would call the backend
      const mockWeather: WeatherData = {
        current: {
          temp: -2 + Math.floor(Math.random() * 5),
          feelsLike: -5 + Math.floor(Math.random() * 5),
          humidity: 70 + Math.floor(Math.random() * 20),
          windSpeed: 3 + Math.floor(Math.random() * 5),
          description: 'Облачно с прояснениями',
          icon: '04d',
          sunrise: new Date().setHours(9, 30, 0, 0),
          sunset: new Date().setHours(16, 0, 0, 0),
        },
        forecast: Array.from({ length: 5 }, (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() + i);
          return {
            date: date.getTime(),
            tempMin: -5 + Math.floor(Math.random() * 5),
            tempMax: 0 + Math.floor(Math.random() * 5),
            description: ['Облачно', 'Снег', 'Пасмурно', 'Ясно'][Math.floor(Math.random() * 4)],
            icon: ['04d', '13d', '03d', '01d'][Math.floor(Math.random() * 4)],
          };
        }),
      };

      setWeather(mockWeather);
    } catch (err) {
      setError('Не удалось загрузить погоду');
    } finally {
      setIsLoading(false);
    }
  }, [location]);

  useEffect(() => {
    fetchWeather();

    // Auto-refresh every 30 minutes
    const interval = setInterval(fetchWeather, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchWeather]);

  const formatTemp = (temp: number) => {
    if (useCelsius) {
      return `${temp > 0 ? '+' : ''}${temp}°C`;
    }
    const fahrenheit = Math.round((temp * 9) / 5 + 32);
    return `${fahrenheit}°F`;
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDay = (timestamp: number) => {
    const date = new Date(timestamp);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Сегодня';
    }
    if (date.toDateString() === tomorrow.toDateString()) {
      return 'Завтра';
    }
    return date.toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric' });
  };

  return (
    <Card className="w-full h-full flex flex-col overflow-hidden">
      <CardHeader className="pb-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Cloud className="h-5 w-5 text-blue-500" />
            Погода
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setUseCelsius(!useCelsius)}
              className="text-xs px-2"
            >
              {useCelsius ? '°C' : '°F'}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={fetchWeather}
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
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        ) : isLoading && !weather ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : weather ? (
          <>
            {/* Current Weather */}
            <div className="flex items-center gap-4 p-3 rounded-xl bg-gradient-to-br from-blue-500/10 to-purple-500/10">
              <div className="flex-shrink-0">
                {WEATHER_ICONS[weather.current.icon] || <Cloud className="h-8 w-8" />}
              </div>
              <div className="flex-1">
                <div className="text-3xl font-bold">{formatTemp(weather.current.temp)}</div>
                <div className="text-sm text-muted-foreground capitalize">
                  {weather.current.description}
                </div>
              </div>
            </div>

            {/* Weather Details */}
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                <Thermometer className="h-4 w-4 text-orange-500" />
                <div className="text-xs">
                  <div className="text-muted-foreground">Ощущается</div>
                  <div className="font-medium">{formatTemp(weather.current.feelsLike)}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                <Wind className="h-4 w-4 text-blue-500" />
                <div className="text-xs">
                  <div className="text-muted-foreground">Ветер</div>
                  <div className="font-medium">{weather.current.windSpeed} м/с</div>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                <Droplets className="h-4 w-4 text-cyan-500" />
                <div className="text-xs">
                  <div className="text-muted-foreground">Влажность</div>
                  <div className="font-medium">{weather.current.humidity}%</div>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                <div className="flex gap-1">
                  <Sunrise className="h-4 w-4 text-yellow-500" />
                  <Sunset className="h-4 w-4 text-orange-500" />
                </div>
                <div className="text-xs">
                  <div className="font-medium">
                    {formatTime(weather.current.sunrise)} / {formatTime(weather.current.sunset)}
                  </div>
                </div>
              </div>
            </div>

            {/* 5-Day Forecast */}
            <div className="flex-1 overflow-hidden">
              <div className="text-xs font-medium text-muted-foreground mb-2">
                Прогноз на 5 дней
              </div>
              <div className="space-y-1">
                {weather.forecast.map((day, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="w-16 text-xs font-medium">
                      {formatDay(day.date)}
                    </div>
                    <div className="flex-shrink-0">
                      {SMALL_WEATHER_ICONS[day.icon] || <Cloud className="h-5 w-5" />}
                    </div>
                    <div className="flex-1 text-xs text-muted-foreground truncate">
                      {day.description}
                    </div>
                    <div className="text-xs font-medium whitespace-nowrap">
                      <span className="text-blue-500">{formatTemp(day.tempMin)}</span>
                      {' / '}
                      <span className="text-red-500">{formatTemp(day.tempMax)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}

export default WeatherWidget;
