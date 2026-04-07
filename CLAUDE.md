# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run setup          # First-time setup: install deps, generate Prisma client, run migrations
npm run dev            # Dev server at http://localhost:3000 (uses Turbopack + node-compat shim)
npm run build          # Production build
npm run lint           # ESLint
npm run test           # Vitest (all tests)
npx vitest run src/path/to/file.test.tsx  # Run a single test file
npm run db:reset       # Reset SQLite database (destructive)
```

All dev/build commands must use the `NODE_OPTIONS='--require ./node-compat.cjs'` shim — this is handled by the npm scripts, so prefer those over calling `next` directly.

The optional `ANTHROPIC_API_KEY` in `.env` enables real AI generation; without it the app uses a `MockLanguageModel` that returns canned responses.

## Architecture

UIGen is a Next.js 15 App Router app where users describe React components and Claude generates them with live preview.

### Request Flow

1. User types a prompt → `ChatProvider` (`src/lib/contexts/chat-context.tsx`) calls `useChat` (Vercel AI SDK)
2. Streams to `POST /api/chat` (`src/app/api/chat/route.ts`) → `streamText` with `claude-haiku-4-5`
3. Claude runs an agentic loop (up to 40 steps, 120s timeout) using two tools:
   - `str_replace_editor` — create/edit/view files in the virtual FS
   - `file_manager` — rename/delete files
4. Tool calls are streamed back and executed by `FileSystemProvider` (`src/lib/contexts/file-system-context.tsx`)
5. `PreviewFrame` (`src/components/preview/PreviewFrame.tsx`) re-renders the iframe on FS changes

### Virtual File System

All generated code lives in memory — nothing is written to disk. `src/lib/file-system.ts` implements a serializable in-memory FS. The AI always writes to `/App.jsx` as the entry point; components live alongside it. The FS state is serialized to JSON and stored in the `Project.data` column for authenticated users.

### JSX Transform / Preview

`src/lib/transform/jsx-transformer.ts` uses `@babel/standalone` in-browser to transpile JSX, builds ESM import maps resolving to `esm.sh` CDN, and injects the result into a sandboxed iframe. No local bundling needed for preview.

### Authentication

JWT sessions via `jose`, stored in httpOnly cookies (7-day expiry). `src/lib/auth.ts` provides session helpers; `src/actions/` contains server actions for sign-up, sign-in, sign-out, and project CRUD. Passwords hashed with bcrypt.

### Database

SQLite via Prisma. Two models: `User` (email + hashed password) and `Project` (JSON-serialized messages + file system state). Projects are saved after each AI response for authenticated users; anonymous sessions are client-side only.

### AI Prompt

`src/lib/prompts/generation.tsx` defines the system prompt. Claude is instructed to use Tailwind CSS, write components as ESM modules, and use the `@/` import alias for cross-file imports.

### Key Path Aliases

`@/*` → `src/*` (configured in `tsconfig.json` and `components.json`)

### UI Stack

- Radix UI primitives wrapped as shadcn/ui components in `src/components/ui/`
- Monaco Editor for code editing (`src/components/editor/`)
- `react-resizable-panels` for the split-pane layout
- Tailwind CSS v4

## Code Style

Use comments sparingly — only for complex logic that isn't self-evident.
