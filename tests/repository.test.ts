import { beforeEach, describe, expect, it } from "vitest";
import { repository } from "../src/lib/repository";
import { collections, seedSnippets } from "../src/data/seedLibrary";
import { settingsDefaults } from "../src/lib/repository";
import type { Collection, Settings } from "../src/types";
describe("Repository fallback", () => {
  it("keeps CRUD, copies, and favorites in session memory", async () => {
    await repository.resetToSeedData();
    const saved = await repository.saveSnippet({
      ...seedSnippets[0],
      title: "Session record",
    });
    await repository.recordCopy(saved.id);
    await repository.toggleFavorite(saved.id);
    const item = (await repository.listSnippets()).find(
      (s) => s.id === saved.id,
    )!;
    expect(item.copyCount).toBe(1);
    expect(item.isFavorite).toBe(!saved.isFavorite);
    expect(item.lastUsedAt).toBeTruthy();
    await repository.deleteSnippet(saved.id);
    expect(
      (await repository.listSnippets()).find((s) => s.id === saved.id),
    ).toBeUndefined();
  });
  it("does not reseed intentionally empty libraries", async () => {
    await repository.clearAllLocalData();
    expect((await repository.initializeLibrary()).snippets).toEqual([]);
    await repository.resetToSeedData();
    expect((await repository.listSnippets()).length).toBe(seedSnippets.length);
  });
});

describe("Collection guards and atomic changes", () => {
  const input = { name: "Project helpers", description: "Useful snippets", color: "#ABC123" };
  beforeEach(async () => { await repository.resetToSeedData(); });

  it("normalizes names, preserves IDs on edit, and deletes empty collections", async () => {
    const created = await repository.createCollection({ ...input, name: "  Project helpers  " });
    expect(created.name).toBe(input.name);
    const updated = await repository.updateCollection(created.id, { ...input, name: "Renamed helpers" });
    expect(updated).toMatchObject({ id: created.id, name: "Renamed helpers", sortOrder: created.sortOrder });
    await repository.deleteCollection(created.id);
    expect((await repository.initializeLibrary()).collections).toEqual(collections);
  });

  it("rejects blank names, invalid colors, duplicates, and missing or system targets", async () => {
    const before = await repository.initializeLibrary();
    await expect(repository.createCollection({ ...input, name: "   " })).rejects.toThrow("name is required");
    await expect(repository.createCollection({ ...input, color: "red" })).rejects.toThrow("color");
    await expect(repository.createCollection({ ...input, name: ` ${collections[0].name.toUpperCase()} ` })).rejects.toThrow("already exists");
    await expect(repository.updateCollection(collections[0].id, { ...input, name: collections[1].name.toLowerCase() })).rejects.toThrow("already exists");
    await expect(repository.updateCollection("missing", input)).rejects.toThrow("not found");
    await expect(repository.deleteCollection("missing")).rejects.toThrow("not found");
    await expect(repository.updateCollection("favorites", input)).rejects.toThrow("System");
    await expect(repository.deleteCollection("favorites")).rejects.toThrow("System");
    expect(await repository.initializeLibrary()).toEqual(before);
  });

  it("keeps populated collections and at least one editable collection", async () => {
    await expect(repository.deleteCollection(seedSnippets[0].collectionId)).rejects.toThrow("Only empty");
    await repository.replaceLibrary([], [collections[0], collections[7]]);
    await expect(repository.deleteCollection(collections[0].id)).rejects.toThrow("at least one editable");
    await expect(repository.replaceLibrary([], [collections[7]])).rejects.toThrow("at least one editable");
    const extra = await repository.createCollection(input);
    await repository.deleteCollection(collections[0].id);
    expect((await repository.initializeLibrary()).collections.map(collection => collection.id)).toEqual(["favorites", extra.id]);
  });

  it("serializes duplicate creates and rejects references to deleted collections", async () => {
    const outcomes = await Promise.allSettled([
      repository.createCollection(input),
      repository.createCollection({ ...input, name: input.name.toUpperCase() }),
    ]);
    expect(outcomes.map(result => result.status)).toEqual(["fulfilled", "rejected"]);
    const created = (await repository.initializeLibrary()).collections.find(collection => collection.name === input.name)!;
    await repository.deleteCollection(created.id);
    await expect(repository.saveSnippet({ ...seedSnippets[0], collectionId: created.id })).rejects.toThrow("Invalid fields");
    expect(await repository.listSnippets()).toEqual(seedSnippets);
  });

  it("takes ownership of imported values and preserves preferences on demo reset", async () => {
    const imported = JSON.parse(JSON.stringify(collections)) as Collection[];
    const settings: Settings = { ...settingsDefaults, theme: "light" };
    await repository.replaceLibrary([], imported, settings);
    imported[0].name = "External mutation";
    settings.theme = "dark";
    expect((await repository.initializeLibrary()).collections).toEqual(collections);
    await repository.resetToSeedData();
    expect((await repository.getSettings()).theme).toBe("light");
    await repository.clearAllLocalData();
    expect(await repository.getSettings()).toEqual(settingsDefaults);
    expect(await repository.listSnippets()).toEqual([]);
  });
});
