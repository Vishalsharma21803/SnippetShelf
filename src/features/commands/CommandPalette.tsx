import { useState } from "react";
import { ChevronLeft, Command, FolderCog, Plus, Search, Settings } from "lucide-react";
import { Modal } from "../../components/Modal";

export function CommandPalette({ onClose, onNew, onSettings, onSearch, onCollections }: { onClose: () => void; onNew: () => void; onSettings: () => void; onSearch: () => void; onCollections: () => void }) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const commands = [
    { label: "Create new snippet", hint: "N", icon: <Plus size={16} />, action: onNew },
    { label: "Focus search", hint: "/", icon: <Search size={16} />, action: onSearch },
    { label: "Open settings", hint: "", icon: <Settings size={16} />, action: onSettings },
    { label: "Manage collections", hint: "", icon: <FolderCog size={16} />, action: onCollections },
  ];
  const matching = commands.filter(c => c.label.toLowerCase().includes(query.toLowerCase()));
  return <Modal label="Command palette" onClose={onClose} className="palette-backdrop"><div className="palette">
    <div className="palette-search"><Search size={18} /><input value={query} onChange={e => { setQuery(e.target.value); setActive(0); }} aria-label="Find command" onKeyDown={e => {
      if (e.key === "ArrowDown") { e.preventDefault(); setActive(v => Math.max(0, Math.min(v + 1, matching.length - 1))); }
      if (e.key === "ArrowUp") { e.preventDefault(); setActive(v => Math.max(0, v - 1)); }
      if (e.key === "Enter") { e.preventDefault(); matching[active]?.action(); }
    }} placeholder="Type a command..." /><kbd>ESC</kbd></div>
    <div className="palette-list">{matching.map((command, index) => <button className={index === active ? "command-active" : ""} key={command.label} onClick={command.action}>{command.icon}<span>{command.label}</span>{command.hint && <kbd>{command.hint}</kbd>}<ChevronLeft size={14} className="rotate-180" /></button>)}{!matching.length && <p className="p-4 text-sm text-muted">No commands match your search.</p>}</div>
    <div className="palette-footer"><span><Command size={12} /> Navigate</span><span><kbd>↵</kbd> Select</span><span><kbd>esc</kbd> Close</span></div>
    <p className="shortcut-help">N new · E edit · F favorite · C copy · / search · ? shortcuts<br />Shortcuts pause while editing fields or using a dialog.</p>
  </div></Modal>;
}
