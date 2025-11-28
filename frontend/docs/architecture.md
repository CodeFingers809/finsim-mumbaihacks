# Trading Platform MVP Architecture Plan

## Monorepo Tooling
- **Package Manager**: pnpm (workspace-based)
- **Task Runner**: Turborepo for parallel app/package builds and shared scripts
- **Workspaces**: `apps/*` for runnable apps, `packages/*` for shared config/utilities

## Apps & Packages
- `apps/trader`: Next.js 14 App Router application (primary UI + API)
- `packages/config`: Shared Tailwind + ESLint + TypeScript base configs
- `packages/ui`: Theme tokens, shadcn/ui registry, shared primitives (buttons, cards, layout wrappers)
- `packages/types`: Shared TypeScript types/interfaces for API + DB objects

## Core Libraries
- UI: Tailwind CSS + shadcn/ui (dark theme presets)
- State: Zustand for local client stores (watchlists, strategy builder)
- Data: TanStack Query (React Query) for API fetching/caching, server actions for critical flows
- Auth: Clerk (middleware + server helpers)
- DB: MongoDB via Mongoose (connection helper + models per spec)
- Charts: TradingView Lightweight Charts (dynamic import for client-side rendering)
- Notifications: Sonner toasts

## API & Data Flow
- App Router route handlers inside `src/app/api/*`
- Wrapper `withAuth` utility to enforce Clerk auth + role checks
- Service layer in `src/lib/services` for watchlists, strategies, positions, backtests (decouple from handlers)
- External data clients (Yahoo Finance/Finnhub) inside `src/lib/api-clients`
- Caching via lightweight in-memory map + revalidation tags

## Pages/Layouts
- `src/app/(auth)` for sign-in/up (Clerk components)
- `src/app/(dashboard)` for protected pages: research, stock, strategy, backtesting, orders, positions
- Shared `DashboardShell` component with sidebar + top nav + responsive layout
- Provider tree under `src/app/providers.tsx` wiring Clerk, QueryClient, Theme, Zustand hydration

## Styling & Theme
- Global dark theme tokens inside `packages/ui/tokens.ts`
- Tailwind config extends colors, fonts, spacing to match spec
- Layout uses CSS grid/flex for multi-column watchlist/research panel

## Database Models (Mongoose)
- `UserData`, `Watchlist`, `Strategy`, `Position`, `BacktestResult`
- Indexes on `userId` for faster lookups, TTL on stale backtests (optional)
- Shared TypeScript interfaces exported via `packages/types`

## Testing & Quality
- ESLint + Prettier via shared config
- Zod schemas for payload validation in API routes
- Basic unit tests (Vitest) planned for services (stretch goal) – placeholder script

## Deployment Readiness
- Environment variables template (`.env.example`)
- Production build via `turbo build`
- App hosted on Vercel; MongoDB Atlas + Clerk config documented in README
