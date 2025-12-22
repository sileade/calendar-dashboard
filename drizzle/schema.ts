import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, bigint } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Calendar connections - stores OAuth tokens and connection settings for each calendar provider
 */
export const calendarConnections = mysqlTable("calendar_connections", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  provider: mysqlEnum("provider", ["google", "apple", "notion"]).notNull(),
  isConnected: boolean("isConnected").default(false).notNull(),
  syncDirection: mysqlEnum("syncDirection", ["none", "pull", "push", "bidirectional"]).default("bidirectional").notNull(),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  tokenExpiresAt: bigint("tokenExpiresAt", { mode: "number" }),
  // For Apple CalDAV
  caldavUrl: text("caldavUrl"),
  caldavUsername: varchar("caldavUsername", { length: 255 }),
  caldavPassword: text("caldavPassword"),
  // For Notion
  notionDatabaseId: varchar("notionDatabaseId", { length: 64 }),
  notionAccessToken: text("notionAccessToken"),
  // Metadata
  calendarId: varchar("calendarId", { length: 255 }),
  calendarName: varchar("calendarName", { length: 255 }),
  color: varchar("color", { length: 7 }).default("#007AFF"),
  lastSyncAt: timestamp("lastSyncAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CalendarConnection = typeof calendarConnections.$inferSelect;
export type InsertCalendarConnection = typeof calendarConnections.$inferInsert;

/**
 * Events - unified event storage from all calendar sources
 */
export const events = mysqlTable("events", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  connectionId: int("connectionId"),
  // External IDs for sync
  googleEventId: varchar("googleEventId", { length: 255 }),
  appleEventId: varchar("appleEventId", { length: 255 }),
  notionPageId: varchar("notionPageId", { length: 64 }),
  // Event details
  title: varchar("title", { length: 500 }).notNull(),
  description: text("description"),
  location: text("location"),
  startTime: bigint("startTime", { mode: "number" }).notNull(),
  endTime: bigint("endTime", { mode: "number" }).notNull(),
  isAllDay: boolean("isAllDay").default(false).notNull(),
  // Recurrence
  recurrenceRule: text("recurrenceRule"),
  // Source tracking
  source: mysqlEnum("source", ["local", "google", "apple", "notion"]).default("local").notNull(),
  // Sync status
  syncStatus: mysqlEnum("syncStatus", ["synced", "pending", "error"]).default("pending").notNull(),
  lastSyncError: text("lastSyncError"),
  // Visual
  color: varchar("color", { length: 7 }).default("#007AFF"),
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Event = typeof events.$inferSelect;
export type InsertEvent = typeof events.$inferInsert;

/**
 * Sync log - tracks synchronization history
 */
export const syncLogs = mysqlTable("sync_logs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  connectionId: int("connectionId").notNull(),
  action: mysqlEnum("action", ["pull", "push", "conflict_resolved"]).notNull(),
  eventsProcessed: int("eventsProcessed").default(0).notNull(),
  eventsCreated: int("eventsCreated").default(0).notNull(),
  eventsUpdated: int("eventsUpdated").default(0).notNull(),
  eventsDeleted: int("eventsDeleted").default(0).notNull(),
  status: mysqlEnum("status", ["success", "partial", "failed"]).notNull(),
  errorMessage: text("errorMessage"),
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
});

export type SyncLog = typeof syncLogs.$inferSelect;
export type InsertSyncLog = typeof syncLogs.$inferInsert;
