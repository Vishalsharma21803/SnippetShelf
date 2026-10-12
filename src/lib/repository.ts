import type { Collection, CollectionInput, Settings, Snippet, SnippetInput } from "../types";
import { collections, seedSnippets } from "../data/seedLibrary";
import { makeSnapshot, validateSnapshot } from "./importExport";
import { normalizeCollectionInput } from "./validation";
import { settingsDefaults } from "./settings";

export { settingsDefaults } from "./settings";
type State = {
  snippets: Snippet[];
  collections: Collection[];
  settings: Settings;
};
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const fresh = (): State =>
  clone({ snippets: seedSnippets, collections, settings: settingsDefaults });
let state: State;
let initialization: Promise<void> | undefined;
let db: IDBDatabase | undefined;
let fallback = false;
let queue = Promise.resolve();

async function initialize() {
  initialization ??= (async () => {
    try {
      db = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open("snippetshelf-library", 1);
        const timeout = setTimeout(
          () => reject(new Error("Storage timed out")),
          4000,
        );
        request.onupgradeneeded = () =>
          request.result.createObjectStore("workspace");
        request.onsuccess = () => {
          clearTimeout(timeout);
          if (fallback) request.result.close();
          else resolve(request.result);
        };
        request.onerror = () => {
          clearTimeout(timeout);
          reject(request.error);
        };
        request.onblocked = () => {
          clearTimeout(timeout);
          reject(new Error("Storage blocked"));
        };
      });
    } catch {
      fallback = true;
      state = fresh();
      return;
    }
    const saved = await new Promise<unknown>((resolve, reject) => {
      const transaction = db!.transaction("workspace");
      const request = transaction.objectStore("workspace").get("library");
      transaction.oncomplete = () => resolve(request.result);
      transaction.onabort = transaction.onerror = () =>
        reject(transaction.error ?? new Error("Could not read saved library."));
    });
    if (saved === undefined) {
      const initial = fresh();
      await persist(initial);
      state = initial;
    } else {
      // A failed read or corrupt record must never be mistaken for first launch.
      const validated = validateSnapshot({
        ...(saved && typeof saved === "object" ? saved : {}),
        schemaVersion: 1,
      });
      state = clone({ snippets: validated.snippets, collections: validated.collections, settings: validated.settings });
    }
  })().catch((error: unknown) => {
    db?.close();
    db = undefined;
    initialization = undefined;
    throw error;
  });
  await initialization;
}
async function persist(next: State) {
  if (fallback || !db) return;
  await new Promise<void>((resolve, reject) => {
    const transaction = db!.transaction("workspace", "readwrite");
    transaction.objectStore("workspace").put(next, "library");
    transaction.oncomplete = () => resolve();
    transaction.onabort = transaction.onerror = () =>
      reject(transaction.error ?? new Error("Could not save library. Your previous data is unchanged."));
  });
}
function change<T>(operation: (current: State) => T): Promise<T> {
  const result = queue.then(async () => {
    await initialize();
    const next = clone(state);
    const result = operation(next);
    validateSnapshot(makeSnapshot(next.snippets, next.collections, next.settings));
    await persist(next);
    state = next;
    return clone(result);
  });
  queue = result.then(
    () => undefined,
    () => undefined,
  );
  return result;
}
function update(current: State, id: string, patch: Partial<Snippet>) {
  const item = current.snippets.find((snippet) => snippet.id === id);
  if (!item) throw new Error("Snippet not found");
  Object.assign(item, patch, { updatedAt: new Date().toISOString() });
  return item;
}
export const repository = {
  get storageFallback() {
    return fallback;
  },
  async initializeLibrary() {
    await initialize();
    return clone({ snippets: state.snippets, collections: state.collections });
  },
  async listSnippets() {
    await initialize();
    return clone(state.snippets);
  },
  async getSettings() {
    await initialize();
    return clone(state.settings);
  },
  saveSnippet(input: SnippetInput, id?: string) {
    input = clone(input);
    return change((current) => {
      if (id) return update(current, id, input);
      const now = new Date().toISOString();
      const item: Snippet = {
        ...clone(input),
        id: crypto.randomUUID(),
        source: "user",
        createdAt: now,
        updatedAt: now,
        copyCount: 0,
      };
      current.snippets.unshift(item);
      return item;
    });
  },
  createCollection(input: CollectionInput) {
    input = clone(input);
    return change((current) => {
      const item: Collection = {
        ...normalizeCollectionInput(input, current.collections),
        id: crypto.randomUUID(),
        icon: "folder",
        sortOrder: Math.max(0, ...current.collections.map(collection => collection.sortOrder)) + 1,
      };
      current.collections.push(item);
      return item;
    });
  },
  updateCollection(id: string, input: CollectionInput) {
    input = clone(input);
    return change((current) => {
      const item = current.collections.find(collection => collection.id === id);
      if (!item) throw new Error("Collection not found.");
      if (item.isSystem) throw new Error("System collections cannot be edited.");
      Object.assign(item, normalizeCollectionInput(input, current.collections, id));
      return item;
    });
  },
  deleteCollection(id: string) {
    return change((current) => {
      const item = current.collections.find(collection => collection.id === id);
      if (!item) throw new Error("Collection not found.");
      if (item.isSystem) throw new Error("System collections cannot be deleted.");
      if (current.snippets.some(snippet => snippet.collectionId === id))
        throw new Error("Only empty collections can be deleted. Move their snippets first.");
      if (current.collections.filter(collection => !collection.isSystem).length <= 1)
        throw new Error("Keep at least one editable collection.");
      current.collections = current.collections.filter(collection => collection.id !== id);
      return null;
    });
  },
  deleteSnippet(id: string) {
    return change((current) => {
      current.snippets = current.snippets.filter((item) => item.id !== id);
      return null;
    });
  },
  toggleFavorite(id: string) {
    return change((current) => {
      const item = current.snippets.find((item) => item.id === id);
      if (!item) throw new Error("Snippet not found");
      return update(current, id, { isFavorite: !item.isFavorite });
    });
  },
  recordCopy(id: string) {
    return change((current) => {
      const item = current.snippets.find((item) => item.id === id);
      if (!item) throw new Error("Snippet not found");
      return update(current, id, {
        copyCount: item.copyCount + 1,
        lastUsedAt: new Date().toISOString(),
      });
    });
  },
  saveSettings(settings: Settings) {
    settings = clone(settings);
    return change((current) => {
      current.settings = settings;
      return settings;
    });
  },
  replaceLibrary(
    snippets: Snippet[],
    nextCollections: Collection[],
    settings?: Settings,
  ) {
    snippets = clone(snippets);
    nextCollections = clone(nextCollections);
    if (settings) settings = clone(settings);
    return change((current) => {
      current.snippets = snippets;
      current.collections = nextCollections;
      if (settings) current.settings = settings;
      return null;
    });
  },
  resetToSeedData() {
    return change((current) => {
      current.snippets = clone(seedSnippets);
      current.collections = clone(collections);
      return { snippets: current.snippets, collections: current.collections };
    });
  },
  clearAllLocalData() {
    return change((current) => {
      current.snippets = [];
      current.collections = clone(collections);
      current.settings = clone(settingsDefaults);
      return { snippets: current.snippets, collections: current.collections };
    });
  },
};
