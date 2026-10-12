import { seed } from "./makeSnippet";
export const sqlSnippets = [
  seed("sql-join", {
    title: "Join active accounts",
    description: "Combine account and profile data with a clear join.",
    language: "SQL",
    collectionId: "data",
    tags: ["join", "select"],
    isFavorite: true,
    explanation:
      "Put the relationship in the join condition and filters in WHERE.",
    code: `SELECT a.id, a.email, p.display_name\nFROM accounts AS a\nJOIN profiles AS p ON p.account_id = a.id\nWHERE a.status = 'active';`,
  }),
  seed("sql-aggregate", {
    title: "Aggregate monthly revenue",
    description: "Group payments by month and currency.",
    language: "SQL",
    collectionId: "data",
    tags: ["aggregate", "reporting"],
    isFavorite: false,
    explanation: "Date truncation syntax varies slightly by database engine.",
    code: `SELECT DATE_TRUNC('month', paid_at) AS month, currency, SUM(amount) AS total\nFROM payments\nGROUP BY 1, 2\nORDER BY 1 DESC;`,
  }),
  seed("sql-date-filter", {
    title: "Filter a rolling window",
    description: "Select rows from the last thirty days.",
    language: "SQL",
    collectionId: "data",
    tags: ["dates", "filter"],
    isFavorite: false,
    explanation:
      "Database clock functions avoid hard-coded dates in scheduled queries.",
    code: `SELECT *\nFROM events\nWHERE occurred_at >= CURRENT_TIMESTAMP - INTERVAL '30 days';`,
  }),
  seed("sql-duplicates", {
    title: "Find duplicate emails",
    description: "Locate normalized values occurring more than once.",
    language: "SQL",
    collectionId: "data",
    tags: ["duplicates", "quality"],
    isFavorite: true,
    explanation: "Use HAVING for conditions on aggregate groups.",
    code: `SELECT LOWER(email) AS normalized_email, COUNT(*) AS occurrences\nFROM users\nGROUP BY LOWER(email)\nHAVING COUNT(*) > 1;`,
  }),
  seed("sql-pagination", {
    title: "Cursor pagination query",
    description: "Fetch the next page without offset drift.",
    language: "SQL",
    collectionId: "data",
    tags: ["pagination", "performance"],
    isFavorite: false,
    explanation:
      "A stable unique sort key makes cursor pagination deterministic.",
    code: `SELECT id, created_at, title\nFROM posts\nWHERE (created_at, id) < (:cursor_date, :cursor_id)\nORDER BY created_at DESC, id DESC\nLIMIT 25;`,
  }),
  seed("sql-window", {
    title: "Rank rows within groups",
    description: "Use a window function to select the latest item per owner.",
    language: "SQL",
    collectionId: "data",
    tags: ["window", "ranking"],
    isFavorite: false,
    explanation:
      "Window functions retain row detail while calculating group context.",
    code: `SELECT *\nFROM (SELECT items.*, ROW_NUMBER() OVER (PARTITION BY owner_id ORDER BY updated_at DESC) AS rank\n      FROM items) ranked\nWHERE rank = 1;`,
  }),
  seed("sql-upsert", {
    title: "Idempotent upsert shape",
    description: "Insert a record or update its current value.",
    language: "SQL",
    collectionId: "data",
    tags: ["write", "upsert"],
    isFavorite: false,
    explanation:
      "Adapt conflict syntax to your database and enforce a unique key.",
    code: `INSERT INTO preferences (user_id, key, value)\nVALUES (:user_id, :key, :value)\nON CONFLICT (user_id, key) DO UPDATE SET value = EXCLUDED.value;`,
  }),
  seed("sql-index", {
    title: "Index a frequent filter",
    description: "Reference index for a common status/time query.",
    language: "SQL",
    collectionId: "data",
    tags: ["index", "performance"],
    isFavorite: false,
    explanation:
      "Confirm query plans and write costs before adding production indexes.",
    code: `CREATE INDEX CONCURRENTLY idx_events_status_time\nON events (status, occurred_at DESC);`,
  }),
];
