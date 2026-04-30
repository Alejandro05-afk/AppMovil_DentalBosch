# AGENTS.md — DentalBosch

## Project

Expo 54 + Expo Router (file-based routing) + TypeScript + NativeWind v4. FSD slices partially implemented: `shared/ui/` tiene componentes base, `pages/auth/` tiene pantallas de login/registro.

## Commands

| Task | Command |
|---|---|
| Dev server | `npx expo start` |
| Android | `npm run android` |
| iOS | `npm run ios` |
| Web | `npm run web` |
| Lint | `npm run lint` (runs `expo lint`) |
| Reset scaffold | `npm run reset-project` |

**No typecheck, test, or build scripts exist yet.** Do not invent them without asking.

## Architecture — FSD

Path aliases in `tsconfig.json` (all map under `src/`):

| Alias | Maps to | FSD slice |
|---|---|---|
| `@/*` | `src/*` | any |
| `@shared/*` | `src/shared/*` | shared |
| `@entities/*` | `src/entities/*` | entities |
| `@features/*` | `src/features/*` | features |
| `@widgets/*` | `src/widgets/*` | widgets |
| `@pages/*` | `src/pages/*` | pages |

**Important:** `app/` is the **Expo Router entry point**, NOT an FSD slice. Route files live in `app/`; business/UI code lives in `src/` following FSD layering rules (lower layers cannot import from higher layers).

**FSD import rules (enforced by ESLint):**

| Layer | Can import from |
|---|---|
| `@shared/` | Only itself, node_modules |
| `@entities/` | `@shared/` + itself |
| `@features/` | `@shared/`, `@entities/` + itself |
| `@widgets/` | `@shared/`, `@entities/`, `@features/` + itself |
| `@pages/` | All lower layers + itself |
| `app/` | Only `@pages/` and `@shared/ui/` (for theme/layout config) |

`app/` files should **re-export** from `@pages/`, not contain business logic. Page wrappers in `app/` are thin.

Current state: `shared/ui/` has Input, Button, Card, LoadingScreen, ErrorScreen, EmptyState, Divider. `pages/auth/` has LoginPage, ForgotPasswordPage, RegisterPage.

## Routing

Uses **Expo Router** (file-based), NOT React Router. Route files are in `app/`. The root layout is `app/_layout.tsx` with a `(tabs)` group.

When adding routes, always colocate screens in `app/` and delegate UI/business logic to `src/pages/` or lower FSD layers.

## Design System

Maintain these exact colors across all components:

| Token | Value |
|---|---|
| Primary | `#FF4FA3` (pink) |
| Secondary | `#38D6C4` (turquoise) |
| Accent | `#7CF3E6` |
| Dark | `#0F172A` |
| Light-bg | `#F8FAFC` |

**Button styles:** Primary = pink bg/white text; Secondary = turquoise bg/white text; Outline = pink border/text; Ghost = transparent bg/pink text; Danger = red bg.

**NativeWind v4** is installed. Use `className` on React Native components. Custom colors defined in `tailwind.config.js`: `bg-primary`, `text-secondary`, etc.

## Environment

- `.env.example` exists but is empty. Copy to `.env` and populate when backend URL is known.
- Expo reads `.env` automatically (no `dotenv` needed). Prefix client-exposed vars with `EXPO_PUBLIC_`.
- JWT tokens should be stored via `@react-native-async-storage/async-storage` (already installed).

## Linting & Formatting

- ESLint: `eslint-config-expo` flat config at `eslint.config.js` with **FSD boundary rules** (`no-restricted-imports` per layer).
- FSD violations are caught as errors by ESLint. Do not bypass them.
- VSCode auto-fixes on save: `source.fixAll`, `source.organizeImports`, `source.sortMembers`.
- Run `npm run lint` before any commit.

## Backend Integration (not yet implemented)

The app will consume a REST API. When implementing:
- Place API client in `src/shared/api/`
- Organize services by domain (e.g., `src/entities/patient/api/`)
- Use interceptors for JWT auth (access + refresh token flow)
- Global error handling at the shared layer
- All env vars for API base URL must use `EXPO_PUBLIC_` prefix

## Verification Order

1. `npm run lint` — always first
2. Manual smoke test in Expo Go or emulator
3. No test framework exists yet — do not create tests without asking
