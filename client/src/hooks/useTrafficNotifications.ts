/**
 * Traffic Notifications Hook
 * Tracks traffic level changes and sends notifications when traffic spikes
 */

import { useState, useCallback, useEffect, useRef } from 'react';

interface TrafficNotificationSettings {
  enabled: boolean;
  spikeThreshold: number; // Minimum increase to trigger notification (default: 2)
  cooldownMinutes: number; // Minutes between notifications (default: 15)
  soundEnabled: boolean;
}

interface TrafficHistory {
  level: number;
  timestamp: number;
}

const DEFAULT_SETTINGS: TrafficNotificationSettings = {
  enabled: true,
  spikeThreshold: 2,
  cooldownMinutes: 15,
  soundEnabled: true,
};

const STORAGE_KEY = 'traffic_notification_settings';
const HISTORY_KEY = 'traffic_level_history';
const LAST_NOTIFICATION_KEY = 'traffic_last_notification';

// Notification sound (short beep)
const playNotificationSound = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 880; // A5 note
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  } catch (e) {
    console.warn('Could not play notification sound:', e);
  }
};

export function useTrafficNotifications() {
  const [settings, setSettings] = useState<TrafficNotificationSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  const [history, setHistory] = useState<TrafficHistory[]>(() => {
    try {
      const saved = localStorage.getItem(HISTORY_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [lastNotificationTime, setLastNotificationTime] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(LAST_NOTIFICATION_KEY);
      return saved ? parseInt(saved, 10) : 0;
    } catch {
      return 0;
    }
  });

  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');
  const previousLevelRef = useRef<number | null>(null);

  // Check notification permission
  useEffect(() => {
    if ('Notification' in window) {
      setPermissionStatus(Notification.permission);
    }
  }, []);

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  // Save history to localStorage (keep last 20 entries)
  useEffect(() => {
    const trimmedHistory = history.slice(-20);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmedHistory));
  }, [history]);

  // Save last notification time
  useEffect(() => {
    localStorage.setItem(LAST_NOTIFICATION_KEY, lastNotificationTime.toString());
  }, [lastNotificationTime]);

  // Request notification permission
  const requestPermission = useCallback(async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setPermissionStatus(permission);
      return permission === 'granted';
    }
    return false;
  }, []);

  // Update settings
  const updateSettings = useCallback((newSettings: Partial<TrafficNotificationSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  // Check if we can send notification (cooldown check)
  const canSendNotification = useCallback(() => {
    const now = Date.now();
    const cooldownMs = settings.cooldownMinutes * 60 * 1000;
    return now - lastNotificationTime > cooldownMs;
  }, [settings.cooldownMinutes, lastNotificationTime]);

  // Send browser notification
  const sendNotification = useCallback((title: string, body: string, level: number) => {
    if (!settings.enabled || permissionStatus !== 'granted') return;
    if (!canSendNotification()) return;

    try {
      const notification = new Notification(title, {
        body,
        icon: '/favicon.ico',
        tag: 'traffic-spike',
        requireInteraction: false,
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      // Auto-close after 10 seconds
      setTimeout(() => notification.close(), 10000);

      setLastNotificationTime(Date.now());

      // Play sound if enabled
      if (settings.soundEnabled) {
        playNotificationSound();
      }
    } catch (e) {
      console.error('Failed to send notification:', e);
    }
  }, [settings.enabled, settings.soundEnabled, permissionStatus, canSendNotification]);

  // Track traffic level and detect spikes
  const trackTrafficLevel = useCallback((level: number) => {
    const now = Date.now();
    
    // Add to history
    setHistory(prev => [...prev, { level, timestamp: now }]);

    // Check for spike
    if (previousLevelRef.current !== null) {
      const increase = level - previousLevelRef.current;
      
      if (increase >= settings.spikeThreshold) {
        // Traffic spike detected!
        const levelDescriptions: Record<number, string> = {
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

        const description = levelDescriptions[level] || 'Пробки';
        
        sendNotification(
          `⚠️ Пробки: ${level} баллов (+${increase})`,
          `${description}. Уровень загруженности вырос с ${previousLevelRef.current} до ${level} баллов.`,
          level
        );
      }
    }

    previousLevelRef.current = level;
  }, [settings.spikeThreshold, sendNotification]);

  // Get traffic trend from history
  const getTrafficTrend = useCallback((): 'up' | 'down' | 'stable' => {
    if (history.length < 2) return 'stable';
    
    const recent = history.slice(-5);
    if (recent.length < 2) return 'stable';
    
    const firstLevel = recent[0].level;
    const lastLevel = recent[recent.length - 1].level;
    
    if (lastLevel > firstLevel + 1) return 'up';
    if (lastLevel < firstLevel - 1) return 'down';
    return 'stable';
  }, [history]);

  // Get average traffic level from history
  const getAverageLevel = useCallback((): number | null => {
    if (history.length === 0) return null;
    
    const sum = history.reduce((acc, h) => acc + h.level, 0);
    return Math.round(sum / history.length);
  }, [history]);

  // Clear history
  const clearHistory = useCallback(() => {
    setHistory([]);
    previousLevelRef.current = null;
  }, []);

  return {
    settings,
    updateSettings,
    permissionStatus,
    requestPermission,
    trackTrafficLevel,
    getTrafficTrend,
    getAverageLevel,
    clearHistory,
    history,
    canSendNotification: canSendNotification(),
  };
}

export type { TrafficNotificationSettings };
