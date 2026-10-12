import { describe, expect, it } from "vitest";
import { collections, seedSnippets } from "../src/data/seedLibrary";
import { makeSnapshot, mergeSnapshots, parseSnapshot } from "../src/lib/importExport";
import { settingsDefaults } from "../src/lib/repository";
describe("Import validation", () => {
  it("round-trips the complete seeded snapshot", () => {
    const data = makeSnapshot(seedSnippets, collections, settingsDefaults);
    expect(parseSnapshot(JSON.stringify(data))).toEqual(data);
    expect(new Set(seedSnippets.map((s) => s.id)).size).toBe(
      seedSnippets.length,
    );
  });
  it("rejects missing code and invalid references", () => {
    const data = makeSnapshot(seedSnippets, collections, settingsDefaults);
    expect(() =>
      parseSnapshot(
        JSON.stringify({
          ...data,
          snippets: [{ ...seedSnippets[0], code: null }],
        }),
      ),
    ).toThrow();
    expect(() =>
      parseSnapshot(
        JSON.stringify({
          ...data,
          snippets: [{ ...seedSnippets[0], collectionId: "missing" }],
        }),
      ),
    ).toThrow();
  });
  it("rejects duplicate IDs and settings corruption", () => {
    const data = makeSnapshot(seedSnippets, collections, settingsDefaults);
    expect(() =>
      parseSnapshot(
        JSON.stringify({
          ...data,
          snippets: [seedSnippets[0], seedSnippets[0]],
        }),
      ),
    ).toThrow();
    expect(() =>
      parseSnapshot(JSON.stringify({ ...data, settings: {} })),
    ).toThrow();
  });
});

describe("Snapshot merge", () => {
  it("adds new IDs while preserving current conflicting records and settings", () => {
    const current = makeSnapshot([seedSnippets[0]], collections, settingsDefaults);
    const extraCollection = { ...collections[0], id: "imported", name: "Imported helpers" };
    const incoming = makeSnapshot([
      { ...seedSnippets[0], title: "Conflicting title" },
      { ...seedSnippets[0], id: "new-record", collectionId: extraCollection.id },
      { ...seedSnippets[0], id: "existing-collection" },
    ], [{ ...collections[0], name: "Conflicting collection" }, extraCollection], { ...settingsDefaults, theme: "light" });
    const before = JSON.stringify({ current, incoming });
    const merged = mergeSnapshots(current, incoming);
    expect(merged.snippets).toEqual([current.snippets[0], incoming.snippets[1], incoming.snippets[2]]);
    expect(merged.collections).toEqual([...current.collections, extraCollection]);
    expect(merged.settings).toEqual(settingsDefaults);
    expect(merged.exportedAt).toBe(current.exportedAt);
    expect(parseSnapshot(JSON.stringify(merged))).toEqual(merged);
    merged.snippets[0].tags.push("mutation");
    merged.collections[0].name = "Mutation";
    expect(JSON.stringify({ current, incoming })).toBe(before);
  });

  it("rejects unresolved references and name collisions across different IDs", () => {
    const current = makeSnapshot(seedSnippets, collections, settingsDefaults);
    const incoming = makeSnapshot([{ ...seedSnippets[0], id: "new", collectionId: "missing" }], collections, settingsDefaults);
    expect(() => mergeSnapshots(current, incoming)).toThrow("Invalid fields");
    const nameCollision = makeSnapshot([], [{ ...collections[0], id: "different-id", name: ` ${collections[0].name.toUpperCase()} ` }], settingsDefaults);
    expect(() => mergeSnapshots(current, nameCollision)).toThrow("duplicate collection");
    expect(() => parseSnapshot(JSON.stringify({ ...current, collections: [] }))).toThrow("editable collection");
  });
});
