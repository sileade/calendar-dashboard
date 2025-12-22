import { useState, useEffect, useMemo, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Filter, X, CalendarIcon, Clock, MapPin, Repeat } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Event } from '../../../../drizzle/schema';

export interface SearchFilters {
  query: string;
  sources: ('local' | 'google' | 'apple' | 'notion')[];
  dateFrom: Date | null;
  dateTo: Date | null;
}

interface SearchFilterProps {
  events: Event[];
  onEventClick: (event: Event) => void;
  className?: string;
}

const SOURCE_OPTIONS = [
  { id: 'local', label: 'Local Calendar', color: '#007AFF' },
  { id: 'google', label: 'Google Calendar', color: '#4285F4' },
  { id: 'apple', label: 'Apple Calendar', color: '#FF3B30' },
  { id: 'notion', label: 'Notion', color: '#000000' },
] as const;

export function SearchFilter({ events, onEventClick, className }: SearchFilterProps) {
  const [query, setQuery] = useState('');
  const [sources, setSources] = useState<SearchFilters['sources']>(['local', 'google', 'apple', 'notion']);
  const [dateFrom, setDateFrom] = useState<Date | null>(null);
  const [dateTo, setDateTo] = useState<Date | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Filter events based on search criteria
  const filteredEvents = useMemo(() => {
    if (!query && sources.length === 4 && !dateFrom && !dateTo) {
      return [];
    }

    return events.filter(event => {
      // Filter by search query
      if (query) {
        const searchLower = query.toLowerCase();
        const titleMatch = event.title?.toLowerCase().includes(searchLower);
        const descMatch = event.description?.toLowerCase().includes(searchLower);
        const locationMatch = event.location?.toLowerCase().includes(searchLower);
        if (!titleMatch && !descMatch && !locationMatch) return false;
      }

      // Filter by source
      if (!sources.includes(event.source as any)) return false;

      // Filter by date range
      const eventStart = new Date(event.startTime);
      if (dateFrom && eventStart < dateFrom) return false;
      if (dateTo) {
        const endOfDay = new Date(dateTo);
        endOfDay.setHours(23, 59, 59, 999);
        if (eventStart > endOfDay) return false;
      }

      return true;
    }).slice(0, 20); // Limit results
  }, [events, query, sources, dateFrom, dateTo]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (sources.length < 4) count++;
    if (dateFrom) count++;
    if (dateTo) count++;
    return count;
  }, [sources, dateFrom, dateTo]);

  const handleSourceToggle = (sourceId: typeof sources[number]) => {
    setSources(prev => 
      prev.includes(sourceId)
        ? prev.filter(s => s !== sourceId)
        : [...prev, sourceId]
    );
  };

  const clearFilters = () => {
    setQuery('');
    setSources(['local', 'google', 'apple', 'notion']);
    setDateFrom(null);
    setDateTo(null);
    setShowResults(false);
  };

  const hasActiveFilters = query || activeFilterCount > 0;

  const handleEventSelect = (event: Event) => {
    onEventClick(event);
    setShowResults(false);
    setQuery('');
  };

  // Highlight matching text
  const highlightMatch = (text: string): React.ReactNode => {
    if (!query || !text) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={i} className="bg-yellow-200 dark:bg-yellow-800/50 rounded px-0.5">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <div className={cn("px-6 py-3 border-b border-border/50 bg-background/50 backdrop-blur-sm", className)}>
      <div className="flex items-center gap-2">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search events..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowResults(e.target.value.length > 0);
            }}
            onFocus={() => query && setShowResults(true)}
            className="pl-9 pr-9 bg-background/80 backdrop-blur-sm border-border/50 focus:border-primary/50 transition-colors"
          />
          {query && (
            <button
              onClick={() => {
                setQuery('');
                setShowResults(false);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Search Results Dropdown */}
          {showResults && query && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-background border border-border rounded-lg shadow-lg overflow-hidden z-50">
              <ScrollArea className="max-h-[300px]">
                {filteredEvents.length > 0 ? (
                  <div className="divide-y divide-border/50">
                    {filteredEvents.map((event) => (
                      <button
                        key={event.id}
                        onClick={() => handleEventSelect(event)}
                        className="w-full p-3 text-left hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className="w-3 h-3 rounded-full mt-1.5 flex-shrink-0"
                            style={{ backgroundColor: event.color || '#007AFF' }}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">
                              {highlightMatch(event.title)}
                            </p>
                            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {format(new Date(event.startTime), 'MMM d, h:mm a')}
                              </span>
                              {event.location && (
                                <span className="flex items-center gap-1 truncate">
                                  <MapPin className="w-3 h-3" />
                                  {highlightMatch(event.location)}
                                </span>
                              )}
                              {event.recurrenceRule && (
                                <span className="flex items-center gap-1">
                                  <Repeat className="w-3 h-3" />
                                  Recurring
                                </span>
                              )}
                            </div>
                            {event.description && (
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                                {highlightMatch(event.description)}
                              </p>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center text-muted-foreground">
                    <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No events found</p>
                    <p className="text-xs mt-1">Try a different search term</p>
                  </div>
                )}
              </ScrollArea>
            </div>
          )}
        </div>

        {/* Filter Button */}
        <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "gap-2 bg-background/80 backdrop-blur-sm border-border/50",
                activeFilterCount > 0 && "border-primary/50"
              )}
            >
              <Filter className="w-4 h-4" />
              Filters
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-4" align="end">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm">Filter Events</h4>
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="h-auto py-1 px-2 text-xs text-muted-foreground hover:text-foreground"
                  >
                    Clear all
                  </Button>
                )}
              </div>

              {/* Source Filter */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                  Calendar Sources
                </Label>
                <div className="space-y-2">
                  {SOURCE_OPTIONS.map((source) => (
                    <div key={source.id} className="flex items-center gap-2">
                      <Checkbox
                        id={`source-${source.id}`}
                        checked={sources.includes(source.id)}
                        onCheckedChange={() => handleSourceToggle(source.id)}
                      />
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: source.color }}
                      />
                      <Label
                        htmlFor={`source-${source.id}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {source.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Date Range Filter */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                  Date Range
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className={cn(
                          "justify-start text-left font-normal",
                          !dateFrom && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateFrom ? format(dateFrom, 'MMM d') : 'From'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={dateFrom || undefined}
                        onSelect={(date) => setDateFrom(date || null)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>

                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className={cn(
                          "justify-start text-left font-normal",
                          !dateTo && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateTo ? format(dateTo, 'MMM d') : 'To'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={dateTo || undefined}
                        onSelect={(date) => setDateTo(date || null)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                {(dateFrom || dateTo) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { setDateFrom(null); setDateTo(null); }}
                    className="w-full h-auto py-1 text-xs text-muted-foreground"
                  >
                    Clear dates
                  </Button>
                )}
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Clear All Button */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="gap-1 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}
