/**
 * District Detection Service
 * Determines city district based on GPS coordinates using polygon-based detection
 */

interface District {
  name: string;
  nameShort: string;
  polygon: [number, number][]; // [lat, lon] pairs
}

interface City {
  name: string;
  bounds: {
    minLat: number;
    maxLat: number;
    minLon: number;
    maxLon: number;
  };
  districts: District[];
}

// St. Petersburg districts with approximate polygon boundaries
const SPB_DISTRICTS: District[] = [
  {
    name: 'Центральный район',
    nameShort: 'Центр',
    polygon: [
      [59.93, 30.30], [59.95, 30.30], [59.95, 30.40], [59.93, 30.40]
    ]
  },
  {
    name: 'Адмиралтейский район',
    nameShort: 'Адмиралтейский',
    polygon: [
      [59.91, 30.25], [59.93, 30.25], [59.93, 30.35], [59.91, 30.35]
    ]
  },
  {
    name: 'Василеостровский район',
    nameShort: 'Васильевский остров',
    polygon: [
      [59.92, 30.20], [59.96, 30.20], [59.96, 30.30], [59.92, 30.30]
    ]
  },
  {
    name: 'Петроградский район',
    nameShort: 'Петроградка',
    polygon: [
      [59.95, 30.28], [59.98, 30.28], [59.98, 30.35], [59.95, 30.35]
    ]
  },
  {
    name: 'Выборгский район',
    nameShort: 'Выборгский',
    polygon: [
      [59.98, 30.28], [60.10, 30.28], [60.10, 30.45], [59.98, 30.45]
    ]
  },
  {
    name: 'Калининский район',
    nameShort: 'Калининский',
    polygon: [
      [59.98, 30.38], [60.05, 30.38], [60.05, 30.50], [59.98, 30.50]
    ]
  },
  {
    name: 'Красногвардейский район',
    nameShort: 'Красногвардейский',
    polygon: [
      [59.93, 30.40], [60.00, 30.40], [60.00, 30.55], [59.93, 30.55]
    ]
  },
  {
    name: 'Невский район',
    nameShort: 'Невский',
    polygon: [
      [59.85, 30.40], [59.93, 30.40], [59.93, 30.55], [59.85, 30.55]
    ]
  },
  {
    name: 'Фрунзенский район',
    nameShort: 'Фрунзенский',
    polygon: [
      [59.85, 30.35], [59.90, 30.35], [59.90, 30.45], [59.85, 30.45]
    ]
  },
  {
    name: 'Московский район',
    nameShort: 'Московский',
    polygon: [
      [59.82, 30.30], [59.88, 30.30], [59.88, 30.38], [59.82, 30.38]
    ]
  },
  {
    name: 'Кировский район',
    nameShort: 'Кировский',
    polygon: [
      [59.82, 30.20], [59.88, 30.20], [59.88, 30.30], [59.82, 30.30]
    ]
  },
  {
    name: 'Красносельский район',
    nameShort: 'Красносельский',
    polygon: [
      [59.75, 30.05], [59.85, 30.05], [59.85, 30.25], [59.75, 30.25]
    ]
  },
  {
    name: 'Приморский район',
    nameShort: 'Приморский',
    polygon: [
      [59.95, 30.15], [60.05, 30.15], [60.05, 30.28], [59.95, 30.28]
    ]
  },
  {
    name: 'Курортный район',
    nameShort: 'Курортный',
    polygon: [
      [60.05, 29.70], [60.20, 29.70], [60.20, 30.05], [60.05, 30.05]
    ]
  },
  {
    name: 'Петродворцовый район',
    nameShort: 'Петергоф',
    polygon: [
      [59.85, 29.70], [59.95, 29.70], [59.95, 30.00], [59.85, 30.00]
    ]
  },
  {
    name: 'Пушкинский район',
    nameShort: 'Пушкин',
    polygon: [
      [59.68, 30.35], [59.78, 30.35], [59.78, 30.50], [59.68, 30.50]
    ]
  },
  {
    name: 'Колпинский район',
    nameShort: 'Колпино',
    polygon: [
      [59.70, 30.55], [59.80, 30.55], [59.80, 30.70], [59.70, 30.70]
    ]
  },
  {
    name: 'Кронштадтский район',
    nameShort: 'Кронштадт',
    polygon: [
      [59.98, 29.70], [60.02, 29.70], [60.02, 29.85], [59.98, 29.85]
    ]
  }
];

// Moscow districts with approximate polygon boundaries
const MOSCOW_DISTRICTS: District[] = [
  {
    name: 'Центральный административный округ',
    nameShort: 'ЦАО',
    polygon: [
      [55.73, 37.58], [55.77, 37.58], [55.77, 37.66], [55.73, 37.66]
    ]
  },
  {
    name: 'Северный административный округ',
    nameShort: 'САО',
    polygon: [
      [55.80, 37.48], [55.90, 37.48], [55.90, 37.60], [55.80, 37.60]
    ]
  },
  {
    name: 'Северо-Восточный административный округ',
    nameShort: 'СВАО',
    polygon: [
      [55.80, 37.60], [55.92, 37.60], [55.92, 37.75], [55.80, 37.75]
    ]
  },
  {
    name: 'Восточный административный округ',
    nameShort: 'ВАО',
    polygon: [
      [55.73, 37.70], [55.82, 37.70], [55.82, 37.90], [55.73, 37.90]
    ]
  },
  {
    name: 'Юго-Восточный административный округ',
    nameShort: 'ЮВАО',
    polygon: [
      [55.65, 37.70], [55.73, 37.70], [55.73, 37.85], [55.65, 37.85]
    ]
  },
  {
    name: 'Южный административный округ',
    nameShort: 'ЮАО',
    polygon: [
      [55.60, 37.55], [55.70, 37.55], [55.70, 37.70], [55.60, 37.70]
    ]
  },
  {
    name: 'Юго-Западный административный округ',
    nameShort: 'ЮЗАО',
    polygon: [
      [55.62, 37.42], [55.70, 37.42], [55.70, 37.55], [55.62, 37.55]
    ]
  },
  {
    name: 'Западный административный округ',
    nameShort: 'ЗАО',
    polygon: [
      [55.70, 37.35], [55.78, 37.35], [55.78, 37.50], [55.70, 37.50]
    ]
  },
  {
    name: 'Северо-Западный административный округ',
    nameShort: 'СЗАО',
    polygon: [
      [55.78, 37.38], [55.88, 37.38], [55.88, 37.50], [55.78, 37.50]
    ]
  }
];

// City definitions with bounds
const CITIES: City[] = [
  {
    name: 'Санкт-Петербург',
    bounds: {
      minLat: 59.65,
      maxLat: 60.20,
      minLon: 29.40,
      maxLon: 31.10
    },
    districts: SPB_DISTRICTS
  },
  {
    name: 'Москва',
    bounds: {
      minLat: 55.50,
      maxLat: 56.00,
      minLon: 37.20,
      maxLon: 38.00
    },
    districts: MOSCOW_DISTRICTS
  }
];

/**
 * Check if a point is inside a polygon using ray casting algorithm
 */
function isPointInPolygon(lat: number, lon: number, polygon: [number, number][]): boolean {
  let inside = false;
  const n = polygon.length;
  
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const [yi, xi] = polygon[i];
    const [yj, xj] = polygon[j];
    
    if (((yi > lat) !== (yj > lat)) && (lon < (xj - xi) * (lat - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }
  
  return inside;
}

/**
 * Calculate distance between two points (Haversine formula)
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Get polygon center
 */
function getPolygonCenter(polygon: [number, number][]): [number, number] {
  const sumLat = polygon.reduce((acc, [lat]) => acc + lat, 0);
  const sumLon = polygon.reduce((acc, [, lon]) => acc + lon, 0);
  return [sumLat / polygon.length, sumLon / polygon.length];
}

/**
 * Find the nearest district if point is not inside any district
 */
function findNearestDistrict(lat: number, lon: number, districts: District[]): District | null {
  let nearestDistrict: District | null = null;
  let minDistance = Infinity;
  
  for (const district of districts) {
    const [centerLat, centerLon] = getPolygonCenter(district.polygon);
    const distance = calculateDistance(lat, lon, centerLat, centerLon);
    
    if (distance < minDistance) {
      minDistance = distance;
      nearestDistrict = district;
    }
  }
  
  return nearestDistrict;
}

export interface LocationInfo {
  city: string;
  district: string;
  districtShort: string;
  isExact: boolean; // true if point is inside district polygon, false if nearest
}

/**
 * Detect city and district based on GPS coordinates
 */
export function detectDistrict(lat: number, lon: number): LocationInfo {
  // Find which city the coordinates belong to
  for (const city of CITIES) {
    const { bounds, districts, name: cityName } = city;
    
    // Check if coordinates are within city bounds
    if (lat >= bounds.minLat && lat <= bounds.maxLat && 
        lon >= bounds.minLon && lon <= bounds.maxLon) {
      
      // Try to find exact district
      for (const district of districts) {
        if (isPointInPolygon(lat, lon, district.polygon)) {
          return {
            city: cityName,
            district: district.name,
            districtShort: district.nameShort,
            isExact: true
          };
        }
      }
      
      // If not in any district polygon, find nearest
      const nearestDistrict = findNearestDistrict(lat, lon, districts);
      if (nearestDistrict) {
        return {
          city: cityName,
          district: nearestDistrict.name,
          districtShort: nearestDistrict.nameShort,
          isExact: false
        };
      }
      
      // In city bounds but no district found
      return {
        city: cityName,
        district: '',
        districtShort: '',
        isExact: false
      };
    }
  }
  
  // Not in any known city
  return {
    city: 'Ваш район',
    district: '',
    districtShort: '',
    isExact: false
  };
}

/**
 * Get formatted location string
 */
export function getFormattedLocation(lat: number, lon: number): string {
  const info = detectDistrict(lat, lon);
  
  if (info.districtShort && info.city !== 'Ваш район') {
    return `${info.districtShort}, ${info.city}`;
  }
  
  return info.city;
}

/**
 * Get short location string (just district or city)
 */
export function getShortLocation(lat: number, lon: number): string {
  const info = detectDistrict(lat, lon);
  
  if (info.districtShort) {
    return info.districtShort;
  }
  
  return info.city;
}
