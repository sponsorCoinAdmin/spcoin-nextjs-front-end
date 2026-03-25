// File: components/views/Buttons/OpenCloseBtn.tsx

'use client';
import React from 'react';

type Props = {
  id?: string;
  onClick: () => void;
  className?: string;
  glyphClassName?: string;
  isExpanded?: boolean;
  expandedGlyph?: React.ReactNode;
  collapsedGlyph?: React.ReactNode;
  expandedTitle?: string;
  collapsedTitle?: string;
  expandedAriaLabel?: string;
  collapsedAriaLabel?: string;
  onDoubleClick?: React.MouseEventHandler<HTMLButtonElement>;
  type?: 'button' | 'submit' | 'reset';
};

export default function OpenCloseBtn({
  id,
  onClick,
  className,
  glyphClassName,
  isExpanded,
  expandedGlyph = 'x',
  collapsedGlyph = '+',
  expandedTitle = 'Return to shared view',
  collapsedTitle = 'Expand this card',
  expandedAriaLabel = 'Return to shared view',
  collapsedAriaLabel = 'Expand this card',
  onDoubleClick,
  type = 'button',
}: Props) {
  const isToggle = typeof isExpanded === 'boolean';
  const glyph = isToggle ? (isExpanded ? expandedGlyph : collapsedGlyph) : expandedGlyph;
  const title = isToggle ? (isExpanded ? expandedTitle : collapsedTitle) : expandedTitle;
  const ariaLabel = isToggle
    ? isExpanded
      ? expandedAriaLabel
      : collapsedAriaLabel
    : expandedAriaLabel;
  return (
    <button
      id={id}
      type={type}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      title={title}
      aria-label={ariaLabel}
      className={`relative flex h-10 w-10 items-center justify-center rounded-full bg-[#2F3A64] text-[#7D96FF] transition-colors hover:bg-[#415088] hover:text-[#D7E1FF] ${className ?? ''}`}
    >
      <span
        className={`absolute inset-0 flex items-center justify-center text-3xl leading-none -translate-y-px ${glyphClassName ?? ''}`}
      >
        {glyph}
      </span>
    </button>
  );
}
