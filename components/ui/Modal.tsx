'use client';

import { useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  dismissOnBackdrop?: boolean;
};

export default function Modal({
  open,
  onClose,
  title,
  children,
  dismissOnBackdrop = true,
}: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const lastFocusedRef = useRef<HTMLElement | null>(null);
  const titleId = 'modal-title-' + Math.random().toString(36).slice(2, 8);

  useEffect(() => {
    if (!open) return;
    lastFocusedRef.current = (document.activeElement as HTMLElement) ?? null;

    // Lock body scroll
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Hide app root from screen readers while modal is open
    const appRoot = document.getElementById('__next') || document.body.firstElementChild;
    const prevAriaHidden = appRoot?.getAttribute('aria-hidden');
    appRoot?.setAttribute('aria-hidden', 'true');

    // Move focus into dialog
    const timer = setTimeout(() => {
      const root = dialogRef.current;
      if (!root) return;
      const focusables = root.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      (focusables[0] ?? root).focus();
    }, 0);

    return () => {
      document.body.style.overflow = prevOverflow;
      if (appRoot) {
        if (prevAriaHidden == null) appRoot.removeAttribute('aria-hidden');
        else appRoot.setAttribute('aria-hidden', prevAriaHidden);
      }
      clearTimeout(timer);
      lastFocusedRef.current?.focus?.();
    };
  }, [open]);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
      if (e.key === 'Tab') {
        const root = dialogRef.current;
        if (!root) return;
        const focusables = root.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusables.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = document.activeElement as HTMLElement | null;

        if (e.shiftKey && active === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && active === last) {
          e.preventDefault();
          first.focus();
        }
      }
    },
    [onClose]
  );

  if (!open) return null;

  // Prefer aria-labelledby if title is present
  const labelProps = title
    ? { 'aria-labelledby': titleId }
    : { 'aria-label': 'Dialog' };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop blocks interaction; mark as hidden for a11y */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={dismissOnBackdrop ? onClose : undefined}
        aria-hidden="true"
      />      <div
        role="dialog"
        aria-modal="true"
        {...labelProps}
        ref={dialogRef}
        onKeyDown={onKeyDown}
        className="
          relative z-10 max-h-[90vh] w-[min(720px,92vw)]
          overflow-hidden rounded-2xl bg-[#0F172A] shadow-2xl
          ring-1 ring-white/10 focus:outline-none
        "
        tabIndex={-1}
      >
        {title && (
          <div className="flex items-center justify-between px-4 pt-4 pb-2 border-b border-white/10">
            <h2 id={titleId} className="text-base font-medium text-white/90">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="rounded-md px-2 py-1 text-white/70 hover:text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/30"
            >
              Close
            </button>
          </div>
        )}
        <div className={title ? 'p-3' : undefined}>{children}</div>
      </div>
    </div>,
    document.body
  );
}
