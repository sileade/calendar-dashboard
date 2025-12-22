/**
 * Notion Calendar Service
 * Handles Notion API integration for calendar database synchronization
 */

import { CalendarConnection, Event } from "../../drizzle/schema";

interface NotionPage {
  id: string;
  properties: {
    [key: string]: NotionProperty;
  };
}

interface NotionProperty {
  type: string;
  title?: Array<{ plain_text: string }>;
  rich_text?: Array<{ plain_text: string }>;
  date?: {
    start: string;
    end?: string;
  };
  checkbox?: boolean;
  select?: { name: string };
  multi_select?: Array<{ name: string }>;
}

interface NotionDatabaseQuery {
  results: NotionPage[];
  has_more: boolean;
  next_cursor?: string;
}

const NOTION_API_BASE = "https://api.notion.com/v1";
const NOTION_VERSION = "2022-06-28";

export class NotionCalendarService {
  private accessToken: string;
  private databaseId: string;

  constructor(connection: CalendarConnection) {
    if (!connection.notionAccessToken || !connection.notionDatabaseId) {
      throw new Error("Notion credentials are required");
    }
    this.accessToken = connection.notionAccessToken;
    this.databaseId = connection.notionDatabaseId;
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const response = await fetch(`${NOTION_API_BASE}${endpoint}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        "Content-Type": "application/json",
        "Notion-Version": NOTION_VERSION,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(`Notion API error: ${error.message || response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get database schema to understand property names
   */
  async getDatabaseSchema(): Promise<{
    titleProperty: string;
    dateProperty: string;
    descriptionProperty?: string;
    locationProperty?: string;
  }> {
    const database = await this.makeRequest<{
      properties: Record<string, { type: string; name: string }>;
    }>(`/databases/${this.databaseId}`);

    let titleProperty = "Name";
    let dateProperty = "Date";
    let descriptionProperty: string | undefined;
    let locationProperty: string | undefined;

    for (const [name, prop] of Object.entries(database.properties)) {
      if (prop.type === "title") {
        titleProperty = name;
      } else if (prop.type === "date") {
        dateProperty = name;
      } else if (prop.type === "rich_text") {
        if (name.toLowerCase().includes("description") || name.toLowerCase().includes("notes")) {
          descriptionProperty = name;
        } else if (name.toLowerCase().includes("location") || name.toLowerCase().includes("place")) {
          locationProperty = name;
        }
      }
    }

    return { titleProperty, dateProperty, descriptionProperty, locationProperty };
  }

  /**
   * Fetch events from Notion database
   */
  async fetchEvents(timeMin?: Date, timeMax?: Date): Promise<NotionPage[]> {
    const schema = await this.getDatabaseSchema();
    
    const filter: any = {
      property: schema.dateProperty,
      date: {
        is_not_empty: true,
      },
    };

    // Add date range filter if provided
    const filters: any[] = [filter];
    
    if (timeMin) {
      filters.push({
        property: schema.dateProperty,
        date: {
          on_or_after: timeMin.toISOString().split("T")[0],
        },
      });
    }
    
    if (timeMax) {
      filters.push({
        property: schema.dateProperty,
        date: {
          on_or_before: timeMax.toISOString().split("T")[0],
        },
      });
    }

    const body = {
      filter: filters.length > 1 ? { and: filters } : filter,
      sorts: [
        {
          property: schema.dateProperty,
          direction: "ascending",
        },
      ],
    };

    const allResults: NotionPage[] = [];
    let hasMore = true;
    let startCursor: string | undefined;

    while (hasMore) {
      const response = await this.makeRequest<NotionDatabaseQuery>(
        `/databases/${this.databaseId}/query`,
        {
          method: "POST",
          body: JSON.stringify({ ...body, start_cursor: startCursor }),
        }
      );

      allResults.push(...response.results);
      hasMore = response.has_more;
      startCursor = response.next_cursor;
    }

    return allResults;
  }

  /**
   * Create a new page (event) in Notion database
   */
  async createEvent(event: Partial<Event>): Promise<string> {
    const schema = await this.getDatabaseSchema();
    
    const properties: Record<string, any> = {
      [schema.titleProperty]: {
        title: [
          {
            text: {
              content: event.title || "Untitled Event",
            },
          },
        ],
      },
      [schema.dateProperty]: {
        date: {
          start: new Date(event.startTime || Date.now()).toISOString(),
          end: event.endTime ? new Date(event.endTime).toISOString() : undefined,
        },
      },
    };

    if (schema.descriptionProperty && event.description) {
      properties[schema.descriptionProperty] = {
        rich_text: [
          {
            text: {
              content: event.description,
            },
          },
        ],
      };
    }

    if (schema.locationProperty && event.location) {
      properties[schema.locationProperty] = {
        rich_text: [
          {
            text: {
              content: event.location,
            },
          },
        ],
      };
    }

    const response = await this.makeRequest<{ id: string }>("/pages", {
      method: "POST",
      body: JSON.stringify({
        parent: { database_id: this.databaseId },
        properties,
      }),
    });

    return response.id;
  }

  /**
   * Update an existing page (event) in Notion
   */
  async updateEvent(pageId: string, event: Partial<Event>): Promise<void> {
    const schema = await this.getDatabaseSchema();
    
    const properties: Record<string, any> = {};

    if (event.title !== undefined) {
      properties[schema.titleProperty] = {
        title: [
          {
            text: {
              content: event.title,
            },
          },
        ],
      };
    }

    if (event.startTime !== undefined) {
      properties[schema.dateProperty] = {
        date: {
          start: new Date(event.startTime).toISOString(),
          end: event.endTime ? new Date(event.endTime).toISOString() : undefined,
        },
      };
    }

    if (schema.descriptionProperty && event.description !== undefined) {
      properties[schema.descriptionProperty] = {
        rich_text: [
          {
            text: {
              content: event.description || "",
            },
          },
        ],
      };
    }

    if (schema.locationProperty && event.location !== undefined) {
      properties[schema.locationProperty] = {
        rich_text: [
          {
            text: {
              content: event.location || "",
            },
          },
        ],
      };
    }

    await this.makeRequest(`/pages/${pageId}`, {
      method: "PATCH",
      body: JSON.stringify({ properties }),
    });
  }

  /**
   * Archive (delete) a page in Notion
   */
  async deleteEvent(pageId: string): Promise<void> {
    await this.makeRequest(`/pages/${pageId}`, {
      method: "PATCH",
      body: JSON.stringify({ archived: true }),
    });
  }

  /**
   * Convert Notion page to local event format
   */
  static async convertFromNotionPage(
    page: NotionPage,
    schema: { titleProperty: string; dateProperty: string; descriptionProperty?: string; locationProperty?: string }
  ): Promise<Partial<Event>> {
    const titleProp = page.properties[schema.titleProperty];
    const dateProp = page.properties[schema.dateProperty];
    const descProp = schema.descriptionProperty ? page.properties[schema.descriptionProperty] : undefined;
    const locProp = schema.locationProperty ? page.properties[schema.locationProperty] : undefined;

    const title = titleProp?.title?.[0]?.plain_text || "Untitled";
    const description = descProp?.rich_text?.[0]?.plain_text;
    const location = locProp?.rich_text?.[0]?.plain_text;

    const startDate = dateProp?.date?.start;
    const endDate = dateProp?.date?.end;

    const isAllDay = startDate ? !startDate.includes("T") : false;
    const startTime = startDate ? new Date(startDate).getTime() : Date.now();
    const endTime = endDate
      ? new Date(endDate).getTime()
      : isAllDay
      ? startTime + 24 * 60 * 60 * 1000 - 1
      : startTime + 60 * 60 * 1000;

    return {
      notionPageId: page.id,
      title,
      description,
      location,
      startTime,
      endTime,
      isAllDay,
      source: "notion",
      syncStatus: "synced",
    };
  }
}
