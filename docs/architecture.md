# Architecture Documentation

## Overview

Calendar Dashboard follows a modern full-stack architecture with clear separation between frontend and backend layers. The application uses tRPC for type-safe API communication, ensuring end-to-end type safety from database to UI.

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client (Browser)                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │   React 19  │  │ Tailwind 4  │  │      shadcn/ui          │  │
│  └──────┬──────┘  └─────────────┘  └─────────────────────────┘  │
│         │                                                        │
│  ┌──────▼──────────────────────────────────────────────────┐    │
│  │                    tRPC Client                           │    │
│  │              (Type-safe API calls)                       │    │
│  └──────────────────────────┬───────────────────────────────┘    │
└─────────────────────────────┼────────────────────────────────────┘
                              │ HTTP/WebSocket
┌─────────────────────────────▼────────────────────────────────────┐
│                        Server (Node.js)                          │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    Express + tRPC                         │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────────────┐  │   │
│  │  │   Auth     │  │  Calendar  │  │   Notifications    │  │   │
│  │  │  Router    │  │   Router   │  │      Router        │  │   │
│  │  └────────────┘  └────────────┘  └────────────────────┘  │   │
│  └──────────────────────────┬───────────────────────────────┘   │
│                             │                                    │
│  ┌──────────────────────────▼───────────────────────────────┐   │
│  │                   Sync Engine                             │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────────────┐  │   │
│  │  │   Google   │  │   Apple    │  │      Notion        │  │   │
│  │  │  Calendar  │  │  Calendar  │  │    Calendar        │  │   │
│  │  └────────────┘  └────────────┘  └────────────────────┘  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                             │                                    │
│  ┌──────────────────────────▼───────────────────────────────┐   │
│  │                   Drizzle ORM                             │   │
│  └──────────────────────────┬───────────────────────────────┘   │
└─────────────────────────────┼────────────────────────────────────┘
                              │
┌─────────────────────────────▼────────────────────────────────────┐
│                      MySQL / TiDB                                │
└──────────────────────────────────────────────────────────────────┘
```

## Data Flow

### Event Creation Flow

The following sequence describes how events are created and synchronized:

1. User creates an event through the UI
2. Frontend calls `trpc.events.create.useMutation()`
3. Server validates input using Zod schemas
4. Event is stored in the local database
5. Sync engine pushes event to connected external calendars
6. External calendar IDs are stored for future synchronization

### Synchronization Flow

The synchronization engine operates in three modes:

| Mode | Direction | Description |
|------|-----------|-------------|
| Pull | External → Local | Imports events from external calendars |
| Push | Local → External | Exports local events to external calendars |
| Bidirectional | Both | Full two-way synchronization |

The sync process follows these steps:

1. Fetch events from external calendar within date range
2. Compare with local events using external IDs
3. Apply conflict resolution (last-modified wins)
4. Update local database with changes
5. Push local changes to external calendar

## Database Schema

### Core Tables

The database consists of four primary tables:

**users** - Stores authenticated user information

| Column | Type | Description |
|--------|------|-------------|
| id | INT | Primary key |
| openId | VARCHAR(64) | OAuth identifier |
| name | TEXT | Display name |
| email | VARCHAR(320) | Email address |
| role | ENUM | User role (user/admin) |

**events** - Stores calendar events

| Column | Type | Description |
|--------|------|-------------|
| id | INT | Primary key |
| userId | INT | Owner reference |
| title | VARCHAR(255) | Event title |
| startTime | BIGINT | Start timestamp (UTC) |
| endTime | BIGINT | End timestamp (UTC) |
| recurrenceRule | TEXT | RRULE string |
| source | VARCHAR(20) | Calendar source |

**calendar_connections** - External calendar connections

| Column | Type | Description |
|--------|------|-------------|
| id | INT | Primary key |
| userId | INT | Owner reference |
| provider | VARCHAR(20) | google/apple/notion |
| syncDirection | VARCHAR(20) | pull/push/bidirectional |
| isActive | BOOLEAN | Connection status |

**event_reminders** - Notification reminders

| Column | Type | Description |
|--------|------|-------------|
| id | INT | Primary key |
| eventId | INT | Event reference |
| reminderTime | INT | Minutes before event |
| notificationSent | BOOLEAN | Delivery status |

## Component Architecture

### Frontend Components

The frontend follows a hierarchical component structure:

```
App
├── ThemeProvider
├── TooltipProvider
├── Toaster
└── Router
    └── Home
        ├── CalendarSidebar
        │   └── MiniCalendar
        ├── SearchFilter
        ├── NotificationCenter
        ├── CalendarGrid (Month View)
        ├── WeekView
        ├── DayView
        ├── EventModal
        │   ├── RecurrenceSelector
        │   └── ReminderSelector
        ├── SyncSettingsModal
        └── PrintModal
```

### State Management

The application uses React Query (via tRPC) for server state management:

- **Server State**: Managed by tRPC queries and mutations with automatic caching
- **UI State**: Managed by React useState for local component state
- **Theme State**: Managed by ThemeContext for dark/light mode

## Security Considerations

### Authentication

Authentication is handled through Manus OAuth with JWT session cookies. Protected routes require valid session tokens.

### Data Protection

- All API endpoints validate user ownership before data access
- External calendar credentials are encrypted at rest
- HTTPS is enforced in production

### Input Validation

All inputs are validated using Zod schemas at the tRPC procedure level, preventing injection attacks and ensuring data integrity.

## Performance Optimizations

### Frontend

- React Query caching reduces redundant API calls
- Virtualized lists for large event collections
- Lazy loading of modal components
- Optimistic updates for instant UI feedback

### Backend

- Database indexes on frequently queried columns
- Connection pooling for database access
- Batch operations for sync engine
- Rate limiting on external API calls

## Scalability

The architecture supports horizontal scaling:

- Stateless server design allows multiple instances
- Database can be scaled independently
- External calendar sync can be offloaded to background workers
- CDN deployment for static assets
