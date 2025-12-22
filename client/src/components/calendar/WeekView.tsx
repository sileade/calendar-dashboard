import { useMemo } from 'react';
import { format, startOfWeek, addDays, isSameDay, isToday, setHours, setMinutes } from 'date-fns';
import { cn } from '@/lib/utils';
import { Event } from '../../../../drizzle/schema';

interface WeekViewProps {
  currentDate: Date;
  events: Event[];
  onTimeSlotClick?: (date: Date) => void;
  onEventClick?: (event: Event) => void;
}

export function WeekView({ currentDate, events, onTimeSlotClick, onEventClick }: WeekViewProps) {
  const weekDays = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [currentDate]);

  const hours = Array.from({ length: 24 }, (_, i) => i);

  const getEventsForDayAndHour = (day: Date, hour: number) => {
    return events.filter(event => {
      const eventStart = new Date(event.startTime);
      const eventHour = eventStart.getHours();
      return isSameDay(eventStart, day) && eventHour === hour;
    });
  };

  const handleTimeSlotClick = (day: Date, hour: number) => {
    const dateTime = setMinutes(setHours(day, hour), 0);
    onTimeSlotClick?.(dateTime);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header with days */}
      <div className="flex border-b border-border sticky top-0 bg-background z-10">
        <div className="w-16 flex-shrink-0" />
        {weekDays.map((day, idx) => (
          <div
            key={idx}
            className={cn(
              "flex-1 py-3 text-center border-l border-border",
              isToday(day) && "bg-primary/5"
            )}
          >
            <div className="text-xs font-medium text-muted-foreground uppercase">
              {format(day, 'EEE')}
            </div>
            <div
              className={cn(
                "text-2xl font-light mt-1",
                isToday(day) && "text-primary font-medium"
              )}
            >
              {format(day, 'd')}
            </div>
          </div>
        ))}
      </div>

      {/* Time grid */}
      <div className="flex-1 overflow-y-auto">
        <div className="flex">
          {/* Time column */}
          <div className="w-16 flex-shrink-0">
            {hours.map((hour) => (
              <div
                key={hour}
                className="h-14 border-b border-border pr-2 text-right"
              >
                <span className="text-xs text-muted-foreground -mt-2 block">
                  {hour === 0 ? '' : format(setHours(new Date(), hour), 'HH:mm')}
                </span>
              </div>
            ))}
          </div>

          {/* Days columns */}
          {weekDays.map((day, dayIdx) => (
            <div key={dayIdx} className="flex-1 border-l border-border">
              {hours.map((hour) => {
                const hourEvents = getEventsForDayAndHour(day, hour);
                return (
                  <div
                    key={hour}
                    onClick={() => handleTimeSlotClick(day, hour)}
                    className={cn(
                      "h-14 border-b border-border relative cursor-pointer",
                      "hover:bg-secondary/30 transition-colors",
                      isToday(day) && "bg-primary/5"
                    )}
                  >
                    {hourEvents.map((event) => (
                      <div
                        key={event.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEventClick?.(event);
                        }}
                        className="absolute inset-x-1 top-1 rounded-md px-2 py-1 text-xs font-medium cursor-pointer overflow-hidden"
                        style={{
                          backgroundColor: `${event.color}20`,
                          color: event.color || '#007AFF',
                          borderLeft: `3px solid ${event.color || '#007AFF'}`,
                          minHeight: '24px',
                        }}
                      >
                        {event.title}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
