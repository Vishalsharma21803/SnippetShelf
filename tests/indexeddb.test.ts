import "fake-indexeddb/auto";
import { IDBDatabase, IDBFactory, IDBObjectStore } from "fake-indexeddb";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { seedSnippets, collections } from "../src/data/seedLibrary";
import { makeSnapshot, mergeSnapshots } from "../src/lib/importExport";

beforeEach(() => {
  vi.resetModules();
  vi.stubGlobal("indexedDB", new IDBFactory());
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

async function storedLibrary(value?: unknown) {
  const db = await new Promise<globalThis.IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open("snippetshelf-library", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("workspace");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  try {
    return await new Promise<unknown>((resolve, reject) => {
      const transaction = db.transaction("workspace", value === undefined ? "readonly" : "readwrite");
      const store = transaction.objectStore("workspace");
      const request = value === undefined ? store.get("library") : store.put(value, "library");
      transaction.oncomplete = () => resolve(request.result);
      transaction.onabort = transaction.onerror = () => reject(transaction.error);
    });
  } finally { db.close(); }
}

function abortNextWrite() {
  const original = IDBObjectStore.prototype.put;
  vi.spyOn(IDBObjectStore.prototype, "put").mockImplementationOnce(function (this: IDBObjectStore, ...args) {
    const request = original.apply(this, args);
    this.transaction.abort();
    return request;
  });
}

describe("IndexedDB persistence", () => {
  it("retains edits, copy counts, settings, and intentionally empty data after module reload", async () => {
    const { repository } = await import("../src/lib/repository");
    await repository.initializeLibrary();
    expect(repository.storageFallback).toBe(false);
    const item = await repository.saveSnippet({
      ...seedSnippets[0],
      title: "Persistent custom snippet",
    });
    await repository.recordCopy(item.id);
    await repository.saveSettings({
      theme: "light",
      lineWrap: true,
      showLineNumbers: false,
      reduceMotion: true,
      editorFontSize: "large",
      avatarBackgroundColor: "#123abc",
      avatarTextColor: "#ABCDEF",
    });
    vi.resetModules();
    const { repository: reopened } = await import("../src/lib/repository");
    expect(
      (await reopened.listSnippets()).find((s) => s.id === item.id),
    ).toMatchObject({ title: "Persistent custom snippet", copyCount: 1 });
    expect(await reopened.getSettings()).toMatchObject({
      theme: "light",
      lineWrap: true,
      avatarBackgroundColor: "#123abc",
      avatarTextColor: "#ABCDEF",
    });
    await reopened.replaceLibrary([], collections);
    vi.resetModules();
    const { repository: empty } = await import("../src/lib/repository");
    expect((await empty.initializeLibrary()).snippets).toEqual([]);
    expect(empty.storageFallback).toBe(false);
  });

  it("persists default avatar colors on first launch", async () => {
    const { repository, settingsDefaults } = await import("../src/lib/repository");
    expect(await repository.getSettings()).toEqual(settingsDefaults);
    expect(await storedLibrary()).toMatchObject({ settings: {
      avatarBackgroundColor: "#ddc5ff",
      avatarTextColor: "#342c4c",
    } });
  });

  it("loads legacy saved settings with avatar defaults and preserves the entire library", async () => {
    const legacy = {
      snippets: [{ ...seedSnippets[0], title: "Keep saved edits", copyCount: 9 }],
      collections: collections.map(collection => ({ ...collection, description: "Keep saved collection" })),
      settings: { theme: "light", editorFontSize: "large", lineWrap: true, reduceMotion: true, showLineNumbers: false },
    };
    await storedLibrary(legacy);
    const { repository } = await import("../src/lib/repository");
    expect(await repository.initializeLibrary()).toEqual({ snippets: legacy.snippets, collections: legacy.collections });
    const expectedSettings = { ...legacy.settings, avatarBackgroundColor: "#ddc5ff", avatarTextColor: "#342c4c" };
    expect(await repository.getSettings()).toEqual(expectedSettings);
    expect(await storedLibrary()).toEqual(legacy);
    await repository.saveSettings(await repository.getSettings());
    expect(await storedLibrary()).toEqual({ ...legacy, settings: expectedSettings });
    vi.resetModules();
    const { repository: reopened } = await import("../src/lib/repository");
    expect(await reopened.getSettings()).toEqual(expectedSettings);
    expect(await reopened.initializeLibrary()).toEqual({ snippets: legacy.snippets, collections: legacy.collections });
  });

  it.each(["avatarBackgroundColor", "avatarTextColor"] as const)(
    "rejects invalid %s saves without changing memory or persistence",
    async (field) => {
      const { repository } = await import("../src/lib/repository");
      const before = await repository.getSettings();
      const saved = await storedLibrary();
      await expect(repository.saveSettings({ ...before, [field]: "#abc" })).rejects.toThrow("Invalid settings");
      expect(await repository.getSettings()).toEqual(before);
      expect(await storedLibrary()).toEqual(saved);
    },
  );

  it("rejects invalid stored avatar colors without overwriting the saved library", async () => {
    const { settingsDefaults } = await import("../src/lib/repository");
    const invalid = { snippets: seedSnippets, collections, settings: { ...settingsDefaults, avatarTextColor: null } };
    await storedLibrary(invalid);
    vi.resetModules();
    const { repository } = await import("../src/lib/repository");
    await expect(repository.initializeLibrary()).rejects.toThrow("Invalid settings");
    expect(await storedLibrary()).toEqual(invalid);
    expect(repository.storageFallback).toBe(false);
  });

  it("keeps avatar settings atomic when persistence fails and permits retry", async () => {
    const { repository } = await import("../src/lib/repository");
    const before = await repository.getSettings();
    const saved = await storedLibrary();
    const next = { ...before, avatarBackgroundColor: "#123456", avatarTextColor: "#abcdef" };
    abortNextWrite();
    await expect(repository.saveSettings(next)).rejects.toThrow();
    expect(await repository.getSettings()).toEqual(before);
    expect(await storedLibrary()).toEqual(saved);
    await repository.saveSettings(next);
    expect(await repository.getSettings()).toEqual(next);
    expect(await storedLibrary()).toMatchObject({ settings: next });
  });

  it("persists collection CRUD and merged snapshots across reloads", async () => {
    const { repository, settingsDefaults } = await import("../src/lib/repository");
    const created = await repository.createCollection({ name: "My helpers", description: "Personal collection", color: "#123abc" });
    await repository.updateCollection(created.id, { name: "Renamed helpers", description: "Updated collection", color: "#abcdef" });
    const library = await repository.initializeLibrary();
    const incoming = makeSnapshot([{ ...seedSnippets[0], id: "imported-snippet", collectionId: created.id }], library.collections, settingsDefaults);
    const merged = mergeSnapshots(makeSnapshot(library.snippets, library.collections, settingsDefaults), incoming);
    await repository.replaceLibrary(merged.snippets, merged.collections, merged.settings);
    vi.resetModules();
    const { repository: reopened } = await import("../src/lib/repository");
    expect((await reopened.initializeLibrary()).collections.find(collection => collection.id === created.id)).toMatchObject({ name: "Renamed helpers", color: "#abcdef" });
    await expect(reopened.deleteCollection(created.id)).rejects.toThrow("Only empty");
    await reopened.deleteSnippet("imported-snippet");
    await reopened.deleteCollection(created.id);
    vi.resetModules();
    const { repository: deleted } = await import("../src/lib/repository");
    expect((await deleted.initializeLibrary()).collections.some(collection => collection.id === created.id)).toBe(false);
  });

  it("rejects aborted writes without changing memory or persisted records, then permits retry", async () => {
    const { repository } = await import("../src/lib/repository");
    const before = await repository.initializeLibrary();
    const persisted = await storedLibrary();
    abortNextWrite();
    await expect(repository.createCollection({ name: "Not saved", description: "", color: "#123456" })).rejects.toThrow();
    expect(await repository.initializeLibrary()).toEqual(before);
    expect(await storedLibrary()).toEqual(persisted);
    expect(repository.storageFallback).toBe(false);
    await repository.createCollection({ name: "Saved on retry", description: "", color: "#123456" });
    expect((await repository.initializeLibrary()).collections).toHaveLength(before.collections.length + 1);
  });

  it("keeps replacement, reset, and clear atomic when persistence fails", async () => {
    const { repository } = await import("../src/lib/repository");
    await repository.saveSnippet({ ...seedSnippets[0], title: "Keep custom changes" });
    const before = await repository.initializeLibrary();
    const saved = await storedLibrary();
    for (const action of [
      () => repository.replaceLibrary([], collections),
      () => repository.resetToSeedData(),
      () => repository.clearAllLocalData(),
    ]) {
      abortNextWrite();
      await expect(action()).rejects.toThrow();
      expect(await repository.initializeLibrary()).toEqual(before);
      expect(await storedLibrary()).toEqual(saved);
    }
  });

  it("retries failed initial seeding instead of reporting unsaved success", async () => {
    const { repository } = await import("../src/lib/repository");
    abortNextWrite();
    await expect(repository.initializeLibrary()).rejects.toThrow();
    expect(await storedLibrary()).toBeUndefined();
    expect(repository.storageFallback).toBe(false);
    expect((await repository.initializeLibrary()).snippets).toEqual(seedSnippets);
    expect(await storedLibrary()).toMatchObject({ snippets: seedSnippets });
  });

  it("does not overwrite existing data after a read failure or corrupt saved record", async () => {
    const { repository } = await import("../src/lib/repository");
    await repository.clearAllLocalData();
    const saved = await storedLibrary();
    vi.resetModules();
    const { repository: reopened } = await import("../src/lib/repository");
    vi.spyOn(IDBDatabase.prototype, "transaction").mockImplementationOnce(() => { throw new Error("Read failed"); });
    await expect(reopened.initializeLibrary()).rejects.toThrow("Read failed");
    expect(reopened.storageFallback).toBe(false);
    expect(await storedLibrary()).toEqual(saved);
    expect((await reopened.initializeLibrary()).snippets).toEqual([]);

    const corrupt = { snippets: [], collections: "corrupt", settings: {} };
    await storedLibrary(corrupt);
    vi.resetModules();
    const { repository: invalid } = await import("../src/lib/repository");
    await expect(invalid.initializeLibrary()).rejects.toThrow("Unsupported");
    expect(await storedLibrary()).toEqual(corrupt);
  });
});
