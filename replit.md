# UTECH Student Athlete Scholarship Application

## Overview

A web application for the University of Technology, Jamaica Department of Sport to manage student athlete scholarship applications. The system allows students to submit scholarship applications through a comprehensive form and provides administrators with tools to view, search, and manage submitted applications.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Build Tool**: Vite with custom configuration for Replit environment
- **Routing**: Wouter (lightweight client-side routing)
- **State Management**: TanStack React Query for server state and caching
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **Form Handling**: React Hook Form with Zod validation via @hookform/resolvers

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript (ESM modules)
- **API Design**: RESTful JSON API with `/api` prefix
- **Request Validation**: Zod schemas with zod-validation-error for readable errors

### Data Layer
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Location**: `shared/schema.ts` (shared between client and server)
- **Schema Validation**: drizzle-zod for generating Zod schemas from database tables
- **Migrations**: Drizzle Kit with `db:push` command for schema synchronization

### Project Structure
```
├── client/           # React frontend application
│   └── src/
│       ├── components/ui/  # shadcn/ui components
│       ├── pages/          # Page components
│       ├── hooks/          # Custom React hooks
│       └── lib/            # Utilities and query client
├── server/           # Express backend
│   ├── index.ts      # Server entry point
│   ├── routes.ts     # API route definitions
│   ├── storage.ts    # Database access layer
│   └── db.ts         # Database connection
├── shared/           # Shared code between client/server
│   └── schema.ts     # Drizzle schema definitions
└── migrations/       # Database migrations
```

### Design System
- Material Design principles following `design_guidelines.md`
- Roboto font family via Google Fonts CDN
- Focus on form usability and efficient data entry
- Light mode with CSS custom properties for theming
- Responsive design with mobile-first approach

### Build System
- Development: Vite dev server with HMR proxied through Express
- Production: Vite builds static assets, esbuild bundles server code
- Custom build script at `script/build.ts` handles both client and server bundling

## External Dependencies

### Database
- **PostgreSQL**: Primary database, connection via `DATABASE_URL` environment variable
- **Connection**: node-postgres (pg) Pool with Drizzle ORM

### UI Libraries
- **Radix UI**: Full suite of accessible primitives (dialog, select, checkbox, etc.)
- **Lucide React**: Icon library
- **date-fns**: Date formatting and manipulation
- **embla-carousel-react**: Carousel functionality
- **vaul**: Drawer component
- **cmdk**: Command palette component
- **react-day-picker**: Calendar/date picker

### Development Tools
- **Replit Plugins**: vite-plugin-runtime-error-modal, cartographer, dev-banner
- **TypeScript**: Strict mode enabled with bundler module resolution