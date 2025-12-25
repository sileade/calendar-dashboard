import { describe, it, expect } from 'vitest';

// Since districtDetection is a client-side service, we'll test the logic here
// by recreating the core functions

interface District {
  name: string;
  nameShort: string;
  polygon: [number, number][];
}

interface LocationInfo {
  city: string;
  district: string;
  districtShort: string;
  isExact: boolean;
}

// Core polygon detection function
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

// St. Petersburg districts (subset for testing)
const SPB_DISTRICTS: District[] = [
  {
    name: 'Центральный район',
    nameShort: 'Центр',
    polygon: [
      [59.93, 30.30], [59.95, 30.30], [59.95, 30.40], [59.93, 30.40]
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
  }
];

// Moscow districts (subset for testing)
const MOSCOW_DISTRICTS: District[] = [
  {
    name: 'Центральный административный округ',
    nameShort: 'ЦАО',
    polygon: [
      [55.73, 37.58], [55.77, 37.58], [55.77, 37.66], [55.73, 37.66]
    ]
  }
];

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

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function getPolygonCenter(polygon: [number, number][]): [number, number] {
  const sumLat = polygon.reduce((acc, [lat]) => acc + lat, 0);
  const sumLon = polygon.reduce((acc, [, lon]) => acc + lon, 0);
  return [sumLat / polygon.length, sumLon / polygon.length];
}

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

function detectDistrict(lat: number, lon: number): LocationInfo {
  for (const city of CITIES) {
    const { bounds, districts, name: cityName } = city;
    
    if (lat >= bounds.minLat && lat <= bounds.maxLat && 
        lon >= bounds.minLon && lon <= bounds.maxLon) {
      
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
      
      const nearestDistrict = findNearestDistrict(lat, lon, districts);
      if (nearestDistrict) {
        return {
          city: cityName,
          district: nearestDistrict.name,
          districtShort: nearestDistrict.nameShort,
          isExact: false
        };
      }
      
      return {
        city: cityName,
        district: '',
        districtShort: '',
        isExact: false
      };
    }
  }
  
  return {
    city: 'Ваш район',
    district: '',
    districtShort: '',
    isExact: false
  };
}

describe('District Detection Service', () => {
  describe('isPointInPolygon', () => {
    it('should detect point inside a square polygon', () => {
      const polygon: [number, number][] = [
        [0, 0], [0, 10], [10, 10], [10, 0]
      ];
      
      expect(isPointInPolygon(5, 5, polygon)).toBe(true);
      expect(isPointInPolygon(1, 1, polygon)).toBe(true);
      expect(isPointInPolygon(9, 9, polygon)).toBe(true);
    });

    it('should detect point outside a square polygon', () => {
      const polygon: [number, number][] = [
        [0, 0], [0, 10], [10, 10], [10, 0]
      ];
      
      expect(isPointInPolygon(-1, 5, polygon)).toBe(false);
      expect(isPointInPolygon(11, 5, polygon)).toBe(false);
      expect(isPointInPolygon(5, -1, polygon)).toBe(false);
      expect(isPointInPolygon(5, 11, polygon)).toBe(false);
    });
  });

  describe('detectDistrict', () => {
    it('should detect St. Petersburg Central district', () => {
      // Point in Central district
      const result = detectDistrict(59.94, 30.35);
      
      expect(result.city).toBe('Санкт-Петербург');
      expect(result.districtShort).toBe('Центр');
      expect(result.isExact).toBe(true);
    });

    it('should detect Moscow Central district', () => {
      // Point in Moscow CAO
      const result = detectDistrict(55.75, 37.62);
      
      expect(result.city).toBe('Москва');
      expect(result.districtShort).toBe('ЦАО');
      expect(result.isExact).toBe(true);
    });

    it('should find nearest district when not in exact polygon', () => {
      // Point in St. Petersburg but not in any exact district polygon
      const result = detectDistrict(59.90, 30.35);
      
      expect(result.city).toBe('Санкт-Петербург');
      expect(result.isExact).toBe(false);
      // Should find some nearest district
      expect(result.districtShort).toBeTruthy();
    });

    it('should return default for unknown location', () => {
      // Point far from any known city
      const result = detectDistrict(40.0, 50.0);
      
      expect(result.city).toBe('Ваш район');
      expect(result.district).toBe('');
      expect(result.districtShort).toBe('');
      expect(result.isExact).toBe(false);
    });
  });

  describe('calculateDistance', () => {
    it('should calculate distance between two points', () => {
      // Distance from SPb center to Moscow center (approximately 635 km)
      const distance = calculateDistance(59.93, 30.31, 55.75, 37.62);
      
      expect(distance).toBeGreaterThan(600);
      expect(distance).toBeLessThan(700);
    });

    it('should return 0 for same point', () => {
      const distance = calculateDistance(59.93, 30.31, 59.93, 30.31);
      
      expect(distance).toBe(0);
    });
  });

  describe('getPolygonCenter', () => {
    it('should calculate center of a square polygon', () => {
      const polygon: [number, number][] = [
        [0, 0], [0, 10], [10, 10], [10, 0]
      ];
      
      const [centerLat, centerLon] = getPolygonCenter(polygon);
      
      expect(centerLat).toBe(5);
      expect(centerLon).toBe(5);
    });
  });
});
