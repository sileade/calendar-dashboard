# API Reference

This document provides a comprehensive reference for all tRPC procedures available in the Calendar Dashboard API. All endpoints use tRPC protocol and are accessible at `/api/trpc`.

## Authentication

### auth.me

Returns the currently authenticated user or null if not authenticated.

| Property | Value |
|----------|-------|
| Type | Query |
| Auth Required | No |

**Response:**
```typescript
{
  id: number;
  openId: string;
  name: string | null;
  email: string | null;
  role: "user" | "admin";
  createdAt: Date;
  updatedAt: Date;
  lastSignedIn: Date;
} | null
```

### auth.logout

Logs out the current user by clearing the session cookie.

| Property | Value |
|----------|-------|
| Type | Mutation |
| Auth Required | Yes |

**Response:**
```typescript
{ success: true }
```

## Events

### events.list

Retrieves all events for the authenticated user within an optional date range.

| Property | Value |
|----------|-------|
| Type | Query |
| Auth Required | Yes |

**Input:**
```typescript
{
  startDate?: number;  // Unix timestamp (ms)
  endDate?: number;    // Unix timestamp (ms)
}
```

**Response:**
```typescript
Array<{
  id: number;
  userId: number;
  connectionId: number | null;
  googleEventId: string | null;
  appleEventId: string | null;
  notionPageId: string | null;
  title: string;
  description: string | null;
  location: string | null;
  startTime: number;
  endTime: number;
  isAllDay: boolean;
  color: string;
  source: "local" | "google" | "apple" | "notion";
  recurrenceRule: string | null;
  createdAt: Date;
  updatedAt: Date;
}>
```

### events.create

Creates a new calendar event.

| Property | Value |
|----------|-------|
| Type | Mutation |
| Auth Required | Yes |

**Input:**
```typescript
{
  title: string;
  description?: string;
  location?: string;
  startTime: number;      // Unix timestamp (ms)
  endTime: number;        // Unix timestamp (ms)
  isAllDay?: boolean;
  color?: string;         // Hex color code
  recurrenceRule?: string; // RRULE format
}
```

**Response:**
```typescript
{
  id: number;
  success: true;
}
```

### events.update

Updates an existing calendar event.

| Property | Value |
|----------|-------|
| Type | Mutation |
| Auth Required | Yes |

**Input:**
```typescript
{
  id: number;
  title?: string;
  description?: string;
  location?: string;
  startTime?: number;
  endTime?: number;
  isAllDay?: boolean;
  color?: string;
  recurrenceRule?: string;
}
```

**Response:**
```typescript
{ success: true }
```

### events.delete

Deletes a calendar event.

| Property | Value |
|----------|-------|
| Type | Mutation |
| Auth Required | Yes |

**Input:**
```typescript
{ id: number }
```

**Response:**
```typescript
{ success: true }
```

## Calendar Connections

### connections.list

Retrieves all calendar connections for the authenticated user.

| Property | Value |
|----------|-------|
| Type | Query |
| Auth Required | Yes |

**Response:**
```typescript
Array<{
  id: number;
  userId: number;
  provider: "google" | "apple" | "notion";
  accountEmail: string | null;
  accountName: string | null;
  isActive: boolean;
  syncDirection: "pull" | "push" | "bidirectional";
  lastSyncAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}>
```

### connections.create

Creates a new calendar connection.

| Property | Value |
|----------|-------|
| Type | Mutation |
| Auth Required | Yes |

**Input:**
```typescript
{
  provider: "google" | "apple" | "notion";
  accessToken?: string;
  refreshToken?: string;
  accountEmail?: string;
  accountName?: string;
  syncDirection?: "pull" | "push" | "bidirectional";
  // Provider-specific fields
  notionDatabaseId?: string;
  caldavUrl?: string;
  caldavUsername?: string;
  caldavPassword?: string;
}
```

**Response:**
```typescript
{
  id: number;
  success: true;
}
```

### connections.update

Updates a calendar connection's settings.

| Property | Value |
|----------|-------|
| Type | Mutation |
| Auth Required | Yes |

**Input:**
```typescript
{
  id: number;
  isActive?: boolean;
  syncDirection?: "pull" | "push" | "bidirectional";
}
```

**Response:**
```typescript
{ success: true }
```

### connections.delete

Removes a calendar connection.

| Property | Value |
|----------|-------|
| Type | Mutation |
| Auth Required | Yes |

**Input:**
```typescript
{ id: number }
```

**Response:**
```typescript
{ success: true }
```

## Synchronization

### sync.trigger

Triggers manual synchronization for all active connections.

| Property | Value |
|----------|-------|
| Type | Mutation |
| Auth Required | Yes |

**Input:**
```typescript
{
  connectionId?: number;  // Optional: sync specific connection only
}
```

**Response:**
```typescript
{
  success: true;
  syncedEvents: number;
  errors: string[];
}
```

### sync.status

Returns the current synchronization status.

| Property | Value |
|----------|-------|
| Type | Query |
| Auth Required | Yes |

**Response:**
```typescript
{
  lastSyncAt: Date | null;
  isSyncing: boolean;
  pendingChanges: number;
}
```

## Reminders

### reminders.setForEvent

Sets reminders for a specific event.

| Property | Value |
|----------|-------|
| Type | Mutation |
| Auth Required | Yes |

**Input:**
```typescript
{
  eventId: number;
  reminderTimes: number[];  // Minutes before event (e.g., [5, 15, 60])
}
```

**Response:**
```typescript
{ success: true }
```

### reminders.getForEvent

Retrieves reminders for a specific event.

| Property | Value |
|----------|-------|
| Type | Query |
| Auth Required | Yes |

**Input:**
```typescript
{ eventId: number }
```

**Response:**
```typescript
Array<{
  id: number;
  eventId: number;
  reminderTime: number;
  notificationSent: boolean;
}>
```

## Notifications

### notifications.list

Retrieves all notifications for the authenticated user.

| Property | Value |
|----------|-------|
| Type | Query |
| Auth Required | Yes |

**Input:**
```typescript
{
  unreadOnly?: boolean;
  limit?: number;
}
```

**Response:**
```typescript
Array<{
  id: number;
  userId: number;
  eventId: number | null;
  title: string;
  message: string;
  type: "reminder" | "sync" | "system";
  isRead: boolean;
  createdAt: Date;
}>
```

### notifications.markAsRead

Marks notifications as read.

| Property | Value |
|----------|-------|
| Type | Mutation |
| Auth Required | Yes |

**Input:**
```typescript
{
  notificationIds: number[];
}
```

**Response:**
```typescript
{ success: true }
```

### notifications.updatePreferences

Updates notification preferences.

| Property | Value |
|----------|-------|
| Type | Mutation |
| Auth Required | Yes |

**Input:**
```typescript
{
  pushEnabled?: boolean;
  emailEnabled?: boolean;
  soundEnabled?: boolean;
  defaultReminderTimes?: number[];
}
```

**Response:**
```typescript
{ success: true }
```

## Settings

### settings.getKiosk

Retrieves kiosk mode settings.

| Property | Value |
|----------|-------|
| Type | Query |
| Auth Required | Yes |

**Response:**
```typescript
{
  kioskEnabled: boolean;
  homerUrl: string | null;
  autoRefreshInterval: number;  // Minutes
  hideCursor: boolean;
  fullscreen: boolean;
}
```

### settings.updateKiosk

Updates kiosk mode settings.

| Property | Value |
|----------|-------|
| Type | Mutation |
| Auth Required | Yes |

**Input:**
```typescript
{
  kioskEnabled?: boolean;
  homerUrl?: string;
  autoRefreshInterval?: number;
  hideCursor?: boolean;
  fullscreen?: boolean;
}
```

**Response:**
```typescript
{ success: true }
```

## Error Handling

All API errors follow a consistent format:

```typescript
{
  error: {
    code: string;      // TRPC error code
    message: string;   // Human-readable message
    data?: {
      code: string;    // Application-specific code
      httpStatus: number;
    }
  }
}
```

Common error codes include:

| Code | HTTP Status | Description |
|------|-------------|-------------|
| UNAUTHORIZED | 401 | User not authenticated |
| FORBIDDEN | 403 | User lacks permission |
| NOT_FOUND | 404 | Resource not found |
| BAD_REQUEST | 400 | Invalid input data |
| INTERNAL_SERVER_ERROR | 500 | Server error |

## Rate Limiting

API requests are rate-limited to prevent abuse. The current limits are:

| Endpoint Type | Limit |
|---------------|-------|
| Queries | 100 requests/minute |
| Mutations | 30 requests/minute |
| Sync operations | 10 requests/minute |

When rate limited, the API returns a 429 status code with a `Retry-After` header.
