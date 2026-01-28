// File: components/views/AssetSelectPanels/AssetSelectLayout.tsx
import React from "react";

type AssetSelectLayoutProps = {
  /** Optional top area (title, tabs, etc.) */
  header?: React.ReactNode;

  /** Optional sticky-ish toolbar area (search, filters, etc.) */
  toolbar?: React.ReactNode;

  /** The scrollable list/content area */
  children: React.ReactNode;

  /** Optional bottom area (actions, pagination, etc.) */
  footer?: React.ReactNode;

  /** Extra classes on the outer container */
  className?: string;

  /** Extra classes on the scroll container */
  scrollClassName?: string;

  /** For debugging wheel/scroll if you want */
  onWheel?: React.WheelEventHandler<HTMLDivElement>;
};

/**
 * A consistent panel layout:
 * - header (no scroll)
 * - toolbar (no scroll)
 * - scrollable content (ONLY scroll area)
 * - footer (no scroll)
 *
 * Key: uses flex + min-h-0 to allow the middle area to actually scroll.
 */
export const AssetSelectLayout = React.forwardRef<HTMLDivElement, AssetSelectLayoutProps>(
  function AssetSelectLayout(
    {
      header,
      toolbar,
      children,
      footer,
      className = "",
      scrollClassName = "",
      onWheel,
    },
    scrollRef
  ) {
    return (
      <div className={`flex h-full w-full flex-col min-h-0 ${className}`}>
        {header ? <div className="shrink-0">{header}</div> : null}
        {toolbar ? <div className="shrink-0">{toolbar}</div> : null}

        {/* The ONLY scrollable area */}
        <div
          ref={scrollRef}
          className={`min-h-0 flex-1 overflow-y-auto overscroll-contain ${scrollClassName}`}
          onWheel={onWheel}
        >
          {children}
        </div>

        {footer ? <div className="shrink-0">{footer}</div> : null}
      </div>
    );
  }
);

AssetSelectLayout.displayName = "AssetSelectLayout";
