# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
npm run dev          # Next.js dev server with Turbopack
npm run dev:daemon   # Background server, logs to logs.txt

# Build & Production
npm run build
npm run start

# Testing & Linting
npm test             # Vitest (run a single test: npx vitest run <path>)
npm run lint         # ESLint via next lint

# Database
npm run setup        # Full setup: install + prisma generate + migrate dev
npm run db:reset     # Reset database (destructive)
npx prisma studio    # Database GUI
```

Requires `ANTHROPIC_API_KEY` in `.env` for real AI generation; without it a `MockLanguageModel` is used automatically.

## Architecture

**UIGen** is an AI-powered React component generator with live preview. The user describes a component in chat, Claude generates it via tool calls that manipulate an in-memory virtual file system, and the result renders in a sandboxed iframe.

### Request Flow

1. User submits prompt → `ChatInterface` → `POST /api/chat`
2. `/api/chat` calls Claude (Haiku 4.5) via Vercel AI SDK with streaming + tool calls
3. Claude uses `str_replace_editor` (create/view/edit files) and `file_manager` (rename/delete) tools defined in `src/lib/tools/`
4. Tool calls update the **VirtualFileSystem** (in-memory `Map<string, FileNode>` tree) via `FileSystemContext`
5. `PreviewFrame` detects file changes, uses Babel Standalone (`src/lib/transform/jsx-transformer.ts`) to transpile JSX client-side, injects an ES module ImportMap, and renders in a sandboxed iframe

### Key Contexts

- **`FileSystemContext`** (`src/lib/contexts/FileSystemContext.tsx`): Owns VFS state. Provides file CRUD, serialization, and a refresh trigger for the preview.
- **`ChatContext`** (`src/lib/contexts/ChatContext.tsx`): Wraps `useChat` from `@ai-sdk/react`, manages chat history and streaming state.

### Panel Layout

`src/app/main-content.tsx` uses `react-resizable-panels` to arrange three panes:

- Left: `ChatInterface` (message list + input)
- Center: `PreviewFrame` (iframe live preview)
- Right: `CodeEditor` (Monaco) + `FileTree`

### Authentication

JWT sessions (jose, 7-day expiry) with bcrypt password hashing. Server actions in `src/actions/` handle signUp/signIn/signOut. Middleware at `src/middleware.ts` protects API routes. Anonymous users get ephemeral sessions; authenticated users get projects persisted in SQLite via Prisma.

### Database

Prisma + SQLite. Schema: `User` (id, email, password, projects) → `Project` (id, name, messages JSON, filesystem JSON). Migrations in `prisma/migrations/`.

### System Prompt

The generation prompt in `src/lib/prompts/` instructs Claude on how to build components using the available file tools. Modifying it changes AI behavior significantly.

### Node Compatibility

`node-compat.cjs` is required at startup (via `NODE_OPTIONS`) to polyfill Web Storage API issues under Node.js 25+.
