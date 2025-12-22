import { useState } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, isToday } from 'date-fns';
import { ChevronLeft, ChevronRight, Plus, Settings, Calendar as CalendarIcon, Cloud, CloudOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { CalendarConnection } from '../../../../drizzle/schema';
import { PROVIDER_COLORS } from '@shared/types';

interface CalendarSidebarProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
  connections: CalendarConnection[];
  onNewEvent: () => void;
  onOpenSettings: () => void;
  onToggleConnection?: (connectionId: number, enabled: boolean) => void;
}

export function CalendarSidebar({
  currentDate,
  onDateChange,
  connections,
  onNewEvent,
  onOpenSettings,
  onToggleConnection,
}: CalendarSidebarProps) {
  const [miniCalendarDate, setMiniCalendarDate] = useState(currentDate);

  const getMiniCalendarDays = () => {
    const monthStart = startOfMonth(miniCalendarDate);
    const monthEnd = endOfMonth(miniCalendarDate);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const days: Date[] = [];
    let day = calendarStart;
    while (day <= calendarEnd) {
      days.push(day);
      day = addDays(day, 1);
    }
    return days;
  };

  const weekDays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'google':
        return (
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
        );
      case 'apple':
        return (
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
          </svg>
        );
      case 'notion':
        return (
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.968c-.42-.326-.98-.7-2.055-.607L3.01 2.295c-.466.046-.56.28-.374.466zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.841-.046.935-.56.935-1.167V6.354c0-.606-.233-.933-.748-.886l-15.177.887c-.56.047-.747.327-.747.933zm14.337.745c.093.42 0 .84-.42.888l-.7.14v10.264c-.608.327-1.168.514-1.635.514-.748 0-.935-.234-1.495-.933l-4.577-7.186v6.952l1.448.327s0 .84-1.168.84l-3.22.186c-.094-.186 0-.653.327-.746l.84-.233V9.854L7.822 9.76c-.094-.42.14-1.026.793-1.073l3.456-.233 4.764 7.279v-6.44l-1.215-.14c-.093-.514.28-.886.747-.933zM2.64 1.782l13.168-.933c1.635-.14 2.055-.047 3.082.7l4.25 2.986c.7.513.933.653.933 1.213v16.378c0 1.026-.373 1.634-1.68 1.726l-15.458.934c-.98.047-1.448-.093-1.962-.747l-3.129-4.06c-.56-.747-.793-1.306-.793-1.96V2.996c0-.84.374-1.54 1.589-1.214z"/>
          </svg>
        );
      default:
        return <CalendarIcon className="w-4 h-4" />;
    }
  };

  return (
    <div className="w-64 h-full flex flex-col bg-sidebar border-r border-sidebar-border">
      {/* New Event Button */}
      <div className="p-4">
        <Button
          onClick={onNewEvent}
          className="w-full gap-2 apple-shadow"
          size="lg"
        >
          <Plus className="w-5 h-5" />
          New Event
        </Button>
      </div>

      {/* Mini Calendar */}
      <div className="px-4 pb-4">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => setMiniCalendarDate(subMonths(miniCalendarDate, 1))}
            className="p-1 hover:bg-secondary rounded-md transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-medium">
            {format(miniCalendarDate, 'MMMM yyyy')}
          </span>
          <button
            onClick={() => setMiniCalendarDate(addMonths(miniCalendarDate, 1))}
            className="p-1 hover:bg-secondary rounded-md transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-0.5 text-center">
          {weekDays.map((day, idx) => (
            <div key={idx} className="text-xs text-muted-foreground py-1">
              {day}
            </div>
          ))}
          {getMiniCalendarDays().map((day, idx) => (
            <button
              key={idx}
              onClick={() => onDateChange(day)}
              className={cn(
                "text-xs py-1.5 rounded-full transition-colors",
                !isSameMonth(day, miniCalendarDate) && "text-muted-foreground/50",
                isSameDay(day, currentDate) && "bg-primary text-primary-foreground",
                isToday(day) && !isSameDay(day, currentDate) && "text-primary font-semibold",
                !isSameDay(day, currentDate) && "hover:bg-secondary"
              )}
            >
              {format(day, 'd')}
            </button>
          ))}
        </div>
      </div>

      {/* Calendar List */}
      <div className="flex-1 overflow-y-auto px-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Calendars
          </span>
          <button
            onClick={onOpenSettings}
            className="p-1 hover:bg-secondary rounded-md transition-colors"
          >
            <Settings className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <div className="space-y-1">
          {/* Local Calendar */}
          <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-secondary/50 transition-colors">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: '#34C759' }}
            />
            <CalendarIcon className="w-4 h-4 text-muted-foreground" />
            <span className="flex-1 text-sm">Local Calendar</span>
          </div>

          {/* Connected Calendars */}
          {connections.map((conn) => (
            <div
              key={conn.id}
              className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-secondary/50 transition-colors"
            >
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: conn.color || '#007AFF' }}
              />
              {getProviderIcon(conn.provider)}
              <span className="flex-1 text-sm truncate">
                {conn.calendarName || `${conn.provider} Calendar`}
              </span>
              {conn.isConnected ? (
                <Cloud className="w-4 h-4 text-green-500" />
              ) : (
                <CloudOff className="w-4 h-4 text-muted-foreground" />
              )}
            </div>
          ))}

          {connections.length === 0 && (
            <div className="text-sm text-muted-foreground text-center py-4">
              No calendars connected
            </div>
          )}
        </div>
      </div>

      {/* Settings Link */}
      <div className="p-4 border-t border-sidebar-border">
        <button
          onClick={onOpenSettings}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full"
        >
          <Settings className="w-4 h-4" />
          Sync Settings
        </button>
      </div>
    </div>
  );
}
