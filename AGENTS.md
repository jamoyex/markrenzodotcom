# Database safety

Treat every configured remote database URL or credential as live production unless the user explicitly confirms that it is disposable. Never expose `.env` contents or connection credentials.

Before database or integration tests, inspect how the database is selected, including environment auto-loading and module import order. Search database-facing tests and setup for destructive operations. Force a verified, temporary, isolated database before any write, migration, reset, seed, truncate or drop. Hard-stop when isolation cannot be proven. Database inspection is read-only by default; live writes require explicit authorization and a precisely scoped target. A Git backup does not back up database contents.

# Public-facing copy

- Write the portfolio in Mark’s personal voice and the AI guide as a guide speaking about Mark. Keep copy natural, specific and concise; preserve factual dates, roles and achievements.
- Keep research provenance, editorial notes, asset prompts, backend status and knowledge-publication notices out of visitor copy. Store production notes in `docs/` or `branding/`, never `public/`.
- Describe what visitors can do or expect in ordinary language. Use a short demo label where needed; avoid repeated disclaimers or implementation explanations.
- Review expanded drawers, project dialogs, errors, captions, alt text and mobile wrapping as well as the main page. Keep accessibility instructions and required license notices.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
