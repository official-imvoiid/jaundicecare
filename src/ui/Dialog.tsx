import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { X } from 'lucide-react';

interface DialogProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}

/** A modal dialog. Uses the browser's own <dialog>, so focus stays inside and Escape closes it. */
export function Dialog({ title, onClose, children, footer }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);

  // No clean-up on purpose. Calling close() here would queue a `close` event;
  // in development React runs this effect twice, so that stale event would
  // arrive after the dialog had been reopened and shut it straight away.
  // Unmounting removes the element, which is all the clean-up a dialog needs.
  useEffect(() => {
    const dialog = ref.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  return (
    <dialog
      ref={ref}
      // The browser fires `close` after Escape; ignore one that arrives while the dialog is open
      onClose={() => {
        if (!ref.current?.open) onClose();
      }}
      aria-label={title}
      className="m-auto w-[min(640px,calc(100vw-2rem))] rounded-xl border border-line bg-surface p-0 text-body"
    >
      <div className="flex items-center justify-between gap-4 border-b border-line px-6 py-4">
        <h2 className="h-label text-base">{title}</h2>
        <button type="button" onClick={onClose} aria-label="Close" className="rounded-md p-1 text-muted hover:bg-sunken hover:text-ink">
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
      <div className="px-6 py-5">{children}</div>
      {footer && <div className="flex flex-wrap justify-end gap-3 border-t border-line px-6 py-4">{footer}</div>}
    </dialog>
  );
}
