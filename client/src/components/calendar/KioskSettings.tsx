import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Monitor, ExternalLink, Hand, RefreshCw, MousePointer2, Maximize } from 'lucide-react';
import { toast } from 'sonner';

interface KioskSettings {
  enabled: boolean;
  homerUrl: string;
  autoRefreshInterval: number; // minutes
  hideCursor: boolean;
  fullscreen: boolean;
  swipeGesturesEnabled: boolean;
}

interface KioskSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DEFAULT_SETTINGS: KioskSettings = {
  enabled: false,
  homerUrl: '',
  autoRefreshInterval: 5,
  hideCursor: true,
  fullscreen: true,
  swipeGesturesEnabled: true,
};

const STORAGE_KEY = 'calendar-kiosk-settings';

export function useKioskSettings() {
  const [settings, setSettings] = useState<KioskSettings>(() => {
    if (typeof window === 'undefined') return DEFAULT_SETTINGS;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
      } catch {
        return DEFAULT_SETTINGS;
      }
    }
    return DEFAULT_SETTINGS;
  });

  const updateSettings = (newSettings: Partial<KioskSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  return { settings, updateSettings };
}

export function KioskSettingsModal({ isOpen, onClose }: KioskSettingsModalProps) {
  const { settings, updateSettings } = useKioskSettings();
  const [localSettings, setLocalSettings] = useState<KioskSettings>(settings);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings, isOpen]);

  const handleSave = () => {
    updateSettings(localSettings);
    toast.success('Kiosk settings saved');
    onClose();
  };

  const handleEnterKioskMode = () => {
    updateSettings({ ...localSettings, enabled: true });
    
    // Enter fullscreen if enabled
    if (localSettings.fullscreen && document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {
        toast.error('Could not enter fullscreen mode');
      });
    }
    
    toast.success('Kiosk mode enabled');
    onClose();
  };

  const handleExitKioskMode = () => {
    updateSettings({ ...localSettings, enabled: false });
    
    // Exit fullscreen
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen();
    }
    
    toast.success('Kiosk mode disabled');
  };

  const handleTestHomerUrl = () => {
    if (localSettings.homerUrl) {
      window.open(localSettings.homerUrl, '_blank');
    } else {
      toast.error('Please enter a Homer URL first');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Monitor className="w-5 h-5" />
            Kiosk Mode Settings
          </DialogTitle>
          <DialogDescription>
            Configure the calendar for wall-mounted display or Raspberry Pi deployment
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Kiosk Mode Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base font-medium">Kiosk Mode</Label>
              <p className="text-sm text-muted-foreground">
                Enable optimized display mode for dedicated screens
              </p>
            </div>
            <Switch
              checked={localSettings.enabled}
              onCheckedChange={(checked) => setLocalSettings(prev => ({ ...prev, enabled: checked }))}
            />
          </div>

          <Separator />

          {/* Homer Integration */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <ExternalLink className="w-4 h-4 text-muted-foreground" />
              <Label className="text-base font-medium">Homer Dashboard URL</Label>
            </div>
            <p className="text-sm text-muted-foreground">
              Swipe right with 3 fingers to navigate to your Homer dashboard
            </p>
            <div className="flex gap-2">
              <Input
                placeholder="http://homer.local or http://192.168.1.100:8080"
                value={localSettings.homerUrl}
                onChange={(e) => setLocalSettings(prev => ({ ...prev, homerUrl: e.target.value }))}
              />
              <Button variant="outline" size="icon" onClick={handleTestHomerUrl}>
                <ExternalLink className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <Separator />

          {/* Display Options */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Display Options</Label>

            {/* Fullscreen */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Maximize className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">Fullscreen Mode</span>
              </div>
              <Switch
                checked={localSettings.fullscreen}
                onCheckedChange={(checked) => setLocalSettings(prev => ({ ...prev, fullscreen: checked }))}
              />
            </div>

            {/* Hide Cursor */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MousePointer2 className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">Hide Cursor (after 3s inactivity)</span>
              </div>
              <Switch
                checked={localSettings.hideCursor}
                onCheckedChange={(checked) => setLocalSettings(prev => ({ ...prev, hideCursor: checked }))}
              />
            </div>

            {/* Swipe Gestures */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Hand className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">3-Finger Swipe Gestures</span>
              </div>
              <Switch
                checked={localSettings.swipeGesturesEnabled}
                onCheckedChange={(checked) => setLocalSettings(prev => ({ ...prev, swipeGesturesEnabled: checked }))}
              />
            </div>
          </div>

          <Separator />

          {/* Auto Refresh */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-muted-foreground" />
              <Label className="text-base font-medium">Auto Refresh</Label>
            </div>
            <p className="text-sm text-muted-foreground">
              Automatically refresh calendar every {localSettings.autoRefreshInterval} minutes
            </p>
            <Slider
              value={[localSettings.autoRefreshInterval]}
              onValueChange={([value]) => setLocalSettings(prev => ({ ...prev, autoRefreshInterval: value }))}
              min={1}
              max={60}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>1 min</span>
              <span>30 min</span>
              <span>60 min</span>
            </div>
          </div>

          {/* Gesture Instructions */}
          {localSettings.swipeGesturesEnabled && localSettings.homerUrl && (
            <>
              <Separator />
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <h4 className="font-medium text-sm">Gesture Controls</h4>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>• <strong>3-finger swipe right</strong>: Navigate to Homer dashboard</p>
                  <p>• <strong>3-finger swipe left</strong>: Return to calendar (from Homer)</p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-between pt-4 border-t">
          <div>
            {settings.enabled ? (
              <Button variant="outline" onClick={handleExitKioskMode}>
                Exit Kiosk Mode
              </Button>
            ) : (
              <Button variant="default" onClick={handleEnterKioskMode}>
                Enter Kiosk Mode
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save Settings
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Kiosk mode effects hook
export function useKioskMode() {
  const { settings } = useKioskSettings();

  // Auto-refresh effect
  useEffect(() => {
    if (!settings.enabled || settings.autoRefreshInterval <= 0) return;

    const interval = setInterval(() => {
      window.location.reload();
    }, settings.autoRefreshInterval * 60 * 1000);

    return () => clearInterval(interval);
  }, [settings.enabled, settings.autoRefreshInterval]);

  // Hide cursor effect
  useEffect(() => {
    if (!settings.enabled || !settings.hideCursor) return;

    let timeout: NodeJS.Timeout;
    const style = document.createElement('style');
    style.id = 'kiosk-cursor-style';

    const hideCursor = () => {
      style.textContent = '* { cursor: none !important; }';
      if (!document.head.contains(style)) {
        document.head.appendChild(style);
      }
    };

    const showCursor = () => {
      style.textContent = '';
    };

    const handleMouseMove = () => {
      showCursor();
      clearTimeout(timeout);
      timeout = setTimeout(hideCursor, 3000);
    };

    document.addEventListener('mousemove', handleMouseMove);
    timeout = setTimeout(hideCursor, 3000);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      clearTimeout(timeout);
      style.remove();
    };
  }, [settings.enabled, settings.hideCursor]);

  // Fullscreen effect
  useEffect(() => {
    if (!settings.enabled || !settings.fullscreen) return;

    const enterFullscreen = async () => {
      try {
        if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        }
      } catch (err) {
        console.warn('Could not enter fullscreen:', err);
      }
    };

    // Try to enter fullscreen on user interaction
    const handleInteraction = () => {
      enterFullscreen();
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('touchstart', handleInteraction);
    };

    document.addEventListener('click', handleInteraction);
    document.addEventListener('touchstart', handleInteraction);

    return () => {
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('touchstart', handleInteraction);
    };
  }, [settings.enabled, settings.fullscreen]);

  return settings;
}
