// File: @/lib/utils/components/ToDo.tsx
'use client';

import React, { useCallback, useEffect, useState } from 'react';

type ToDoProps = {
  /** controls visibility externally; if omitted, component manages its own visibility */
  show?: boolean;
  /** called when the user dismisses the overlay (via clicking the text) */
  onDismiss?: () => void;
  /** banner text */
  message?: string;
  /** 0–1 backdrop opacity */
  opacity?: number;
  /** banner text color */
  color?: string;
  /** z-index of the overlay */
  zIndex?: number;
  /** whether the backdrop should block clicks (until dismissed) */
  blockClicks?: boolean;
};

export default function ToDo({
  show,
  onDismiss,
  message = 'ToDo',
  opacity = 0.5,
  color = '#ff1a1a',
  zIndex = 2000,
  blockClicks = true,
}: ToDoProps) {
  // If `show` is controlled by parent, mirror it; otherwise manage locally.
  const [visible, setVisible] = useState(show ?? true);

  useEffect(() => {
    if (typeof show === 'boolean') setVisible(show);
  }, [show]);

  const dismiss = useCallback(() => {
    if (onDismiss) onDismiss();
    else setVisible(false);
  }, [onDismiss]);

  if (!visible) return null;

  return (
    <div
      aria-hidden
      style={{
        position: 'fixed',
        inset: 0,
        background: `rgba(0,0,0,${opacity})`,
        zIndex,
        // Backdrop blocks clicks until the banner is clicked/dismissed
        pointerEvents: blockClicks ? 'auto' : 'none',
      }}
    >
      {/* Clickable banner text */}
      <button
        type="button"
        onClick={dismiss}
        title="Click to dismiss"
        style={{
          position: 'absolute',
          left: '-25%',
          right: '-25%',
          top: '50%',
          transform: 'translateY(-50%) rotate(-20deg)',
          textAlign: 'center',
          fontWeight: 900,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color,
          fontSize: 'min(14vw, 120px)',
          opacity: 0.9,
          userSelect: 'none',
          // make it look like text (no default button styles)
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          // ensure the button itself captures the click
          pointerEvents: 'auto',
        }}
      >
        {message}
      </button>
    </div>
  );
}
