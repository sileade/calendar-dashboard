/**
 * Google Calendar Service
 * Handles OAuth2 authentication and event synchronization with Google Calendar API
 */

import { CalendarConnection, Event } from "../../drizzle/schema";

interface GoogleEvent {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  colorId?: string;
  recurrence?: string[];
}

interface GoogleCalendarList {
  items: Array<{
    id: string;
    summary: string;
    primary?: boolean;
    backgroundColor?: string;
  }>;
}

const GOOGLE_API_BASE = "https://www.googleapis.com/calendar/v3";

export class GoogleCalendarService {
  private accessToken: string;
  private refreshToken?: string;

  constructor(connection: CalendarConnection) {
    if (!connection.accessToken) {
      throw new Error("Google Calendar access token is required");
    }
    this.accessToken = connection.accessToken;
    this.refreshToken = connection.refreshToken || undefined;
  }

  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`${GOOGLE_API_BASE}${endpoint}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(`Google Calendar API error: ${error.error?.message || response.statusText}`);
    }

    return response.json();
  }

  /**
   * List all calendars for the user
   */
  async listCalendars(): Promise<GoogleCalendarList> {
    return this.makeRequest<GoogleCalendarList>("/users/me/calendarList");
  }

  /**
   * Fetch events from Google Calendar
   */
  async fetchEvents(
    calendarId: string = "primary",
    timeMin?: Date,
    timeMax?: Date
  ): Promise<GoogleEvent[]> {
    const params = new URLSearchParams();
    if (timeMin) params.set("timeMin", timeMin.toISOString());
    if (timeMax) params.set("timeMax", timeMax.toISOString());
    params.set("singleEvents", "true");
    params.set("orderBy", "startTime");
    params.set("maxResults", "2500");

    const response = await this.makeRequest<{ items: GoogleEvent[] }>(
      `/calendars/${encodeURIComponent(calendarId)}/events?${params.toString()}`
    );

    return response.items || [];
  }

  /**
   * Create a new event in Google Calendar
   */
  async createEvent(calendarId: string = "primary", event: Partial<Event>): Promise<GoogleEvent> {
    const googleEvent = this.convertToGoogleEvent(event);
    
    return this.makeRequest<GoogleEvent>(
      `/calendars/${encodeURIComponent(calendarId)}/events`,
      {
        method: "POST",
        body: JSON.stringify(googleEvent),
      }
    );
  }

  /**
   * Update an existing event in Google Calendar
   */
  async updateEvent(
    calendarId: string = "primary",
    eventId: string,
    event: Partial<Event>
  ): Promise<GoogleEvent> {
    const googleEvent = this.convertToGoogleEvent(event);
    
    return this.makeRequest<GoogleEvent>(
      `/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`,
      {
        method: "PUT",
        body: JSON.stringify(googleEvent),
      }
    );
  }

  /**
   * Delete an event from Google Calendar
   */
  async deleteEvent(calendarId: string = "primary", eventId: string): Promise<void> {
    await fetch(`${GOOGLE_API_BASE}/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
    });
  }

  /**
   * Convert local event to Google Calendar format
   */
  private convertToGoogleEvent(event: Partial<Event>): Partial<GoogleEvent> {
    const isAllDay = event.isAllDay || false;
    const start = new Date(event.startTime || Date.now());
    const end = new Date(event.endTime || Date.now());

    return {
      summary: event.title,
      description: event.description || undefined,
      location: event.location || undefined,
      start: isAllDay
        ? { date: start.toISOString().split("T")[0] }
        : { dateTime: start.toISOString() },
      end: isAllDay
        ? { date: end.toISOString().split("T")[0] }
        : { dateTime: end.toISOString() },
      recurrence: event.recurrenceRule ? [event.recurrenceRule] : undefined,
    };
  }

  /**
   * Convert Google Calendar event to local format
   */
  static convertFromGoogleEvent(googleEvent: GoogleEvent): Partial<Event> {
    const isAllDay = !googleEvent.start.dateTime;
    const startTime = isAllDay
      ? new Date(googleEvent.start.date + "T00:00:00").getTime()
      : new Date(googleEvent.start.dateTime!).getTime();
    const endTime = isAllDay
      ? new Date(googleEvent.end.date + "T23:59:59").getTime()
      : new Date(googleEvent.end.dateTime!).getTime();

    return {
      googleEventId: googleEvent.id,
      title: googleEvent.summary || "Untitled Event",
      description: googleEvent.description,
      location: googleEvent.location,
      startTime,
      endTime,
      isAllDay,
      recurrenceRule: googleEvent.recurrence?.[0],
      source: "google",
      syncStatus: "synced",
    };
  }
}

/**
 * Generate Google OAuth2 authorization URL
 */
export function getGoogleAuthUrl(clientId: string, redirectUri: string, state?: string): string {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "https://www.googleapis.com/auth/calendar",
    access_type: "offline",
    prompt: "consent",
  });
  
  if (state) params.set("state", state);
  
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeGoogleCode(
  code: string,
  clientId: string,
  clientSecret: string,
  redirectUri: string
): Promise<{ access_token: string; refresh_token?: string; expires_in: number }> {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(`Failed to exchange code: ${error.error_description || response.statusText}`);
  }

  return response.json();
}
