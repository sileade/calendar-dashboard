# Calendar Dashboard TODO

## Core Features
- [x] Database schema for events, calendar connections, and sync settings
- [x] Apple Design styled calendar UI with month/week/day views
- [x] Google Calendar OAuth2 integration for reading/writing events
- [x] Apple Calendar CalDAV integration for bidirectional sync
- [x] Notion API integration for calendar database sync
- [x] Bidirectional synchronization engine across all calendars
- [x] Unified calendar view displaying events from all sources
- [x] Event creation, editing, and deletion with auto-sync
- [x] Synchronization control panel for connecting/disconnecting calendars
- [x] Sync direction settings (one-way or two-way) per calendar
- [x] Print functionality for A3 and A4 formats with optimized layout

## UI Components
- [x] Calendar grid component (month view)
- [x] Week view component
- [x] Day view component
- [x] Event card component
- [x] Event creation/edit modal
- [x] Calendar sidebar with calendar list
- [x] Settings panel for sync configuration
- [x] Print preview modal

## Integrations
- [x] Google Calendar OAuth flow
- [x] Google Calendar event CRUD operations
- [x] Apple Calendar CalDAV authentication
- [x] Apple Calendar event sync
- [x] Notion API authentication
- [x] Notion database event sync

## Sync Engine
- [x] Event normalization across platforms
- [x] Conflict resolution strategy
- [x] Automatic sync on event changes
- [x] Manual sync trigger option
- [x] Sync status indicators

## New Features (v1.1)

### Search & Filtering
- [x] Search bar component with real-time filtering
- [x] Filter by event title/name
- [x] Filter by date range
- [x] Filter by calendar source (Google/Apple/Notion/Local)
- [x] Search results highlighting
- [x] Clear filters button

### Recurring Events
- [x] RRULE support in database schema
- [x] Recurrence pattern UI (daily/weekly/monthly/yearly)
- [x] Custom recurrence intervals
- [x] End date or occurrence count options
- [x] Recurrence exceptions handling (database schema)
- [ ] Edit single occurrence vs entire series (future enhancement)
- [x] Visual indicator for recurring events

### Push Notifications
- [x] Browser notification permission request
- [x] Reminder settings per event (5min/15min/30min/1hr/1day before)
- [x] Default reminder preferences in settings
- [x] Notification center component
- [x] In-app notification center
- [x] Sound/vibration options (preferences)
- [ ] Snooze functionality (future enhancement)


## Documentation & Deployment (v1.2)

### Documentation
- [ ] README.md with project overview
- [ ] API documentation
- [ ] Architecture documentation
- [ ] Installation guide
- [ ] Configuration guide
- [ ] User manual

### GitHub Repository
- [ ] Create repository
- [ ] Push code to GitHub
- [ ] Add .gitignore
- [ ] Add LICENSE file

### Kiosk Mode Adaptation
- [ ] Fullscreen mode support
- [ ] Auto-hide cursor
- [ ] Disable context menu
- [ ] Touch-friendly UI adjustments
- [ ] Auto-refresh functionality
- [ ] Offline mode support

### Raspberry Pi Deployment
- [ ] Raspberry Pi OS setup guide
- [ ] Chromium kiosk configuration
- [ ] Systemd service for auto-start
- [ ] Network configuration
- [ ] Display configuration
- [ ] Ansible playbook for automated setup
- [ ] Terraform configuration (if applicable)


### Homer Integration
- [ ] Three-finger swipe gesture detection
- [ ] Homer URL configuration in settings
- [ ] Swipe right to navigate to Homer dashboard
- [ ] Visual feedback for gesture recognition
- [ ] Configurable gesture sensitivity
