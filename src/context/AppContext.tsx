import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Collection, CollectionInput, Settings, Snippet, SnippetInput } from "../types";
import { repository, settingsDefaults } from "../lib/repository";
import { collections as seedCollections } from "../data/collections";

type Toast = {
  id: number;
  message: string;
  type: "success" | "error" | "info";
};
type AppContextValue = {
  snippets: Snippet[];
  collections: Collection[];
  settings: Settings;
  loading: boolean;
  error: string | null;
  storageFallback: boolean;
  toasts: Toast[];
  createSnippet: (input: SnippetInput) => Promise<Snippet>;
  updateSnippet: (id: string, input: SnippetInput) => Promise<Snippet>;
  deleteSnippet: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  recordCopy: (id: string) => Promise<void>;
  createCollection: (input: CollectionInput) => Promise<Collection>;
  updateCollection: (id: string, input: CollectionInput) => Promise<void>;
  deleteCollection: (id: string) => Promise<void>;
  saveSettings: (settings: Settings) => Promise<void>;
  resetData: () => Promise<void>;
  clearData: () => Promise<void>;
  importData: (
    snippets: Snippet[],
    collections: Collection[],
    settings: Settings,
  ) => Promise<void>;
  notify: (message: string, type?: Toast["type"]) => void;
  dismissToast: (id: number) => void;
};
const Context = createContext<AppContextValue | null>(null);
export function AppProvider({ children }: { children: ReactNode }) {
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [collections, setCollections] = useState<Collection[]>(seedCollections);
  const [settings, setSettingsState] = useState<Settings>(settingsDefaults);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [storageFallback, setStorageFallback] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const notify = useCallback(
    (message: string, type: Toast["type"] = "info") => {
      const id = Date.now() + Math.random();
      setToasts((value) => [...value, { id, message, type }]);
      window.setTimeout(
        () => setToasts((value) => value.filter((item) => item.id !== id)),
        3500,
      );
    },
    [],
  );
  useEffect(() => {
    let alive = true;
    Promise.all([repository.initializeLibrary(), repository.getSettings()])
      .then(([library, loadedSettings]) => {
        if (!alive) return;
        setSnippets(library.snippets);
        setCollections(library.collections);
        setSettingsState(loadedSettings);
        setStorageFallback(repository.storageFallback);
      })
      .catch(() => {
        if (alive)
          setError("Could not load your library. Refresh to try again.");
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);
  const createSnippet = useCallback(async (input: SnippetInput) => {
    const item = await repository.saveSnippet(input);
    setSnippets((value) => [item, ...value]);
    return item;
  }, []);
  const updateSnippet = useCallback(async (id: string, input: SnippetInput) => {
    const item = await repository.saveSnippet(input, id);
    setSnippets((value) =>
      value.map((current) => (current.id === id ? item : current)),
    );
    return item;
  }, []);
  const deleteSnippet = useCallback(async (id: string) => {
    await repository.deleteSnippet(id);
    setSnippets((value) => value.filter((item) => item.id !== id));
  }, []);
  const toggleFavorite = useCallback(async (id: string) => {
    const item = await repository.toggleFavorite(id);
    setSnippets((value) =>
      value.map((current) => (current.id === id ? item : current)),
    );
  }, []);
  const recordCopy = useCallback(async (id: string) => {
    const item = await repository.recordCopy(id);
    setSnippets((value) =>
      value.map((current) => (current.id === id ? item : current)),
    );
  }, []);
  const saveSettings = useCallback(async (value: Settings) => {
    await repository.saveSettings(value);
    setSettingsState(value);
  }, []);
  const createCollection = useCallback(async (input: CollectionInput) => {
    const item = await repository.createCollection(input);
    setCollections(value => [...value, item]);
    return item;
  }, []);
  const updateCollection = useCallback(async (id: string, input: CollectionInput) => {
    const item = await repository.updateCollection(id, input);
    setCollections(value => value.map(collection => collection.id === id ? item : collection));
  }, []);
  const deleteCollection = useCallback(async (id: string) => {
    await repository.deleteCollection(id);
    setCollections(value => value.filter(collection => collection.id !== id));
  }, []);
  const resetData = useCallback(async () => {
    const library = await repository.resetToSeedData();
    setSnippets(library.snippets);
    setCollections(library.collections);
    notify("Demo library restored", "success");
  }, [notify]);
  const clearData = useCallback(async () => {
    const library = await repository.clearAllLocalData();
    setSnippets(library.snippets);
    setCollections(library.collections);
    setSettingsState(settingsDefaults);
    notify("Local library cleared", "success");
  }, [notify]);
  const importData = useCallback(
    async (
      nextSnippets: Snippet[],
      nextCollections: Collection[],
      nextSettings: Settings,
    ) => {
      await repository.replaceLibrary(
        nextSnippets,
        nextCollections,
        nextSettings,
      );
      setSnippets(nextSnippets);
      setCollections(nextCollections);
      setSettingsState(nextSettings);
    },
    [],
  );
  const value = useMemo(
    () => ({
      snippets,
      collections,
      settings,
      loading,
      error,
      storageFallback: storageFallback || repository.storageFallback,
      toasts,
      createSnippet,
      updateSnippet,
      deleteSnippet,
      toggleFavorite,
      recordCopy,
      createCollection,
      updateCollection,
      deleteCollection,
      saveSettings,
      resetData,
      clearData,
      importData,
      notify,
      dismissToast: (id: number) =>
        setToasts((value) => value.filter((item) => item.id !== id)),
    }),
    [
      snippets,
      collections,
      settings,
      loading,
      error,
      storageFallback,
      toasts,
      createSnippet,
      updateSnippet,
      deleteSnippet,
      toggleFavorite,
      recordCopy,
      createCollection,
      updateCollection,
      deleteCollection,
      saveSettings,
      resetData,
      clearData,
      importData,
      notify,
    ],
  );
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export const useApp = () => {
  const context = useContext(Context);
  if (!context) throw new Error("useApp must be inside AppProvider");
  return context;
};
