# Calendar Dashboard

A unified calendar application with Apple Design aesthetics, featuring bidirectional synchronization with Google Calendar, Apple Calendar (CalDAV), and Notion. Includes support for recurring events, push notifications, and print functionality in A3/A4 formats.

## Features

| Feature | Description |
|---------|-------------|
| **Unified Calendar View** | Month, week, and day views with seamless navigation |
| **Multi-Platform Sync** | Bidirectional synchronization with Google, Apple, and Notion calendars |
| **Recurring Events** | Full RRULE support for daily, weekly, monthly, and yearly patterns |
| **Smart Search** | Real-time search with filters by source, date range, and keywords |
| **Push Notifications** | Browser notifications with customizable reminder times |
| **Print Support** | Export calendars to A3 and A4 formats with optimized layouts |
| **Kiosk Mode** | Designed for Raspberry Pi deployment as a wall-mounted display |

## Technology Stack

The application is built using modern web technologies:

| Layer | Technology |
|-------|------------|
| Frontend | React 19, Tailwind CSS 4, shadcn/ui |
| Backend | Express 4, tRPC 11 |
| Database | MySQL/TiDB with Drizzle ORM |
| Authentication | Manus OAuth |
| Build Tool | Vite 7 |

## Quick Start

### Prerequisites

Before installation, ensure you have the following installed:

- Node.js 22.x or later
- pnpm 10.x or later
- MySQL 8.x or TiDB database

### Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/njrty/calendar-dashboard.git
cd calendar-dashboard
pnpm install
```

### Environment Configuration

Create a `.env` file in the project root with the following variables:

```env
DATABASE_URL=mysql://user:password@host:3306/database
JWT_SECRET=your-jwt-secret
VITE_APP_ID=your-app-id
```

### Database Setup

Push the database schema:

```bash
pnpm db:push
```

### Development Server

Start the development server:

```bash
pnpm dev
```

The application will be available at `http://localhost:3000`.

### Production Build

Build for production:

```bash
pnpm build
pnpm start
```

## Project Structure

```
calendar-dashboard/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   │   └── calendar/   # Calendar-specific components
│   │   ├── pages/          # Page components
│   │   ├── contexts/       # React contexts
│   │   ├── hooks/          # Custom hooks
│   │   └── lib/            # Utilities and tRPC client
│   └── public/             # Static assets
├── server/                 # Backend Express/tRPC server
│   ├── services/           # External service integrations
│   │   ├── googleCalendar.ts
│   │   ├── appleCalendar.ts
│   │   ├── notionCalendar.ts
│   │   └── syncEngine.ts
│   ├── db.ts               # Database queries
│   └── routers.ts          # tRPC procedures
├── drizzle/                # Database schema and migrations
├── shared/                 # Shared types and utilities
└── docs/                   # Documentation
```

## Calendar Integrations

### Google Calendar

Google Calendar integration uses OAuth2 for authentication. To configure:

1. Create a project in Google Cloud Console
2. Enable Google Calendar API
3. Create OAuth2 credentials
4. Add credentials in Sync Settings

### Apple Calendar (CalDAV)

Apple Calendar uses CalDAV protocol. To connect:

1. Generate an app-specific password at appleid.apple.com
2. Enter your Apple ID and app-specific password in Sync Settings
3. Select calendars to synchronize

### Notion

Notion integration requires an internal integration token:

1. Create an integration at notion.so/my-integrations
2. Share your calendar database with the integration
3. Enter the integration token and database ID in Sync Settings

## Kiosk Mode

The application includes a kiosk mode optimized for Raspberry Pi deployment. See the [Raspberry Pi Setup Guide](docs/raspberry-pi-setup.md) for detailed instructions.

## API Reference

See [API Documentation](docs/api-reference.md) for detailed endpoint information.

## Testing

Run the test suite:

```bash
pnpm test
```

The project includes 54 tests covering:
- Calendar CRUD operations
- Synchronization engine
- Recurrence rule parsing
- Search and filtering
- Notification system

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting pull requests.

## Support

For issues and feature requests, please use the GitHub issue tracker.
