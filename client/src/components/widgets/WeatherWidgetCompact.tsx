import { useState, useEffect, useCallback } from 'react';
import { 
  Cloud, 
  Sun, 
  CloudRain, 
  CloudSnow, 
  CloudLightning,
  Wind,
  Droplets,
  RefreshCw,
  Loader2,
  ExternalLink,
  Thermometer
} from 'lucide-react';

interface WeatherData {
  temperature: number;
  feelsLike: number;
  condition: string;
  conditionCode: string;
  humidity: number;
  windSpeed: number;
  city: string;
  updatedAt: string;
}

const WEATHER_ICONS: Record<string, React.ElementType> = {
  'clear': Sun,
  'clouds': Cloud,
  'rain': CloudRain,
  'drizzle': CloudRain,
  'snow': CloudSnow,
  'thunderstorm': CloudLightning,
  'mist': Cloud,
  'fog': Cloud,
  'haze': Cloud,
};

const WEATHER_CONDITIONS_RU: Record<string, string> = {
  'clear': 'Ясно',
  'clouds': 'Облачно',
  'rain': 'Дождь',
  'drizzle': 'Морось',
  'snow': 'Снег',
  'thunderstorm': 'Гроза',
  'mist': 'Туман',
  'fog': 'Туман',
  'haze': 'Дымка',
};

export function WeatherWidgetCompact() {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchWeatherData = useCallback(async () => {
    setIsLoading(true);
    
    try {
      // Simulated data - in production this would use OpenWeatherMap API
      const conditions = ['clear', 'clouds', 'rain', 'snow'];
      const condition = conditions[Math.floor(Math.random() * conditions.length)];
      const temp = Math.floor(Math.random() * 15) - 5; // -5 to +10 for winter SPb
      
      const mockData: WeatherData = {
        temperature: temp,
        feelsLike: temp - 3,
        condition: WEATHER_CONDITIONS_RU[condition] || condition,
        conditionCode: condition,
        humidity: Math.floor(Math.random() * 30) + 60, // 60-90%
        windSpeed: Math.floor(Math.random() * 10) + 2, // 2-12 m/s
        city: 'Санкт-Петербург',
        updatedAt: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
      };
      
      setWeatherData(mockData);
    } catch (err) {
      console.error('Failed to fetch weather data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWeatherData();
    const interval = setInterval(fetchWeatherData, 30 * 60 * 1000); // Update every 30 min
    return () => clearInterval(interval);
  }, [fetchWeatherData]);

  const getWeatherIcon = (code: string) => {
    const Icon = WEATHER_ICONS[code] || Cloud;
    return Icon;
  };

  const getTemperatureColor = (temp: number) => {
    if (temp <= -10) return 'text-blue-400';
    if (temp <= 0) return 'text-cyan-400';
    if (temp <= 10) return 'text-green-400';
    if (temp <= 20) return 'text-yellow-400';
    if (temp <= 30) return 'text-orange-400';
    return 'text-red-400';
  };

  if (isLoading && !weatherData) {
    return (
      <div className="p-3 rounded-xl bg-muted/30 flex items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!weatherData) return null;

  const WeatherIcon = getWeatherIcon(weatherData.conditionCode);

  return (
    <div className="rounded-xl bg-muted/30 overflow-hidden">
      {/* Header */}
      <div className="px-3 py-2 flex items-center justify-between border-b border-border/50">
        <div className="flex items-center gap-2">
          <Thermometer className="h-4 w-4 text-blue-400" />
          <span className="text-xs font-medium">Погода</span>
        </div>
        <button
          onClick={fetchWeatherData}
          className="p-1 hover:bg-secondary rounded-md transition-colors"
          disabled={isLoading}
        >
          <RefreshCw className={`h-3 w-3 text-muted-foreground ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Weather Info */}
      <div className="p-3">
        <div className="flex items-center gap-3">
          {/* Temperature and Icon */}
          <div className="flex items-center gap-2">
            <WeatherIcon className="h-8 w-8 text-muted-foreground" />
            <div className={`text-2xl font-bold ${getTemperatureColor(weatherData.temperature)}`}>
              {weatherData.temperature > 0 ? '+' : ''}{weatherData.temperature}°
            </div>
          </div>
          
          {/* Details */}
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">{weatherData.condition}</div>
            <div className="text-xs text-muted-foreground">
              Ощущается {weatherData.feelsLike > 0 ? '+' : ''}{weatherData.feelsLike}°
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Droplets className="h-3 w-3" />
            <span>{weatherData.humidity}%</span>
          </div>
          <div className="flex items-center gap-1">
            <Wind className="h-3 w-3" />
            <span>{weatherData.windSpeed} м/с</span>
          </div>
        </div>

        {/* Link to Weather Service */}
        <a
          href="https://yandex.ru/pogoda/saint-petersburg"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mt-3 py-1"
        >
          <ExternalLink className="h-3 w-3" />
          Яндекс.Погода
        </a>
      </div>
    </div>
  );
}

export default WeatherWidgetCompact;
