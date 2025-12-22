import { eq, and, gte, lte, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, calendarConnections, events, syncLogs, InsertCalendarConnection, InsertEvent, InsertSyncLog } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// User operations
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// Calendar Connection operations
export async function getCalendarConnections(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(calendarConnections).where(eq(calendarConnections.userId, userId));
}

export async function getCalendarConnection(id: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(calendarConnections)
    .where(and(eq(calendarConnections.id, id), eq(calendarConnections.userId, userId)))
    .limit(1);
  return result[0];
}

export async function createCalendarConnection(connection: InsertCalendarConnection) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(calendarConnections).values(connection);
  return result[0].insertId;
}

export async function updateCalendarConnection(id: number, userId: number, updates: Partial<InsertCalendarConnection>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(calendarConnections)
    .set({ ...updates, updatedAt: new Date() })
    .where(and(eq(calendarConnections.id, id), eq(calendarConnections.userId, userId)));
}

export async function deleteCalendarConnection(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(calendarConnections)
    .where(and(eq(calendarConnections.id, id), eq(calendarConnections.userId, userId)));
}

// Event operations
export async function getEvents(userId: number, startTime?: number, endTime?: number) {
  const db = await getDb();
  if (!db) return [];
  
  let query = db.select().from(events).where(eq(events.userId, userId));
  
  if (startTime && endTime) {
    query = db.select().from(events).where(
      and(
        eq(events.userId, userId),
        gte(events.startTime, startTime),
        lte(events.endTime, endTime)
      )
    );
  }
  
  return query;
}

export async function getEvent(id: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(events)
    .where(and(eq(events.id, id), eq(events.userId, userId)))
    .limit(1);
  return result[0];
}

export async function createEvent(event: InsertEvent) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(events).values(event);
  return result[0].insertId;
}

export async function updateEvent(id: number, userId: number, updates: Partial<InsertEvent>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(events)
    .set({ ...updates, updatedAt: new Date() })
    .where(and(eq(events.id, id), eq(events.userId, userId)));
}

export async function deleteEvent(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(events)
    .where(and(eq(events.id, id), eq(events.userId, userId)));
}

export async function getEventByExternalId(userId: number, provider: 'google' | 'apple' | 'notion', externalId: string) {
  const db = await getDb();
  if (!db) return undefined;
  
  const fieldMap = {
    google: events.googleEventId,
    apple: events.appleEventId,
    notion: events.notionPageId,
  };
  
  const result = await db.select().from(events)
    .where(and(eq(events.userId, userId), eq(fieldMap[provider], externalId)))
    .limit(1);
  return result[0];
}

// Sync Log operations
export async function createSyncLog(log: InsertSyncLog) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(syncLogs).values(log);
  return result[0].insertId;
}

export async function updateSyncLog(id: number, updates: Partial<InsertSyncLog>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(syncLogs).set(updates).where(eq(syncLogs.id, id));
}

export async function getSyncLogs(userId: number, limit = 20) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(syncLogs)
    .where(eq(syncLogs.userId, userId))
    .orderBy(desc(syncLogs.startedAt))
    .limit(limit);
}
