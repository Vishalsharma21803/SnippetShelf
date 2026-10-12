import { describe, expect, it } from "vitest";
import { collections, seedSnippets } from "../src/data/seedLibrary";
import { searchScore, selectSnippets } from "../src/lib/selectors";
import { normalizeTags, validateSnippet } from "../src/lib/validation";
import type { LibraryFilters } from "../src/types";

const base: LibraryFilters = {
  query: "",
  collectionId: "",
  language: "all",
  favoritesOnly: false,
  recentOnly: false,
  tags: [],
  sortBy: "updated",
  sortDirection: "desc",
};
describe("SnippetShelf selectors", () => {
  it("ships a complete multi-category demo library", () => {
    expect(seedSnippets.length).toBeGreaterThanOrEqual(60);
    expect(new Set(seedSnippets.map((s) => s.language)).size).toBeGreaterThan(
      6,
    );
    expect(
      seedSnippets.every((s) =>
        collections.some((c) => c.id === s.collectionId),
      ),
    ).toBe(true);
  });
  it("searches title and code case-insensitively", () => {
    expect(
      selectSnippets(seedSnippets, collections, {
        ...base,
        query: "DEBOUNCE",
      }).some((s) => s.id === "js-debounce"),
    ).toBe(true);
    expect(
      selectSnippets(seedSnippets, collections, {
        ...base,
        query: "ROW_NUMBER",
      }).some((s) => s.id === "sql-window"),
    ).toBe(true);
  });
  it("composes favorite, language, and tag filters", () => {
    const result = selectSnippets(seedSnippets, collections, {
      ...base,
      language: "React",
      favoritesOnly: true,
      tags: ["hooks"],
    });
    expect(result.length).toBeGreaterThan(0);
    expect(
      result.every(
        (s) =>
          s.language === "React" && s.isFavorite && s.tags.includes("hooks"),
      ),
    ).toBe(true);
  });
  it("does not mutate source when sorting", () => {
    const first = seedSnippets[0].id;
    selectSnippets(seedSnippets, collections, {
      ...base,
      sortBy: "title",
      sortDirection: "asc",
    });
    expect(seedSnippets[0].id).toBe(first);
  });
  it("filters collections, recency and mismatched tags without changing sources", () => {
    const first = { ...seedSnippets[0], lastUsedAt: '2026-01-01T00:00:00.000Z' };
    const second = { ...seedSnippets[1], collectionId: 'another', lastUsedAt: undefined };
    expect(selectSnippets([first, second], collections, { ...base, collectionId: first.collectionId })).toEqual([first]);
    expect(selectSnippets([first, second], collections, { ...base, recentOnly: true })).toEqual([first]);
    expect(selectSnippets([first, second], collections, { ...base, tags: ['nonexistent'] })).toEqual([]);
  });
  it("sorts copy counts and creation dates in each direction", () => {
    const early = { ...seedSnippets[0], copyCount: 2, createdAt: '2025-01-01T00:00:00.000Z' };
    const late = { ...seedSnippets[1], copyCount: 9, createdAt: '2026-01-01T00:00:00.000Z' };
    for (const sortBy of ['created', 'most-used'] as const) {
      expect(selectSnippets([late, early], collections, { ...base, sortBy, sortDirection: 'asc' })).toEqual([early, late]);
      expect(selectSnippets([early, late], collections, { ...base, sortBy, sortDirection: 'desc' })).toEqual([late, early]);
    }
  });
  it("ranks exact titles above prefixes, tags and reference code", () => {
    const item = { ...seedSnippets[0], title: 'Needle helper', tags: ['tag-only'], description: 'description-only', explanation: 'note-only', code: 'code-only' };
    expect(searchScore(item, 'needle helper')).toBe(100);
    expect(searchScore(item, 'needle')).toBe(80);
    expect(searchScore(item, 'helper')).toBe(65);
    expect(searchScore(item, 'dle')).toBe(60);
    expect(searchScore(item, 'tag-only')).toBe(50);
    expect(searchScore(item, 'description-only')).toBe(30);
    expect(searchScore(item, 'code-only')).toBe(10);
    expect(searchScore(item, 'collection-only', { ...collections[0], name: 'collection-only' })).toBe(25);
    expect(searchScore(item, 'missing')).toBe(-1);
  });
});
describe("Snippet validation", () => {
  it("normalizes and deduplicates tags", () =>
    expect(normalizeTags([" React ", "react", "", "hooks"])).toEqual([
      "react",
      "hooks",
    ]));
  it("reports required field boundaries", () =>
    expect(
      validateSnippet(
        {
          title: "x",
          description: "short",
          code: " ",
          language: "TypeScript",
          collectionId: "missing",
          tags: [],
          explanation: "",
          isFavorite: false,
        },
        collections,
      ),
    ).toEqual(
      expect.objectContaining({
        title: expect.any(String),
        description: expect.any(String),
        code: expect.any(String),
        collectionId: expect.any(String),
      }),
    ));
});
