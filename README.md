# Service Bus Explorer Web

A modern web-based Azure Service Bus Explorer built with React and NestJS. This application provides a comprehensive interface for managing Azure Service Bus queues, topics, subscriptions, and messages.

## Features

- **Connection Management**: Connect to multiple Azure Service Bus namespaces using connection strings or Entra ID authentication
- **Queue Management**: Create, view, update, and delete queues
- **Topic & Subscription Management**: Full CRUD operations for topics and subscriptions
- **Rule Management**: Create and manage subscription rules with SQL filters
- **Message Operations**:
  - Send messages with custom properties
  - Peek messages (non-destructive)
  - Receive messages
  - View and manage dead-letter queues
  - Resubmit messages from DLQ
- **Real-time Updates**: WebSocket-based message listener for live message monitoring
- **Dark Mode**: Full dark mode support

## Tech Stack

### Backend
- NestJS 10.x
- @azure/service-bus
- Socket.IO for WebSocket
- SQLite for local connection storage
- Swagger for API documentation

### Frontend
- React 18 with Vite
- TanStack React Query
- Zustand for state management
- Tailwind CSS + shadcn/ui components
- Socket.IO client

## Prerequisites

- Node.js 18+
- pnpm 8+

## Getting Started

1. **Clone and install dependencies**:
   ```bash
   cd service-bus-explorer-web
   pnpm install
   ```

2. **Configure environment**:
   ```bash
   # Backend
   cp apps/api/.env.example apps/api/.env

   # Frontend (optional)
   cp apps/web/.env.example apps/web/.env
   ```

3. **Start development servers**:
   ```bash
   pnpm dev
   ```

   This will start:
   - API server at http://localhost:3001
   - Web app at http://localhost:5173

4. **Build for production**:
   ```bash
   pnpm build
   ```

## Project Structure

```
service-bus-explorer-web/
├── apps/
│   ├── api/                 # NestJS Backend
│   │   └── src/
│   │       ├── modules/
│   │       │   ├── connections/    # Connection management
│   │       │   ├── service-bus/    # Queues, Topics, Subscriptions, Rules
│   │       │   ├── event-hubs/     # Event Hubs (future)
│   │       │   └── websocket/      # Real-time gateway
│   │       └── main.ts
│   │
│   └── web/                 # React Frontend
│       └── src/
│           ├── components/
│           │   ├── common/         # Reusable UI components
│           │   ├── connections/    # Connection dialogs
│           │   ├── layout/         # App layout, sidebar
│           │   └── messages/       # Message viewer, editor
│           ├── hooks/              # React hooks
│           ├── pages/              # Page components
│           ├── services/           # API client
│           └── store/              # Zustand stores
│
└── packages/
    └── shared/              # Shared TypeScript types
```

## API Documentation

When running the API server, Swagger documentation is available at:
http://localhost:3001/api/docs

## License

MIT

## Attribution

This project is a Node.js adaptation inspired by the original **Service Bus Explorer** project:

- Original project: https://github.com/paolosalvatori/ServiceBusExplorer
- Copyright and license for the original work remain with the original authors.

This repository includes independent implementation and modifications for a web-based Node.js stack.
See [LICENSE](./LICENSE) for this project’s license terms.
