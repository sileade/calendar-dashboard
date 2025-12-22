/**
 * Unified type exports
 * Import shared types from this single entry point.
 */

export type * from "../drizzle/schema";
export * from "./_core/errors";

// Calendar event types
export interface CalendarEventInput {
  title: string;
  description?: string;
  location?: string;
  startTime: number;
  endTime: number;
  isAllDay?: boolean;
  color?: string;
  recurrenceRule?: string;
}

export interface UpdateEventInput extends Partial<CalendarEventInput> {
  id: number;
}

export interface SyncSettings {
  connectionId: number;
  syncDirection: 'none' | 'pull' | 'push' | 'bidirectional';
}

// Calendar view types
export type CalendarView = 'month' | 'week' | 'day' | 'year';

export interface DateRange {
  start: Date;
  end: Date;
}

// Provider colors
export const PROVIDER_COLORS = {
  google: '#4285F4',
  apple: '#007AFF',
  notion: '#000000',
  local: '#34C759',
} as const;

// Apple calendar color palette
export const CALENDAR_COLORS = [
  { name: 'Red', value: '#FF3B30' },
  { name: 'Orange', value: '#FF9500' },
  { name: 'Yellow', value: '#FFCC00' },
  { name: 'Green', value: '#34C759' },
  { name: 'Teal', value: '#5AC8FA' },
  { name: 'Blue', value: '#007AFF' },
  { name: 'Indigo', value: '#5856D6' },
  { name: 'Purple', value: '#AF52DE' },
  { name: 'Pink', value: '#FF2D55' },
  { name: 'Brown', value: '#A2845E' },
] as const;

// Print format types
export type PrintFormat = 'A3' | 'A4';
export type PrintOrientation = 'portrait' | 'landscape';

export interface PrintOptions {
  format: PrintFormat;
  orientation: PrintOrientation;
  showWeekNumbers?: boolean;
  includeNotes?: boolean;
}

// Recurrence types (RRULE support)
export type RecurrenceFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface RecurrenceRule {
  frequency: RecurrenceFrequency;
  interval: number; // Every N days/weeks/months/years
  endDate?: number; // Unix timestamp
  count?: number; // Number of occurrences
  byDay?: number[]; // 0=Sunday, 1=Monday, etc.
  byMonthDay?: number[]; // Day of month (1-31)
  byMonth?: number[]; // Month (1-12)
}

export interface RecurrenceException {
  originalDate: number; // Original occurrence date
  isDeleted?: boolean; // If true, this occurrence is skipped
  modifiedEvent?: Partial<CalendarEventInput>; // Modified data for this occurrence
}

// Reminder types
export type ReminderTime = 0 | 5 | 10 | 15 | 30 | 60 | 120 | 1440 | 2880; // Minutes before event

export const REMINDER_OPTIONS: { value: ReminderTime; label: string }[] = [
  { value: 0, label: 'At time of event' },
  { value: 5, label: '5 minutes before' },
  { value: 10, label: '10 minutes before' },
  { value: 15, label: '15 minutes before' },
  { value: 30, label: '30 minutes before' },
  { value: 60, label: '1 hour before' },
  { value: 120, label: '2 hours before' },
  { value: 1440, label: '1 day before' },
  { value: 2880, label: '2 days before' },
];

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: {
    eventId?: number;
    url?: string;
  };
}

// Search and filter types
export interface SearchFilters {
  query: string;
  sources: ('local' | 'google' | 'apple' | 'notion')[];
  dateFrom: Date | null;
  dateTo: Date | null;
}
