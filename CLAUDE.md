# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

**Start development server:**

```bash
npm start
# or
ng serve
```

Development server runs on <http://localhost:4200> with automatic reload.

**Build application:**

```bash
npm run build
# or
ng build
```

Production build outputs to `dist/frontend/` directory.

**Watch mode (development build with file watching):**

```bash
npm run watch
# or
ng build --watch --configuration development
```

**Run tests:**

```bash
npm test
# or
ng test
```

Uses Karma test runner with Jasmine framework.

**Generate components/services:**

```bash
ng generate component component-name
ng generate service service-name
ng generate guard guard-name
```

## Application Architecture

This is an Angular 19 application for a WhatsApp business communication platform with the following key architectural patterns:

### State Management

- **NgRx** is used extensively for state management across all major features
- Each feature has its own NgRx store slice with actions, effects, reducers, and selectors
- Store configuration in `src/app/app.config.ts` includes reducers for: auth, userManagement, contacts, messages, conversations, socket, notes, etc.

### Feature Structure

The application follows a modular architecture with clear separation:

**Core Module (`src/app/core/`):**

- `api/` - HTTP interceptors and API service
- `guards/` - Route guards (AuthGuard)
- `models/` - TypeScript interfaces and types
- `services/` - Business logic services with NgRx integration
- `env/` - Environment configuration

**Features (`src/app/features/`):**

- `auth/` - Authentication pages and components
- `home/` - Main dashboard with nested routes
- `chatbot/` - Chatbot builder functionality  
- `landing/` - Landing page components

**Shared (`src/app/shared/`):**

- Reusable components used across features
- Common utilities and pipes

### Key Technologies

- **Angular 19** with standalone components
- **Angular Material** for UI components (azure-blue theme)
- **NgRx** for state management
- **TailwindCSS** for styling (dark mode enabled)
- **PrimeNG** for additional UI components
- **Socket.IO** for real-time communication
- **RxJS** for reactive programming

### Routing Structure

- Main routes defined in `src/app/app.routes.ts`
- Feature-based routing with lazy loading
- Protected routes using AuthGuard
- Dashboard routes nested under `/dashboard` path

### State Management Pattern

Each feature follows consistent NgRx patterns:

- Actions define events and their payloads
- Effects handle side effects (API calls, socket events)  
- Reducers manage state transitions
- Selectors provide derived state
- Services act as facades between components and NgRx

### Socket.IO Integration

- Real-time communication configured in environment
- Socket service handles connection management
- NgRx effects manage socket events and state updates

### Environment Configuration

Environment settings in `src/app/core/env/environment.ts` include:

- API URL configuration  
- Socket.IO connection settings
- Production/development flags

## Important Development Notes

**NgRx Usage:**

- Always use selectors to access store state
- Dispatch actions through services, not directly from components
- Effects should handle all side effects (API calls, navigation, etc.)

**Component Architecture:**

- Follow Angular standalone component pattern
- Use OnPush change detection where possible
- Implement reactive forms with proper validation

**Styling:**

- TailwindCSS is configured with Angular Material
- Dark mode support available via 'class' strategy
- Component-specific styles in .css files alongside components

**Testing:**

- Karma + Jasmine setup for unit tests
- Test files follow `.spec.ts` naming convention
