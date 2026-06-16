'use client';

import React from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

type Props = {
  currentId?: number;
  label?: string;
  showNetworkIcon?: boolean;
  showChevron?: boolean;
  showHoverBg?: boolean;
  titleDisplay?: boolean;

  // Parent button toggle
  onButtonClick: () => void;

  // Targeted click areas (stopPropagation inside)
  onImageClick?: () => void;
  onChevronClick?: () => void;
  chevronUp?: boolean;

  // Optional label-only actions
  onConnectTextClick?: () => void;     // when label is "Connect"
  onDisconnectTextClick?: () => void;  // when label is "Disconnect"

  // Override the default button classes (e.g. for full-width edge-to-edge)
  className?: string;
};

export default function ConnectMainButton({
  currentId,
  label,
  showNetworkIcon = true,
  showChevron = true,
  showHoverBg = true,
  titleDisplay = false,
  onButtonClick,
  onImageClick,
  onChevronClick,
  onConnectTextClick,
  onDisconnectTextClick,
  chevronUp = false,
  className,
}: Props) {
  const mainHoverClass = showHoverBg
    ? 'hover:bg-connect-hover-bg hover:text-connect-hover-color'
    : 'hover:bg-transparent hover:text-connect-color';

  // stop inner click from triggering parent button
  const stopThen = (e: React.MouseEvent, fn?: () => void) => {
    e.preventDefault();
    e.stopPropagation();
    fn?.();
  };

  // keyboard helper for inner “button-like” spans/images
  const keyActivate =
    (fn?: () => void) =>
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        e.stopPropagation();
        fn?.();
      }
    };

  // Only make the label interactive if we were given a handler
  const labelClickHandler = onConnectTextClick ?? onDisconnectTextClick;
  const labelIsAction = !!labelClickHandler;
  const networkMenuTitle = titleDisplay ? 'Open Select Network' : undefined;
  const labelTitle = titleDisplay
    ? onConnectTextClick
      ? 'Connect Wallet'
      : onDisconnectTextClick
      ? 'Disconnect Wallet'
      : undefined
    : undefined;

  return (
    <button
      type="button"
      aria-haspopup="menu"
      onClick={onButtonClick}
      className={`
        bg-connect-bg text-connect-color font-bold rounded-lg px-3 py-1.5
        flex items-center gap-2 text-sm outline-none border-0 focus:ring-0
        ${mainHoverClass}
        ${className ?? ''}
      `}
    >
      {/* Network image — toggles dropdown only */}
      {showNetworkIcon && typeof currentId === 'number' && (
        <img
          src={`/assets/blockchains/${currentId}/logo.png`}
          alt="Network"
          title={networkMenuTitle}
          className="h-8 w-8 rounded cursor-pointer"
          role="button"
          tabIndex={0}
          onClick={(e) => stopThen(e, onImageClick)}
          onKeyDown={keyActivate(onImageClick)}
        />
      )}

      {/* Label — optionally acts as Connect/Disconnect */}
      {label && (
        <span
          title={labelTitle}
          className={`opacity-85 font-bold ${labelIsAction ? 'cursor-pointer' : ''}`}
          {...(labelIsAction
            ? {
                role: 'button' as const,
                tabIndex: 0,
                onKeyDown: keyActivate(labelClickHandler),
                'aria-label': onConnectTextClick
                  ? 'Connect Wallet'
                  : 'Disconnect Wallet',
              }
            : {})}
          onClick={(e) => labelIsAction && stopThen(e, labelClickHandler)}
        >
          {label}
        </span>
      )}

      {/* Chevron — toggles dropdown only */}
      {showChevron && (
        <span
          title={networkMenuTitle}
          className="flex items-center opacity-75 cursor-pointer select-none"
          role="button"
          tabIndex={0}
          aria-label="Toggle network menu"
          onClick={(e) => stopThen(e, onChevronClick)}
          onKeyDown={keyActivate(onChevronClick)}
        >
          {chevronUp ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </span>
      )}
    </button>
  );
}
