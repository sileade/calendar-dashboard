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
