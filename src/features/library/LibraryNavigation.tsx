import { CircleHelp, Heart, LayoutGrid, Plus, RefreshCcw, Settings, X, FolderCog } from "lucide-react";
import { languages, type Collection, type LibraryFilters, type Snippet } from "../../types";
import { cn, languageColors, SideNav } from "../../components/ui";

export function LibraryNavigation({ filters, setFilters, collections, snippets, open, onClose, onNew, onSettings, onCommands, onCollections }: {
  filters: LibraryFilters; setFilters: React.Dispatch<React.SetStateAction<LibraryFilters>>;
  collections: Collection[]; snippets: Snippet[]; open: boolean;
  onClose: () => void; onNew: () => void; onSettings: () => void; onCommands: () => void; onCollections: () => void;
}) {
  const navigate = (patch: Partial<LibraryFilters>) => { setFilters(v => ({ ...v, ...patch })); onClose(); };
  return <aside id="library-navigation" className={cn("sidebar", open && "sidebar-open")} aria-label="Library navigation">
    <div className="mobile-side-head"><span>Workspace</span><button className="icon-button" aria-label="Close navigation" onClick={onClose}><X size={18} /></button></div>
    <button className="new-button" onClick={onNew}><Plus size={17} /> New snippet <span>N</span></button>
    <div className="side-scroll">
      <p className="eyebrow">LIBRARY</p>
      <SideNav active={!filters.collectionId && !filters.favoritesOnly && !filters.recentOnly} icon={<LayoutGrid size={16} />} label="All snippets" count={snippets.length} onClick={() => navigate({ collectionId: "", favoritesOnly: false, recentOnly: false })} />
      <SideNav active={filters.favoritesOnly} icon={<Heart size={16} />} label="Favorites" count={snippets.filter(s => s.isFavorite).length} onClick={() => navigate({ collectionId: "", favoritesOnly: true, recentOnly: false })} />
      <SideNav active={filters.recentOnly} icon={<RefreshCcw size={16} />} label="Recently used" count={snippets.filter(s => s.lastUsedAt).length} onClick={() => navigate({ collectionId: "", favoritesOnly: false, recentOnly: true })} />
      <div className="collection-heading"><p className="eyebrow side-section">COLLECTIONS</p><button className="icon-button" aria-label="Manage collections" onClick={onCollections}><FolderCog size={15} /></button></div>
      {collections.filter(c => !c.isSystem).map(collection => <SideNav key={collection.id} active={filters.collectionId === collection.id} icon={<span className="collection-dot" style={{ background: collection.color }} />} label={collection.name} count={snippets.filter(s => s.collectionId === collection.id).length} onClick={() => navigate({ collectionId: collection.id, favoritesOnly: false, recentOnly: false })} />)}
      <p className="eyebrow side-section">LANGUAGES</p>
      {languages.map(language => <SideNav key={language} active={filters.language === language} icon={<span className="lang-dot" style={{ background: languageColors[language] }} />} label={language} count={snippets.filter(s => s.language === language).length} onClick={() => navigate({ language: filters.language === language ? "all" : language })} />)}
    </div>
    <div className="side-footer"><button className="side-link" onClick={onSettings}><Settings size={16} /> Settings</button><button className="side-link" onClick={onCommands}><CircleHelp size={16} /> Keyboard shortcuts <kbd>?</kbd></button></div>
  </aside>;
}
