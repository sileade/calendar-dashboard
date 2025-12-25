import { useState, useMemo } from 'react';
import { format, addMonths, subMonths, addWeeks, subWeeks, addDays, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { useAuth } from '@/_core/hooks/useAuth';
import { getLoginUrl } from '@/const';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { CalendarGrid } from '@/components/calendar/CalendarGrid';
import { WeekView } from '@/components/calendar/WeekView';
import { DayView } from '@/components/calendar/DayView';
import { CalendarSidebar } from '@/components/calendar/CalendarSidebar';
import { EventModal } from '@/components/calendar/EventModal';
import { SyncSettingsModal } from '@/components/calendar/SyncSettingsModal';
import { PrintModal } from '@/components/calendar/PrintModal';
import { CalendarView } from '@shared/types';
import { Event } from '../../../drizzle/schema';
import { ChevronLeft, ChevronRight, Calendar, CalendarDays, CalendarRange, Printer, RefreshCw, LogIn, Search, Bell, Repeat, Monitor } from 'lucide-react';
import { SearchFilter } from '@/components/calendar/SearchFilter';
import { NotificationCenter, useNotificationPermission, showBrowserNotification } from '@/components/calendar/NotificationCenter';
import { ReminderTime } from '@shared/types';
import { toast } from 'sonner';
import { KioskSettingsModal, useKioskMode, useKioskSettings } from '@/components/calendar/KioskSettings';
import { useHomerSwipe } from '@/hooks/useSwipeGesture';
import { WidgetsPanel } from '@/components/widgets/WidgetsPanel';
import { LayoutGrid, Palette } from 'lucide-react';
import { ThemeSettings } from '@/components/calendar/ThemeSettings';
import { useAdaptiveTheme } from '@/hooks/useAdaptiveTheme';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { useAutoRefresh, REFRESH_INTERVALS, formatLastRefresh } from '@/hooks/useAutoRefresh';

export default function Home() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<CalendarView>('month');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [initialEventDate, setInitialEventDate] = useState<Date | undefined>();
  const [isKioskSettingsOpen, setIsKioskSettingsOpen] = useState(false);
  const [isWidgetsPanelOpen, setIsWidgetsPanelOpen] = useState(false);
  const [isThemeSettingsOpen, setIsThemeSettingsOpen] = useState(false);
  
  // Adaptive theme and responsive layout
  const adaptiveTheme = useAdaptiveTheme();
  const { screenInfo, layoutConfig, isMobile, isTablet, isTouch } = useResponsiveLayout();
  
  // Kiosk mode
  const kioskSettings = useKioskMode();
  const { settings: kioskConfig } = useKioskSettings();
  
  // Homer swipe gesture
  useHomerSwipe(kioskConfig.homerUrl, kioskConfig.enabled && kioskConfig.swipeGesturesEnabled);

  // Fetch events for current view range
  const dateRange = useMemo(() => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    return {
      startTime: start.getTime(),
      endTime: end.getTime(),
    };
  }, [currentDate]);

  const { data: events = [], refetch: refetchEvents } = trpc.events.list.useQuery(
    dateRange,
    { enabled: isAuthenticated }
  );

  // Auto-refresh calendar events
  const {
    lastRefresh: calendarLastRefresh,
    isRefreshing: isCalendarRefreshing,
    isPaused: isCalendarPaused,
    refresh: refreshCalendar,
    toggle: toggleCalendarRefresh,
  } = useAutoRefresh({
    interval: REFRESH_INTERVALS.CALENDAR,
    onRefresh: async () => {
      await refetchEvents();
    },
    enabled: isAuthenticated,
    pauseOnHidden: true,
  });

  const { data: connections = [], refetch: refetchConnections } = trpc.connections.list.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  const createEvent = trpc.events.create.useMutation({
    onSuccess: () => {
      toast.success('Event created');
      refetchEvents();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateEvent = trpc.events.update.useMutation({
    onSuccess: () => {
      toast.success('Event updated');
      refetchEvents();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteEvent = trpc.events.delete.useMutation({
    onSuccess: () => {
      toast.success('Event deleted');
      refetchEvents();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const triggerSync = trpc.sync.trigger.useMutation({
    onSuccess: () => {
      toast.success('Sync completed');
      refetchEvents();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const navigatePrevious = () => {
    switch (view) {
      case 'month':
        setCurrentDate(subMonths(currentDate, 1));
        break;
      case 'week':
        setCurrentDate(subWeeks(currentDate, 1));
        break;
      case 'day':
        setCurrentDate(subDays(currentDate, 1));
        break;
    }
  };

  const navigateNext = () => {
    switch (view) {
      case 'month':
        setCurrentDate(addMonths(currentDate, 1));
        break;
      case 'week':
        setCurrentDate(addWeeks(currentDate, 1));
        break;
      case 'day':
        setCurrentDate(addDays(currentDate, 1));
        break;
    }
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const handleDateClick = (date: Date) => {
    if (view === 'month') {
      setCurrentDate(date);
      setView('day');
    } else {
      setInitialEventDate(date);
      setSelectedEvent(null);
      setIsEventModalOpen(true);
    }
  };

  const handleEventClick = (event: Event) => {
    setSelectedEvent(event);
    setIsEventModalOpen(true);
  };

  const handleNewEvent = () => {
    setSelectedEvent(null);
    setInitialEventDate(new Date());
    setIsEventModalOpen(true);
  };

  const setReminders = trpc.reminders.setForEvent.useMutation();

  const handleSaveEvent = (eventData: {
    title: string;
    description?: string;
    location?: string;
    startTime: number;
    endTime: number;
    isAllDay: boolean;
    color: string;
    recurrenceRule?: string;
    reminders?: ReminderTime[];
  }) => {
    const { reminders: reminderTimes, ...eventPayload } = eventData;
    
    if (selectedEvent) {
      updateEvent.mutate({
        id: selectedEvent.id,
        ...eventPayload,
      }, {
        onSuccess: () => {
          if (reminderTimes && reminderTimes.length > 0) {
            setReminders.mutate({
              eventId: selectedEvent.id,
              reminderTimes,
            });
          }
        },
      });
    } else {
      createEvent.mutate(eventPayload, {
        onSuccess: (result) => {
          if (reminderTimes && reminderTimes.length > 0 && result.id) {
            setReminders.mutate({
              eventId: result.id,
              reminderTimes,
            });
          }
        },
      });
    }
  };

  const handleDeleteEvent = (eventId: number) => {
    deleteEvent.mutate({ id: eventId });
  };

  const getViewTitle = () => {
    switch (view) {
      case 'month':
        return format(currentDate, 'MMMM yyyy');
      case 'week':
        return `Week of ${format(currentDate, 'MMM d, yyyy')}`;
      case 'day':
        return format(currentDate, 'EEEE, MMMM d, yyyy');
      default:
        return format(currentDate, 'MMMM yyyy');
    }
  };

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        {/* Hero Section */}
        <div className="flex-1 flex flex-col items-center justify-center px-4">
          <div className="text-center max-w-2xl mx-auto">
            <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-8">
              <Calendar className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-5xl font-semibold tracking-tight mb-4">
              Calendar Dashboard
            </h1>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              Unify your calendars from Google, Apple, and Notion in one beautiful interface. 
              Bidirectional sync keeps everything in harmony.
            </p>
            <Button
              size="lg"
              className="gap-2 text-lg px-8 py-6 rounded-xl apple-shadow"
              onClick={() => window.location.href = getLoginUrl()}
            >
              <LogIn className="w-5 h-5" />
              Sign In to Get Started
            </Button>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 max-w-4xl mx-auto">
            <div className="text-center p-6">
              <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <RefreshCw className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold mb-2">Bidirectional Sync</h3>
              <p className="text-sm text-muted-foreground">
                Changes sync both ways automatically across all your calendars
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CalendarDays className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold mb-2">Unified View</h3>
              <p className="text-sm text-muted-foreground">
                See all your events from different sources in one place
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Printer className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold mb-2">Print Ready</h3>
              <p className="text-sm text-muted-foreground">
                Export to A3 or A4 format for physical planning
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="py-6 text-center text-sm text-muted-foreground">
          <p>Designed with Apple Design principles in mind</p>
        </footer>
      </div>
    );
  }

  return (
    <div className="h-screen flex overflow-hidden bg-background">
      {/* Sidebar */}
      <CalendarSidebar
        currentDate={currentDate}
        onDateChange={setCurrentDate}
        connections={connections}
        onNewEvent={handleNewEvent}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b border-border flex items-center justify-between px-6 bg-background/80 backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={navigatePrevious}
                className="rounded-full"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={navigateNext}
                className="rounded-full"
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
            <h1 className="text-xl font-semibold">{getViewTitle()}</h1>
            <Button
              variant="outline"
              size="sm"
              onClick={goToToday}
              className="rounded-full"
            >
              Today
            </Button>
          </div>

          <div className="flex items-center gap-2">
            {/* View Switcher */}
            <div className="flex items-center bg-secondary rounded-lg p-1">
              <Button
                variant={view === 'day' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setView('day')}
                className="rounded-md gap-1"
              >
                <Calendar className="w-4 h-4" />
                Day
              </Button>
              <Button
                variant={view === 'week' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setView('week')}
                className="rounded-md gap-1"
              >
                <CalendarRange className="w-4 h-4" />
                Week
              </Button>
              <Button
                variant={view === 'month' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setView('month')}
                className="rounded-md gap-1"
              >
                <CalendarDays className="w-4 h-4" />
                Month
              </Button>
            </div>

            {/* Actions - Sync with auto-refresh indicator */}
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  refreshCalendar();
                  triggerSync.mutate({});
                }}
                disabled={triggerSync.isPending || isCalendarRefreshing}
                className="rounded-full"
                title={`Синхронизация (${formatLastRefresh(calendarLastRefresh)})`}
              >
                <RefreshCw className={`w-5 h-5 ${(triggerSync.isPending || isCalendarRefreshing) ? 'animate-spin' : ''}`} />
              </Button>
              {!isCalendarPaused && (
                <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsPrintModalOpen(true)}
              className="rounded-full"
            >
              <Printer className="w-5 h-5" />
            </Button>
            
            {/* Widgets Panel */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsWidgetsPanelOpen(true)}
              className="rounded-full"
              title="Widgets"
            >
              <LayoutGrid className="w-5 h-5" />
            </Button>
            
            {/* Theme Settings */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsThemeSettingsOpen(true)}
              className="rounded-full"
              title="Theme Settings"
            >
              <Palette className="w-5 h-5" />
            </Button>
            
            {/* Kiosk Mode */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsKioskSettingsOpen(true)}
              className={`rounded-full ${kioskConfig.enabled ? 'text-primary' : ''}`}
              title="Kiosk Mode Settings"
            >
              <Monitor className="w-5 h-5" />
            </Button>
            
            {/* Notifications */}
            <NotificationCenter />
          </div>
        </header>
        
        {/* Search Bar */}
        <SearchFilter
          events={events}
          onEventClick={handleEventClick}
        />

        {/* Calendar View */}
        <main className="flex-1 overflow-hidden">
          {view === 'month' && (
            <CalendarGrid
              currentDate={currentDate}
              events={events}
              onDateClick={handleDateClick}
              onEventClick={handleEventClick}
            />
          )}
          {view === 'week' && (
            <WeekView
              currentDate={currentDate}
              events={events}
              onTimeSlotClick={handleDateClick}
              onEventClick={handleEventClick}
            />
          )}
          {view === 'day' && (
            <DayView
              currentDate={currentDate}
              events={events}
              onTimeSlotClick={handleDateClick}
              onEventClick={handleEventClick}
            />
          )}
        </main>
      </div>

      {/* Modals */}
      <EventModal
        isOpen={isEventModalOpen}
        onClose={() => setIsEventModalOpen(false)}
        event={selectedEvent}
        initialDate={initialEventDate}
        onSave={handleSaveEvent}
        onDelete={handleDeleteEvent}
      />

      <SyncSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        connections={connections}
        onRefresh={() => {
          refetchConnections();
          refetchEvents();
        }}
      />

      <PrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        currentDate={currentDate}
        events={events}
      />

      <KioskSettingsModal
        isOpen={isKioskSettingsOpen}
        onClose={() => setIsKioskSettingsOpen(false)}
      />

      <WidgetsPanel
        isOpen={isWidgetsPanelOpen}
        onOpenChange={setIsWidgetsPanelOpen}
      />

      <ThemeSettings
        isOpen={isThemeSettingsOpen}
        onClose={() => setIsThemeSettingsOpen(false)}
      />
      
      {/* Kiosk Mode Indicator */}
      {kioskConfig.enabled && (
        <div className="fixed bottom-4 right-4 bg-primary/90 text-primary-foreground px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-2 shadow-lg">
          <Monitor className="w-4 h-4" />
          Kiosk Mode
          {kioskConfig.homerUrl && (
            <span className="text-xs opacity-75">• Swipe → Homer</span>
          )}
        </div>
      )}
    </div>
  );
}
