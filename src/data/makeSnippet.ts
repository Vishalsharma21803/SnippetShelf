import type { Snippet, SnippetInput } from "../types";
export const seed = (id: string, input: SnippetInput): Snippet => ({
  ...input,
  id,
  createdAt: "2024-05-01T10:00:00.000Z",
  updatedAt: "2024-06-12T10:00:00.000Z",
  copyCount: Math.floor(id.length * 3),
  source: "seed",
});
