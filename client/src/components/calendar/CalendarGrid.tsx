import { useMemo, useCallback, useState, useRef } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, isToday, addMonths, subMonths } from 'date-fns';
import { ru } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Event } from '../../../../drizzle/schema';
import { useTouch } from '@/hooks/useTouch';
import { TouchFeedback } from '@/components/ui/touch-ripple';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CalendarGridProps {
  currentDate: Date;
  events: Event[];
  onDateClick?: (date: Date) => void;
  onEventClick?: (event: Event) => void;
  onMonthChange?: (date: Date) => void;
}

export function CalendarGrid({ currentDate, events, onDateClick, onEventClick, onMonthChange }: CalendarGridProps) {
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle swipe gestures for month navigation
  const handleSwipeLeft = useCallback(() => {
    setSwipeDirection('left');
    const nextMonth = addMonths(currentDate, 1);
    onMonthChange?.(nextMonth);
    setTimeout(() => setSwipeDirection(null), 300);
  }, [currentDate, onMonthChange]);

  const handleSwipeRight = useCallback(() => {
    setSwipeDirection('right');
    const prevMonth = subMonths(currentDate, 1);
    onMonthChange?.(prevMonth);
    setTimeout(() => setSwipeDirection(null), 300);
  }, [currentDate, onMonthChange]);

  // Touch hook for swipe detection
  const { ref: touchRef } = useTouch<HTMLDivElement>({
    onSwipeLeft: handleSwipeLeft,
    onSwipeRight: handleSwipeRight,
    swipeThreshold: 50,
  });

  const days = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const daysArray: Date[] = [];
    let day = calendarStart;
    while (day <= calendarEnd) {
      daysArray.push(day);
      day = addDays(day, 1);
    }
    return daysArray;
  }, [currentDate]);

  const getEventsForDay = (date: Date) => {
    return events.filter(event => {
      const eventStart = new Date(event.startTime);
      const eventEnd = new Date(event.endTime);
      return isSameDay(eventStart, date) || (eventStart <= date && eventEnd >= date);
    });
  };

  // Long press handler for creating new event
  const handleLongPress = useCallback((date: Date) => {
    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
    onDateClick?.(date);
  }, [onDateClick]);

  const weekDays = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

  return (
    <div 
      ref={touchRef}
      className={cn(
        "flex flex-col h-full touch-pan-y",
        swipeDirection === 'left' && "animate-slide-out-left",
        swipeDirection === 'right' && "animate-slide-out-right"
      )}
    >
      {/* Swipe indicators */}
      <div className={cn(
        "swipe-nav-indicator left",
        swipeDirection === 'right' && "active"
      )}>
        <ChevronLeft className="h-5 w-5 text-primary-foreground" />
      </div>
      <div className={cn(
        "swipe-nav-indicator right",
        swipeDirection === 'left' && "active"
      )}>
        <ChevronRight className="h-5 w-5 text-primary-foreground" />
      </div>

      {/* Week day headers */}
      <div className="grid grid-cols-7 border-b border-border bg-muted/30">
        {weekDays.map((day) => (
          <div
            key={day}
            className="py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="flex-1 grid grid-cols-7 grid-rows-6">
        {days.map((day, idx) => {
          const dayEvents = getEventsForDay(day);
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isCurrentDay = isToday(day);

          return (
            <CalendarDayCell
              key={idx}
              day={day}
              events={dayEvents}
              isCurrentMonth={isCurrentMonth}
              isCurrentDay={isCurrentDay}
              onDateClick={onDateClick}
              onEventClick={onEventClick}
              onLongPress={handleLongPress}
            />
          );
        })}
      </div>
    </div>
  );
}

// Separate component for day cell with touch optimization
interface CalendarDayCellProps {
  day: Date;
  events: Event[];
  isCurrentMonth: boolean;
  isCurrentDay: boolean;
  onDateClick?: (date: Date) => void;
  onEventClick?: (event: Event) => void;
  onLongPress?: (date: Date) => void;
}

function CalendarDayCell({
  day,
  events,
  isCurrentMonth,
  isCurrentDay,
  onDateClick,
  onEventClick,
  onLongPress,
}: CalendarDayCellProps) {
  const [isPressed, setIsPressed] = useState(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleTouchStart = useCallback(() => {
    setIsPressed(true);
    longPressTimer.current = setTimeout(() => {
      onLongPress?.(day);
    }, 500);
  }, [day, onLongPress]);

  const handleTouchEnd = useCallback(() => {
    setIsPressed(false);
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const handleClick = useCallback(() => {
    onDateClick?.(day);
  }, [day, onDateClick]);

  return (
    <div
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      onMouseDown={handleTouchStart}
      onMouseUp={handleTouchEnd}
      onMouseLeave={handleTouchEnd}
      className={cn(
        "touch-calendar-cell border-b border-r border-border cursor-pointer transition-all duration-150",
        "hover:bg-secondary/50 active:bg-secondary",
        !isCurrentMonth && "opacity-40 bg-muted/30",
        isCurrentDay && "bg-primary/5",
        isPressed && "bg-secondary scale-[0.98]"
      )}
    >
      <div className="flex items-center justify-between mb-1">
        <span
          className={cn(
            "text-sm font-medium w-8 h-8 flex items-center justify-center rounded-full transition-colors",
            isCurrentDay && "bg-primary text-primary-foreground"
          )}
        >
          {format(day, 'd')}
        </span>
      </div>

      <div className="space-y-1 overflow-hidden">
        {events.slice(0, 3).map((event) => (
          <TouchFeedback
            key={event.id}
            className="touch-event-chip rounded"
            onPress={() => onEventClick?.(event)}
          >
            <div
              className="w-full text-left truncate text-xs font-medium"
              style={{
                backgroundColor: `${event.color}20`,
                color: event.color || '#007AFF',
                borderLeft: `3px solid ${event.color || '#007AFF'}`,
                padding: '4px 8px',
                borderRadius: '4px',
              }}
            >
              {event.title}
            </div>
          </TouchFeedback>
        ))}
        {events.length > 3 && (
          <div className="text-xs text-muted-foreground pl-1 font-medium">
            +{events.length - 3} ещё
          </div>
        )}
      </div>
    </div>
  );
}
