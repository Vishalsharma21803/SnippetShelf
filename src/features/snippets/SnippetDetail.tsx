import { ChevronLeft, Code2, Command, Copy, Edit3, Heart, Maximize2, Minimize2, Sparkles, Trash2 } from "lucide-react";
import type { Collection, Settings, Snippet } from "../../types";
import { relatedSnippets } from "../../lib/selectors";
import { cn, timeAgo } from "../../components/ui";
import { Markdown } from "../../components/Markdown";
import { SyntaxCode } from "../../components/SyntaxCode";

export function SnippetDetail({ snippet, snippets, collections, settings, reading, onReading, onCopy, onFavorite, onEdit, onDelete, onRelated }: {
  snippet: Snippet; snippets: Snippet[]; collections: Collection[]; settings: Settings; reading: boolean;
  onReading: () => void; onCopy: () => void; onFavorite: () => void; onEdit: () => void; onDelete: () => void; onRelated: (snippet: Snippet) => void;
}) {
  const collection = collections.find(c => c.id === snippet.collectionId);
  return <div className="detail-scroll">
    <div className="detail-actions"><span className="detail-label"><span className="collection-dot" style={{ background: collection?.color }} />{collection?.name}</span><div className="flex items-center">
      <button className="icon-button" aria-label={reading ? "Exit reading mode" : "Enter reading mode"} aria-pressed={reading} onClick={onReading}>{reading ? <Minimize2 size={16} /> : <Maximize2 size={16} />}</button>
      <button className="icon-button" aria-label="Edit snippet" onClick={onEdit}><Edit3 size={16} /></button>
      <button className={cn("icon-button", snippet.isFavorite && "favorite-active")} aria-label="Toggle favorite" aria-pressed={snippet.isFavorite} onClick={onFavorite}><Heart size={16} fill={snippet.isFavorite ? "currentColor" : "none"} /></button>
      <button className="icon-button danger" aria-label="Delete snippet" onClick={onDelete}><Trash2 size={16} /></button>
    </div></div>
    <h2 className="detail-title">{snippet.title}</h2><p className="detail-description">{snippet.description}</p>
    <div className="meta-row"><span><span className="clock-icon">◷</span> Updated {timeAgo(snippet.updatedAt)}</span><span><Copy size={14} /> {snippet.copyCount} copies</span></div>
    <div className="code-shell"><div className="code-head"><span><span className="code-dot red" /><span className="code-dot yellow" /><span className="code-dot green" /></span><span>{snippet.language.toLowerCase()}</span><button className="copy-button" onClick={onCopy}><Copy size={14} /> Copy code</button></div>
      <pre className="code-view" tabIndex={0} aria-label={`${snippet.language} code`} style={{ fontSize: { small: 11, medium: 13, large: 16 }[settings.editorFontSize], whiteSpace: settings.lineWrap ? "pre-wrap" : "pre" }}><code><SyntaxCode code={snippet.code} language={snippet.language} lineNumbers={settings.showLineNumbers} /></code></pre>
    </div>
    <section className="explanation"><h3><Sparkles size={15} /> Notes</h3><Markdown text={snippet.explanation} /></section>
    <div className="detail-tags">{snippet.tags.map(tag => <span key={tag}>#{tag}</span>)}</div>
    <section className="related"><h3>Related snippets</h3>{relatedSnippets(snippet, snippets).map(item => <button key={item.id} onClick={() => onRelated(item)}><span className="related-icon"><Code2 size={14} /></span><span><strong>{item.title}</strong><small>{item.language} · {item.copyCount} copies</small></span><ChevronLeft size={14} className="rotate-180" /></button>)}</section>
    <div className="keyboard-hint"><Command size={14} /> Press <kbd>E</kbd> to edit · <kbd>C</kbd> to copy{reading && <> · <kbd>Esc</kbd> exit reading mode</>}</div>
  </div>;
}
