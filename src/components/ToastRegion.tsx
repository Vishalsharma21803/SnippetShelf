import { Check, X, Zap } from "lucide-react";
import { cn } from "./ui";

export function ToastRegion({ toasts, onDismiss }: { toasts: { id: number; message: string; type: "success" | "error" | "info" }[]; onDismiss: (id: number) => void }) {
  return <div className="toast-region" role="status" aria-live="polite">{toasts.map(toast => <div key={toast.id} className={cn("toast", toast.type)}><span>{toast.type === "success" ? <Check size={15} /> : <Zap size={15} />}</span>{toast.message}<button onClick={() => onDismiss(toast.id)} aria-label="Dismiss notification"><X size={14} /></button></div>)}</div>;
}
