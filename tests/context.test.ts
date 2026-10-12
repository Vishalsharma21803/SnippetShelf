import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppProvider, useApp } from "../src/context/AppContext";
import { repository } from "../src/lib/repository";

beforeEach(async () => { await repository.resetToSeedData(); });
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe("Collection context actions", () => {
  it("publishes copy, favorite, settings, import, clear and reset results", async () => {
    const { result } = renderHook(useApp, { wrapper: AppProvider });
    await waitFor(() => expect(result.current.loading).toBe(false));
    const initial = result.current.snippets[0];
    const collections = result.current.collections;
    await act(async () => { await result.current.recordCopy(initial.id); });
    expect(result.current.snippets.find(s => s.id === initial.id)?.copyCount).toBe(initial.copyCount + 1);
    await act(async () => { await result.current.toggleFavorite(initial.id); });
    expect(result.current.snippets.find(s => s.id === initial.id)?.isFavorite).toBe(!initial.isFavorite);
    const settings = { ...result.current.settings, theme: 'light' as const };
    await act(async () => { await result.current.saveSettings(settings); });
    expect(result.current.settings.theme).toBe('light');
    await act(async () => { await result.current.importData([initial], collections, settings); });
    expect(result.current.snippets).toEqual([initial]);
    await act(async () => { await result.current.clearData(); });
    expect(result.current.snippets).toEqual([]);
    expect(result.current.settings.theme).toBe('dark');
    await act(async () => { await result.current.resetData(); });
    expect(result.current.snippets).toHaveLength(67);
    act(() => { result.current.toasts.forEach(toast => result.current.dismissToast(toast.id)); });
    expect(result.current.toasts).toHaveLength(0);
  });
  it("publishes saved collections and retains state on rejected writes", async () => {
    const { result } = renderHook(useApp, { wrapper: AppProvider });
    await waitFor(() => expect(result.current.loading).toBe(false));
    const input = { name: "Context helpers", description: "For this workspace", color: "#123456" };
    let id = "";
    await act(async () => { id = (await result.current.createCollection(input)).id; });
    expect(result.current.collections.find(collection => collection.id === id)).toMatchObject(input);
    await act(async () => { expect(await result.current.updateCollection(id, { ...input, name: "Updated helpers" })).toBeUndefined(); });
    expect(result.current.collections.find(collection => collection.id === id)?.name).toBe("Updated helpers");
    const before = result.current.collections;
    vi.spyOn(repository, "deleteCollection").mockRejectedValueOnce(new Error("Storage full"));
    await act(async () => { await expect(result.current.deleteCollection(id)).rejects.toThrow("Storage full"); });
    expect(result.current.collections).toBe(before);
    await act(async () => { expect(await result.current.deleteCollection(id)).toBeUndefined(); });
    expect(result.current.collections.some(collection => collection.id === id)).toBe(false);
    expect(result.current.collections).toEqual((await repository.initializeLibrary()).collections);
  });
});
