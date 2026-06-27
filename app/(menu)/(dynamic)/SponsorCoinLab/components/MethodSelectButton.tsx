'use client';
import React from 'react';
import { SelectChevron } from './SelectChevron';

type Props = {
  className?: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  disabled?: boolean;
};

export default function MethodSelectButton({ className, value, options, onChange, disabled }: Props) {
  const [isOpen, setIsOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  const displayValue = value || 'Select method';

  return (
    <div ref={ref} className="relative w-full min-w-0">
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((o) => !o)}
        className={`${className ?? ''} flex items-center justify-between gap-3 pr-3 text-left`}
      >
        <span className={value ? 'min-w-0 truncate text-white' : 'min-w-0 truncate text-[#9CA3AF]'}>
          {displayValue}
        </span>
        <span className="inline-flex shrink-0 items-center justify-center text-[#8FA8FF] transition-colors">
          <SelectChevron open={isOpen} />
        </span>
      </button>
      {isOpen && !disabled && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-lg border border-[#334155] bg-[#0E111B] py-1 shadow-lg">
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => { onChange(opt); setIsOpen(false); }}
              className={`w-full px-3 py-2 text-left text-sm hover:bg-[#1A2035] ${opt === value ? 'text-[#8FA8FF]' : 'text-white'}`}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
