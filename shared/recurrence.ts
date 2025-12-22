import { RecurrenceRule, RecurrenceFrequency } from './types';

/**
 * Parse RRULE string to RecurrenceRule object
 */
export function parseRRule(rrule: string): RecurrenceRule | null {
  if (!rrule || !rrule.startsWith('RRULE:')) return null;

  const parts = rrule.replace('RRULE:', '').split(';');
  const rule: RecurrenceRule = {
    frequency: 'daily',
    interval: 1,
  };

  for (const part of parts) {
    const [key, value] = part.split('=');
    switch (key) {
      case 'FREQ':
        rule.frequency = value.toLowerCase() as RecurrenceFrequency;
        break;
      case 'INTERVAL':
        rule.interval = parseInt(value, 10);
        break;
      case 'COUNT':
        rule.count = parseInt(value, 10);
        break;
      case 'UNTIL':
        // Parse YYYYMMDD or YYYYMMDDTHHMMSSZ format
        const year = parseInt(value.slice(0, 4), 10);
        const month = parseInt(value.slice(4, 6), 10) - 1;
        const day = parseInt(value.slice(6, 8), 10);
        rule.endDate = new Date(year, month, day).getTime();
        break;
      case 'BYDAY':
        rule.byDay = value.split(',').map(d => {
          const dayMap: Record<string, number> = {
            SU: 0, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6
          };
          return dayMap[d] ?? 0;
        });
        break;
      case 'BYMONTHDAY':
        rule.byMonthDay = value.split(',').map(d => parseInt(d, 10));
        break;
      case 'BYMONTH':
        rule.byMonth = value.split(',').map(m => parseInt(m, 10));
        break;
    }
  }

  return rule;
}

/**
 * Convert RecurrenceRule object to RRULE string
 */
export function toRRule(rule: RecurrenceRule): string {
  const parts: string[] = [];

  parts.push(`FREQ=${rule.frequency.toUpperCase()}`);

  if (rule.interval && rule.interval > 1) {
    parts.push(`INTERVAL=${rule.interval}`);
  }

  if (rule.count) {
    parts.push(`COUNT=${rule.count}`);
  }

  if (rule.endDate) {
    const date = new Date(rule.endDate);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    parts.push(`UNTIL=${year}${month}${day}`);
  }

  if (rule.byDay && rule.byDay.length > 0) {
    const dayMap = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
    parts.push(`BYDAY=${rule.byDay.map(d => dayMap[d]).join(',')}`);
  }

  if (rule.byMonthDay && rule.byMonthDay.length > 0) {
    parts.push(`BYMONTHDAY=${rule.byMonthDay.join(',')}`);
  }

  if (rule.byMonth && rule.byMonth.length > 0) {
    parts.push(`BYMONTH=${rule.byMonth.join(',')}`);
  }

  return `RRULE:${parts.join(';')}`;
}

/**
 * Generate occurrences of a recurring event within a date range
 */
export function generateOccurrences(
  startTime: number,
  endTime: number,
  rule: RecurrenceRule,
  rangeStart: Date,
  rangeEnd: Date,
  maxOccurrences: number = 100
): { startTime: number; endTime: number }[] {
  const occurrences: { startTime: number; endTime: number }[] = [];
  const duration = endTime - startTime;
  let currentDate = new Date(startTime);
  let count = 0;

  const ruleEndDate = rule.endDate ? new Date(rule.endDate) : null;
  const maxCount = rule.count || maxOccurrences;

  while (count < maxCount && currentDate <= rangeEnd) {
    // Check if we've passed the rule end date
    if (ruleEndDate && currentDate > ruleEndDate) break;

    // Check if current occurrence is within range
    if (currentDate >= rangeStart) {
      // Check day-of-week constraint
      if (rule.byDay && rule.byDay.length > 0) {
        if (!rule.byDay.includes(currentDate.getDay())) {
          currentDate = getNextDate(currentDate, rule);
          continue;
        }
      }

      // Check month-day constraint
      if (rule.byMonthDay && rule.byMonthDay.length > 0) {
        if (!rule.byMonthDay.includes(currentDate.getDate())) {
          currentDate = getNextDate(currentDate, rule);
          continue;
        }
      }

      // Check month constraint
      if (rule.byMonth && rule.byMonth.length > 0) {
        if (!rule.byMonth.includes(currentDate.getMonth() + 1)) {
          currentDate = getNextDate(currentDate, rule);
          continue;
        }
      }

      occurrences.push({
        startTime: currentDate.getTime(),
        endTime: currentDate.getTime() + duration,
      });
      count++;
    }

    currentDate = getNextDate(currentDate, rule);
  }

  return occurrences;
}

/**
 * Get the next date based on recurrence rule
 */
function getNextDate(current: Date, rule: RecurrenceRule): Date {
  const next = new Date(current);
  const interval = rule.interval || 1;

  switch (rule.frequency) {
    case 'daily':
      next.setDate(next.getDate() + interval);
      break;
    case 'weekly':
      next.setDate(next.getDate() + (7 * interval));
      break;
    case 'monthly':
      next.setMonth(next.getMonth() + interval);
      break;
    case 'yearly':
      next.setFullYear(next.getFullYear() + interval);
      break;
  }

  return next;
}

/**
 * Get human-readable description of recurrence rule
 */
export function describeRecurrence(rule: RecurrenceRule): string {
  const interval = rule.interval || 1;
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  let description = '';

  switch (rule.frequency) {
    case 'daily':
      description = interval === 1 ? 'Daily' : `Every ${interval} days`;
      break;
    case 'weekly':
      if (rule.byDay && rule.byDay.length > 0) {
        const days = rule.byDay.map(d => dayNames[d]).join(', ');
        description = interval === 1 
          ? `Weekly on ${days}` 
          : `Every ${interval} weeks on ${days}`;
      } else {
        description = interval === 1 ? 'Weekly' : `Every ${interval} weeks`;
      }
      break;
    case 'monthly':
      if (rule.byMonthDay && rule.byMonthDay.length > 0) {
        const days = rule.byMonthDay.join(', ');
        description = interval === 1 
          ? `Monthly on day ${days}` 
          : `Every ${interval} months on day ${days}`;
      } else {
        description = interval === 1 ? 'Monthly' : `Every ${interval} months`;
      }
      break;
    case 'yearly':
      description = interval === 1 ? 'Yearly' : `Every ${interval} years`;
      break;
  }

  if (rule.count) {
    description += `, ${rule.count} times`;
  } else if (rule.endDate) {
    const endDate = new Date(rule.endDate);
    description += `, until ${endDate.toLocaleDateString()}`;
  }

  return description;
}

/**
 * Check if a specific date is an occurrence of a recurring event
 */
export function isOccurrence(
  eventStartTime: number,
  rule: RecurrenceRule,
  checkDate: Date
): boolean {
  const eventStart = new Date(eventStartTime);
  
  // Check if checkDate is before event start
  if (checkDate < eventStart) return false;

  // Check end conditions
  if (rule.endDate && checkDate.getTime() > rule.endDate) return false;

  // Check day-of-week constraint
  if (rule.byDay && rule.byDay.length > 0) {
    if (!rule.byDay.includes(checkDate.getDay())) return false;
  }

  // Check month-day constraint
  if (rule.byMonthDay && rule.byMonthDay.length > 0) {
    if (!rule.byMonthDay.includes(checkDate.getDate())) return false;
  }

  // Check month constraint
  if (rule.byMonth && rule.byMonth.length > 0) {
    if (!rule.byMonth.includes(checkDate.getMonth() + 1)) return false;
  }

  // Calculate if checkDate falls on a valid interval
  const interval = rule.interval || 1;
  const diffTime = checkDate.getTime() - eventStart.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  switch (rule.frequency) {
    case 'daily':
      return diffDays % interval === 0;
    case 'weekly':
      return Math.floor(diffDays / 7) % interval === 0;
    case 'monthly':
      const monthsDiff = (checkDate.getFullYear() - eventStart.getFullYear()) * 12 
        + (checkDate.getMonth() - eventStart.getMonth());
      return monthsDiff % interval === 0 && checkDate.getDate() === eventStart.getDate();
    case 'yearly':
      const yearsDiff = checkDate.getFullYear() - eventStart.getFullYear();
      return yearsDiff % interval === 0 
        && checkDate.getMonth() === eventStart.getMonth() 
        && checkDate.getDate() === eventStart.getDate();
    default:
      return false;
  }
}
