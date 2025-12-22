import axios from 'axios';

// SPb Transport API (transport.orgp.spb.ru)
const SPB_TRANSPORT_BASE_URL = 'https://transport.orgp.spb.ru/Portal/transport/internalapi';

// OpenWeatherMap API
const OPENWEATHER_BASE_URL = 'https://api.openweathermap.org/data/2.5';

// Yandex Traffic (embedded via iframe, no direct API needed for basic display)

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
  arrivalTime: number;
  destination: string;
}

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

interface GeoLocation {
  lat: number;
  lon: number;
}

// Cache for API responses
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 60 * 1000; // 1 minute

function getCached<T>(key: string): T | null {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data as T;
  }
  return null;
}

function setCache(key: string, data: any): void {
  cache.set(key, { data, timestamp: Date.now() });
}

// SPb Transport API
export async function getNearestStops(lat: number, lon: number, radius: number = 500): Promise<TransportStop[]> {
  const cacheKey = `stops_${lat}_${lon}_${radius}`;
  const cached = getCached<TransportStop[]>(cacheKey);
  if (cached) return cached;

  try {
    // Using GTFS data from SPb transport portal
    const response = await axios.get(`${SPB_TRANSPORT_BASE_URL}/stops/nearest`, {
      params: { lat, lon, radius },
      timeout: 10000,
    });

    const stops: TransportStop[] = response.data.map((stop: any) => ({
      id: stop.stop_id || stop.id,
      name: stop.stop_name || stop.name,
      lat: parseFloat(stop.stop_lat || stop.lat),
      lon: parseFloat(stop.stop_lon || stop.lon),
      distance: stop.distance,
    }));

    setCache(cacheKey, stops);
    return stops;
  } catch (error) {
    console.error('Error fetching nearest stops:', error);
    // Return mock data as fallback
    return getMockStops(lat, lon);
  }
}

export async function getStopArrivals(stopId: string): Promise<TransportArrival[]> {
  const cacheKey = `arrivals_${stopId}`;
  const cached = getCached<TransportArrival[]>(cacheKey);
  if (cached) return cached;

  try {
    const response = await axios.get(`${SPB_TRANSPORT_BASE_URL}/forecast/bystop`, {
      params: { stopID: stopId },
      timeout: 10000,
    });

    const arrivals: TransportArrival[] = response.data.map((arrival: any) => ({
      routeId: arrival.route_id || arrival.routeId,
      routeName: arrival.route_short_name || arrival.routeName,
      routeType: mapRouteType(arrival.route_type || arrival.routeType),
      arrivalTime: Math.round((arrival.arrival_time - Date.now()) / 60000),
      destination: arrival.trip_headsign || arrival.destination,
    }));

    setCache(cacheKey, arrivals);
    return arrivals;
  } catch (error) {
    console.error('Error fetching stop arrivals:', error);
    return getMockArrivals();
  }
}

function mapRouteType(type: number | string): 'bus' | 'tram' | 'trolleybus' | 'metro' {
  const typeMap: Record<string, 'bus' | 'tram' | 'trolleybus' | 'metro'> = {
    '0': 'tram',
    '1': 'metro',
    '3': 'bus',
    '800': 'trolleybus',
    'tram': 'tram',
    'metro': 'metro',
    'bus': 'bus',
    'trolleybus': 'trolleybus',
  };
  return typeMap[String(type)] || 'bus';
}

// Weather API (OpenWeatherMap)
export async function getWeather(lat: number, lon: number, apiKey?: string): Promise<WeatherData> {
  const cacheKey = `weather_${lat}_${lon}`;
  const cached = getCached<WeatherData>(cacheKey);
  if (cached) return cached;

  const key = apiKey || process.env.OPENWEATHER_API_KEY;
  
  if (!key) {
    console.warn('OpenWeatherMap API key not configured, using mock data');
    return getMockWeather();
  }

  try {
    // Get current weather
    const currentResponse = await axios.get(`${OPENWEATHER_BASE_URL}/weather`, {
      params: {
        lat,
        lon,
        appid: key,
        units: 'metric',
        lang: 'ru',
      },
      timeout: 10000,
    });

    // Get 5-day forecast
    const forecastResponse = await axios.get(`${OPENWEATHER_BASE_URL}/forecast`, {
      params: {
        lat,
        lon,
        appid: key,
        units: 'metric',
        lang: 'ru',
      },
      timeout: 10000,
    });

    const current = currentResponse.data;
    const forecast = forecastResponse.data;

    // Process forecast to get daily data
    const dailyForecast = processForecast(forecast.list);

    const weatherData: WeatherData = {
      current: {
        temp: Math.round(current.main.temp),
        feelsLike: Math.round(current.main.feels_like),
        humidity: current.main.humidity,
        windSpeed: Math.round(current.wind.speed),
        description: current.weather[0].description,
        icon: current.weather[0].icon,
        sunrise: current.sys.sunrise * 1000,
        sunset: current.sys.sunset * 1000,
      },
      forecast: dailyForecast,
    };

    setCache(cacheKey, weatherData);
    return weatherData;
  } catch (error) {
    console.error('Error fetching weather:', error);
    return getMockWeather();
  }
}

function processForecast(list: any[]): WeatherData['forecast'] {
  const dailyMap = new Map<string, any[]>();

  list.forEach((item) => {
    const date = new Date(item.dt * 1000).toDateString();
    if (!dailyMap.has(date)) {
      dailyMap.set(date, []);
    }
    dailyMap.get(date)!.push(item);
  });

  const forecast: WeatherData['forecast'] = [];
  
  dailyMap.forEach((items, dateStr) => {
    if (forecast.length >= 5) return;
    
    const temps = items.map((i) => i.main.temp);
    const midday = items.find((i) => {
      const hour = new Date(i.dt * 1000).getHours();
      return hour >= 11 && hour <= 14;
    }) || items[Math.floor(items.length / 2)];

    forecast.push({
      date: items[0].dt * 1000,
      tempMin: Math.round(Math.min(...temps)),
      tempMax: Math.round(Math.max(...temps)),
      description: midday.weather[0].description,
      icon: midday.weather[0].icon,
    });
  });

  return forecast;
}

// Geolocation utilities
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

// Mock data fallbacks
function getMockStops(lat: number, lon: number): TransportStop[] {
  const baseStops = [
    { id: '1', name: 'Невский проспект', lat: 59.9356, lon: 30.3271 },
    { id: '2', name: 'Гостиный двор', lat: 59.9330, lon: 30.3328 },
    { id: '3', name: 'Площадь Восстания', lat: 59.9310, lon: 30.3608 },
    { id: '4', name: 'Маяковская', lat: 59.9320, lon: 30.3548 },
    { id: '5', name: 'Адмиралтейская', lat: 59.9362, lon: 30.3145 },
    { id: '6', name: 'Садовая', lat: 59.9267, lon: 30.3178 },
    { id: '7', name: 'Сенная площадь', lat: 59.9270, lon: 30.3200 },
    { id: '8', name: 'Технологический институт', lat: 59.9167, lon: 30.3189 },
  ];

  return baseStops
    .map((stop) => ({
      ...stop,
      distance: calculateDistance(lat, lon, stop.lat, stop.lon),
    }))
    .sort((a, b) => (a.distance || 0) - (b.distance || 0))
    .slice(0, 5);
}

function getMockArrivals(): TransportArrival[] {
  const routes = [
    { routeId: '1', routeName: '3', routeType: 'bus' as const, destination: 'Площадь Ленина' },
    { routeId: '2', routeName: '7', routeType: 'trolleybus' as const, destination: 'Финляндский вокзал' },
    { routeId: '3', routeName: '22', routeType: 'tram' as const, destination: 'Купчино' },
    { routeId: '4', routeName: '27', routeType: 'bus' as const, destination: 'Проспект Просвещения' },
    { routeId: '5', routeName: 'М2', routeType: 'metro' as const, destination: 'Парнас' },
  ];

  return routes.map((route, index) => ({
    ...route,
    arrivalTime: 2 + index * 3 + Math.floor(Math.random() * 3),
  }));
}

function getMockWeather(): WeatherData {
  const now = new Date();
  const forecast: WeatherData['forecast'] = [];
  
  for (let i = 0; i < 5; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() + i);
    forecast.push({
      date: date.getTime(),
      tempMin: -5 + Math.floor(Math.random() * 5),
      tempMax: 0 + Math.floor(Math.random() * 5),
      description: ['Облачно', 'Снег', 'Пасмурно', 'Ясно'][Math.floor(Math.random() * 4)],
      icon: ['04d', '13d', '03d', '01d'][Math.floor(Math.random() * 4)],
    });
  }

  return {
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
    forecast,
  };
}

export type { TransportStop, TransportArrival, WeatherData, GeoLocation };
