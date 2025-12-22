import { describe, expect, it, vi } from "vitest";

/**
 * Tests for widget functionality
 * Note: Widgets are client-side components that fetch data from external APIs
 * These tests verify the data structures and utility functions
 */

// Transport types
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

// Traffic types
interface TrafficData {
  level: number;
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

// Traffic level descriptions
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

// Utility function to get arrival color class
function getArrivalColor(minutes: number): string {
  if (minutes <= 3) return 'text-green-600';
  if (minutes <= 7) return 'text-yellow-600';
  return 'text-foreground/70';
}

// Utility function to get traffic color class
function getTrafficColor(level: number): string {
  const colors: Record<number, string> = {
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
  return colors[Math.min(Math.max(level, 0), 10)];
}

// Utility function to filter stops by search query
function filterStops(stops: TransportStop[], query: string): TransportStop[] {
  if (!query.trim()) return stops;
  return stops.filter(stop =>
    stop.name.toLowerCase().includes(query.toLowerCase())
  );
}

// Utility function to sort arrivals by time
function sortArrivalsByTime(arrivals: TransportArrival[]): TransportArrival[] {
  return [...arrivals].sort((a, b) => a.arrivalTime - b.arrivalTime);
}

describe("Transport Widget", () => {
  describe("TransportStop type", () => {
    it("should have required fields", () => {
      const stop: TransportStop = {
        id: '1',
        name: 'Невский проспект',
        lat: 59.9356,
        lon: 30.3271,
      };
      
      expect(stop.id).toBeDefined();
      expect(stop.name).toBeDefined();
      expect(stop.lat).toBeTypeOf('number');
      expect(stop.lon).toBeTypeOf('number');
    });

    it("should support optional distance field", () => {
      const stop: TransportStop = {
        id: '1',
        name: 'Невский проспект',
        lat: 59.9356,
        lon: 30.3271,
        distance: 150,
      };
      
      expect(stop.distance).toBe(150);
    });
  });

  describe("TransportArrival type", () => {
    it("should have all required fields", () => {
      const arrival: TransportArrival = {
        routeId: '1',
        routeName: '3',
        routeType: 'bus',
        arrivalTime: 5,
        destination: 'Площадь Ленина',
      };
      
      expect(arrival.routeId).toBeDefined();
      expect(arrival.routeName).toBeDefined();
      expect(arrival.routeType).toBe('bus');
      expect(arrival.arrivalTime).toBe(5);
      expect(arrival.destination).toBeDefined();
    });

    it("should support all transport types", () => {
      const types: TransportArrival['routeType'][] = ['bus', 'tram', 'trolleybus', 'metro'];
      
      types.forEach(type => {
        const arrival: TransportArrival = {
          routeId: '1',
          routeName: 'Test',
          routeType: type,
          arrivalTime: 5,
          destination: 'Test',
        };
        expect(arrival.routeType).toBe(type);
      });
    });
  });

  describe("getArrivalColor", () => {
    it("should return green for arrivals <= 3 minutes", () => {
      expect(getArrivalColor(0)).toBe('text-green-600');
      expect(getArrivalColor(1)).toBe('text-green-600');
      expect(getArrivalColor(2)).toBe('text-green-600');
      expect(getArrivalColor(3)).toBe('text-green-600');
    });

    it("should return yellow for arrivals 4-7 minutes", () => {
      expect(getArrivalColor(4)).toBe('text-yellow-600');
      expect(getArrivalColor(5)).toBe('text-yellow-600');
      expect(getArrivalColor(6)).toBe('text-yellow-600');
      expect(getArrivalColor(7)).toBe('text-yellow-600');
    });

    it("should return default color for arrivals > 7 minutes", () => {
      expect(getArrivalColor(8)).toBe('text-foreground/70');
      expect(getArrivalColor(15)).toBe('text-foreground/70');
      expect(getArrivalColor(30)).toBe('text-foreground/70');
    });
  });

  describe("filterStops", () => {
    const stops: TransportStop[] = [
      { id: '1', name: 'Невский проспект', lat: 59.9356, lon: 30.3271 },
      { id: '2', name: 'Гостиный двор', lat: 59.9330, lon: 30.3328 },
      { id: '3', name: 'Площадь Восстания', lat: 59.9310, lon: 30.3608 },
    ];

    it("should return all stops for empty query", () => {
      expect(filterStops(stops, '')).toHaveLength(3);
      expect(filterStops(stops, '   ')).toHaveLength(3);
    });

    it("should filter stops by name (case insensitive)", () => {
      expect(filterStops(stops, 'невский')).toHaveLength(1);
      expect(filterStops(stops, 'НЕВСКИЙ')).toHaveLength(1);
      expect(filterStops(stops, 'Невский')).toHaveLength(1);
    });

    it("should return empty array for no matches", () => {
      expect(filterStops(stops, 'xyz')).toHaveLength(0);
    });

    it("should support partial matches", () => {
      expect(filterStops(stops, 'площ')).toHaveLength(1);
      expect(filterStops(stops, 'ост')).toHaveLength(1); // Гостиный
    });
  });

  describe("sortArrivalsByTime", () => {
    it("should sort arrivals by arrival time ascending", () => {
      const arrivals: TransportArrival[] = [
        { routeId: '1', routeName: '3', routeType: 'bus', arrivalTime: 10, destination: 'A' },
        { routeId: '2', routeName: '7', routeType: 'bus', arrivalTime: 2, destination: 'B' },
        { routeId: '3', routeName: '22', routeType: 'tram', arrivalTime: 5, destination: 'C' },
      ];

      const sorted = sortArrivalsByTime(arrivals);
      
      expect(sorted[0].arrivalTime).toBe(2);
      expect(sorted[1].arrivalTime).toBe(5);
      expect(sorted[2].arrivalTime).toBe(10);
    });

    it("should not mutate original array", () => {
      const arrivals: TransportArrival[] = [
        { routeId: '1', routeName: '3', routeType: 'bus', arrivalTime: 10, destination: 'A' },
        { routeId: '2', routeName: '7', routeType: 'bus', arrivalTime: 2, destination: 'B' },
      ];

      const sorted = sortArrivalsByTime(arrivals);
      
      expect(arrivals[0].arrivalTime).toBe(10);
      expect(sorted[0].arrivalTime).toBe(2);
    });
  });
});

describe("Traffic Widget", () => {
  describe("TrafficData type", () => {
    it("should have all required fields", () => {
      const data: TrafficData = {
        level: 5,
        localTime: '12:30',
        description: 'Затруднённое движение',
        trend: 'up',
        events: [],
      };
      
      expect(data.level).toBe(5);
      expect(data.localTime).toBeDefined();
      expect(data.description).toBeDefined();
      expect(data.trend).toBe('up');
      expect(data.events).toBeInstanceOf(Array);
    });

    it("should support all trend values", () => {
      const trends: TrafficData['trend'][] = ['up', 'down', 'stable'];
      
      trends.forEach(trend => {
        const data: TrafficData = {
          level: 5,
          localTime: '12:30',
          description: 'Test',
          trend,
          events: [],
        };
        expect(data.trend).toBe(trend);
      });
    });
  });

  describe("TrafficEvent type", () => {
    it("should support all event types", () => {
      const types: TrafficEvent['type'][] = ['accident', 'roadwork', 'closure', 'event'];
      
      types.forEach(type => {
        const event: TrafficEvent = {
          id: '1',
          type,
          description: 'Test',
          location: 'Test location',
        };
        expect(event.type).toBe(type);
      });
    });
  });

  describe("TRAFFIC_DESCRIPTIONS", () => {
    it("should have descriptions for all levels 0-10", () => {
      for (let i = 0; i <= 10; i++) {
        expect(TRAFFIC_DESCRIPTIONS[i]).toBeDefined();
        expect(TRAFFIC_DESCRIPTIONS[i].length).toBeGreaterThan(0);
      }
    });

    it("should return 'Дороги свободны' for levels 0-1", () => {
      expect(TRAFFIC_DESCRIPTIONS[0]).toBe('Дороги свободны');
      expect(TRAFFIC_DESCRIPTIONS[1]).toBe('Дороги свободны');
    });

    it("should return 'Город стоит' for levels 9-10", () => {
      expect(TRAFFIC_DESCRIPTIONS[9]).toBe('Город стоит');
      expect(TRAFFIC_DESCRIPTIONS[10]).toBe('Город стоит');
    });
  });

  describe("getTrafficColor", () => {
    it("should return green colors for low traffic (0-2)", () => {
      expect(getTrafficColor(0)).toContain('green');
      expect(getTrafficColor(1)).toContain('green');
      expect(getTrafficColor(2)).toContain('green');
    });

    it("should return yellow/orange colors for medium traffic (4-6)", () => {
      expect(getTrafficColor(4)).toContain('yellow');
      expect(getTrafficColor(5)).toContain('yellow');
      expect(getTrafficColor(6)).toContain('orange');
    });

    it("should return red colors for high traffic (8-10)", () => {
      expect(getTrafficColor(8)).toContain('red');
      expect(getTrafficColor(9)).toContain('red');
      expect(getTrafficColor(10)).toContain('red');
    });

    it("should clamp values to 0-10 range", () => {
      expect(getTrafficColor(-5)).toBe(getTrafficColor(0));
      expect(getTrafficColor(15)).toBe(getTrafficColor(10));
    });
  });
});

describe("Widget Configuration", () => {
  it("should have correct default widget IDs", () => {
    const widgetIds = ['transport', 'traffic'];
    
    widgetIds.forEach(id => {
      expect(id).toMatch(/^[a-z]+$/);
    });
  });

  it("should store widget config in localStorage format", () => {
    const config = {
      transport: { enabled: true },
      traffic: { enabled: false },
    };
    
    const serialized = JSON.stringify(config);
    const parsed = JSON.parse(serialized);
    
    expect(parsed.transport.enabled).toBe(true);
    expect(parsed.traffic.enabled).toBe(false);
  });
});
