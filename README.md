# SnippetShelf

A frontend-only developer snippet library built with Vite, React, TypeScript, Tailwind CSS, and local Lucide icons. No backend, API keys, or environment variables.

## Run

Requires Node.js 22.12+ (22.x), 24.x, or 26+ and npm. Verified with Node.js 24.

```sh
npm install
npm run dev
```

```sh
npm run typecheck
npm run lint
npm test
npm run test:coverage
npm run build
npx playwright install chromium
npm run test:e2e
npm run preview
```

## Pull request previews

Same-repository pull requests build and publish a digest-pinned `linux/amd64`
image through `.github/workflows/preview.yml`. The trusted workflow deploys that
digest to the preview platform and comments a link at `/pr-<number>/`; fork pull
requests do not receive package-write or platform credentials.

Before enabling deployment, create GitHub Environment `preview-platform` and add
`PREVIEW_PLATFORM_TOKEN` as its secret. Set the SnippetShelf GHCR package
visibility to **Public** so the platform can pull its immutable digest. The
trusted workflow calls the configured platform endpoint at
`http://13.63.54.222`; no platform token is present in the PR build workflow.

## Included

- 67 realistic snippets across 10 language/domain files and eight collections.
- Search title, description, code, notes, language, collection name, and tags; compose collection/language/tag/favorite/recent filters and sort controls.
- Resizable three-panel desktop workspace (pointer and keyboard), distraction-free reading mode, mobile library/detail navigation, dark/light/system theme.
- Create, edit, delete with confirmation, favorite, copy, usage tracking, related snippets.
- Create and edit collection names, descriptions, and colors. Names are trimmed, nonempty, and unique case-insensitively; colors use six-digit hex values. System collections are protected. Delete only empty collections, retaining at least one editable collection.
- Settings for code size, line wrapping, line numbers, motion, theme, avatar circle/text colors, reset, and clear.
- Command palette (`Ctrl/Cmd+K`), `/` search, `N` create, `E` edit, `F` favorite, `C` copy. Arrow keys navigate palette and focused list cards. Escape closes overlays; dirty editor asks before discarding.
- Highlighted code editing/viewing and safe Markdown notes with preview.
- Full-library or current-results JSON export; validated import preview with atomic replacement or merge by file picker or drag/drop. Merge preserves existing IDs and preferences while adding new records.

## Structure

- `src/data/snippets.*.ts`: separate, editable hardcoded seed arrays. Add a record using `seed()` with a unique stable ID, supported language, and existing collection ID.
- `src/types`: domain types.
- `src/lib`: selectors, validation, snapshot import/export, and persistence adapter.
- `src/context/AppContext.tsx`: persisted React domain state and actions.
- `src/components`: shared accessible modal, error boundary, header, resizable workspace, code renderer/editor, Markdown, and notifications.
- `src/features/library`: navigation, filtering, results, and selection.
- `src/features/snippets`: detail/reading view and validated editor.
- `src/features/collections`: collection manager.
- `src/features/settings`: preferences, import/export, reset, and clear.
- `src/features/commands`: command palette and shortcut help.
- `src/App.tsx`: feature orchestration and transient workspace state.
- `src/styles.css`: Tailwind entry point and scoped responsive component/theme styles.
- `tests`: unit, repository, rendering security, and React Testing Library workflows/context actions.
- `tests/e2e`: Playwright production-build journeys, responsive checks, and axe accessibility checks.

## Storage and backup

First launch clones source-controlled seed records into IndexedDB. Existing browser data is authoritative until **Settings → Reset demo data**, which restores demo snippets and collections while keeping preferences. Deleting every record leaves a persistent empty library; it does not silently reseed. **Clear local data** empties snippets and restores default collections and preferences.

The repository validates and persists the entire small workspace in a single IndexedDB transaction, including collection edits and import replacement. A serialized write queue prevents lost updates within this tab. If IndexedDB cannot be opened at startup, the app uses session memory and displays a warning; memory-only edits are lost on reload, so export a JSON backup to keep them. Once storage opens, read or write failures reject the operation rather than reporting an unsaved success. Failed writes leave both the current in-memory library and the saved library unchanged. Failed initialization and corrupt stored records never silently overwrite existing data with demos. Multiple tabs are not synchronized; use one editing tab per browser profile.

JSON backups use `{schemaVersion: 1, exportedAt, collections, snippets, settings}`. Imports validate IDs, references, collection names/colors, at least one editable collection, field types, record dates, supported languages, settings, and editor constraints before showing a preview. Imports are capped at 10 MB. Choose **Replace library** to replace existing records/preferences or **Merge library** to keep current conflicts and add new records. Cancel leaves current state untouched. Current-results exports include all collection definitions so even an empty filtered export remains a valid backup.

`mergeSnapshots(current, incoming)` in `src/lib/importExport.ts` is a pure helper: existing snippet and collection IDs win, only new IDs are appended, and current preferences are retained. Both inputs and the result are validated; dangling references and duplicate collection names under different IDs reject the merge instead of dropping or renaming records. The returned snapshot can be persisted through the same atomic import action. Input records are never mutated or shared with the result.

Clipboard access needs a secure browser context (HTTPS or localhost). If denied, the app selects visible code for manual copying. Snippets are never executed. Highlighting preserves original text; notes are parsed into safe React elements, never inserted as raw HTML. Supported Markdown: headings, paragraphs, lists, quotes, fenced code, inline code, bold/emphasis/strikethrough, horizontal rules, and safe links. Unsupported/raw HTML remains inert text.

## Limits and verification

Chromium is the verified browser; Firefox, Safari, and Edge require separate validation. Core functionality does not fetch external APIs or assets. Browsing and editing work entirely offline after assets load, but no service worker/offline installation is included. There is no deep-link routing, cloud sync, authentication, or code execution. Panel sizes are session-only. Collection deletion does not automatically move or delete snippets: edit their collection first. Highlighting is lightweight lexical highlighting, not full language parsing. Markdown is a safe subset, not full CommonMark/GFM; nested lists, tables, images, and reference links are unsupported.

Vitest covers core selectors/validation, complete seed validation, merge behavior, collection guards/context actions, memory fallback, IndexedDB reload and failed transactions, corrupt-data preservation, create/search/edit/delete, keyboard/dirty drafts, lossless highlighting, and safe Markdown. Coverage enforces 90% statements/branches/functions/lines for `src/lib/**` as a group; whole-app UI coverage is reported separately.

Playwright tests the actual production bundle in Chromium: search/filter, resizing/reading mode, persistent CRUD/favorites/copy, import/export/merge/clear, collection management, keyboard commands, theme persistence, mobile editing/overflow, clipboard failure, storage denial, and axe WCAG A/AA checks on primary views in both themes. `npm run test:e2e` builds and starts its own preview server on localhost:4173; keep that port free. Tests use isolated browser contexts, not your saved personal library. Screenshots and failure traces appear under ignored `test-results/`.

Manual screen-reader testing, 200% zoom review, and cross-browser visual verification remain outstanding. Automated axe results do not establish complete WCAG compliance. Zero defects cannot be guaranteed; report reproducible issues with browser, steps, and expected result.

### Verified implementation checks

- Clean `npm ci`, TypeScript, ESLint, and production build.
- 37 passing Vitest tests across seven files.
- Eight passing Chromium end-to-end tests, including automated accessibility checks.
- Core `src/lib` coverage: 95.77% statements, 94.73% branches, 95.78% functions, 96.51% lines.
- Whole-app Vitest coverage: 66.37% statements, 77.53% lines; browser test coverage is separate, not merged into these percentages. Settings and collections primarily have browser-flow coverage.
- `npm audit`: zero reported vulnerabilities after updating development dependencies.
- Desktop dark/light and mobile screenshots reviewed.

No Git repository existed at implementation time, so verification used source inspection and automated checks rather than a Git diff.
