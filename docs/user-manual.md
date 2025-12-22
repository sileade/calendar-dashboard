# User Manual

## Introduction

Calendar Dashboard is a unified calendar application that brings together events from multiple sources into a single, beautifully designed interface. This manual covers all features and provides guidance for daily use.

## Getting Started

### First Login

When you first access Calendar Dashboard, you will be prompted to log in using your Manus account. After successful authentication, you will see the main calendar view with your local calendar ready to use.

### Interface Overview

The application consists of three main areas:

| Area | Description |
|------|-------------|
| **Sidebar** | Contains the mini calendar, calendar list, and quick actions |
| **Header** | Navigation controls, view switcher, and action buttons |
| **Main View** | The calendar grid displaying your events |

## Calendar Views

### Month View

The month view displays a traditional calendar grid showing all days of the current month. Events appear as colored bars within each day cell. Click any day to create a new event, or click an existing event to view or edit it.

### Week View

The week view shows seven days with hourly time slots. This view is ideal for detailed scheduling and seeing how events fit into your day. Events display with their full duration, making it easy to identify free time slots.

### Day View

The day view focuses on a single day with detailed hourly breakdown. This view provides the most detail for busy days and is recommended when you need to manage many events in a short timeframe.

### Switching Views

Use the view switcher buttons in the header to change between Day, Week, and Month views. You can also use keyboard shortcuts:

| Shortcut | Action |
|----------|--------|
| `D` | Switch to Day view |
| `W` | Switch to Week view |
| `M` | Switch to Month view |

## Managing Events

### Creating Events

To create a new event, you have several options:

1. Click the **New Event** button in the sidebar
2. Click on any date in the calendar grid
3. Click and drag to select a time range (Week/Day views)

The event creation dialog will appear with the following fields:

| Field | Description |
|-------|-------------|
| Title | The event name (required) |
| Date & Time | Start and end time |
| All Day | Toggle for full-day events |
| Location | Optional venue or address |
| Description | Additional notes |
| Color | Visual color coding |
| Recurrence | Repeat pattern settings |
| Reminders | Notification times |

### Editing Events

Click on any event to open the edit dialog. Make your changes and click **Save** to update the event. Changes will automatically sync to connected external calendars.

### Deleting Events

Open the event edit dialog and click the **Delete** button. You will be asked to confirm the deletion. For recurring events, you can choose to delete only this occurrence or all future occurrences.

## Recurring Events

### Setting Up Recurrence

When creating or editing an event, click on **Repeat** to configure recurrence. The following patterns are available:

| Pattern | Description |
|---------|-------------|
| Daily | Repeats every day or every N days |
| Weekly | Repeats on selected days of the week |
| Monthly | Repeats on the same date each month |
| Yearly | Repeats on the same date each year |

### Recurrence Options

For each pattern, you can configure:

**Interval**: How often the event repeats (e.g., every 2 weeks)

**End Condition**: When the recurrence stops:
- Never (continues indefinitely)
- After N occurrences
- On a specific date

**Weekly Days**: For weekly recurrence, select which days of the week the event occurs.

### Visual Indicators

Recurring events display a repeat icon (↻) in the calendar view. The recurrence description appears in the event details.

## Search and Filtering

### Quick Search

Use the search bar at the top of the calendar to find events. Search works across:
- Event titles
- Descriptions
- Locations

Results appear in a dropdown as you type, with matching text highlighted.

### Advanced Filters

Click the **Filters** button to access advanced filtering options:

| Filter | Description |
|--------|-------------|
| Calendar Source | Show/hide events from specific calendars |
| Date Range | Filter events within a date range |

Active filters are indicated by a badge on the Filters button. Click **Clear** to remove all filters.

## Calendar Connections

### Connecting Google Calendar

To sync with Google Calendar:

1. Click **Sync Settings** in the sidebar
2. Click **Connect** next to Google Calendar
3. Sign in with your Google account
4. Grant calendar access permissions
5. Select sync direction (pull, push, or bidirectional)

### Connecting Apple Calendar

Apple Calendar uses CalDAV protocol:

1. Go to appleid.apple.com and generate an app-specific password
2. Click **Sync Settings** in the sidebar
3. Click **Connect** next to Apple Calendar
4. Enter your Apple ID email
5. Enter the app-specific password
6. Select calendars to sync

### Connecting Notion

To sync with a Notion calendar database:

1. Create an integration at notion.so/my-integrations
2. Share your calendar database with the integration
3. Click **Sync Settings** in the sidebar
4. Click **Connect** next to Notion
5. Enter your integration token
6. Enter the database ID

### Sync Directions

Each connection can be configured with a sync direction:

| Direction | Description |
|-----------|-------------|
| Pull | Import events from external calendar only |
| Push | Export local events to external calendar only |
| Bidirectional | Full two-way synchronization |

### Manual Sync

Click the refresh button (↻) in the header to trigger immediate synchronization with all connected calendars.

## Notifications and Reminders

### Setting Reminders

When creating or editing an event, click **Add Reminder** to set notification times. Available options include:

- At time of event
- 5, 10, 15, 30 minutes before
- 1 hour, 2 hours before
- 1 day, 2 days before

You can add multiple reminders to a single event.

### Browser Notifications

To receive push notifications:

1. Click the bell icon in the header
2. Click **Enable Notifications**
3. Allow notifications when prompted by your browser

### Notification Center

The bell icon shows a badge with the count of unread notifications. Click it to open the notification center where you can:

- View all notifications
- Mark notifications as read
- Access notification preferences

### Notification Preferences

In the notification center, click the settings icon to configure:

| Setting | Description |
|---------|-------------|
| Push Notifications | Enable/disable browser notifications |
| Sound | Play sound for notifications |
| Default Reminders | Set default reminder times for new events |

## Printing

### Print Preview

Click the printer icon in the header to open the print dialog. You can configure:

| Option | Description |
|--------|-------------|
| Format | A3 or A4 paper size |
| Orientation | Portrait or Landscape |
| Date Range | Which dates to include |
| Include | Events, notes, or both |

### Print Layout

The print layout is optimized for readability with:
- Clear date headers
- Event times and titles
- Color-coded event categories
- Page numbers for multi-page prints

## Kiosk Mode

### Enabling Kiosk Mode

Kiosk mode is designed for wall-mounted displays. To enable:

1. Open Settings
2. Navigate to Kiosk Settings
3. Enable Kiosk Mode
4. Configure display options

### Kiosk Features

| Feature | Description |
|---------|-------------|
| Fullscreen | Removes browser chrome |
| Auto-refresh | Periodically updates the display |
| Hidden Cursor | Hides mouse cursor after inactivity |
| Homer Integration | Swipe to access Homer dashboard |

### Homer Integration

When Homer URL is configured, swipe right with three fingers to navigate to your Homer dashboard. This allows quick access to your home server control panel.

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `N` | Create new event |
| `T` | Go to today |
| `←` | Previous period |
| `→` | Next period |
| `D` | Day view |
| `W` | Week view |
| `M` | Month view |
| `/` | Focus search |
| `Esc` | Close dialog |

## Troubleshooting

### Events Not Syncing

If events are not synchronizing:

1. Check that the connection is active in Sync Settings
2. Verify your credentials are still valid
3. Try disconnecting and reconnecting the calendar
4. Check your internet connection

### Notifications Not Working

If you're not receiving notifications:

1. Ensure browser notifications are enabled
2. Check that notifications are allowed for this site
3. Verify notification preferences in the app
4. Try refreshing the page

### Display Issues

If the calendar doesn't display correctly:

1. Try refreshing the page
2. Clear your browser cache
3. Ensure JavaScript is enabled
4. Try a different browser

## Support

For additional help or to report issues, please visit our GitHub repository or contact support through the application settings.
