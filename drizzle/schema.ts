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

/**
 * Event reminders - notification settings for events
 */
export const eventReminders = mysqlTable("event_reminders", {
  id: int("id").autoincrement().primaryKey(),
  eventId: int("eventId").notNull(),
  userId: int("userId").notNull(),
  reminderTime: bigint("reminderTime", { mode: "number" }).notNull(), // Minutes before event
  notificationType: mysqlEnum("notificationType", ["push", "email", "in_app"]).default("push").notNull(),
  isSent: boolean("isSent").default(false).notNull(),
  sentAt: timestamp("sentAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type EventReminder = typeof eventReminders.$inferSelect;
export type InsertEventReminder = typeof eventReminders.$inferInsert;

/**
 * User notification preferences
 */
export const notificationPreferences = mysqlTable("notification_preferences", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  defaultReminders: text("defaultReminders"), // JSON array of default reminder times
  pushEnabled: boolean("pushEnabled").default(true).notNull(),
  emailEnabled: boolean("emailEnabled").default(false).notNull(),
  soundEnabled: boolean("soundEnabled").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type NotificationPreference = typeof notificationPreferences.$inferSelect;
export type InsertNotificationPreference = typeof notificationPreferences.$inferInsert;

/**
 * In-app notifications center
 */
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  eventId: int("eventId"),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message"),
  type: mysqlEnum("type", ["reminder", "sync", "system"]).default("reminder").notNull(),
  isRead: boolean("isRead").default(false).notNull(),
  actionUrl: text("actionUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;
