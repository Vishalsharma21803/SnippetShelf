import { useRef, useState } from "react";
import { Download, FileJson, Laptop, Moon, RefreshCcw, Sun, Trash2, Upload, X } from "lucide-react";
import type { Collection, Settings, Snippet } from "../../types";
import { makeSnapshot, mergeSnapshots, parseSnapshot, type Snapshot } from "../../lib/importExport";
import { Modal } from "../../components/Modal";
import { errorMessage, Toggle } from "../../components/ui";

export function SettingsModal({ settings, snippets, filteredSnippets, collections, onClose, onSave, onReset, onClear, onImport, notify }: {
  settings: Settings; snippets: Snippet[]; filteredSnippets: Snippet[]; collections: Collection[]; onClose: () => void;
  onSave: (settings: Settings) => Promise<void>; onReset: () => Promise<void>; onClear: () => Promise<void>;
  onImport: (snippets: Snippet[], collections: Collection[], settings: Settings) => Promise<void>;
  notify: (message: string, type?: "success" | "error" | "info") => void;
}) {
  const file = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState(settings);
  const [preview, setPreview] = useState<Snapshot | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const close = () => { if (!busy) onClose(); };
  const save = async (next: Settings) => {
    setBusy(true); setError("");
    try { await onSave(next); setValue(next); }
    catch (failure) { setError(errorMessage(failure, "Could not save preferences. Try again.")); }
    finally { setBusy(false); }
  };
  const exportData = (filtered = false) => {
    try {
      const blob = new Blob([JSON.stringify(makeSnapshot(filtered ? filteredSnippets : snippets, collections, value), null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url; link.download = `snippetshelf-export-${new Date().toISOString().slice(0, 10)}.json`;
      link.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      notify("Library exported", "success");
    } catch (failure) { setError(errorMessage(failure, "Could not export the library.")); }
  };
  const readFile = async (selected?: File) => {
    if (!selected || busy) return;
    setPreview(null); setError(""); setBusy(true);
    try {
      if (selected.size > 10_000_000) throw new Error("Import must be smaller than 10 MB.");
      setPreview(parseSnapshot(await selected.text()));
    } catch (failure) { setError(`${errorMessage(failure, "Invalid import file")} Current library is unchanged.`); }
    finally { setBusy(false); }
  };
  const importPreview = async (merge = false) => {
    if (!preview || busy) return;
    setBusy(true); setError("");
    try {
      const incoming = merge ? mergeSnapshots(makeSnapshot(snippets, collections, value), preview) : preview;
      await onImport(incoming.snippets, incoming.collections, incoming.settings);
      notify(merge ? "Library merged; existing records preserved" : "Library imported", "success"); onClose();
    }
    catch (failure) { setError(errorMessage(failure, "Import failed. Try again.")); }
    finally { setBusy(false); }
  };
  const reset = async (clear: boolean) => {
    if (busy || !window.confirm(clear ? "Delete all snippets and reset preferences? Export a backup first if needed." : "Restore all demo snippets? User changes will be removed.")) return;
    setBusy(true); setError("");
    try { await (clear ? onClear() : onReset()); onClose(); }
    catch (failure) { setError(errorMessage(failure, "Could not update library data. Try again.")); }
    finally { setBusy(false); }
  };
  return <Modal label="Settings" onClose={close}><div className="settings-modal" onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); void readFile(e.dataTransfer.files[0]); }}>
    <div className="modal-head"><div><span className="eyebrow">WORKSPACE</span><h2>Settings</h2></div><button className="icon-button" aria-label="Close settings" disabled={busy} onClick={close}><X size={19} /></button></div>
    {error && <p role="alert" className="field-error">{error}</p>}
    <fieldset disabled={busy} className="editor-fields">
      <section className="settings-section"><h3>Appearance</h3>
        <div className="setting-row"><span><strong>Theme</strong><small>Choose how SnippetShelf looks</small></span><div className="segmented">{(["dark", "light", "system"] as const).map(theme => <button key={theme} className={value.theme === theme ? "active" : ""} aria-pressed={value.theme === theme} onClick={() => void save({ ...value, theme })}>{theme === "dark" ? <Moon size={14} /> : theme === "light" ? <Sun size={14} /> : <Laptop size={14} />}{theme}</button>)}</div></div>
        <div className="setting-row"><label htmlFor="avatar-background-color"><strong>Avatar background color</strong><small>Color of the circle around VS</small></label><input id="avatar-background-color" className="avatar-color-input" type="color" value={value.avatarBackgroundColor} onChange={e => void save({ ...value, avatarBackgroundColor: e.target.value })} /></div>
        <div className="setting-row"><label htmlFor="avatar-text-color"><strong>Avatar text color</strong><small>Color of the VS initials</small></label><input id="avatar-text-color" className="avatar-color-input" type="color" value={value.avatarTextColor} onChange={e => void save({ ...value, avatarTextColor: e.target.value })} /></div>
        <div className="setting-row"><span><strong>Code font size</strong><small>Comfortable reading in code panels</small></span><select aria-label="Code font size" value={value.editorFontSize} onChange={e => void save({ ...value, editorFontSize: e.target.value as Settings["editorFontSize"] })}><option value="small">Small</option><option value="medium">Medium</option><option value="large">Large</option></select></div>
        <Toggle label="Show line numbers" checked={value.showLineNumbers} onChange={showLineNumbers => void save({ ...value, showLineNumbers })} />
        <Toggle label="Reduce motion" checked={value.reduceMotion} onChange={reduceMotion => void save({ ...value, reduceMotion })} />
        <Toggle label="Wrap long code lines" checked={value.lineWrap} onChange={lineWrap => void save({ ...value, lineWrap })} />
      </section>
      <section className="settings-section"><h3>Library data</h3><div className="data-actions"><button className="data-action" onClick={() => exportData()}><Download size={17} /><span><strong>Export library</strong><small>Download versioned JSON</small></span></button><button className="data-action" onClick={() => file.current?.click()}><Upload size={17} /><span><strong>Import library</strong><small>Choose or drop a JSON backup</small></span></button><input ref={file} type="file" accept="application/json" hidden onChange={e => { void readFile(e.target.files?.[0]); e.target.value = ""; }} /></div>
        <button className="text-button mt-3" onClick={() => exportData(true)}>Export current results ({filteredSnippets.length})</button>
        {preview && <div className="import-preview mt-4 rounded-lg border border-line p-4 text-sm"><h4 className="font-semibold">Import preview</h4><p className="my-2 text-muted">{preview.snippets.length} snippets · {preview.collections.length} collections · {preview.snippets.filter(s => snippets.some(existing => existing.id === s.id)).length} matching IDs · 0 invalid records</p><p className="mb-4 text-muted">Replace removes your current library and preferences. Merge adds new IDs while keeping existing records and preferences. Conflicting collection names must be resolved before merging.</p><div className="flex flex-wrap gap-2"><button className="primary-button" onClick={() => void importPreview(true)}>Merge library</button><button className="secondary-button" onClick={() => void importPreview()}>Replace library</button><button className="secondary-button" onClick={() => setPreview(null)}>Cancel import</button></div></div>}
        <button className="reset-link" onClick={() => void reset(false)}><RefreshCcw size={14} /> Reset demo data</button><button className="danger-link" onClick={() => void reset(true)}><Trash2 size={14} /> Clear local data</button>
      </section>
    </fieldset>
    <div className="settings-note"><FileJson size={15} /> Snippets are stored locally in IndexedDB and never executed.</div>
  </div></Modal>;
}
