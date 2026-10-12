# SnippetShelf — Frontend Implementation Plan

## 1. Project outcome

Build a polished, frontend-only developer snippet manager with Vite and React.
The application will ship with a large, realistic demo library loaded from
hardcoded arrays in separate data files. Users can browse, search, filter,
create, edit, favorite, organize, copy, import, export, and delete snippets
without a backend or environment variables.

The default dataset is source-controlled and easy to edit. Runtime changes are
stored locally in IndexedDB so the application remains useful after refresh.

## 2. Fixed constraints

- Use Vite + React.
- Frontend only. No server, authentication, database service, API key, or
  environment variable.
- Keep seed content in separate imported array files, not buried inside React
  components.
- Use local browser storage for user-created and user-edited data.
- Do not execute snippet code inside the application.
- Do not depend on external APIs for core behavior.
- Use local SVG/CSS icons or an installed icon library; no remote icon CDN.
- Include enough seed content for the interface to look populated immediately.
- Make the application functional, responsive, keyboard-friendly, and usable
  with mouse, keyboard, and narrow screens.

## 3. Product behavior

### Primary workflow

1. User opens SnippetShelf and sees a populated library.
2. User selects a collection or language from the sidebar.
3. User searches by title, description, code, tags, language, or collection.
4. User selects a result and reads its explanation and code.
5. User copies code, toggles favorite, edits content, or creates a snippet.
6. User changes remain after refresh because the runtime repository persists
   them locally.
7. User can export the current library and import it on another browser.

### Required application areas

- **App shell:** desktop sidebar, top command/search bar, responsive mobile
  navigation, theme controls, and status feedback.
- **Library sidebar:** All Snippets, Favorites, Recently Used, collections,
  languages, and settings/help entry points.
- **Snippet list:** searchable, filterable result list with title, language,
  tags, collection, updated time, favorite status, and usage count.
- **Snippet detail:** code preview, copy action, edit action, delete action,
  metadata, Markdown explanation, related snippets, and keyboard hints.
- **Snippet editor:** create/edit form with validation, code input, Markdown
  explanation, tags, language, collection, and favorite controls.
- **Command palette:** keyboard-opened actions for navigation and common
  operations.
- **Settings panel:** theme, editor font size, line wrapping, reduced motion,
  import, export, reset demo data, and clear local data.
- **Toast/confirmation system:** success, warning, error, and destructive
  confirmation feedback.

## 4. Recommended technology choices

### Runtime

- Vite
- React
- TypeScript
- React Router only if multiple URL-addressable views are useful; otherwise
  keep the first release as a stateful single-page workspace.
- IndexedDB through a small repository module. Prefer a lightweight wrapper
  such as `idb` only if dependency policy permits; otherwise use the native API
  behind a typed adapter.

### UI and interaction

- CSS Modules or a clearly scoped global CSS architecture.
- CSS custom properties for theme tokens.
- Lucide React or another local icon package for consistent icons.
- A small custom command palette rather than a heavy UI framework.
- Native `dialog` or an accessible modal abstraction for forms and confirmation.
- `<pre><code>` with safe text rendering for code. Never use `dangerouslySetInnerHTML`
  for user-provided code.
- Markdown explanation rendering with sanitization if a Markdown package is
  used. Raw HTML must be disabled or sanitized.

### Testing

- Vitest for unit and component tests.
- React Testing Library for user-facing component behavior.
- Playwright for browser-level smoke and critical-flow tests.
- ESLint and TypeScript strict checking.
- Prettier if project formatting is not already configured.

## 5. Proposed directory structure

```text
snippet-shelf/
├── public/
│   └── favicon.svg
├── src/
│   ├── app/
│   │   ├── App.tsx
│   │   ├── appRoutes.tsx
│   │   └── providers.tsx
│   ├── assets/
│   ├── components/
│   │   ├── common/
│   │   ├── layout/
│   │   ├── snippets/
│   │   ├── collections/
│   │   ├── command-palette/
│   │   └── feedback/
│   ├── data/
│   │   ├── collections.ts
│   │   ├── snippets.javascript.ts
│   │   ├── snippets.typescript.ts
│   │   ├── snippets.react.ts
│   │   ├── snippets.css.ts
│   │   ├── snippets.html.ts
│   │   ├── snippets.python.ts
│   │   ├── snippets.sql.ts
│   │   ├── snippets.shell.ts
│   │   ├── snippets.git.ts
│   │   ├── snippets.json.ts
│   │   └── seedLibrary.ts
│   ├── features/
│   │   ├── library/
│   │   ├── snippet-editor/
│   │   ├── snippet-detail/
│   │   ├── command-palette/
│   │   ├── settings/
│   │   └── import-export/
│   ├── hooks/
│   ├── lib/
│   │   ├── db/
│   │   ├── search/
│   │   ├── import-export/
│   │   ├── clipboard/
│   │   ├── markdown/
│   │   └── validation/
│   ├── state/
│   │   ├── libraryStore.ts
│   │   ├── uiStore.ts
│   │   └── settingsStore.ts
│   ├── styles/
│   │   ├── tokens.css
│   │   ├── globals.css
│   │   └── utilities.css
│   ├── types/
│   │   ├── snippet.ts
│   │   ├── collection.ts
│   │   └── settings.ts
│   └── main.tsx
├── tests/
│   ├── fixtures/
│   ├── unit/
│   ├── components/
│   └── e2e/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── playwright.config.ts
├── eslint.config.js
└── README.md
```

The exact folders can be simplified during implementation if the generated
Vite project is small, but seed data, data access, state, UI components, and
feature workflows must remain separated.

## 6. Data model

### Snippet

```ts
type Snippet = {
  id: string;
  title: string;
  description: string;
  code: string;
  language: SnippetLanguage;
  collectionId: string;
  tags: string[];
  explanation: string;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
  lastUsedAt?: string;
  copyCount: number;
  source: 'seed' | 'user';
};
```

### Collection

```ts
type Collection = {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  isSystem: boolean;
  sortOrder: number;
};
```

### Settings

```ts
type Settings = {
  theme: 'dark' | 'light' | 'system';
  editorFontSize: 'small' | 'medium' | 'large';
  lineWrap: boolean;
  reduceMotion: boolean;
  showLineNumbers: boolean;
};
```

### UI state

```ts
type LibraryViewState = {
  selectedSnippetId: string | null;
  activeCollectionId: string;
  activeLanguage: SnippetLanguage | 'all';
  searchQuery: string;
  sortBy: 'updated' | 'created' | 'title' | 'most-used';
  sortDirection: 'asc' | 'desc';
  favoritesOnly: boolean;
  selectedTags: string[];
  isEditorOpen: boolean;
  editingSnippetId: string | null;
};
```

Use stable IDs in seed files. Do not generate random IDs while rendering or
the same seed records will appear to change on each reload.

## 7. Seed data plan

Create separate arrays by technology/domain and merge them once in
`seedLibrary.ts`. Keep each record complete and realistic rather than adding
placeholder text.

### Seed volume target

- 8 collections, including system collections and practical custom collections.
- 10+ languages or categories.
- At least 60 snippets in the first release.
- At least 6 snippets per major category.
- Every record must have a meaningful title, description, valid code, tags,
  explanation, and collection assignment.
- Include varied code lengths: one-line helpers, medium examples, and larger
  practical patterns.
- Include enough duplicate-adjacent topics to make search and filtering useful.

### Suggested collections

1. Frontend Essentials
2. React Patterns
3. TypeScript Utilities
4. CSS & Layout
5. Git & Shell
6. Data & JSON
7. Backend Reference
8. Personal Favorites

System views such as All Snippets, Favorites, and Recently Used should be
computed views, not duplicated data collections.

### Suggested data files

- `snippets.javascript.ts`: debounce, throttle, deep clone, groupBy, retry,
  query-string parsing, local storage helpers.
- `snippets.typescript.ts`: typed event map, discriminated unions, generic
  helpers, result type, typed fetch wrapper as reference code only.
- `snippets.react.ts`: custom hook patterns, controlled input, debounced search,
  outside-click hook, error boundary reference, memoization examples.
- `snippets.css.ts`: responsive grid, glass panel, focus ring, text clamp,
  skeleton loader, tooltip, theme variables.
- `snippets.html.ts`: accessible dialog structure, form structure, skip link,
  responsive image, navigation landmarks.
- `snippets.python.ts`: list grouping, dataclass, context manager, file parsing,
  HTTP reference pattern without executing it.
- `snippets.sql.ts`: joins, aggregation, date filtering, duplicate detection,
  pagination reference queries.
- `snippets.shell.ts`: safe directory loop, archive command, port check,
  environment inspection examples as plain reference text.
- `snippets.git.ts`: branching, interactive cleanup reference, reflog recovery,
  useful log formats.
- `snippets.json.ts`: common configuration and API payload examples.

Avoid real credentials, private URLs, destructive commands without warnings, or
code that suggests unsafe execution inside the product.

## 8. Persistence strategy

### Seed-to-runtime flow

1. App opens IndexedDB.
2. If no library exists, clone the imported seed arrays into the database.
3. If a library exists, load the stored library and ignore seed changes for that
   browser until the user chooses “Reset demo data”.
4. User changes update the database through repository methods.
5. UI state such as selected snippet and search query can stay in memory; theme
   and editor preferences persist separately.

### Required repository methods

- `initializeLibrary()`
- `listSnippets()`
- `getSnippet(id)`
- `createSnippet(input)`
- `updateSnippet(id, input)`
- `deleteSnippet(id)`
- `toggleFavorite(id)`
- `recordCopy(id)`
- `listCollections()`
- `createCollection(input)`
- `updateCollection(id, input)`
- `deleteCollection(id)`
- `getSettings()`
- `saveSettings(settings)`
- `replaceLibrary(snapshot)`
- `resetToSeedData()`
- `clearAllLocalData()`

The UI must not call IndexedDB directly. This keeps persistence testable and
makes a future backend replacement possible without rewriting components.

### Failure handling

- If IndexedDB is unavailable, show a visible warning and use an in-memory
  fallback for the current session.
- If clipboard permission fails, keep copy action non-blocking and show the code
  in a selectable fallback state.
- If import data is invalid, preserve the current library and show validation
  errors; never partially replace data.

## 9. Search, filtering, and sorting

Search should be local, deterministic, and fast enough for the seed library.
Create a normalized search document for every snippet containing:

- title
- description
- code
- explanation
- language
- collection name
- tags

The first implementation can use normalized substring matching. Rank results in
this order:

1. Exact title match.
2. Title prefix match.
3. Title word match.
4. Tag or language match.
5. Description/explanation match.
6. Code match.

Required filters:

- collection
- language
- favorites
- one or more tags
- recently used

Required sort options:

- recently updated
- recently created
- title A–Z/Z–A
- most copied

Search and filter combinations must be composable. For example, a user should
be able to search “hook”, restrict it to React, select a tag, and sort by most
used.

Empty states must distinguish between:

- no snippets in the library
- no results for current search
- no favorites yet
- no snippets in selected collection

Each empty state needs a useful action, such as clear filters, create snippet,
or load demo data.

## 10. Interface and visual plan

### Desktop layout

```text
┌───────────────────────────────────────────────────────────────────────────┐
│ Logo / workspace       Search snippets...       Theme  Help  Profile       │
├───────────────┬───────────────────────────────┬───────────────────────────┤
│ Collections   │ Results toolbar                │ Snippet detail             │
│               ├───────────────────────────────┤                           │
│ All snippets  │ Snippet result cards           │ Title + actions            │
│ Favorites     │                                 │ Description                │
│ Recent        │                                 │ Code preview               │
│               │                                 │ Explanation / metadata     │
│ Collections   │                                 │ Related snippets           │
│ Languages     │                                 │                           │
└───────────────┴───────────────────────────────┴───────────────────────────┘
```

### Responsive behavior

- Desktop: three-panel workspace.
- Tablet: sidebar collapses; results and detail remain side by side when space
  allows.
- Mobile: one primary panel at a time with bottom navigation or a back button.
- Editor opens as a full-screen route/sheet on mobile.
- Do not rely on hover to reveal important actions.
- Code blocks scroll horizontally rather than forcing unreadable wrapping.

### Visual language

- Dark-first interface with a carefully designed light theme.
- Near-black background, elevated graphite surfaces, one accent color, and
  language-specific badge colors used sparingly.
- 8px spacing scale, medium corner radius, thin borders, and restrained shadow.
- Clear typography hierarchy: compact UI labels, readable snippet titles, and a
  monospace code face.
- Use motion for panel transitions, copy confirmation, and selection changes;
  honor `prefers-reduced-motion` and the user setting.
- Include visible focus rings and sufficient contrast in both themes.

## 11. Component plan

### Layout components

- `AppShell`
- `TopBar`
- `Sidebar`
- `ResizablePanelGroup`
- `MobileNavigation`
- `PageContent`

### Library components

- `LibraryToolbar`
- `SearchInput`
- `FilterPopover`
- `SortMenu`
- `SnippetList`
- `SnippetListItem`
- `SnippetCount`
- `ActiveFilterChips`
- `EmptyLibraryState`
- `NoSearchResultsState`

### Detail components

- `SnippetDetail`
- `SnippetHeader`
- `CodeViewer`
- `CopyButton`
- `MarkdownExplanation`
- `SnippetMetadata`
- `TagList`
- `RelatedSnippets`

### Editor components

- `SnippetEditor`
- `SnippetForm`
- `CodeTextarea`
- `LanguageSelect`
- `CollectionSelect`
- `TagInput`
- `MarkdownHelp`
- `UnsavedChangesDialog`

### Feedback components

- `ToastRegion`
- `ConfirmDialog`
- `LoadingState`
- `ErrorState`
- `StorageWarning`
- `CopyStatus`

Components should receive data and callbacks through props or feature hooks.
Do not hide database calls in presentational components.

## 12. Editor behavior and validation

### Create/edit fields

- Title: required, trimmed, 2–100 characters.
- Description: required, trimmed, 10–240 characters.
- Code: required, at least one non-whitespace character.
- Language: required, selected from supported values.
- Collection: required, existing collection only.
- Tags: optional, normalized to lowercase, no duplicates, maximum 8 tags.
- Explanation: optional Markdown, maximum 5,000 characters.
- Favorite: optional boolean.

### Form behavior

- Validate on submit and provide field-level errors.
- Preserve entered values after validation failure.
- Disable submit while saving.
- Show saved feedback after successful create/update.
- Warn before leaving with unsaved changes.
- Generate a stable user ID once on successful creation.
- Set `updatedAt` on every update.
- Never mutate seed arrays directly.

### Delete behavior

- Require explicit confirmation.
- State title and consequences in confirmation.
- Remove record only after confirmation.
- Select a sensible neighboring snippet after deletion.
- Show undo only if implementation can safely restore the exact record; otherwise
  do not present a misleading undo action.

## 13. Import and export

### Export

Export a versioned JSON object:

```json
{
  "schemaVersion": 1,
  "exportedAt": "2026-01-01T00:00:00.000Z",
  "collections": [],
  "snippets": [],
  "settings": {}
}
```

- Export all library data or the current filtered view.
- Use a descriptive filename such as `snippetshelf-export-2026-01-01.json`.
- Do not include internal transient UI state.

### Import

- Support file picker and drag-and-drop.
- Parse JSON locally.
- Validate schema before changing storage.
- Show a preview: snippets, collections, conflicts, and invalid records.
- Offer conflict strategy: merge, replace, or cancel.
- Keep import atomic: no writes until user confirms.
- Preserve current data if parsing or validation fails.

If conflict strategy is too large for the first iteration, implement replace
and cancel first, but document that merge is deferred rather than silently
overwriting records.

## 14. Keyboard and accessibility plan

### Keyboard shortcuts

- `Ctrl/Cmd + K`: open command palette.
- `/`: focus search when focus is not already in an editable field.
- `N`: create new snippet when not typing in a field.
- `E`: edit selected snippet when not typing in a field.
- `C`: copy selected snippet code when not typing in a field.
- `F`: toggle favorite for selected snippet.
- `Esc`: close modal, palette, or editor.
- Arrow keys: navigate command palette and list where applicable.

Display shortcuts in tooltips and command palette. Disable global shortcuts when
focus is inside an input, textarea, or contenteditable element unless the
shortcut is explicitly intended there.

### Accessibility requirements

- Semantic landmarks: header, navigation, main, complementary panel.
- Every icon-only button has an accessible name.
- Modal focus is trapped and restored on close.
- Keyboard focus is visible.
- Search and filter updates are announced where appropriate.
- Code remains selectable and readable by screen readers.
- Do not communicate state by color alone.
- Minimum practical contrast target: WCAG AA.
- Test at 200% browser zoom and narrow viewport widths.

## 15. State architecture

Separate three state categories:

1. **Persisted domain state:** snippets, collections, settings.
2. **Derived state:** filtered results, counts, language totals, related items.
3. **Transient UI state:** open panels, selected item, dialogs, toasts, draft
   form state.

Recommended flow:

```text
seed arrays → repository → library store → feature hooks → components
                                      ↓
                                  derived selectors
```

Use immutable updates. Keep selectors pure and test them independently. Avoid
duplicating filtered lists in state; calculate them from the source library and
current filter state.

## 16. Implementation phases

### Phase 1 — Project foundation

- Scaffold Vite React TypeScript project.
- Add lint, formatting, unit test, component test, and Playwright scripts.
- Create global tokens, reset, typography, dark/light themes, and responsive
  breakpoints.
- Render a minimal app shell with loading and error boundaries.

**Exit criteria:** clean install, development server starts, production build
works, lint/typecheck/test commands exist.

### Phase 2 — Types and seed data

- Add domain types.
- Create collection array files.
- Create separate snippet arrays by category.
- Merge and validate seed data at startup.
- Add development-time seed validation for duplicate IDs, missing references,
  invalid languages, malformed dates, and empty required fields.

**Exit criteria:** at least 60 valid records appear in a data inspection test;
all collection references resolve.

### Phase 3 — Repository and persistence

- Implement IndexedDB schema and versioning.
- Implement seed initialization, CRUD, settings, reset, and clear operations.
- Add in-memory fallback and visible storage warning.
- Add repository tests with fake IndexedDB.

**Exit criteria:** create/update/delete/favorite/copy changes survive refresh;
reset returns exactly to seed content.

### Phase 4 — App state and selectors

- Add library store and UI store.
- Add derived selectors for search, filters, sorting, counts, recent items,
  related snippets, and language statistics.
- Add loading, error, and empty-state transitions.

**Exit criteria:** selector tests cover every filter combination and no component
needs to implement its own search logic.

### Phase 5 — Core browsing UI

- Build responsive app shell.
- Build sidebar collections and languages.
- Build search input, filters, sort controls, result list, and detail panel.
- Add selected item behavior and keyboard navigation.

**Exit criteria:** user can find and inspect any seeded snippet on desktop,
tablet, and mobile layouts.

### Phase 6 — Editing workflows

- Build create and edit forms.
- Add validation, dirty-state tracking, save feedback, and delete confirmation.
- Add collection and tag management needed by the editor.
- Add favorite and recently-used behavior.

**Exit criteria:** full create/edit/delete/favorite workflow works after reload;
invalid forms cannot write data.

### Phase 7 — Productivity features

- Add copy behavior and copy counts.
- Add command palette and shortcuts.
- Add configurable code viewer.
- Add Markdown explanation rendering.
- Add related snippets and recent snippets.

**Exit criteria:** keyboard and mouse users can complete primary workflows;
clipboard failure has a usable fallback.

### Phase 8 — Import/export and settings

- Add versioned export.
- Add atomic import preview and confirmation.
- Add theme, font size, wrapping, line number, and reduced-motion settings.
- Add reset demo data and clear local data controls.

**Exit criteria:** exported data can be imported into a clean browser and
produces equivalent library content.

### Phase 9 — Polish and release hardening

- Add skeletons, empty states, error states, and responsive refinements.
- Verify overflow, focus behavior, keyboard navigation, and reduced motion.
- Run all automated checks and manual acceptance checklist.
- Build production bundle and test it through a static server.

**Exit criteria:** no known release-blocking defects; all release checks pass;
remaining limitations are documented.

## 17. Testing and validation plan

### Unit tests

Test pure functions without React rendering:

- Seed data validation.
- ID and date generation helpers.
- Search normalization.
- Search ranking.
- Multi-filter composition.
- Sorting in both directions.
- Tag normalization and de-duplication.
- Form validation boundaries.
- Import schema validation.
- Export schema generation.
- Merge/replace conflict behavior if merge is implemented.
- Related-snippet selection.
- Settings default and migration behavior.
- Clipboard status mapping.

Important boundaries:

- Empty query returns all records.
- Search is case-insensitive.
- Search ignores excess whitespace.
- Search handles punctuation safely.
- Tag matching does not confuse partial unrelated tags unless designed to.
- Favorite filter returns no non-favorites.
- Recently used handles missing `lastUsedAt`.
- Sorting does not mutate original arrays.
- Deleting the selected record does not leave a stale detail view.
- Invalid imported JSON never changes the existing library.
- Duplicate seed IDs fail validation.

### Repository tests

Use fake IndexedDB or an equivalent test adapter to verify:

- Empty database initializes from seed arrays.
- Existing database does not silently overwrite user changes.
- Create persists all fields.
- Update changes only intended fields and updates timestamp.
- Delete removes the correct record.
- Favorite toggle is idempotent per action.
- Copy count increments once per successful copy event.
- Settings persist independently.
- Reset replaces snippets and collections with seed data.
- Clear removes local data.
- Repository errors are surfaced to callers.
- In-memory fallback does not crash app initialization.

### Component tests

Use accessible queries and user interactions rather than implementation details.

Test:

- Sidebar navigation changes active view.
- Search input updates visible results.
- Filter chips can be added and removed.
- Sort menu changes visible order.
- Snippet selection updates detail panel.
- Favorite control updates icon state and count.
- Copy button reports success and failure states.
- Create form validates required fields.
- Create form saves a complete record.
- Edit form loads current values.
- Edit form preserves data after validation error.
- Delete dialog requires confirmation.
- Cancelled delete leaves record unchanged.
- Empty states show correct action.
- Loading and error states render correctly.
- Command palette opens, filters commands, and executes a command.
- Escape closes overlays.
- Settings changes apply to UI and persist.
- Import preview blocks invalid files.
- Export triggers a downloadable valid JSON payload.

### End-to-end tests

Run in Chromium at minimum; add Firefox/WebKit if project time allows.

Critical journeys:

1. **First launch:** app loads seeded library and displays meaningful records.
2. **Search:** search for a known term and open the expected snippet.
3. **Filter:** combine collection, language, tag, and favorite filters.
4. **Create:** create a new snippet, see it in results, refresh, and find it.
5. **Edit:** change code and description, refresh, and verify persistence.
6. **Copy:** copy code and verify success feedback/copy count.
7. **Favorite:** favorite from list/detail and verify Favorites view.
8. **Delete:** delete a snippet and verify it is absent after refresh.
9. **Import/export:** export, reset, import, and verify representative records.
10. **Responsive:** complete browse and edit flow at mobile viewport.
11. **Keyboard:** open command palette, navigate, select result, copy, and edit.
12. **Theme:** switch theme and verify it survives refresh.

Use deterministic test fixtures and a clean browser context for every isolation-
sensitive test. Do not depend on test ordering.

### Accessibility validation

- Run automated accessibility checks against shell, list, detail, editor, and
  command palette.
- Test keyboard-only navigation manually.
- Test screen-reader names for icon buttons.
- Test modal focus entry, containment, and restoration.
- Test color contrast in dark and light themes.
- Test zoom at 200%.
- Test reduced-motion preference.

Automated accessibility checks do not replace manual keyboard review.

### Visual validation

Capture or manually inspect these states at desktop, tablet, and mobile sizes:

- populated library
- selected snippet
- no search results
- no favorites
- empty collection
- create form
- validation errors
- delete confirmation
- import preview
- IndexedDB warning
- light theme
- dark theme
- long title and long code
- many tags
- narrow viewport with horizontal code scroll

Check for clipping, accidental horizontal page scroll, unreadable code,
inconsistent spacing, broken focus indicators, and controls hidden off-screen.

## 18. Validation commands

The final project should expose scripts similar to:

```bash
npm install
npm run dev
npm run lint
npm run typecheck
npm run test
npm run test:coverage
npm run test:e2e
npm run build
npm run preview
```

Recommended final sequence:

```bash
npm ci
npm run lint
npm run typecheck
npm run test -- --run
npm run test:coverage
npm run build
npm run test:e2e
```

If the project uses a different package manager, commit its lockfile and use
the corresponding clean-install command. Do not claim a check passed unless it
was actually run.

### Coverage targets

Coverage is a signal, not the only quality gate. Target:

- 90%+ for search, filtering, validation, import/export, and repository logic.
- 80%+ for feature hooks and state transitions.
- Meaningful component and end-to-end coverage for every critical workflow.
- No uncovered release-critical branch without a documented reason.

## 19. Manual release checklist

### Data and behavior

- [ ] Fresh browser shows populated seed library.
- [ ] At least 60 snippets render with valid metadata.
- [ ] Every language/category has visible data.
- [ ] Search finds title, tag, description, and code matches.
- [ ] Filters combine correctly.
- [ ] Sorting is stable and correct.
- [ ] Create, edit, favorite, copy, and delete work.
- [ ] Changes survive page refresh.
- [ ] Reset demo data restores original seed dataset.
- [ ] Export creates valid versioned JSON.
- [ ] Import validates before writing.
- [ ] Invalid import leaves current data untouched.

### UX

- [ ] No dead buttons or fake controls.
- [ ] Every async action has loading/success/failure feedback.
- [ ] Destructive actions require confirmation.
- [ ] Empty states are useful and distinct.
- [ ] Long content does not break layout.
- [ ] Mobile flow is usable without desktop-only interactions.
- [ ] Command palette and documented shortcuts work.
- [ ] Copy failure has fallback feedback.

### Quality

- [ ] No TypeScript errors.
- [ ] No lint errors.
- [ ] Unit/component tests pass.
- [ ] E2E critical journeys pass.
- [ ] Production build passes.
- [ ] Production preview has no console errors.
- [ ] No unhandled promise rejections.
- [ ] No secrets or environment variables are required.
- [ ] No remote API is required for core behavior.
- [ ] No user code is executed.
- [ ] No debug logs remain.
- [ ] README explains setup, scripts, storage behavior, and limitations.

## 20. README requirements

Document:

- What SnippetShelf does.
- Tech stack.
- Local development commands.
- Test and build commands.
- Seed data locations and how to add a snippet.
- IndexedDB persistence behavior.
- How to reset demo data.
- Import/export schema and limitations.
- Browser support assumptions.
- Clipboard and storage permission caveats.
- Explicit statement that snippets are displayed/stored only and never executed.

## 21. Scope decisions and recommended defaults

### Decision: hardcoded arrays versus IndexedDB

**Recommendation:** use both, with separate responsibilities.

- Arrays are the editable source-controlled demo dataset.
- IndexedDB is the runtime persistence layer for user changes.
- Reset demo data rehydrates IndexedDB from arrays.

Using arrays only would satisfy initial display but lose create/edit data after
refresh. Using IndexedDB only would make changing demo content harder. The
hybrid model satisfies both goals without a backend.

### Decision: syntax highlighting

**Recommendation:** add syntax highlighting after core workflows work. A local
highlighting package can make code readable, but it must not delay storage,
search, and editing. The editor can begin with a styled textarea and the viewer
can use escaped code text until highlighting is integrated.

### Decision: Markdown rendering

**Recommendation:** support a safe Markdown subset for explanations. If a
renderer is used, sanitize output and disable raw HTML. Plain text remains a
valid fallback.

### Decision: state library

**Recommendation:** start with React context plus reducer or a small local store
module. Add a state library only if the implementation becomes difficult to
reason about. Domain repository and pure selectors matter more than the choice
of state package.

### Decision: routing

**Recommendation:** keep one workspace view with local selection state for the
first release. Add routes only if deep-linking to a snippet or separate settings
pages becomes necessary. This reduces refresh and mobile navigation complexity.

## 22. Risks and mitigations

| Risk | Mitigation |
|---|---|
| Too much time spent on visual polish | Finish seed data, persistence, and critical flows before animations. |
| IndexedDB complexity | Hide it behind repository methods and test it independently. |
| Import corrupts user data | Validate and preview entire payload before atomic replacement. |
| Keyboard shortcuts interfere with typing | Ignore global shortcuts inside editable controls. |
| Code rendering creates XSS risk | Render code as text; sanitize Markdown output. |
| Large code blocks break mobile layout | Horizontal code scrolling and tested overflow behavior. |
| Empty app feels unfinished | Ship 60+ realistic seed records with varied metadata. |
| Seed updates do not reach existing browsers | Make Reset demo data explicit and document behavior. |
| Browser permissions fail | Provide visible, recoverable clipboard/storage fallbacks. |
| Scope expands into an IDE | Do not execute code, compile snippets, add collaboration, or add backend sync. |

## 23. Definition of done

The project is ready when:

1. A clean install starts with the documented command.
2. No environment variables are needed.
3. Seed arrays are separated by category and contain at least 60 valid records.
4. The first screen looks populated and communicates what the product does.
5. Search, filters, sorting, selection, code viewing, copying, favorites,
   create, edit, delete, import, export, settings, and reset work.
6. Runtime changes persist locally after refresh.
7. Invalid input and browser failures produce useful feedback without data loss.
8. Desktop and mobile layouts are usable.
9. Keyboard and accessibility requirements are tested.
10. Lint, typecheck, unit tests, component tests, E2E tests, and production
    build pass in a clean run.
11. Final manual checklist is complete.
12. README and known limitations are accurate.

“No bug” is not a verifiable absolute. Release standard is: no known
release-blocking defects, all defined critical paths tested, no failing required
checks, and every unverified limitation documented clearly.
