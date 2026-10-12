import { Search, Plus } from "lucide-react";
import type { LibraryFilters } from "../types";

export const cn = (...values: (string | false | undefined)[]) => values.filter(Boolean).join(" ");
export const languageColors: Record<string, string> = {
  JavaScript: "#f5cf65", TypeScript: "#73a8ff", React: "#74d8ef", CSS: "#c59cff",
  HTML: "#f59e8b", Python: "#83d69a", SQL: "#f49ac2", Shell: "#a9b8c9", Git: "#ff9c7b", JSON: "#ded06c",
};
export const timeAgo = (date?: string) => {
  if (!date) return "Never used";
  const days = Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / 86400000));
  return days === 0 ? "Today" : `${days}d ago`;
};
export const errorMessage = (error: unknown, fallback: string) => error instanceof Error ? error.message : fallback;

export function SideNav({ active, icon, label, count, onClick }: {
  active: boolean; icon: React.ReactNode; label: string; count: number; onClick: () => void;
}) {
  return <button className={cn("side-nav", active && "active")} onClick={onClick} aria-current={active ? "page" : undefined}>
    {icon}<span>{label}</span><b>{count}</b>
  </button>;
}

export function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return <label className="toggle-row"><span>{label}</span><input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} /><span className="toggle-ui" /></label>;
}

export function Loading() {
  return <div className="loading-state" role="status" aria-label="Loading snippets">{[1, 2, 3, 4].map(i => <div className="skeleton-card" key={i}><span /><span /><span /></div>)}</div>;
}

export function EmptyState({ query, filters, total, onClear, onCreate }: {
  query: string; filters: LibraryFilters; total: number; onClear: () => void; onCreate: () => void;
}) {
  const title = !total ? "Your library is empty" : query ? "No snippets found" : filters.favoritesOnly ? "No favorites yet" : filters.recentOnly ? "No snippets copied yet" : filters.collectionId ? "No snippets in this collection" : "No matching snippets";
  return <div className="empty-state"><div className="empty-icon"><Search size={25} /></div><h2>{title}</h2>
    <p>{total ? "Try a different keyword or clear your active filters." : "Create your first snippet to start building a personal reference library."}</p>
    <div><button className="primary-button" onClick={onCreate}><Plus size={15} /> Create snippet</button>{!!total && <button className="text-button" onClick={onClear}>Clear filters</button>}</div>
  </div>;
}
