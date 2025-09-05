'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export function useDropdownPortal() {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLDivElement | null>(null);
  const portalRef = useRef<HTMLDivElement | null>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  const close = useCallback(() => setOpen(false), []);
  const toggle = useCallback(() => setOpen((v) => !v), []);

  const reposition = useCallback(() => {
    if (!anchorRef.current || !portalRef.current) return;
    const a = anchorRef.current.getBoundingClientRect();
    const d = portalRef.current.getBoundingClientRect();
    const gutter = 8;

    // right-align to trigger
    let top = a.bottom + gutter;
    let left = a.right - d.width;

    if (left < gutter) left = gutter;
    if (left + d.width > window.innerWidth - gutter) {
      left = Math.max(gutter, window.innerWidth - d.width - gutter);
    }
    if (top + d.height > window.innerHeight - gutter) {
      top = Math.max(gutter, a.top - d.height - gutter);
    }

    setPos({ top, left });
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
    const onClick = (e: MouseEvent) => {
      const t = e.target as Node;
      const inAnchor = !!anchorRef.current && anchorRef.current.contains(t);
      const inPortal = !!portalRef.current && portalRef.current.contains(t);
      if (!inAnchor && !inPortal) close();
    };
    const onReposition = () => reposition();

    requestAnimationFrame(() => reposition());

    window.addEventListener('keydown', onKey);
    window.addEventListener('pointerdown', onClick, true);
    window.addEventListener('resize', onReposition);
    window.addEventListener('scroll', onReposition, true);

    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('pointerdown', onClick, true);
      window.removeEventListener('resize', onReposition);
      window.removeEventListener('scroll', onReposition, true);
    };
  }, [open, close, reposition]);

  return { open, setOpen, toggle, close, anchorRef, portalRef, pos };
}
