import {
  languages,
  type Collection,
  type Settings,
  type Snippet,
} from "../types";
import { collectionNameKey, validCollectionColor, validateSnippet } from "./validation";
import { settingsDefaults } from "./settings";
export type Snapshot = {
  schemaVersion: 1;
  exportedAt: string;
  collections: Collection[];
  snippets: Snippet[];
  settings: Settings;
};
export const makeSnapshot = (
  snippets: Snippet[],
  collections: Collection[],
  settings: Settings,
): Snapshot => ({
  schemaVersion: 1,
  exportedAt: new Date().toISOString(),
  collections,
  snippets,
  settings,
});
const record = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);
const string = (value: unknown): value is string => typeof value === "string";
const validDate = (value: unknown) =>
  string(value) && Number.isFinite(Date.parse(value));
export function parseSnapshot(raw: string): Snapshot {
  if (raw.length > 10_000_000)
    throw new Error("Import must be smaller than 10 MB.");
  return validateSnapshot(JSON.parse(raw));
}
export function validateSnapshot(value: unknown): Snapshot {
  if (
    !record(value) ||
    value.schemaVersion !== 1 ||
    !Array.isArray(value.snippets) ||
    !Array.isArray(value.collections)
  )
    throw new Error(
      "Unsupported SnippetShelf export. Expected schema version 1.",
    );
  const ids = new Set<string>();
  const names = new Set<string>();
  for (const collection of value.collections) {
    if (
      !record(collection) ||
      !string(collection.id) ||
      !collection.id ||
      ids.has(collection.id) ||
      !string(collection.name) ||
      !collection.name.trim() ||
      names.has(collectionNameKey(collection.name)) ||
      !string(collection.description) ||
      !string(collection.icon) ||
      !string(collection.color) ||
      !validCollectionColor(collection.color) ||
      typeof collection.sortOrder !== "number" ||
      !Number.isFinite(collection.sortOrder) ||
      (collection.isSystem !== undefined &&
        typeof collection.isSystem !== "boolean")
    )
      throw new Error("Invalid or duplicate collection.");
    ids.add(collection.id);
    names.add(collectionNameKey(collection.name));
  }
  if (!value.collections.some(collection => !collection.isSystem))
    throw new Error("Keep at least one editable collection.");
  const snippetIds = new Set<string>();
  for (const item of value.snippets) {
    if (
      !record(item) ||
      !string(item.id) ||
      !item.id ||
      snippetIds.has(item.id) ||
      !string(item.title) ||
      !string(item.description) ||
      !string(item.code) ||
      !string(item.explanation) ||
      !languages.includes(item.language as Snippet["language"]) ||
      !Array.isArray(item.tags) ||
      !item.tags.every(string) ||
      typeof item.isFavorite !== "boolean" ||
      !validDate(item.createdAt) ||
      !validDate(item.updatedAt) ||
      (item.lastUsedAt !== undefined && !validDate(item.lastUsedAt)) ||
      !Number.isInteger(item.copyCount) ||
      (item.copyCount as number) < 0 ||
      !["seed", "user"].includes(item.source as string)
    )
      throw new Error("Invalid or duplicate snippet record.");
    if (
      Object.keys(
        validateSnippet(
          item as unknown as Snippet,
          value.collections as Collection[],
        ),
      ).length
    )
      throw new Error(`Invalid fields in snippet: ${item.title}`);
    snippetIds.add(item.id);
  }
  if (!record(value.settings)) throw new Error("Invalid settings.");
  // Schema version 1 predates avatar preferences. Only the new fields are optional
  // in older records; all original settings must still pass validation.
  const settings: Record<string, unknown> = {
    avatarBackgroundColor: settingsDefaults.avatarBackgroundColor,
    avatarTextColor: settingsDefaults.avatarTextColor,
    ...value.settings,
  };
  if (
    !["dark", "light", "system"].includes(settings.theme as string) ||
    !["small", "medium", "large"].includes(settings.editorFontSize as string) ||
    !["lineWrap", "reduceMotion", "showLineNumbers"].every(
      (key) => typeof settings[key] === "boolean",
    ) ||
    ![settings.avatarBackgroundColor, settings.avatarTextColor].every(
      (color) => string(color) && color.length === 7 && validCollectionColor(color),
    )
  )
    throw new Error("Invalid settings.");
  return { ...value, settings } as unknown as Snapshot;
}

/** Add new IDs only; existing records and preferences remain authoritative. */
export function mergeSnapshots(current: Snapshot, incoming: Snapshot): Snapshot {
  validateSnapshot(current);
  validateSnapshot(incoming);
  const collectionIds = new Set(current.collections.map(collection => collection.id));
  const snippetIds = new Set(current.snippets.map(snippet => snippet.id));
  const merged = validateSnapshot({
    ...current,
    collections: [...current.collections, ...incoming.collections.filter(collection => !collectionIds.has(collection.id))],
    snippets: [...current.snippets, ...incoming.snippets.filter(snippet => !snippetIds.has(snippet.id))],
  });
  return JSON.parse(JSON.stringify(merged)) as Snapshot;
}
