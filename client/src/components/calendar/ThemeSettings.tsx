import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sun,
  Moon,
  Monitor,
  Lightbulb,
  Sunrise,
  Sunset,
  Eye,
  Palette,
} from 'lucide-react';
import { useAdaptiveTheme, ThemeMode } from '@/hooks/useAdaptiveTheme';

interface ThemeSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ThemeSettings({ isOpen, onClose }: ThemeSettingsProps) {
  const {
    currentTheme,
    source,
    ambientLight,
    config,
    isAmbientLightSupported,
    setThemeMode,
    setSunriseTime,
    setSunsetTime,
    setUseAmbientLight,
    setAmbientLightThreshold,
  } = useAdaptiveTheme();

  const getSourceLabel = () => {
    switch (source) {
      case 'manual':
        return 'Ручной выбор';
      case 'time':
        return 'По времени';
      case 'ambient':
        return 'По освещению';
      case 'system':
        return 'Системная';
      default:
        return 'Неизвестно';
    }
  };

  const getThemeIcon = () => {
    if (currentTheme === 'dark') {
      return <Moon className="h-5 w-5 text-blue-400" />;
    }
    return <Sun className="h-5 w-5 text-yellow-500" />;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Настройки темы
          </DialogTitle>
          <DialogDescription>
            Настройте автоматическое переключение темы
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Current Theme Status */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
            <div className="flex items-center gap-3">
              {getThemeIcon()}
              <div>
                <div className="font-medium">
                  {currentTheme === 'dark' ? 'Тёмная тема' : 'Светлая тема'}
                </div>
                <div className="text-xs text-muted-foreground">
                  {getSourceLabel()}
                </div>
              </div>
            </div>
            {ambientLight !== null && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Lightbulb className="h-4 w-4" />
                {Math.round(ambientLight)} lux
              </div>
            )}
          </div>

          {/* Theme Mode Selection */}
          <div className="space-y-2">
            <Label>Режим темы</Label>
            <Select
              value={config.mode}
              onValueChange={(value) => setThemeMode(value as ThemeMode)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">
                  <div className="flex items-center gap-2">
                    <Sun className="h-4 w-4" />
                    Светлая
                  </div>
                </SelectItem>
                <SelectItem value="dark">
                  <div className="flex items-center gap-2">
                    <Moon className="h-4 w-4" />
                    Тёмная
                  </div>
                </SelectItem>
                <SelectItem value="auto">
                  <div className="flex items-center gap-2">
                    <Monitor className="h-4 w-4" />
                    Автоматически
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Auto Mode Settings */}
          {config.mode === 'auto' && (
            <>
              {/* Ambient Light Sensor */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      Датчик освещения
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {isAmbientLightSupported
                        ? 'Автоматически по уровню освещения'
                        : 'Не поддерживается устройством'}
                    </p>
                  </div>
                  <Switch
                    checked={config.useAmbientLight}
                    onCheckedChange={setUseAmbientLight}
                    disabled={!isAmbientLightSupported}
                  />
                </div>

                {config.useAmbientLight && isAmbientLightSupported && (
                  <div className="space-y-2 pl-6">
                    <Label className="text-sm">
                      Порог освещённости: {config.ambientLightThreshold} lux
                    </Label>
                    <Slider
                      value={[config.ambientLightThreshold]}
                      onValueChange={([value]) => setAmbientLightThreshold(value)}
                      min={10}
                      max={200}
                      step={5}
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground">
                      Ниже порога — тёмная тема, выше — светлая
                    </p>
                  </div>
                )}
              </div>

              {/* Time-based Settings */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Sunrise className="h-4 w-4 text-yellow-500" />
                  Переключение по времени
                </Label>
                <p className="text-xs text-muted-foreground">
                  Используется, если датчик освещения недоступен
                </p>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm flex items-center gap-1">
                      <Sunrise className="h-3 w-3" />
                      Рассвет
                    </Label>
                    <Input
                      type="time"
                      value={config.sunriseTime}
                      onChange={(e) => setSunriseTime(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm flex items-center gap-1">
                      <Sunset className="h-3 w-3" />
                      Закат
                    </Label>
                    <Input
                      type="time"
                      value={config.sunsetTime}
                      onChange={(e) => setSunsetTime(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Preview */}
          <div className="space-y-2">
            <Label>Предпросмотр</Label>
            <div className="grid grid-cols-2 gap-2">
              <div
                className={`p-4 rounded-lg border-2 transition-all ${
                  currentTheme === 'light'
                    ? 'border-primary bg-white'
                    : 'border-transparent bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Sun className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm font-medium text-gray-900">Светлая</span>
                </div>
                <div className="h-8 rounded bg-gray-200" />
              </div>
              <div
                className={`p-4 rounded-lg border-2 transition-all ${
                  currentTheme === 'dark'
                    ? 'border-primary bg-gray-900'
                    : 'border-transparent bg-gray-800'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Moon className="h-4 w-4 text-blue-400" />
                  <span className="text-sm font-medium text-gray-100">Тёмная</span>
                </div>
                <div className="h-8 rounded bg-gray-700" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={onClose}>Готово</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ThemeSettings;
