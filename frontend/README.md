# ZapCoin Frontend - React Native Architecture

This project is structured following industry-standard React Native & Expo conventions for high scalability, maintainability, and clean separation of concerns.

## 📁 Directory Structure Overview

```text
frontend/
├── assets/                  # Static assets (fonts, icons, illustrations)
│   ├── fonts/               # Custom typography files (.ttf, .otf)
│   ├── icons/               # App icons & svg vectors
│   └── images/              # Banners, onboarding graphics, splash screens
├── src/
│   ├── api/                 # Network layer (Axios client, API endpoints)
│   ├── components/          # Reusable UI components
│   │   ├── common/          # Atomic components (Button, Card, Input, Modal)
│   │   └── layout/          # Structural wrappers (ScreenWrapper, Header)
│   ├── constants/           # Design system tokens (Colors, Typography, Spacing)
│   ├── context/             # Global React Context providers (AuthContext, etc.)
│   ├── hooks/               # Custom reusable React hooks (useTheme, useAuth)
│   ├── navigation/          # React Navigation stacks, tabs, and router config
│   ├── screens/             # Application screens organized by feature/domain
│   │   ├── auth/            # Login, SignUp, Onboarding screens
│   │   ├── home/            # Dashboard and overview screens
│   │   ├── wallet/          # Token balance, send/receive screens
│   │   └── profile/         # Settings, security, preferences
│   ├── services/            # Persistent storage, crypto services, device APIs
│   ├── store/               # Global state management (Zustand / Redux Toolkit)
│   ├── types/               # TypeScript interfaces, types, navigation parameters
│   └── utils/               # Utility helper functions (formatters, validators)
├── App.tsx                  # Root application entry point
├── app.json                 # Expo configuration & app metadata
├── package.json             # NPM dependencies and scripts
└── tsconfig.json            # TypeScript path aliases and compiler options
```

## 🚀 Key Architectural Guidelines

1. **Atomic Components (`src/components/common`)**:
   - Keep UI building blocks pure, reusable, and detached from specific business logic.
2. **Feature-driven Screens (`src/screens/`)**:
   - Organize screens based on functional domain (`auth`, `home`, `wallet`, `profile`).
3. **Type-Safe Navigation (`src/types/navigation.ts`)**:
   - Strictly typed route parameters with React Navigation.
4. **Path Aliasing**:
   - Use shortcuts configured in `tsconfig.json` such as `@components/*`, `@screens/*`, `@constants/*`, and `@utils/*` instead of nested relative paths.
