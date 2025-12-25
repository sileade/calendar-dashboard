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
- [x] README.md with project overview
- [x] API documentation
- [x] Architecture documentation
- [x] Installation guide
- [x] Configuration guide
- [x] User manual

### GitHub Repository
- [x] Create repository
- [x] Push code to GitHub
- [x] Add .gitignore
- [x] Add LICENSE file

### Kiosk Mode Adaptation
- [x] Fullscreen mode support
- [x] Auto-hide cursor
- [x] Disable context menu
- [x] Touch-friendly UI adjustments
- [x] Auto-refresh functionality
- [ ] Offline mode support (future enhancement)

### Raspberry Pi Deployment
- [x] Raspberry Pi OS setup guide
- [x] Chromium kiosk configuration
- [x] Systemd service for auto-start
- [x] Network configuration
- [x] Display configuration
- [x] Ansible playbook for automated setup
- [x] Terraform configuration


### Homer Integration
- [x] Three-finger swipe gesture detection
- [x] Homer URL configuration in settings
- [x] Swipe right to navigate to Homer dashboard
- [x] Visual feedback for gesture recognition
- [x] Configurable gesture sensitivity


## Widgets (v1.3)

### SPb Public Transport Widget
- [x] Research SPb transport API (Портал открытых данных СПб)
- [x] Create transport widget component
- [x] Display nearest stops and arrival times
- [x] Support for metro, bus, tram, trolleybus
- [x] Configurable favorite stops
- [x] Real-time updates

### Yandex Traffic Widget
- [x] Research Yandex Traffic API/embed options
- [x] Create traffic widget component
- [x] Display traffic score (1-10 points)
- [x] Show traffic map embed
- [x] Color-coded traffic indicators
- [x] Configurable city/region

### Widget Integration
- [x] Add widgets panel to dashboard
- [x] Widget visibility toggle
- [x] Widget position configuration
- [x] Responsive layout for widgets


## Enhanced Features (v1.4)

### Real API Integration
- [x] Connect SPb transport API (transport.orgp.spb.ru)
- [x] Connect Yandex Traffic API with real data
- [x] Add API key configuration in settings
- [x] Error handling for API failures
- [x] Rate limiting and caching

### Geolocation
- [x] GPS-based location detection
- [x] Auto-detect nearest stops
- [x] Location permission handling
- [x] Fallback to manual location input
- [x] Save preferred location

### Weather Widget
- [x] Weather API integration (OpenWeatherMap)
- [x] Current weather display
- [x] 5-day forecast
- [x] Weather icons and animations
- [x] Temperature units toggle (C/F)

### Server Deployment for Kiosks
- [x] Docker containerization
- [x] Docker Compose with Traefik
- [x] Multi-tablet broadcasting support
- [x] Centralized configuration
- [x] Health monitoring endpoint
- [x] Auto-restart on failure

### Adaptive Theme
- [x] Ambient light sensor integration
- [x] Time-based theme switching
- [x] Configurable sunrise/sunset times
- [x] Smooth theme transitions
- [x] Theme override option

### Screen Resolution Adaptation
- [x] Responsive breakpoints for tablets
- [x] Font scaling based on screen size
- [x] Touch-friendly UI for different sizes
- [x] Orientation support (portrait/landscape)
- [x] DPI-aware rendering


## UI Improvements (v1.5)

### Traffic Widget Relocation
- [x] Move traffic widget to sidebar under mini-calendar
- [x] Make traffic widget always visible
- [x] Compact traffic widget design for sidebar


### Weather Widget in Sidebar
- [x] Create compact weather widget for sidebar
- [x] Display current temperature and conditions
- [x] Add weather icon
- [x] Integrate under traffic widget in sidebar
