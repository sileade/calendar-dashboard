/**
 * Sync Engine
 * Handles bidirectional synchronization between local database and external calendars
 */

import { CalendarConnection, Event, InsertEvent } from "../../drizzle/schema";
import * as db from "../db";
import { GoogleCalendarService } from "./googleCalendar";
import { AppleCalendarService } from "./appleCalendar";
import { NotionCalendarService } from "./notionCalendar";

export interface SyncResult {
  connectionId: number;
  provider: string;
  status: "success" | "partial" | "failed";
  eventsProcessed: number;
  eventsCreated: number;
  eventsUpdated: number;
  eventsDeleted: number;
  errors: string[];
}

export class SyncEngine {
  private userId: number;

  constructor(userId: number) {
    this.userId = userId;
  }

  /**
   * Sync all connected calendars
   */
  async syncAll(): Promise<SyncResult[]> {
    const connections = await db.getCalendarConnections(this.userId);
    const results: SyncResult[] = [];

    for (const connection of connections) {
      if (!connection.isConnected || connection.syncDirection === "none") {
        continue;
      }

      try {
        const result = await this.syncConnection(connection);
        results.push(result);
      } catch (error) {
        results.push({
          connectionId: connection.id,
          provider: connection.provider,
          status: "failed",
          eventsProcessed: 0,
          eventsCreated: 0,
          eventsUpdated: 0,
          eventsDeleted: 0,
          errors: [error instanceof Error ? error.message : "Unknown error"],
        });
      }
    }

    return results;
  }

  /**
   * Sync a specific calendar connection
   */
  async syncConnection(connection: CalendarConnection): Promise<SyncResult> {
    const result: SyncResult = {
      connectionId: connection.id,
      provider: connection.provider,
      status: "success",
      eventsProcessed: 0,
      eventsCreated: 0,
      eventsUpdated: 0,
      eventsDeleted: 0,
      errors: [],
    };

    // Create sync log
    const logId = await db.createSyncLog({
      userId: this.userId,
      connectionId: connection.id,
      action: connection.syncDirection === "push" ? "push" : "pull",
      status: "success",
      eventsProcessed: 0,
      eventsCreated: 0,
      eventsUpdated: 0,
      eventsDeleted: 0,
    });

    try {
      switch (connection.provider) {
        case "google":
          await this.syncGoogleCalendar(connection, result);
          break;
        case "apple":
          await this.syncAppleCalendar(connection, result);
          break;
        case "notion":
          await this.syncNotionCalendar(connection, result);
          break;
      }

      // Update connection last sync time
      await db.updateCalendarConnection(connection.id, this.userId, {
        lastSyncAt: new Date(),
      });

      // Update sync log
      await db.updateSyncLog(logId, {
        completedAt: new Date(),
        status: result.errors.length > 0 ? "partial" : "success",
        eventsProcessed: result.eventsProcessed,
        eventsCreated: result.eventsCreated,
        eventsUpdated: result.eventsUpdated,
        eventsDeleted: result.eventsDeleted,
        errorMessage: result.errors.join("; "),
      });
    } catch (error) {
      result.status = "failed";
      result.errors.push(error instanceof Error ? error.message : "Unknown error");

      await db.updateSyncLog(logId, {
        completedAt: new Date(),
        status: "failed",
        errorMessage: result.errors.join("; "),
      });
    }

    return result;
  }

  /**
   * Sync with Google Calendar
   */
  private async syncGoogleCalendar(
    connection: CalendarConnection,
    result: SyncResult
  ): Promise<void> {
    const service = new GoogleCalendarService(connection);
    const calendarId = connection.calendarId || "primary";

    // Calculate sync time range (last 30 days to next 365 days)
    const timeMin = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const timeMax = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

    // Pull events from Google
    if (connection.syncDirection === "pull" || connection.syncDirection === "bidirectional") {
      try {
        const googleEvents = await service.fetchEvents(calendarId, timeMin, timeMax);
        
        for (const googleEvent of googleEvents) {
          result.eventsProcessed++;
          
          // Check if event already exists locally
          const existingEvent = await db.getEventByExternalId(
            this.userId,
            "google",
            googleEvent.id
          );

          const eventData = GoogleCalendarService.convertFromGoogleEvent(googleEvent);

          if (existingEvent) {
            // Update existing event
            await db.updateEvent(existingEvent.id, this.userId, {
              ...eventData,
              syncStatus: "synced",
            });
            result.eventsUpdated++;
          } else {
            // Create new event
            await db.createEvent({
              userId: this.userId,
              connectionId: connection.id,
              ...eventData,
              color: connection.color || "#4285F4",
            } as InsertEvent);
            result.eventsCreated++;
          }
        }
      } catch (error) {
        result.errors.push(`Pull failed: ${error instanceof Error ? error.message : "Unknown"}`);
      }
    }

    // Push local events to Google
    if (connection.syncDirection === "push" || connection.syncDirection === "bidirectional") {
      try {
        // Get local events that need to be synced
        const localEvents = await db.getEvents(this.userId, timeMin.getTime(), timeMax.getTime());
        const pendingEvents = localEvents.filter(
          (e) => e.source === "local" && e.syncStatus === "pending"
        );

        for (const event of pendingEvents) {
          result.eventsProcessed++;

          try {
            if (event.googleEventId) {
              // Update existing Google event
              await service.updateEvent(calendarId, event.googleEventId, event);
            } else {
              // Create new Google event
              const googleEvent = await service.createEvent(calendarId, event);
              await db.updateEvent(event.id, this.userId, {
                googleEventId: googleEvent.id,
                syncStatus: "synced",
              });
            }
            result.eventsUpdated++;
          } catch (error) {
            await db.updateEvent(event.id, this.userId, {
              syncStatus: "error",
              lastSyncError: error instanceof Error ? error.message : "Unknown error",
            });
            result.errors.push(`Failed to sync event ${event.id}`);
          }
        }
      } catch (error) {
        result.errors.push(`Push failed: ${error instanceof Error ? error.message : "Unknown"}`);
      }
    }
  }

  /**
   * Sync with Apple Calendar (CalDAV)
   */
  private async syncAppleCalendar(
    connection: CalendarConnection,
    result: SyncResult
  ): Promise<void> {
    const service = new AppleCalendarService(connection);
    const calendarHref = connection.calendarId || "/";

    const timeMin = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const timeMax = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

    // Pull events from Apple Calendar
    if (connection.syncDirection === "pull" || connection.syncDirection === "bidirectional") {
      try {
        const appleEvents = await service.fetchEvents(calendarHref, timeMin, timeMax);

        for (const appleEvent of appleEvents) {
          result.eventsProcessed++;

          const existingEvent = await db.getEventByExternalId(
            this.userId,
            "apple",
            appleEvent.uid
          );

          const eventData = AppleCalendarService.convertFromCalDAVEvent(appleEvent);

          if (existingEvent) {
            await db.updateEvent(existingEvent.id, this.userId, {
              ...eventData,
              syncStatus: "synced",
            });
            result.eventsUpdated++;
          } else {
            await db.createEvent({
              userId: this.userId,
              connectionId: connection.id,
              ...eventData,
              color: connection.color || "#007AFF",
            } as InsertEvent);
            result.eventsCreated++;
          }
        }
      } catch (error) {
        result.errors.push(`Pull failed: ${error instanceof Error ? error.message : "Unknown"}`);
      }
    }

    // Push local events to Apple Calendar
    if (connection.syncDirection === "push" || connection.syncDirection === "bidirectional") {
      try {
        const localEvents = await db.getEvents(this.userId, timeMin.getTime(), timeMax.getTime());
        const pendingEvents = localEvents.filter(
          (e) => e.source === "local" && e.syncStatus === "pending"
        );

        for (const event of pendingEvents) {
          result.eventsProcessed++;

          try {
            if (event.appleEventId) {
              await service.updateEvent(calendarHref, event.appleEventId, event);
            } else {
              const uid = await service.createEvent(calendarHref, event);
              await db.updateEvent(event.id, this.userId, {
                appleEventId: uid,
                syncStatus: "synced",
              });
            }
            result.eventsUpdated++;
          } catch (error) {
            await db.updateEvent(event.id, this.userId, {
              syncStatus: "error",
              lastSyncError: error instanceof Error ? error.message : "Unknown error",
            });
            result.errors.push(`Failed to sync event ${event.id}`);
          }
        }
      } catch (error) {
        result.errors.push(`Push failed: ${error instanceof Error ? error.message : "Unknown"}`);
      }
    }
  }

  /**
   * Sync with Notion
   */
  private async syncNotionCalendar(
    connection: CalendarConnection,
    result: SyncResult
  ): Promise<void> {
    const service = new NotionCalendarService(connection);

    const timeMin = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const timeMax = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

    // Get database schema
    const schema = await service.getDatabaseSchema();

    // Pull events from Notion
    if (connection.syncDirection === "pull" || connection.syncDirection === "bidirectional") {
      try {
        const notionPages = await service.fetchEvents(timeMin, timeMax);

        for (const page of notionPages) {
          result.eventsProcessed++;

          const existingEvent = await db.getEventByExternalId(
            this.userId,
            "notion",
            page.id
          );

          const eventData = await NotionCalendarService.convertFromNotionPage(page, schema);

          if (existingEvent) {
            await db.updateEvent(existingEvent.id, this.userId, {
              ...eventData,
              syncStatus: "synced",
            });
            result.eventsUpdated++;
          } else {
            await db.createEvent({
              userId: this.userId,
              connectionId: connection.id,
              ...eventData,
              color: connection.color || "#000000",
            } as InsertEvent);
            result.eventsCreated++;
          }
        }
      } catch (error) {
        result.errors.push(`Pull failed: ${error instanceof Error ? error.message : "Unknown"}`);
      }
    }

    // Push local events to Notion
    if (connection.syncDirection === "push" || connection.syncDirection === "bidirectional") {
      try {
        const localEvents = await db.getEvents(this.userId, timeMin.getTime(), timeMax.getTime());
        const pendingEvents = localEvents.filter(
          (e) => e.source === "local" && e.syncStatus === "pending"
        );

        for (const event of pendingEvents) {
          result.eventsProcessed++;

          try {
            if (event.notionPageId) {
              await service.updateEvent(event.notionPageId, event);
            } else {
              const pageId = await service.createEvent(event);
              await db.updateEvent(event.id, this.userId, {
                notionPageId: pageId,
                syncStatus: "synced",
              });
            }
            result.eventsUpdated++;
          } catch (error) {
            await db.updateEvent(event.id, this.userId, {
              syncStatus: "error",
              lastSyncError: error instanceof Error ? error.message : "Unknown error",
            });
            result.errors.push(`Failed to sync event ${event.id}`);
          }
        }
      } catch (error) {
        result.errors.push(`Push failed: ${error instanceof Error ? error.message : "Unknown"}`);
      }
    }
  }

  /**
   * Sync a single event to all connected calendars
   */
  async syncEvent(eventId: number): Promise<void> {
    const event = await db.getEvent(eventId, this.userId);
    if (!event) return;

    const connections = await db.getCalendarConnections(this.userId);

    for (const connection of connections) {
      if (!connection.isConnected) continue;
      if (connection.syncDirection === "none" || connection.syncDirection === "pull") continue;

      try {
        switch (connection.provider) {
          case "google":
            const googleService = new GoogleCalendarService(connection);
            if (event.googleEventId) {
              await googleService.updateEvent(connection.calendarId || "primary", event.googleEventId, event);
            } else {
              const googleEvent = await googleService.createEvent(connection.calendarId || "primary", event);
              await db.updateEvent(event.id, this.userId, { googleEventId: googleEvent.id });
            }
            break;

          case "apple":
            const appleService = new AppleCalendarService(connection);
            if (event.appleEventId) {
              await appleService.updateEvent(connection.calendarId || "/", event.appleEventId, event);
            } else {
              const uid = await appleService.createEvent(connection.calendarId || "/", event);
              await db.updateEvent(event.id, this.userId, { appleEventId: uid });
            }
            break;

          case "notion":
            const notionService = new NotionCalendarService(connection);
            if (event.notionPageId) {
              await notionService.updateEvent(event.notionPageId, event);
            } else {
              const pageId = await notionService.createEvent(event);
              await db.updateEvent(event.id, this.userId, { notionPageId: pageId });
            }
            break;
        }
      } catch (error) {
        console.error(`Failed to sync event ${eventId} to ${connection.provider}:`, error);
      }
    }

    // Mark event as synced
    await db.updateEvent(eventId, this.userId, { syncStatus: "synced" });
  }

  /**
   * Delete event from all connected calendars
   */
  async deleteEventFromAll(event: Event): Promise<void> {
    const connections = await db.getCalendarConnections(this.userId);

    for (const connection of connections) {
      if (!connection.isConnected) continue;
      if (connection.syncDirection === "none" || connection.syncDirection === "pull") continue;

      try {
        switch (connection.provider) {
          case "google":
            if (event.googleEventId) {
              const googleService = new GoogleCalendarService(connection);
              await googleService.deleteEvent(connection.calendarId || "primary", event.googleEventId);
            }
            break;

          case "apple":
            if (event.appleEventId) {
              const appleService = new AppleCalendarService(connection);
              await appleService.deleteEvent(connection.calendarId || "/", event.appleEventId);
            }
            break;

          case "notion":
            if (event.notionPageId) {
              const notionService = new NotionCalendarService(connection);
              await notionService.deleteEvent(event.notionPageId);
            }
            break;
        }
      } catch (error) {
        console.error(`Failed to delete event from ${connection.provider}:`, error);
      }
    }
  }
}
