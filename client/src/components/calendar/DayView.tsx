import { useMemo } from 'react';
import { format, isSameDay, isToday, setHours, setMinutes } from 'date-fns';
import { cn } from '@/lib/utils';
import { Event } from '../../../../drizzle/schema';

interface DayViewProps {
  currentDate: Date;
  events: Event[];
  onTimeSlotClick?: (date: Date) => void;
  onEventClick?: (event: Event) => void;
}

export function DayView({ currentDate, events, onTimeSlotClick, onEventClick }: DayViewProps) {
  const hours = Array.from({ length: 24 }, (_, i) => i);

  const dayEvents = useMemo(() => {
    return events.filter(event => {
      const eventStart = new Date(event.startTime);
      return isSameDay(eventStart, currentDate);
    });
  }, [events, currentDate]);

  const getEventsForHour = (hour: number) => {
    return dayEvents.filter(event => {
      const eventStart = new Date(event.startTime);
      return eventStart.getHours() === hour;
    });
  };

  const handleTimeSlotClick = (hour: number) => {
    const dateTime = setMinutes(setHours(currentDate, hour), 0);
    onTimeSlotClick?.(dateTime);
  };

  const allDayEvents = dayEvents.filter(event => event.isAllDay);
  const timedEvents = dayEvents.filter(event => !event.isAllDay);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="border-b border-border p-4 bg-background sticky top-0 z-10">
        <div className="text-center">
          <div className="text-xs font-medium text-muted-foreground uppercase">
            {format(currentDate, 'EEEE')}
          </div>
          <div
            className={cn(
              "text-4xl font-light mt-1",
              isToday(currentDate) && "text-primary font-medium"
            )}
          >
            {format(currentDate, 'd')}
          </div>
          <div className="text-sm text-muted-foreground mt-1">
            {format(currentDate, 'MMMM yyyy')}
          </div>
        </div>
      </div>

      {/* All-day events */}
      {allDayEvents.length > 0 && (
        <div className="border-b border-border p-2 bg-secondary/20">
          <div className="text-xs text-muted-foreground mb-2">All Day</div>
          <div className="space-y-1">
            {allDayEvents.map((event) => (
              <div
                key={event.id}
                onClick={() => onEventClick?.(event)}
                className="rounded-md px-3 py-2 text-sm font-medium cursor-pointer"
                style={{
                  backgroundColor: `${event.color}20`,
                  color: event.color || '#007AFF',
                  borderLeft: `3px solid ${event.color || '#007AFF'}`,
                }}
              >
                {event.title}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Time grid */}
      <div className="flex-1 overflow-y-auto">
        <div className="flex">
          {/* Time column */}
          <div className="w-20 flex-shrink-0">
            {hours.map((hour) => (
              <div
                key={hour}
                className="h-16 border-b border-border pr-3 text-right"
              >
                <span className="text-xs text-muted-foreground -mt-2 block">
                  {hour === 0 ? '' : format(setHours(new Date(), hour), 'HH:mm')}
                </span>
              </div>
            ))}
          </div>

          {/* Events column */}
          <div className="flex-1 border-l border-border">
            {hours.map((hour) => {
              const hourEvents = getEventsForHour(hour);
              return (
                <div
                  key={hour}
                  onClick={() => handleTimeSlotClick(hour)}
                  className={cn(
                    "h-16 border-b border-border relative cursor-pointer",
                    "hover:bg-secondary/30 transition-colors"
                  )}
                >
                  {hourEvents.map((event, idx) => {
                    const eventStart = new Date(event.startTime);
                    const eventEnd = new Date(event.endTime);
                    const durationHours = (eventEnd.getTime() - eventStart.getTime()) / (1000 * 60 * 60);
                    const height = Math.max(durationHours * 64, 32);
                    const topOffset = (eventStart.getMinutes() / 60) * 64;

                    return (
                      <div
                        key={event.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEventClick?.(event);
                        }}
                        className="absolute rounded-md px-3 py-2 text-sm font-medium cursor-pointer overflow-hidden"
                        style={{
                          backgroundColor: `${event.color}20`,
                          color: event.color || '#007AFF',
                          borderLeft: `3px solid ${event.color || '#007AFF'}`,
                          top: `${topOffset}px`,
                          height: `${height}px`,
                          left: `${idx * 10 + 4}px`,
                          right: '4px',
                          zIndex: idx + 1,
                        }}
                      >
                        <div className="font-medium">{event.title}</div>
                        <div className="text-xs opacity-75">
                          {format(eventStart, 'HH:mm')} - {format(eventEnd, 'HH:mm')}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
