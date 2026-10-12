import { useEffect, useRef, useState } from "react";
import { Star, X } from "lucide-react";
import { languages, type Collection, type Settings, type Snippet, type SnippetInput, type SnippetLanguage } from "../../types";
import { normalizeTags, validateSnippet } from "../../lib/validation";
import { Modal } from "../../components/Modal";
import { CodeEditor } from "../../components/SyntaxCode";
import { Markdown } from "../../components/Markdown";
import { errorMessage } from "../../components/ui";

export function SnippetEditor({ snippet, collections, settings, onClose, onSave }: {
  snippet?: Snippet; collections: Collection[]; settings: Settings; onClose: () => void; onSave: (input: SnippetInput) => Promise<void>;
}) {
  const [form, setForm] = useState<SnippetInput>(snippet ? {
    title: snippet.title, description: snippet.description, code: snippet.code, language: snippet.language,
    collectionId: snippet.collectionId, tags: snippet.tags, explanation: snippet.explanation, isFavorite: snippet.isFavorite,
  } : { title: "", description: "", code: "", language: "TypeScript", collectionId: collections.find(c => !c.isSystem)?.id ?? "", tags: [], explanation: "", isFavorite: false });
  const [tag, setTag] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(false);
  const original = useRef(JSON.stringify(form));
  const dirty = JSON.stringify(form) !== original.current || !!tag.trim();
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  const close = () => {
    if (saving) return;
    if (dirty && !window.confirm("Discard unsaved snippet changes?")) return;
    onClose();
  };
  const update = <K extends keyof SnippetInput>(key: K, value: SnippetInput[K]) => setForm(v => ({ ...v, [key]: value }));
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (saving) return;
    const clean = { ...form, title: form.title.trim(), description: form.description.trim(), tags: normalizeTags([...form.tags, ...tag.split(",")]) };
    const next = validateSnippet(clean, collections);
    setErrors(next);
    if (Object.keys(next).length) return;
    setSaving(true);
    try { await onSave(clean); }
    catch (error) { setErrors({ save: `${errorMessage(error, "Could not save.")} Your draft is still available; try again.` }); }
    finally { setSaving(false); }
  };
  return <Modal label={snippet ? "Edit snippet" : "Create snippet"} onClose={close}><form className="editor-modal" onSubmit={submit}>
    <div className="modal-head"><div><span className="eyebrow">{snippet ? "EDIT SNIPPET" : "NEW SNIPPET"}</span><h2>{snippet ? "Refine your snippet" : "Capture a useful pattern"}</h2></div><button type="button" className="icon-button" aria-label="Close editor" onClick={close}><X size={19} /></button></div>
    {errors.save && <p role="alert" className="field-error">{errors.save}</p>}
    <fieldset disabled={saving} className="editor-fields">
      <div className="form-grid">
        <label>Title<input value={form.title} onChange={e => update("title", e.target.value)} placeholder="e.g. Debounce a callback" />{errors.title && <small className="field-error">{errors.title}</small>}</label>
        <label>Language<select value={form.language} onChange={e => update("language", e.target.value as SnippetLanguage)}>{languages.map(language => <option key={language}>{language}</option>)}</select>{errors.language && <small className="field-error">{errors.language}</small>}</label>
        <label className="wide">Description<input value={form.description} onChange={e => update("description", e.target.value)} placeholder="What problem does this solve?" />{errors.description && <small className="field-error">{errors.description}</small>}</label>
        <label>Collection<select value={form.collectionId} onChange={e => update("collectionId", e.target.value)}>{collections.filter(c => !c.isSystem).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>{errors.collectionId && <small className="field-error">{errors.collectionId}</small>}</label>
        <label>Tags <span className="label-help">up to 8</span><input value={tag} onChange={e => setTag(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); if (tag.trim()) update("tags", normalizeTags([...form.tags, ...tag.split(",")])); setTag(""); } }} placeholder="Type and press Enter" /><span className="form-tags">{form.tags.map(item => <button type="button" key={item} onClick={() => update("tags", form.tags.filter(x => x !== item))}>#{item} <X size={11} /></button>)}</span>{errors.tags && <small className="field-error">{errors.tags}</small>}</label>
        <div className="wide code-field"><span className="field-label">Code</span><CodeEditor value={form.code} language={form.language} onChange={code => update("code", code)} fontSize={{ small: 11, medium: 13, large: 16 }[settings.editorFontSize]} />{errors.code && <small className="field-error">{errors.code}</small>}</div>
        <div className="wide"><div className="notes-editor-head"><label htmlFor="snippet-notes">Notes <span className="label-help">Markdown supported</span></label><button type="button" className="text-button" aria-pressed={preview} onClick={() => setPreview(v => !v)}>{preview ? "Edit notes" : "Preview notes"}</button></div>{preview ? <div className="notes-preview"><Markdown text={form.explanation || "Nothing to preview yet."} /></div> : <textarea id="snippet-notes" value={form.explanation} onChange={e => update("explanation", e.target.value)} placeholder="Explain when and why to use it..." />}{errors.explanation && <small className="field-error">{errors.explanation}</small>}</div>
      </div>
      <label className="favorite-check"><input type="checkbox" checked={form.isFavorite} onChange={e => update("isFavorite", e.target.checked)} /><Star size={16} /> Add to favorites</label>
    </fieldset>
    <div className="modal-foot"><button type="button" className="secondary-button" disabled={saving} onClick={close}>Cancel</button><button className="primary-button" disabled={saving}>{saving ? "Saving…" : snippet ? "Save changes" : "Create snippet"}</button></div>
  </form></Modal>;
}
