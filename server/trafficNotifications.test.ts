import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Traffic notification settings interface
interface TrafficNotificationSettings {
  enabled: boolean;
  spikeThreshold: number;
  cooldownMinutes: number;
  soundEnabled: boolean;
}

const DEFAULT_SETTINGS: TrafficNotificationSettings = {
  enabled: true,
  spikeThreshold: 2,
  cooldownMinutes: 15,
  soundEnabled: true,
};

// Traffic level descriptions
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

// Spike detection logic
function detectSpike(
  currentLevel: number,
  previousLevel: number | null,
  threshold: number
): { isSpike: boolean; increase: number } {
  if (previousLevel === null) {
    return { isSpike: false, increase: 0 };
  }
  
  const increase = currentLevel - previousLevel;
  return {
    isSpike: increase >= threshold,
    increase
  };
}

// Cooldown check logic
function canSendNotification(
  lastNotificationTime: number,
  cooldownMinutes: number
): boolean {
  const now = Date.now();
  const cooldownMs = cooldownMinutes * 60 * 1000;
  return now - lastNotificationTime > cooldownMs;
}

// Traffic trend calculation
function calculateTrend(
  history: { level: number; timestamp: number }[]
): 'up' | 'down' | 'stable' {
  if (history.length < 2) return 'stable';
  
  const recent = history.slice(-5);
  if (recent.length < 2) return 'stable';
  
  const firstLevel = recent[0].level;
  const lastLevel = recent[recent.length - 1].level;
  
  if (lastLevel > firstLevel + 1) return 'up';
  if (lastLevel < firstLevel - 1) return 'down';
  return 'stable';
}

// Average level calculation
function calculateAverageLevel(
  history: { level: number; timestamp: number }[]
): number | null {
  if (history.length === 0) return null;
  
  const sum = history.reduce((acc, h) => acc + h.level, 0);
  return Math.round(sum / history.length);
}

describe('Traffic Notifications', () => {
  describe('detectSpike', () => {
    it('should detect spike when increase meets threshold', () => {
      const result = detectSpike(6, 4, 2);
      
      expect(result.isSpike).toBe(true);
      expect(result.increase).toBe(2);
    });

    it('should detect spike when increase exceeds threshold', () => {
      const result = detectSpike(8, 4, 2);
      
      expect(result.isSpike).toBe(true);
      expect(result.increase).toBe(4);
    });

    it('should not detect spike when increase is below threshold', () => {
      const result = detectSpike(5, 4, 2);
      
      expect(result.isSpike).toBe(false);
      expect(result.increase).toBe(1);
    });

    it('should not detect spike when traffic decreases', () => {
      const result = detectSpike(3, 6, 2);
      
      expect(result.isSpike).toBe(false);
      expect(result.increase).toBe(-3);
    });

    it('should not detect spike when previous level is null', () => {
      const result = detectSpike(5, null, 2);
      
      expect(result.isSpike).toBe(false);
      expect(result.increase).toBe(0);
    });

    it('should work with different thresholds', () => {
      expect(detectSpike(7, 4, 3).isSpike).toBe(true);
      expect(detectSpike(7, 4, 4).isSpike).toBe(false);
      expect(detectSpike(9, 4, 5).isSpike).toBe(true);
    });
  });

  describe('canSendNotification', () => {
    it('should allow notification when cooldown has passed', () => {
      const lastNotification = Date.now() - 20 * 60 * 1000; // 20 minutes ago
      
      expect(canSendNotification(lastNotification, 15)).toBe(true);
    });

    it('should block notification during cooldown', () => {
      const lastNotification = Date.now() - 10 * 60 * 1000; // 10 minutes ago
      
      expect(canSendNotification(lastNotification, 15)).toBe(false);
    });

    it('should allow notification when no previous notification', () => {
      expect(canSendNotification(0, 15)).toBe(true);
    });

    it('should work with different cooldown values', () => {
      const lastNotification = Date.now() - 10 * 60 * 1000; // 10 minutes ago
      
      expect(canSendNotification(lastNotification, 5)).toBe(true);
      expect(canSendNotification(lastNotification, 10)).toBe(false);
      expect(canSendNotification(lastNotification, 15)).toBe(false);
    });
  });

  describe('calculateTrend', () => {
    it('should return stable for empty history', () => {
      expect(calculateTrend([])).toBe('stable');
    });

    it('should return stable for single entry', () => {
      expect(calculateTrend([{ level: 5, timestamp: Date.now() }])).toBe('stable');
    });

    it('should detect upward trend', () => {
      const history = [
        { level: 3, timestamp: Date.now() - 4000 },
        { level: 4, timestamp: Date.now() - 3000 },
        { level: 5, timestamp: Date.now() - 2000 },
        { level: 6, timestamp: Date.now() - 1000 },
        { level: 7, timestamp: Date.now() },
      ];
      
      expect(calculateTrend(history)).toBe('up');
    });

    it('should detect downward trend', () => {
      const history = [
        { level: 7, timestamp: Date.now() - 4000 },
        { level: 6, timestamp: Date.now() - 3000 },
        { level: 5, timestamp: Date.now() - 2000 },
        { level: 4, timestamp: Date.now() - 1000 },
        { level: 3, timestamp: Date.now() },
      ];
      
      expect(calculateTrend(history)).toBe('down');
    });

    it('should return stable for minor fluctuations', () => {
      const history = [
        { level: 5, timestamp: Date.now() - 4000 },
        { level: 6, timestamp: Date.now() - 3000 },
        { level: 5, timestamp: Date.now() - 2000 },
        { level: 6, timestamp: Date.now() - 1000 },
        { level: 5, timestamp: Date.now() },
      ];
      
      expect(calculateTrend(history)).toBe('stable');
    });
  });

  describe('calculateAverageLevel', () => {
    it('should return null for empty history', () => {
      expect(calculateAverageLevel([])).toBe(null);
    });

    it('should calculate average for single entry', () => {
      expect(calculateAverageLevel([{ level: 5, timestamp: Date.now() }])).toBe(5);
    });

    it('should calculate average for multiple entries', () => {
      const history = [
        { level: 3, timestamp: Date.now() - 2000 },
        { level: 5, timestamp: Date.now() - 1000 },
        { level: 7, timestamp: Date.now() },
      ];
      
      expect(calculateAverageLevel(history)).toBe(5);
    });

    it('should round average to nearest integer', () => {
      const history = [
        { level: 3, timestamp: Date.now() - 1000 },
        { level: 4, timestamp: Date.now() },
      ];
      
      // Average is 3.5, should round to 4
      expect(calculateAverageLevel(history)).toBe(4);
    });
  });

  describe('TRAFFIC_DESCRIPTIONS', () => {
    it('should have descriptions for all levels 0-10', () => {
      for (let level = 0; level <= 10; level++) {
        expect(TRAFFIC_DESCRIPTIONS[level]).toBeDefined();
        expect(typeof TRAFFIC_DESCRIPTIONS[level]).toBe('string');
        expect(TRAFFIC_DESCRIPTIONS[level].length).toBeGreaterThan(0);
      }
    });

    it('should have Russian descriptions', () => {
      expect(TRAFFIC_DESCRIPTIONS[0]).toBe('Свободно');
      expect(TRAFFIC_DESCRIPTIONS[5]).toBe('Затруднено');
      expect(TRAFFIC_DESCRIPTIONS[10]).toBe('Город стоит');
    });
  });

  describe('DEFAULT_SETTINGS', () => {
    it('should have valid default values', () => {
      expect(DEFAULT_SETTINGS.enabled).toBe(true);
      expect(DEFAULT_SETTINGS.spikeThreshold).toBeGreaterThanOrEqual(1);
      expect(DEFAULT_SETTINGS.spikeThreshold).toBeLessThanOrEqual(5);
      expect(DEFAULT_SETTINGS.cooldownMinutes).toBeGreaterThanOrEqual(5);
      expect(DEFAULT_SETTINGS.soundEnabled).toBe(true);
    });
  });
});
