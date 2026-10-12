import type { Collection, CollectionInput, SnippetInput } from "../types";
import { languages } from "../types";
export const validCollectionColor = (color: string) => /^#[0-9a-f]{6}$/i.test(color);
export const collectionNameKey = (name: string) => name.trim().toLowerCase();
export function normalizeCollectionInput(
  input: CollectionInput,
  collections: Collection[],
  id?: string,
): CollectionInput {
  const name = input.name.trim();
  if (!name) throw new Error("Collection name is required.");
  if (collections.some(collection => collection.id !== id &&
    collectionNameKey(collection.name) === collectionNameKey(name)))
    throw new Error("A collection with this name already exists.");
  if (!validCollectionColor(input.color))
    throw new Error("Choose a valid six-digit hex collection color.");
  return { name, description: input.description.trim(), color: input.color };
}
export type FieldErrors = Partial<Record<keyof SnippetInput, string>>;
export const normalizeTags = (tags: string[]) =>
  [
    ...new Set(tags.map((tag) => tag.trim().toLowerCase()).filter(Boolean)),
  ];
export const validateSnippet = (
  input: SnippetInput,
  collections: Collection[],
): FieldErrors => {
  const errors: FieldErrors = {};
  if (input.title.trim().length < 2 || input.title.trim().length > 100)
    errors.title = "Title must be 2–100 characters.";
  if (
    input.description.trim().length < 10 ||
    input.description.trim().length > 240
  )
    errors.description = "Description must be 10–240 characters.";
  if (!input.code.trim()) errors.code = "Code cannot be empty.";
  if (!languages.includes(input.language))
    errors.language = "Choose a supported language.";
  if (!collections.some((collection) => collection.id === input.collectionId))
    errors.collectionId = "Choose an existing collection.";
  if (input.tags.length > 8) errors.tags = "Use up to 8 tags.";
  if (input.explanation.length > 5000)
    errors.explanation = "Explanation must be under 5,000 characters.";
  return errors;
};
