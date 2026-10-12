import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft, Code2, LayoutGrid, Plus, Settings } from "lucide-react";
import { useApp } from "./context/AppContext";
import type { Snippet } from "./types";
import { allTags, selectSnippets } from "./lib/selectors";
import { cn, errorMessage } from "./components/ui";
import { AppHeader } from "./components/AppHeader";
import { ToastRegion } from "./components/ToastRegion";
import { ResizableWorkspace } from "./components/ResizableWorkspace";
import { LibraryNavigation } from "./features/library/LibraryNavigation";
import { initialFilters, LibraryResults } from "./features/library/LibraryResults";
import { SnippetDetail } from "./features/snippets/SnippetDetail";
import { SnippetEditor } from "./features/snippets/SnippetEditor";
import { SettingsModal } from "./features/settings/SettingsModal";
import { CollectionManager } from "./features/collections/CollectionManager";
import { CommandPalette } from "./features/commands/CommandPalette";

type Dialog = { type: "editor"; id: string | null } | { type: "settings" | "commands" | "collections" } | null;

export default function App() {
  const app = useApp();
  const [filters, setFilters] = useState(initialFilters);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [mobilePanel, setMobilePanel] = useState<"list" | "detail">("list");
  const [mobileNav, setMobileNav] = useState(false);
  const [reading, setReading] = useState(false);
  const [systemDark, setSystemDark] = useState(() => window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? true);
  useEffect(() => {
    const media = window.matchMedia?.("(prefers-color-scheme: dark)");
    const update = () => setSystemDark(media?.matches ?? true);
    media?.addEventListener("change", update);
    return () => media?.removeEventListener("change", update);
  }, []);
  const runAction = useCallback(async (action: () => Promise<unknown>, fallback: string) => {
    try { await action(); } catch (error) { app.notify(errorMessage(error, fallback), "error"); }
  }, [app]);
  const copySnippet = useCallback(async (snippet: Snippet) => {
    try {
      if (!navigator.clipboard) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(snippet.code);
    } catch {
      const code = document.querySelector(".code-view code");
      if (code) { const range = document.createRange(); range.selectNodeContents(code); window.getSelection()?.removeAllRanges(); window.getSelection()?.addRange(range); }
      app.notify("Clipboard unavailable — code selected for manual copying", "error");
      return;
    }
    app.notify("Code copied to clipboard", "success");
    await runAction(() => app.recordCopy(snippet.id), "Code copied, but usage could not be saved.");
  }, [app, runAction]);
  const results = useMemo(() => selectSnippets(app.snippets, app.collections, filters), [app.snippets, app.collections, filters]);
  const selected = results.find(item => item.id === selectedId) ?? results[0] ?? null;
  const tags = useMemo(() => allTags(app.snippets), [app.snippets]);
  useEffect(() => {
    if (!selectedId && results[0]) setSelectedId(results[0].id);
    if (selectedId && !app.snippets.some(item => item.id === selectedId)) setSelectedId(results[0]?.id ?? null);
    if (filters.collectionId && !app.collections.some(c => c.id === filters.collectionId)) setFilters(value => ({ ...value, collectionId: "" }));
    if (!selected) setReading(false);
  }, [results, selected, selectedId, app.snippets, app.collections, filters.collectionId]);
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.isComposing || event.repeat || dialog || document.querySelector('[aria-modal="true"]')) return;
      const target = event.target as HTMLElement;
      const typing = ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) || target.isContentEditable;
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); setDialog({ type: "commands" }); return; }
      if (typing || event.ctrlKey || event.metaKey || event.altKey) return;
      if (event.key === "Escape") { setReading(false); setMobileNav(false); return; }
      if (event.key === "/") { event.preventDefault(); document.querySelector<HTMLInputElement>("#global-search")?.focus(); }
      if (event.key === "?") setDialog({ type: "commands" });
      if (event.key.toLowerCase() === "n") setDialog({ type: "editor", id: null });
      if (event.key.toLowerCase() === "e" && selected) setDialog({ type: "editor", id: selected.id });
      if (event.key.toLowerCase() === "f" && selected) void runAction(() => app.toggleFavorite(selected.id), "Could not update favorite.");
      if (event.key.toLowerCase() === "c" && selected) void copySnippet(selected);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selected, app, copySnippet, dialog, runAction]);
  const choose = (snippet: Snippet) => {
    if (!results.some(item => item.id === snippet.id)) setFilters(initialFilters);
    setSelectedId(snippet.id); setMobilePanel("detail");
  };
  const newSnippet = () => { setMobileNav(false); setDialog({ type: "editor", id: null }); };
  const favorite = (id: string) => void runAction(() => app.toggleFavorite(id), "Could not update favorite.");
  const theme = app.settings.theme === "system" ? systemDark ? "dark" : "light" : app.settings.theme;
  return <div className={cn("min-h-screen bg-ink text-slate-100", theme === "light" && "light-theme", app.settings.reduceMotion && "reduce-motion")}>
    <AppHeader query={filters.query} onQuery={query => { setFilters(value => ({ ...value, query })); setReading(false); setMobilePanel("list"); }} onMenu={() => { setReading(false); setMobileNav(true); }} onCommands={() => setDialog({ type: "commands" })} theme={theme} onTheme={() => void runAction(() => app.saveSettings({ ...app.settings, theme: theme === "dark" ? "light" : "dark" }), "Could not save theme.")} />
    <div className="pr-banner"><h2><span className="pr-banner-mark" aria-hidden="true" />PR number two</h2></div>
    <ResizableWorkspace reading={reading}
      navigation={<LibraryNavigation filters={filters} setFilters={setFilters} collections={app.collections} snippets={app.snippets} open={mobileNav} onClose={() => { setMobileNav(false); setMobilePanel("list"); }} onNew={newSnippet} onSettings={() => { setMobileNav(false); setDialog({ type: "settings" }); }} onCommands={() => { setMobileNav(false); setDialog({ type: "commands" }); }} onCollections={() => { setMobileNav(false); setDialog({ type: "collections" }); }} />}
      results={<LibraryResults filters={filters} setFilters={setFilters} collections={app.collections} results={results} selectedId={selected?.id} tags={tags} total={app.snippets.length} loading={app.loading} error={app.error} storageFallback={app.storageFallback} showingDetail={mobilePanel === "detail"} onChoose={choose} onFavorite={favorite} onNew={newSnippet} onSettings={() => setDialog({ type: "settings" })} />}
      detail={<aside id="snippet-detail" className={cn("detail-panel", mobilePanel === "list" && !reading && "mobile-hidden")} aria-label="Snippet details"><div className="detail-mobile-head"><button className="back-button" onClick={() => { setMobilePanel("list"); setReading(false); }}><ChevronLeft size={18} /> Back to library</button></div>
        {selected ? <SnippetDetail snippet={selected} snippets={app.snippets} collections={app.collections} settings={app.settings} reading={reading} onReading={() => setReading(value => !value)} onCopy={() => void copySnippet(selected)} onFavorite={() => favorite(selected.id)} onEdit={() => setDialog({ type: "editor", id: selected.id })} onDelete={() => {
          if (!window.confirm(`Delete “${selected.title}”? This cannot be undone.`)) return;
          void runAction(async () => { await app.deleteSnippet(selected.id); setSelectedId(null); app.notify("Snippet deleted", "success"); }, "Could not delete snippet.");
        }} onRelated={choose} /> : <div className="no-detail"><Code2 size={32} /><h2>Select a snippet</h2><p>Choose a result to inspect its code and context.</p></div>}
      </aside>}
    />
    <nav className="mobile-nav"><button className={mobilePanel === "list" ? "active" : ""} onClick={() => { setMobilePanel("list"); setReading(false); }}><LayoutGrid size={18} />Browse</button><button onClick={newSnippet}><Plus size={18} />Create</button><button onClick={() => setDialog({ type: "settings" })}><Settings size={18} />Settings</button></nav>
    {dialog?.type === "editor" && <SnippetEditor snippet={dialog.id ? app.snippets.find(s => s.id === dialog.id) : undefined} collections={app.collections} settings={app.settings} onClose={() => setDialog(null)} onSave={async input => {
      if (dialog.id) { await app.updateSnippet(dialog.id, input); app.notify("Snippet updated", "success"); setSelectedId(dialog.id); }
      else { const created = await app.createSnippet(input); setFilters(initialFilters); app.notify("Snippet created", "success"); setSelectedId(created.id); }
      setDialog(null);
    }} />}
    {dialog?.type === "settings" && <SettingsModal settings={app.settings} snippets={app.snippets} filteredSnippets={results} collections={app.collections} onClose={() => setDialog(null)} onSave={app.saveSettings} onReset={app.resetData} onClear={app.clearData} onImport={app.importData} notify={app.notify} />}
    {dialog?.type === "collections" && <CollectionManager collections={app.collections} snippets={app.snippets} onCreate={app.createCollection} onUpdate={app.updateCollection} onDelete={app.deleteCollection} onClose={() => setDialog(null)} />}
    {dialog?.type === "commands" && <CommandPalette onClose={() => setDialog(null)} onNew={newSnippet} onSettings={() => setDialog({ type: "settings" })} onCollections={() => setDialog({ type: "collections" })} onSearch={() => { setDialog(null); setReading(false); setMobilePanel("list"); window.setTimeout(() => document.querySelector<HTMLInputElement>("#global-search")?.focus(), 0); }} />}
    <ToastRegion toasts={app.toasts} onDismiss={app.dismissToast} />
  </div>;
}
