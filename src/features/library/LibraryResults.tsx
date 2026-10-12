import { ArrowDownUp, BookOpen, ChevronDown, Filter, Heart, Languages, Tag, X, Zap } from "lucide-react";
import { languages, type Collection, type LibraryFilters, type Snippet, type SortBy } from "../../types";
import { cn, EmptyState, languageColors, Loading } from "../../components/ui";

export const initialFilters: LibraryFilters = { query: "", collectionId: "", language: "all", favoritesOnly: false, recentOnly: false, tags: [], sortBy: "updated", sortDirection: "desc" };

function SnippetCard({ snippet, selected, onClick, onFavorite }: { snippet: Snippet; selected: boolean; onClick: () => void; onFavorite: () => void }) {
  return <article className={cn("snippet-card", selected && "selected")} onClick={onClick} tabIndex={0} aria-label={`${snippet.title}${selected ? ", selected" : ""}`} onKeyDown={e => {
    if (e.target !== e.currentTarget) return;
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); }
    if (e.key === "ArrowDown") { e.preventDefault(); (e.currentTarget.nextElementSibling as HTMLElement)?.focus(); }
    if (e.key === "ArrowUp") { e.preventDefault(); (e.currentTarget.previousElementSibling as HTMLElement)?.focus(); }
  }}>
    <div className="card-top"><span className="language-badge" style={{ color: languageColors[snippet.language], background: `${languageColors[snippet.language]}18` }}><span className="lang-dot" style={{ background: languageColors[snippet.language] }} />{snippet.language}</span>
      <button className={cn("favorite-button", snippet.isFavorite && "on")} aria-label={snippet.isFavorite ? "Remove favorite" : "Add favorite"} aria-pressed={snippet.isFavorite} onClick={e => { e.stopPropagation(); onFavorite(); }}><Heart size={15} fill={snippet.isFavorite ? "currentColor" : "none"} /></button>
    </div><h3>{snippet.title}</h3><p>{snippet.description}</p><div className="card-code"><code>{snippet.code.split("\n").slice(0, 2).join("\n")}</code><span>···</span></div>
    <div className="card-bottom"><div className="mini-tags">{snippet.tags.slice(0, 2).map(tag => <span key={tag}>#{tag}</span>)}</div><span>{snippet.copyCount} copies</span></div>
  </article>;
}

export function LibraryResults({ filters, setFilters, collections, results, selectedId, tags, total, loading, error, storageFallback, showingDetail, onChoose, onFavorite, onNew, onSettings }: {
  filters: LibraryFilters; setFilters: React.Dispatch<React.SetStateAction<LibraryFilters>>; collections: Collection[];
  results: Snippet[]; selectedId?: string; tags: string[]; total: number; loading: boolean; error: string | null;
  storageFallback: boolean; showingDetail: boolean; onChoose: (snippet: Snippet) => void; onFavorite: (id: string) => void; onNew: () => void; onSettings: () => void;
}) {
  return <main id="library-results" className={cn("results-panel", showingDetail && "showing-detail")}>
    <div className="results-head"><div><div className="breadcrumb"><BookOpen size={14} /> Library <ChevronDown size={13} /></div><h1>{filters.favoritesOnly ? "Favorites" : filters.recentOnly ? "Recently used" : filters.collectionId ? collections.find(c => c.id === filters.collectionId)?.name : "All snippets"}</h1><p aria-live="polite">{results.length} {results.length === 1 ? "snippet" : "snippets"} <span>·</span> Curated for your workflow</p></div><button className="filter-button" aria-label="Preferences" onClick={onSettings}><Filter size={15} /> Preferences</button></div>
    <div className="toolbar"><label className="filter-chip"><Languages size={14} /><select className="language-select" aria-label="Filter language" value={filters.language} onChange={e => setFilters(v => ({ ...v, language: e.target.value as LibraryFilters["language"] }))}><option value="all">All languages</option>{languages.map(language => <option key={language}>{language}</option>)}</select></label>
      <button className="filter-chip" aria-label={`Sort direction: ${filters.sortDirection === "desc" ? "descending" : "ascending"}`} onClick={() => setFilters(v => ({ ...v, sortDirection: v.sortDirection === "desc" ? "asc" : "desc" }))}><ArrowDownUp size={14} />{filters.sortBy === "updated" ? (filters.sortDirection === "desc" ? "Recently updated" : "Oldest updated") : filters.sortBy === "created" ? (filters.sortDirection === "desc" ? "Recently created" : "Oldest created") : filters.sortBy === "title" ? (filters.sortDirection === "asc" ? "Title A–Z" : "Title Z–A") : (filters.sortDirection === "desc" ? "Most copied" : "Least copied")}</button>
      <select className="sort-select" aria-label="Sort snippets" value={filters.sortBy} onChange={e => setFilters(v => ({ ...v, sortBy: e.target.value as SortBy }))}><option value="updated">Recently updated</option><option value="created">Recently created</option><option value="title">Title</option><option value="most-used">Most copied</option></select>
      {(filters.query || filters.language !== "all" || filters.tags.length > 0) && <button className="clear-filters" onClick={() => setFilters(initialFilters)}>Clear filters <X size={13} /></button>}
    </div>
    {storageFallback && <div className="storage-warning"><Zap size={15} /> Browser storage unavailable. Changes will last this session.</div>}
    <div className="tag-strip">{tags.map(tag => <button key={tag} className={cn("tag-pill", filters.tags.includes(tag) && "selected")} aria-pressed={filters.tags.includes(tag)} onClick={() => setFilters(v => ({ ...v, tags: v.tags.includes(tag) ? v.tags.filter(x => x !== tag) : [...v.tags, tag] }))}><Tag size={11} />{tag}</button>)}</div>
    <div className="snippet-list">{error && <p role="alert">{error}</p>}{loading ? <Loading /> : results.length ? results.map(snippet => <SnippetCard key={snippet.id} snippet={snippet} selected={selectedId === snippet.id} onClick={() => onChoose(snippet)} onFavorite={() => onFavorite(snippet.id)} />) : <EmptyState query={filters.query} filters={filters} total={total} onClear={() => setFilters(initialFilters)} onCreate={onNew} />}</div>
  </main>;
}
