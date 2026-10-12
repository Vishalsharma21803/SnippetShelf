import { Command, Menu, Moon, Search, Sparkles, Sun } from "lucide-react";
import type { Settings } from "../types";

export function AppHeader({ query, onQuery, onMenu, onCommands, theme, onTheme, avatarBackgroundColor, avatarTextColor }: { query: string; onQuery: (query: string) => void; onMenu: () => void; onCommands: () => void; theme: "light" | "dark"; onTheme: () => void; avatarBackgroundColor: Settings["avatarBackgroundColor"]; avatarTextColor: Settings["avatarTextColor"] }) {
  return <header className="topbar"><div className="brand"><div className="brand-mark"><Sparkles size={17} /></div><div><strong>Snippet<span>Shelf</span></strong><small>YOUR DEVELOPER LIBRARY</small></div></div>
    <button className="mobile-menu" aria-label="Open navigation" onClick={onMenu}><Menu size={20} /></button>
    <div className="top-search"><Search size={18} /><input id="global-search" aria-label="Search snippets" value={query} onChange={e => onQuery(e.target.value)} placeholder="Search snippets, tags, code..." /><button className="search-command" aria-label="Commands" onClick={onCommands}><kbd>⌘ K</kbd></button></div>
    <div className="top-actions"><button className="icon-button" aria-label="Toggle theme" onClick={onTheme}>{theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}</button><button className="icon-button" aria-label="Open command palette" onClick={onCommands}><Command size={18} /></button><div className="avatar" aria-label="Profile initials VS" style={{ backgroundColor: avatarBackgroundColor, color: avatarTextColor }}>VS</div></div>
  </header>;
}
