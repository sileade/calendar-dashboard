/**
 * Apple Calendar Service (CalDAV)
 * Handles CalDAV authentication and event synchronization with iCloud Calendar
 */

import { CalendarConnection, Event } from "../../drizzle/schema";

interface CalDAVEvent {
  uid: string;
  summary: string;
  description?: string;
  location?: string;
  dtstart: string;
  dtend: string;
  rrule?: string;
}

export class AppleCalendarService {
  private caldavUrl: string;
  private username: string;
  private password: string;

  constructor(connection: CalendarConnection) {
    if (!connection.caldavUrl || !connection.caldavUsername || !connection.caldavPassword) {
      throw new Error("CalDAV credentials are required for Apple Calendar");
    }
    this.caldavUrl = connection.caldavUrl;
    this.username = connection.caldavUsername;
    this.password = connection.caldavPassword;
  }

  private getAuthHeader(): string {
    return `Basic ${Buffer.from(`${this.username}:${this.password}`).toString("base64")}`;
  }

  private async makeRequest(
    url: string,
    method: string,
    body?: string,
    contentType?: string
  ): Promise<Response> {
    const headers: Record<string, string> = {
      Authorization: this.getAuthHeader(),
      "Content-Type": contentType || "application/xml; charset=utf-8",
    };

    if (method === "REPORT" || method === "PROPFIND") {
      headers["Depth"] = "1";
    }

    return fetch(url, {
      method,
      headers,
      body,
    });
  }

  /**
   * Discover calendars available on the CalDAV server
   */
  async discoverCalendars(): Promise<Array<{ href: string; displayName: string; color?: string }>> {
    const propfindBody = `<?xml version="1.0" encoding="utf-8"?>
      <d:propfind xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav" xmlns:cs="http://calendarserver.org/ns/">
        <d:prop>
          <d:displayname/>
          <cs:calendar-color/>
          <d:resourcetype/>
        </d:prop>
      </d:propfind>`;

    const response = await this.makeRequest(
      this.caldavUrl,
      "PROPFIND",
      propfindBody
    );

    if (!response.ok) {
      throw new Error(`CalDAV PROPFIND failed: ${response.statusText}`);
    }

    const text = await response.text();
    // Parse XML response - simplified parsing
    const calendars: Array<{ href: string; displayName: string; color?: string }> = [];
    
    // Extract calendar info from XML (basic parsing)
    const hrefMatches = text.match(/<d:href>([^<]+)<\/d:href>/g);
    const nameMatches = text.match(/<d:displayname>([^<]*)<\/d:displayname>/g);
    
    if (hrefMatches) {
      hrefMatches.forEach((match, index) => {
        const href = match.replace(/<\/?d:href>/g, "");
        const name = nameMatches?.[index]?.replace(/<\/?d:displayname>/g, "") || "Calendar";
        if (href.includes("/calendars/") || href.includes("/calendar/")) {
          calendars.push({ href, displayName: name });
        }
      });
    }

    return calendars;
  }

  /**
   * Fetch events from CalDAV calendar
   */
  async fetchEvents(
    calendarHref: string,
    timeMin?: Date,
    timeMax?: Date
  ): Promise<CalDAVEvent[]> {
    const startDate = timeMin || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = timeMax || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

    const reportBody = `<?xml version="1.0" encoding="utf-8"?>
      <c:calendar-query xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav">
        <d:prop>
          <d:getetag/>
          <c:calendar-data/>
        </d:prop>
        <c:filter>
          <c:comp-filter name="VCALENDAR">
            <c:comp-filter name="VEVENT">
              <c:time-range start="${this.formatDateForCalDAV(startDate)}" end="${this.formatDateForCalDAV(endDate)}"/>
            </c:comp-filter>
          </c:comp-filter>
        </c:filter>
      </c:calendar-query>`;

    const calendarUrl = new URL(calendarHref, this.caldavUrl).toString();
    const response = await this.makeRequest(calendarUrl, "REPORT", reportBody);

    if (!response.ok) {
      throw new Error(`CalDAV REPORT failed: ${response.statusText}`);
    }

    const text = await response.text();
    return this.parseICalendarEvents(text);
  }

  /**
   * Create a new event in CalDAV calendar
   */
  async createEvent(calendarHref: string, event: Partial<Event>): Promise<string> {
    const uid = this.generateUID();
    const icalEvent = this.convertToICalendar(event, uid);
    
    const eventUrl = new URL(`${calendarHref}${uid}.ics`, this.caldavUrl).toString();
    
    const response = await this.makeRequest(
      eventUrl,
      "PUT",
      icalEvent,
      "text/calendar; charset=utf-8"
    );

    if (!response.ok) {
      throw new Error(`CalDAV PUT failed: ${response.statusText}`);
    }

    return uid;
  }

  /**
   * Update an existing event in CalDAV calendar
   */
  async updateEvent(calendarHref: string, uid: string, event: Partial<Event>): Promise<void> {
    const icalEvent = this.convertToICalendar(event, uid);
    
    const eventUrl = new URL(`${calendarHref}${uid}.ics`, this.caldavUrl).toString();
    
    const response = await this.makeRequest(
      eventUrl,
      "PUT",
      icalEvent,
      "text/calendar; charset=utf-8"
    );

    if (!response.ok) {
      throw new Error(`CalDAV PUT failed: ${response.statusText}`);
    }
  }

  /**
   * Delete an event from CalDAV calendar
   */
  async deleteEvent(calendarHref: string, uid: string): Promise<void> {
    const eventUrl = new URL(`${calendarHref}${uid}.ics`, this.caldavUrl).toString();
    
    const response = await this.makeRequest(eventUrl, "DELETE");

    if (!response.ok && response.status !== 404) {
      throw new Error(`CalDAV DELETE failed: ${response.statusText}`);
    }
  }

  /**
   * Convert local event to iCalendar format
   */
  private convertToICalendar(event: Partial<Event>, uid: string): string {
    const start = new Date(event.startTime || Date.now());
    const end = new Date(event.endTime || Date.now());
    const isAllDay = event.isAllDay || false;

    const dtstart = isAllDay
      ? `DTSTART;VALUE=DATE:${this.formatDateOnly(start)}`
      : `DTSTART:${this.formatDateTime(start)}`;
    
    const dtend = isAllDay
      ? `DTEND;VALUE=DATE:${this.formatDateOnly(end)}`
      : `DTEND:${this.formatDateTime(end)}`;

    let ical = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Calendar Dashboard//EN
BEGIN:VEVENT
UID:${uid}
DTSTAMP:${this.formatDateTime(new Date())}
${dtstart}
${dtend}
SUMMARY:${this.escapeICalText(event.title || "Untitled")}`;

    if (event.description) {
      ical += `\nDESCRIPTION:${this.escapeICalText(event.description)}`;
    }
    if (event.location) {
      ical += `\nLOCATION:${this.escapeICalText(event.location)}`;
    }
    if (event.recurrenceRule) {
      ical += `\nRRULE:${event.recurrenceRule}`;
    }

    ical += `
END:VEVENT
END:VCALENDAR`;

    return ical;
  }

  /**
   * Parse iCalendar events from CalDAV response
   */
  private parseICalendarEvents(xmlResponse: string): CalDAVEvent[] {
    const events: CalDAVEvent[] = [];
    
    // Extract calendar-data from XML
    const calendarDataMatches = xmlResponse.match(/<c:calendar-data[^>]*>([^]*?)<\/c:calendar-data>/g);
    
    if (!calendarDataMatches) return events;

    for (const match of calendarDataMatches) {
      const icalData = match
        .replace(/<c:calendar-data[^>]*>/, "")
        .replace(/<\/c:calendar-data>/, "")
        .trim();

      const event = this.parseICalEvent(icalData);
      if (event) {
        events.push(event);
      }
    }

    return events;
  }

  /**
   * Parse a single iCalendar event
   */
  private parseICalEvent(icalData: string): CalDAVEvent | null {
    const lines = icalData.split(/\r?\n/);
    const event: Partial<CalDAVEvent> = {};

    for (const line of lines) {
      if (line.startsWith("UID:")) {
        event.uid = line.substring(4);
      } else if (line.startsWith("SUMMARY:")) {
        event.summary = this.unescapeICalText(line.substring(8));
      } else if (line.startsWith("DESCRIPTION:")) {
        event.description = this.unescapeICalText(line.substring(12));
      } else if (line.startsWith("LOCATION:")) {
        event.location = this.unescapeICalText(line.substring(9));
      } else if (line.startsWith("DTSTART")) {
        event.dtstart = this.extractDateTime(line);
      } else if (line.startsWith("DTEND")) {
        event.dtend = this.extractDateTime(line);
      } else if (line.startsWith("RRULE:")) {
        event.rrule = line.substring(6);
      }
    }

    if (event.uid && event.summary && event.dtstart && event.dtend) {
      return event as CalDAVEvent;
    }

    return null;
  }

  /**
   * Convert CalDAV event to local format
   */
  static convertFromCalDAVEvent(caldavEvent: CalDAVEvent): Partial<Event> {
    const isAllDay = caldavEvent.dtstart.length === 8; // YYYYMMDD format
    
    const startTime = isAllDay
      ? new Date(
          parseInt(caldavEvent.dtstart.substring(0, 4)),
          parseInt(caldavEvent.dtstart.substring(4, 6)) - 1,
          parseInt(caldavEvent.dtstart.substring(6, 8))
        ).getTime()
      : new Date(caldavEvent.dtstart).getTime();

    const endTime = isAllDay
      ? new Date(
          parseInt(caldavEvent.dtend.substring(0, 4)),
          parseInt(caldavEvent.dtend.substring(4, 6)) - 1,
          parseInt(caldavEvent.dtend.substring(6, 8))
        ).getTime()
      : new Date(caldavEvent.dtend).getTime();

    return {
      appleEventId: caldavEvent.uid,
      title: caldavEvent.summary,
      description: caldavEvent.description,
      location: caldavEvent.location,
      startTime,
      endTime,
      isAllDay,
      recurrenceRule: caldavEvent.rrule,
      source: "apple",
      syncStatus: "synced",
    };
  }

  private formatDateForCalDAV(date: Date): string {
    return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  }

  private formatDateTime(date: Date): string {
    return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  }

  private formatDateOnly(date: Date): string {
    return date.toISOString().split("T")[0].replace(/-/g, "");
  }

  private extractDateTime(line: string): string {
    const match = line.match(/:(\d{8}T?\d{0,6}Z?)/);
    return match ? match[1] : "";
  }

  private escapeICalText(text: string): string {
    return text
      .replace(/\\/g, "\\\\")
      .replace(/;/g, "\\;")
      .replace(/,/g, "\\,")
      .replace(/\n/g, "\\n");
  }

  private unescapeICalText(text: string): string {
    return text
      .replace(/\\n/g, "\n")
      .replace(/\\,/g, ",")
      .replace(/\\;/g, ";")
      .replace(/\\\\/g, "\\");
  }

  private generateUID(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}@calendar-dashboard`;
  }
}
