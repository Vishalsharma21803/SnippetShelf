import { useState } from "react";
import { Edit3, Plus, Trash2, X } from "lucide-react";
import type { Collection, Snippet } from "../../types";
import { Modal } from "../../components/Modal";
import { errorMessage } from "../../components/ui";

type CollectionForm = Pick<Collection, "name" | "description" | "color">;
const emptyForm: CollectionForm = { name: "", description: "", color: "#79e2c0" };

export function CollectionManager({ collections, snippets, onCreate, onUpdate, onDelete, onClose }: {
  collections: Collection[]; snippets: Snippet[];
  onCreate: (input: CollectionForm) => Promise<Collection>;
  onUpdate: (id: string, input: CollectionForm) => Promise<void>;
  onDelete: (id: string) => Promise<void>; onClose: () => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const editable = collections.filter(collection => !collection.isSystem);
  const reset = () => { setEditingId(null); setForm(emptyForm); setError(""); };
  const close = () => {
    if (busy) return;
    const original = editable.find(c => c.id === editingId) ?? emptyForm;
    const dirty = form.name !== original.name || form.description !== original.description || form.color !== original.color;
    if (dirty && !window.confirm("Discard unsaved collection changes?")) return;
    onClose();
  };
  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;
    const input = { ...form, name: form.name.trim(), description: form.description.trim() };
    if (!input.name) { setError("Collection name is required."); return; }
    setBusy(true); setError(""); setStatus("");
    try {
      if (editingId) await onUpdate(editingId, input); else await onCreate(input);
      setStatus(editingId ? "Collection updated." : "Collection created."); reset();
    } catch (failure) { setError(errorMessage(failure, "Could not save collection. Your draft is still available.")); }
    finally { setBusy(false); }
  };
  const remove = async (collection: Collection) => {
    if (busy || editable.length <= 1 || snippets.some(s => s.collectionId === collection.id)) return;
    if (!window.confirm(`Delete empty collection “${collection.name}”?`)) return;
    setBusy(true); setError(""); setStatus("");
    try { await onDelete(collection.id); if (editingId === collection.id) reset(); setStatus("Collection deleted."); }
    catch (failure) { setError(errorMessage(failure, "Could not delete collection.")); }
    finally { setBusy(false); }
  };
  return <Modal label="Manage collections" onClose={close}><div className="settings-modal collection-manager">
    <div className="modal-head"><div><span className="eyebrow">ORGANIZE YOUR LIBRARY</span><h2>Manage collections</h2></div><button className="icon-button" aria-label="Close collections" disabled={busy} onClick={close}><X size={19} /></button></div>
    <p className="text-sm text-muted mb-4">Only empty collections can be deleted. Move snippets to another collection using Edit snippet first. Keep at least one collection.</p>
    <ul className="collection-list">{editable.map(collection => {
      const count = snippets.filter(s => s.collectionId === collection.id).length;
      const reason = count ? "Move snippets to another collection before deleting." : editable.length <= 1 ? "Keep at least one collection." : "Delete empty collection";
      return <li key={collection.id}><span className="collection-dot" style={{ background: collection.color }} /><div className="min-w-0 flex-1"><strong>{collection.name}</strong><small>{count} {count === 1 ? "snippet" : "snippets"}{collection.description && ` · ${collection.description}`}</small>{(count > 0 || editable.length <= 1) && <small>{reason}</small>}</div><button className="icon-button" disabled={busy} aria-label={`Edit collection ${collection.name}`} onClick={() => { setEditingId(collection.id); setForm({ name: collection.name, description: collection.description, color: collection.color }); setError(""); setStatus(""); }}><Edit3 size={15} /></button><button className="icon-button danger" disabled={busy || count > 0 || editable.length <= 1} title={reason} aria-label={`Delete collection ${collection.name}`} onClick={() => void remove(collection)}><Trash2 size={15} /></button></li>;
    })}</ul>
    <form onSubmit={save}><fieldset disabled={busy} className="editor-fields"><h3 className="mb-3 text-sm font-semibold">{editingId ? "Edit collection" : "New collection"}</h3><div className="form-grid"><label>Name<input value={form.name} onChange={e => setForm(v => ({ ...v, name: e.target.value }))} /></label><label>Color<input type="color" value={form.color} onChange={e => setForm(v => ({ ...v, color: e.target.value }))} /></label><label className="wide">Description<input value={form.description} onChange={e => setForm(v => ({ ...v, description: e.target.value }))} /></label></div></fieldset>
      {error && <p role="alert" className="field-error">{error}</p>}{status && <p role="status" className="text-sm mt-3 text-mint">{status}</p>}
      <div className="modal-foot">{editingId && <button type="button" className="secondary-button" disabled={busy} onClick={reset}>Cancel edit</button>}<button className="primary-button" disabled={busy}><Plus size={15} />{busy ? "Saving…" : editingId ? "Save collection" : "Create collection"}</button></div>
    </form>
  </div></Modal>;
}
