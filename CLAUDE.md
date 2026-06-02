# CLAUDE.md

## What This Project Is
SchulSaniApp — a self-hosted mobile app for school paramedic teams (Schulsanitätsdienst) in Germany. Each school runs their own instance on their own server. The app handles missions, duty rosters, absence requests, and news.

## Legacy Reference
The old codebase is at ~/Projects/SchulSaniApp
Study it for UX/design/screen flow reference ONLY. Never copy code from it directly. It has hardcoded names, in-memory storage, and no design system — all of which we are fixing.

## Tech Stack
- **Monorepo**: pnpm workspaces
- **Mobile**: Expo (React Native), TypeScript, Zustand, Expo Router
- **Backend**: Hono, TypeScript, Zod
- **Database**: Drizzle ORM + PostgreSQL (self-hosted)
- **Auth**: IServ credential POST (credentials never leave school infrastructure)
- **Push**: Expo Notifications + EAS

## Folder Structure


/
├── apps/
│   ├── mobile/
│   └── api/
├── packages/
│   ├── db/        # Drizzle schema + migrations
│   └── shared/    # Shared types + Zod schemas
├── docker-compose.yml
├── pnpm-workspace.yaml
└── package.json


## Common Commands
```bash
pnpm install           # Install all dependencies
pnpm run build         # Build all packages
pnpm run typecheck     # TypeScript check across monorepo
docker compose up -d   # Start backend + database


Roles

Six built-in roles (never hardcoded per username):

	•	sanitaeter — respond to missions, view duty, submit LOA, view news
	•	sanitaeter_leitung — all above + create/close missions, manage duty, approve LOA, post news
	•	sanitaeter_leitung_admin — all above + view/manage users, assign custom roles
	•	teacher — create/close missions, approve LOA, post + moderate news, view users (no duty.manage)
	•	admin — all above + news.manage, users.manage, roles.assign
	•	owner — all above + roles.create

Roles are ALWAYS stored in the database. Never hardcode roles per username.

Critical Rules — Never Break These

	•	NEVER hardcode real student or staff names anywhere
	•	NEVER use in-memory storage — everything goes in the database
	•	NEVER use AsyncStorage for JWT — always expo-secure-store
	•	NEVER log the request body of POST /auth/login
	•	NEVER commit .env files — only .env.example with placeholder values
	•	NEVER use inline styles — always StyleSheet.create with theme tokens
	•	NEVER use raw strings in JSX — always go through the translation system
	•	NEVER use any in TypeScript — strict mode always
	•	Always use pnpm, never npm or yarn

Design System

All design tokens are in apps/mobile/theme.ts. Use them everywhere.

	•	Dark theme default + white theme + 3 custom themes
	•	Cards: surface background, border, radius.md, spacing.md padding
	•	Status badges as colored pills — never plain text
	•	Skeleton loaders for loading states — never centered spinners
	•	Empty states: icon + heading + subtext — never blank screens
	•	Active missions: red banner pinned to top of missions tab
	•	Safe area insets everywhere via react-native-safe-area-context

Security

	•	JWT secret minimum 32 characters
	•	JWT expires after 7 days
	•	Rate limit /auth/login — max 10 requests per IP per minute
	•	Security headers on every API response
	•	Never return tokens or credentials in API responses

Translations

	•	Two files: apps/mobile/i18n/de.ts (default) and apps/mobile/i18n/en.ts
	•	useTranslation() hook reads language from Zustand (persisted in SecureStore)
	•	Language toggle in profile tab
	•	Never use raw strings in JSX

TypeScript

	•	Strict mode, no any
	•	Zod validation on every API input
	•	All API responses fully typed end-to-end
	•	Error boundaries on all tab screens


## Behavior

- When you need to edit a file, always execute the tool call — never just show the raw JSON output.
- If a stop hook fires mid-task, immediately continue working without asking for confirmation.
- Never output tool call JSON as text. Always execute it.

Tool Calls — No Raw Output
  
  When you need to do anything (read a file, edit, run a command), always use the tool. Not text. Not JSON. The tool.

  Always do this:
  - Read a file instead of describing what's in it
  - Edit a file instead of showing the raw diff 
  - Bash instead of pasting command output 
  
  Never do this:
  - Copy terminal output into your response as text
  - Print tool-call JSON in a code block
  - Say "let me show you what I found" instead of reading it
  - Explain what a tool returned — just show it by using the tool
  
  If you catch yourself doing it wrong: Stop immediately. Use the tool. No excuses, no explanations.


## Memory & Notes
Save important decisions, architecture notes, and TODOs to:
~/Obsidian/Brain/Claude/SchulSaniApp/

- Architecture decisions → architecture.md
- TODOs → todos.md
- Bugs found → bugs.md
- Session summaries → sessions/YYYY-MM-DD.md
