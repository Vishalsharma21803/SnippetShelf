import { useEffect, useRef, type ReactNode } from "react";

export function Modal({
  children,
  onClose,
  label,
  className = "",
}: {
  children: ReactNode;
  onClose: () => void;
  label: string;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const root = ref.current!;
    const selector =
      'button:not(:disabled), input:not(:disabled):not([type="hidden"]), textarea:not(:disabled), select:not(:disabled), a[href], [tabindex="0"]';
    (
      root.querySelector<HTMLElement>('input:not(:disabled):not([type="file"]):not([type="hidden"]), textarea:not(:disabled)') ??
      root.querySelector<HTMLElement>(selector) ?? root
    ).focus();
    const siblings = [...(root.parentElement?.children ?? [])]
      .filter((element): element is HTMLElement => element instanceof HTMLElement && element !== root)
      .map(element => ({ element, inert: element.inert }));
    siblings.forEach(({ element }) => { element.inert = true; });
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        event.preventDefault();
        closeRef.current();
      }
      if (event.key !== "Tab") return;
      const elements = [...root.querySelectorAll<HTMLElement>(selector)].filter(
        (item) => !item.closest('[hidden], [aria-hidden="true"]'),
      );
      const first = elements[0];
      const last = elements[elements.length - 1];
      if (!first) { event.preventDefault(); root.focus(); return; }
      if (!root.contains(document.activeElement) || document.activeElement === root) {
        event.preventDefault(); (event.shiftKey ? last : first)?.focus(); return;
      }
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      }
      if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener("keydown", handler);
    return () => {
      document.removeEventListener("keydown", handler);
      siblings.forEach(({ element, inert }) => { element.inert = inert; });
      if (previous?.isConnected) previous.focus();
    };
  }, []);
  return (
    <div
      className={`modal-backdrop ${className}`}
      ref={ref}
      role="dialog"
      aria-modal="true"
      aria-label={label}
      tabIndex={-1}
    >
      {children}
    </div>
  );
}
