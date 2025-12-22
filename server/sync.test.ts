import { describe, expect, it, vi, beforeEach } from "vitest";
import { GoogleCalendarService } from "./services/googleCalendar";
import { AppleCalendarService } from "./services/appleCalendar";
import { NotionCalendarService } from "./services/notionCalendar";
import { CalendarConnection } from "../drizzle/schema";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("GoogleCalendarService", () => {
  const mockConnection: CalendarConnection = {
    id: 1,
    userId: 1,
    provider: "google",
    calendarId: "primary",
    calendarName: "Test Calendar",
    accessToken: "test-access-token",
    refreshToken: "test-refresh-token",
    tokenExpiresAt: new Date(Date.now() + 3600000),
    caldavUrl: null,
    caldavUsername: null,
    caldavPassword: null,
    notionAccessToken: null,
    notionDatabaseId: null,
    syncDirection: "bidirectional",
    isConnected: true,
    color: "#4285F4",
    lastSyncAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates service instance with valid connection", () => {
    const service = new GoogleCalendarService(mockConnection);
    expect(service).toBeDefined();
  });

  it("throws error without access token", () => {
    const invalidConnection = { ...mockConnection, accessToken: null };
    expect(() => new GoogleCalendarService(invalidConnection)).toThrow(
      "Google Calendar access token is required"
    );
  });

  it("converts Google event to local format", () => {
    const googleEvent = {
      id: "google-event-123",
      summary: "Test Meeting",
      description: "A test meeting",
      location: "Conference Room",
      start: { dateTime: "2025-01-15T10:00:00Z" },
      end: { dateTime: "2025-01-15T11:00:00Z" },
    };

    const localEvent = GoogleCalendarService.convertFromGoogleEvent(googleEvent);

    expect(localEvent.googleEventId).toBe("google-event-123");
    expect(localEvent.title).toBe("Test Meeting");
    expect(localEvent.description).toBe("A test meeting");
    expect(localEvent.location).toBe("Conference Room");
    expect(localEvent.isAllDay).toBe(false);
    expect(localEvent.source).toBe("google");
  });

  it("handles all-day events correctly", () => {
    const allDayEvent = {
      id: "all-day-123",
      summary: "Holiday",
      start: { date: "2025-01-20" },
      end: { date: "2025-01-21" },
    };

    const localEvent = GoogleCalendarService.convertFromGoogleEvent(allDayEvent);

    expect(localEvent.isAllDay).toBe(true);
  });
});

describe("AppleCalendarService", () => {
  const mockConnection: CalendarConnection = {
    id: 2,
    userId: 1,
    provider: "apple",
    calendarId: "/calendars/home/",
    calendarName: "iCloud Calendar",
    accessToken: null,
    refreshToken: null,
    tokenExpiresAt: null,
    caldavUrl: "https://caldav.icloud.com",
    caldavUsername: "test@icloud.com",
    caldavPassword: "app-specific-password",
    notionAccessToken: null,
    notionDatabaseId: null,
    syncDirection: "bidirectional",
    isConnected: true,
    color: "#007AFF",
    lastSyncAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates service instance with valid CalDAV credentials", () => {
    const service = new AppleCalendarService(mockConnection);
    expect(service).toBeDefined();
  });

  it("throws error without CalDAV credentials", () => {
    const invalidConnection = { ...mockConnection, caldavUrl: null };
    expect(() => new AppleCalendarService(invalidConnection)).toThrow(
      "CalDAV credentials are required for Apple Calendar"
    );
  });

  it("converts CalDAV event to local format", () => {
    const caldavEvent = {
      uid: "caldav-event-123",
      summary: "Apple Event",
      description: "Test description",
      location: "Apple Park",
      dtstart: "20250115T100000Z",
      dtend: "20250115T110000Z",
    };

    const localEvent = AppleCalendarService.convertFromCalDAVEvent(caldavEvent);

    expect(localEvent.appleEventId).toBe("caldav-event-123");
    expect(localEvent.title).toBe("Apple Event");
    expect(localEvent.description).toBe("Test description");
    expect(localEvent.location).toBe("Apple Park");
    expect(localEvent.source).toBe("apple");
  });

  it("handles all-day CalDAV events", () => {
    const allDayEvent = {
      uid: "all-day-caldav",
      summary: "All Day Event",
      dtstart: "20250120",
      dtend: "20250121",
    };

    const localEvent = AppleCalendarService.convertFromCalDAVEvent(allDayEvent);

    expect(localEvent.isAllDay).toBe(true);
  });
});

describe("NotionCalendarService", () => {
  const mockConnection: CalendarConnection = {
    id: 3,
    userId: 1,
    provider: "notion",
    calendarId: null,
    calendarName: "Notion Calendar",
    accessToken: null,
    refreshToken: null,
    tokenExpiresAt: null,
    caldavUrl: null,
    caldavUsername: null,
    caldavPassword: null,
    notionAccessToken: "secret_notion_token",
    notionDatabaseId: "database-id-123",
    syncDirection: "bidirectional",
    isConnected: true,
    color: "#000000",
    lastSyncAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates service instance with valid Notion credentials", () => {
    const service = new NotionCalendarService(mockConnection);
    expect(service).toBeDefined();
  });

  it("throws error without Notion credentials", () => {
    const invalidConnection = { ...mockConnection, notionAccessToken: null };
    expect(() => new NotionCalendarService(invalidConnection)).toThrow(
      "Notion credentials are required"
    );
  });

  it("converts Notion page to local event format", async () => {
    const notionPage = {
      id: "notion-page-123",
      properties: {
        Name: {
          type: "title",
          title: [{ plain_text: "Notion Event" }],
        },
        Date: {
          type: "date",
          date: {
            start: "2025-01-15T10:00:00.000Z",
            end: "2025-01-15T11:00:00.000Z",
          },
        },
        Description: {
          type: "rich_text",
          rich_text: [{ plain_text: "Event description" }],
        },
      },
    };

    const schema = {
      titleProperty: "Name",
      dateProperty: "Date",
      descriptionProperty: "Description",
    };

    const localEvent = await NotionCalendarService.convertFromNotionPage(
      notionPage,
      schema
    );

    expect(localEvent.notionPageId).toBe("notion-page-123");
    expect(localEvent.title).toBe("Notion Event");
    expect(localEvent.description).toBe("Event description");
    expect(localEvent.source).toBe("notion");
  });
});

describe("Event Format Conversions", () => {
  it("preserves event data through Google conversion cycle", () => {
    const originalEvent = {
      title: "Test Event",
      description: "Description",
      location: "Location",
      startTime: new Date("2025-01-15T10:00:00Z").getTime(),
      endTime: new Date("2025-01-15T11:00:00Z").getTime(),
      isAllDay: false,
    };

    const googleEvent = {
      id: "google-123",
      summary: originalEvent.title,
      description: originalEvent.description,
      location: originalEvent.location,
      start: { dateTime: new Date(originalEvent.startTime).toISOString() },
      end: { dateTime: new Date(originalEvent.endTime).toISOString() },
    };

    const converted = GoogleCalendarService.convertFromGoogleEvent(googleEvent);

    expect(converted.title).toBe(originalEvent.title);
    expect(converted.description).toBe(originalEvent.description);
    expect(converted.location).toBe(originalEvent.location);
    expect(converted.isAllDay).toBe(originalEvent.isAllDay);
  });

  it("handles missing optional fields gracefully", () => {
    const minimalGoogleEvent = {
      id: "minimal-123",
      summary: "Minimal Event",
      start: { dateTime: "2025-01-15T10:00:00Z" },
      end: { dateTime: "2025-01-15T11:00:00Z" },
    };

    const converted = GoogleCalendarService.convertFromGoogleEvent(minimalGoogleEvent);

    expect(converted.title).toBe("Minimal Event");
    expect(converted.description).toBeUndefined();
    expect(converted.location).toBeUndefined();
  });

  it("handles untitled events", () => {
    const untitledEvent = {
      id: "untitled-123",
      start: { dateTime: "2025-01-15T10:00:00Z" },
      end: { dateTime: "2025-01-15T11:00:00Z" },
    };

    const converted = GoogleCalendarService.convertFromGoogleEvent(untitledEvent as any);

    expect(converted.title).toBe("Untitled Event");
  });
});
