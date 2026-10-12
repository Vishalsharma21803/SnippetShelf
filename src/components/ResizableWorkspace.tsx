import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { cn } from "./ui";

function ResizeHandle({ label, controls, value, min, max, onChange }: { label: string; controls: string; value: number; min: number; max: number; onChange: (value: number) => void }) {
  const drag = useRef<{ startX: number; startValue: number } | null>(null);
  const update = (next: number) => onChange(Math.round(Math.max(min, Math.min(max, next))));
  return <div className="resize-handle" role="separator" aria-label={label} aria-orientation="vertical" aria-controls={controls} aria-valuemin={Math.round(min)} aria-valuemax={Math.round(max)} aria-valuenow={Math.round(value)} aria-valuetext={`${Math.round(value)} pixels`} tabIndex={0} title="Drag or use Left/Right arrows to resize. Home/End for limits." onPointerDown={event => {
    if (event.button !== 0) return;
    event.preventDefault(); event.currentTarget.focus(); event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { startX: event.clientX, startValue: value };
  }} onPointerMove={event => { if (drag.current) update(drag.current.startValue + event.clientX - drag.current.startX); }} onPointerUp={event => { drag.current = null; if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); }} onPointerCancel={() => { drag.current = null; }} onLostPointerCapture={() => { drag.current = null; }} onKeyDown={event => {
    const step = event.shiftKey ? 48 : 16;
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault(); event.stopPropagation();
    update(event.key === "Home" ? min : event.key === "End" ? max : value + (event.key === "ArrowRight" ? step : -step));
  }} />;
}

export function ResizableWorkspace({ navigation, results, detail, reading }: { navigation: ReactNode; results: ReactNode; detail: ReactNode; reading: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(() => window.innerWidth);
  const [sidebar, setSidebar] = useState(236);
  const [ratio, setRatio] = useState(0.48);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const update = () => setWidth(element.getBoundingClientRect().width);
    update();
    if (typeof ResizeObserver === "undefined") { window.addEventListener("resize", update); return () => window.removeEventListener("resize", update); }
    const observer = new ResizeObserver(update); observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const available = Math.max(600, width - sidebar - 12);
  const resultWidth = Math.max(280, Math.min(available - 320, available * ratio));
  const style = { "--sidebar-width": `${sidebar}px`, "--results-width": `${resultWidth}px` } as CSSProperties;
  return <div ref={ref} className={cn("workspace", reading && "reading-mode")} style={style}>
    {navigation}<ResizeHandle label="Resize navigation" controls="library-navigation" value={sidebar} min={180} max={280} onChange={setSidebar} />
    {results}<ResizeHandle label="Resize snippet list" controls="library-results" value={resultWidth} min={280} max={available - 320} onChange={value => setRatio(value / available)} />
    {detail}
  </div>;
}
