import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  LayoutGrid, 
  Bus, 
  Car,
  Cloud,
  Settings,
  X,
  GripVertical
} from 'lucide-react';
import { TransportWidget } from './TransportWidget';
import { TrafficWidget } from './TrafficWidget';
import { WeatherWidget } from './WeatherWidget';

interface WidgetConfig {
  id: string;
  name: string;
  icon: React.ReactNode;
  enabled: boolean;
  component: React.ComponentType;
}

const DEFAULT_WIDGETS: WidgetConfig[] = [
  {
    id: 'weather',
    name: 'Погода',
    icon: <Cloud className="h-4 w-4" />,
    enabled: true,
    component: WeatherWidget,
  },
  {
    id: 'transport',
    name: 'Транспорт СПб',
    icon: <Bus className="h-4 w-4" />,
    enabled: true,
    component: TransportWidget,
  },
  {
    id: 'traffic',
    name: 'Пробки Яндекс',
    icon: <Car className="h-4 w-4" />,
    enabled: true,
    component: TrafficWidget,
  },
];

interface WidgetsPanelProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WidgetsPanel({ isOpen, onOpenChange }: WidgetsPanelProps) {
  const [widgets, setWidgets] = useState<WidgetConfig[]>(() => {
    const saved = localStorage.getItem('calendar-widgets-config');
    if (saved) {
      const savedConfig = JSON.parse(saved);
      return DEFAULT_WIDGETS.map(widget => ({
        ...widget,
        enabled: savedConfig[widget.id]?.enabled ?? widget.enabled,
      }));
    }
    return DEFAULT_WIDGETS;
  });
  
  const [showSettings, setShowSettings] = useState(false);

  // Save config to localStorage
  useEffect(() => {
    const config: Record<string, { enabled: boolean }> = {};
    widgets.forEach(widget => {
      config[widget.id] = { enabled: widget.enabled };
    });
    localStorage.setItem('calendar-widgets-config', JSON.stringify(config));
  }, [widgets]);

  const toggleWidget = (id: string) => {
    setWidgets(prev => prev.map(widget => 
      widget.id === id ? { ...widget, enabled: !widget.enabled } : widget
    ));
  };

  const enabledWidgets = widgets.filter(w => w.enabled);

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[400px] sm:w-[450px] p-0 flex flex-col">
        <SheetHeader className="p-4 border-b flex-shrink-0">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <LayoutGrid className="h-5 w-5" />
              Виджеты
            </SheetTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings className={`h-4 w-4 ${showSettings ? 'text-primary' : ''}`} />
            </Button>
          </div>
        </SheetHeader>
        
        <div className="flex-1 overflow-auto">
          {showSettings ? (
            <div className="p-4 space-y-4">
              <p className="text-sm text-muted-foreground">
                Выберите виджеты для отображения на панели
              </p>
              <div className="space-y-3">
                {widgets.map((widget) => (
                  <div
                    key={widget.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-md bg-muted">
                        {widget.icon}
                      </div>
                      <Label htmlFor={widget.id} className="font-medium cursor-pointer">
                        {widget.name}
                      </Label>
                    </div>
                    <Switch
                      id={widget.id}
                      checked={widget.enabled}
                      onCheckedChange={() => toggleWidget(widget.id)}
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-4 space-y-4">
              {enabledWidgets.length > 0 ? (
                enabledWidgets.map((widget) => {
                  const WidgetComponent = widget.component;
                  return (
                    <div key={widget.id} className="h-[350px]">
                      <WidgetComponent />
                    </div>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <LayoutGrid className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">
                    Нет активных виджетов
                  </p>
                  <Button
                    variant="link"
                    onClick={() => setShowSettings(true)}
                    className="mt-2"
                  >
                    Настроить виджеты
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default WidgetsPanel;
