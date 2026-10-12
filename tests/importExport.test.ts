import { describe, expect, it } from "vitest";
import { collections, seedSnippets } from "../src/data/seedLibrary";
import { makeSnapshot, mergeSnapshots, parseSnapshot, validateSnapshot } from "../src/lib/importExport";
import { settingsDefaults } from "../src/lib/repository";
describe("Import validation", () => {
  it("round-trips the complete seeded snapshot", () => {
    const data = makeSnapshot(seedSnippets, collections, settingsDefaults);
    expect(parseSnapshot(JSON.stringify(data))).toEqual(data);
    expect(data.settings).toMatchObject({ avatarBackgroundColor: "#ddc5ff", avatarTextColor: "#342c4c" });
    expect(new Set(seedSnippets.map((s) => s.id)).size).toBe(
      seedSnippets.length,
    );
  });
  it("round-trips custom six-digit avatar colors without changing the schema version", () => {
    const data = makeSnapshot(seedSnippets, collections, {
      ...settingsDefaults,
      avatarBackgroundColor: "#ABC123",
      avatarTextColor: "#012def",
    });
    expect(data.schemaVersion).toBe(1);
    expect(parseSnapshot(JSON.stringify(data))).toEqual(data);
  });
  it("defaults missing avatar fields in legacy backups without changing other data or the input", () => {
    const data = makeSnapshot(seedSnippets, collections, settingsDefaults);
    const legacySettings = {
      theme: "light",
      editorFontSize: "large",
      lineWrap: true,
      reduceMotion: true,
      showLineNumbers: false,
    };
    const legacy = { ...data, settings: legacySettings };
    const before = JSON.stringify(legacy);
    const expected = { ...data, settings: { ...settingsDefaults, ...legacySettings } };
    expect(validateSnapshot(legacy)).toEqual(expected);
    expect(parseSnapshot(before)).toEqual(expected);
    expect(JSON.stringify(legacy)).toBe(before);
  });
  it.each(["avatarBackgroundColor", "avatarTextColor"] as const)(
    "defaults only the missing %s field",
    (field) => {
      const settings: Record<string, unknown> = {
        ...settingsDefaults,
        avatarBackgroundColor: "#123456",
        avatarTextColor: "#abcdef",
      };
      delete settings[field];
      const data = { ...makeSnapshot(seedSnippets, collections, settingsDefaults), settings };
      expect(parseSnapshot(JSON.stringify(data)).settings).toEqual({
        ...settings,
        [field]: settingsDefaults[field],
      });
    },
  );
  it.each(["avatarBackgroundColor", "avatarTextColor"] as const)(
    "rejects invalid %s values rather than replacing them with defaults",
    (field) => {
      const data = makeSnapshot(seedSnippets, collections, settingsDefaults);
      for (const color of ["#abc", "#12345678", "123456", "#gggggg", "red", "", " #123456", "#123456\n", null, 123456, false, undefined]) {
        expect(() => validateSnapshot({ ...data, settings: { ...data.settings, [field]: color } })).toThrow("Invalid settings");
      }
    },
  );
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
