import type { Collection, LibraryFilters, Snippet } from "../types";

export const normalize = (value: string) =>
  value.toLocaleLowerCase().trim().replace(/\s+/g, " ");
export const searchScore = (
  snippet: Snippet,
  query: string,
  collection?: Collection,
) => {
  const q = normalize(query);
  if (!q) return 0;
  const title = normalize(snippet.title);
  const tags = snippet.tags.map(normalize);
  if (title === q) return 100;
  if (title.startsWith(q)) return 80;
  if (title.split(" ").some((word) => word.startsWith(q))) return 65;
  if (title.includes(q)) return 60;
  if (
    tags.some((tag) => tag.includes(q)) ||
    normalize(snippet.language).includes(q)
  )
    return 50;
  const description = normalize(
    `${snippet.description} ${snippet.explanation}`,
  );
  if (description.includes(q)) return 30;
  if (normalize(snippet.code).includes(q)) return 10;
  if (collection && normalize(collection.name).includes(q)) return 25;
  return -1;
};
export const selectSnippets = (
  snippets: Snippet[],
  collections: Collection[],
  filters: LibraryFilters,
) => {
  const getCollection = (snippet: Snippet) =>
    collections.find((item) => item.id === snippet.collectionId);
  return snippets
    .filter((snippet) => {
      const score = searchScore(snippet, filters.query, getCollection(snippet));
      if (filters.query && score < 0) return false;
      if (filters.collectionId && snippet.collectionId !== filters.collectionId)
        return false;
      if (filters.language !== "all" && snippet.language !== filters.language)
        return false;
      if (filters.favoritesOnly && !snippet.isFavorite) return false;
      if (filters.recentOnly && !snippet.lastUsedAt) return false;
      if (
        filters.tags.length &&
        !filters.tags.every((tag) => snippet.tags.includes(tag))
      )
        return false;
      return true;
    })
    .sort((a, b) => {
      const score = filters.query
        ? searchScore(b, filters.query, getCollection(b)) -
          searchScore(a, filters.query, getCollection(a))
        : 0;
      if (score) return score;
      let comparison = 0;
      if (filters.sortBy === "title")
        comparison = a.title.localeCompare(b.title);
      if (filters.sortBy === "most-used")
        comparison = a.copyCount - b.copyCount;
      if (filters.sortBy === "created")
        comparison = a.createdAt.localeCompare(b.createdAt);
      if (filters.sortBy === "updated")
        comparison = a.updatedAt.localeCompare(b.updatedAt);
      return filters.sortDirection === "asc" ? comparison : -comparison;
    });
};
export const allTags = (snippets: Snippet[]) =>
  [...new Set(snippets.flatMap((item) => item.tags))].sort();
export const relatedSnippets = (selected: Snippet, snippets: Snippet[]) =>
  snippets
    .filter(
      (item) =>
        item.id !== selected.id &&
        (item.language === selected.language ||
          item.tags.some((tag) => selected.tags.includes(tag))),
    )
    .slice(0, 4);
