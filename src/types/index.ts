export const languages = [
  "JavaScript",
  "TypeScript",
  "React",
  "CSS",
  "HTML",
  "Python",
  "SQL",
  "Shell",
  "Git",
  "JSON",
] as const;
export type SnippetLanguage = (typeof languages)[number];
export type Theme = "dark" | "light" | "system";
export type SortBy = "updated" | "created" | "title" | "most-used";
export type Collection = {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  isSystem?: boolean;
  sortOrder: number;
};
export type CollectionInput = Pick<Collection, "name" | "description" | "color">;
export type Snippet = {
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
  source: "seed" | "user";
};
export type SnippetInput = Pick<
  Snippet,
  | "title"
  | "description"
  | "code"
  | "language"
  | "collectionId"
  | "tags"
  | "explanation"
  | "isFavorite"
>;
export type Settings = {
  theme: Theme;
  editorFontSize: "small" | "medium" | "large";
  lineWrap: boolean;
  reduceMotion: boolean;
  showLineNumbers: boolean;
  avatarBackgroundColor: string;
  avatarTextColor: string;
};
export type LibraryFilters = {
  query: string;
  collectionId: string;
  language: SnippetLanguage | "all";
  favoritesOnly: boolean;
  recentOnly: boolean;
  tags: string[];
  sortBy: SortBy;
  sortDirection: "asc" | "desc";
};
