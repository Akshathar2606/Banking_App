# Mobile Banking App - Frontend

A React Native mobile banking application built with Expo and TypeScript.

## Technology Stack

- **React Native** - Mobile framework
- **Expo** - Development platform
- **TypeScript** - Type safety
- **Expo Router** - File-based routing

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm start
   ```

3. Run on platforms:
   - **Android**: Press `a` in the terminal or run `npm run android`
   - **iOS**: Press `i` in the terminal or run `npm run ios`
   - **Web**: Press `w` in the terminal or run `npm run web`

## Project Structure

```
mobil_banking/
├── app/                    # Expo Router screens (file-based routing)
│   ├── _layout.tsx        # Root layout component
│   └── index.tsx          # Home/landing screen
├── assets/                # Static assets (images, fonts, icons)
│   └── README.md          # Asset requirements and guidelines
├── components/            # Reusable UI components
│   └── README.md          # Component organization guide
├── constants/             # App-wide constants (colors, config)
│   ├── Colors.ts          # Color palette
│   └── index.ts           # Constants exports
├── hooks/                 # Custom React hooks
│   └── README.md          # Hooks documentation
├── services/              # API services and external integrations
│   └── README.md          # Services structure (backend integration ready)
├── types/                 # TypeScript type definitions
│   └── index.ts           # Global types and interfaces
├── utils/                 # Utility functions and helpers
│   └── README.md          # Utils organization guide
├── node_modules/          # Dependencies (gitignored)
├── .gitignore             # Git ignore rules
├── app.json               # Expo configuration
├── babel.config.js        # Babel configuration for Expo
├── package.json           # Project dependencies and scripts
├── tsconfig.json          # TypeScript compiler configuration
└── README.md              # This file
```

## Folder Descriptions

### `/app` - Expo Router Screens
File-based routing powered by Expo Router. Each file becomes a route:
- `_layout.tsx` - Defines the navigation structure
- `index.tsx` - Root route (/)
- Future screens will be added here (e.g., `login.tsx`, `dashboard.tsx`)

### `/components` - UI Components
Reusable React Native components organized by purpose:
- `common/` - Shared components (buttons, inputs, cards)
- `screens/` - Screen-specific components
- `layout/` - Layout components (headers, navigation)

### `/constants` - Configuration
App-wide constants including colors, dimensions, and configuration values.

### `/hooks` - Custom React Hooks
Custom hooks for data fetching, state management, and UI interactions.

### `/services` - API & External Services
Service layer for backend communication:
- Will integrate with Node.js + Express backend
- Authentication service placeholder
- API client setup

### `/types` - TypeScript Definitions
Global TypeScript interfaces and type definitions.

### `/utils` - Utilities
Helper functions for formatting, validation, and common operations.

### `/assets` - Static Assets
Images, fonts, icons, and other static resources.

## Team Member 1 Responsibilities

- Mobile frontend development
- UI/UX implementation
- Integration with backend APIs (future)
