import React from 'react';
import { SelectChevron } from './SelectChevron';

type AccountOption = {
  value: string;
  label: string;
};

type Props = {
  value: string;
  onChange: (value: string) => void;
  className: string;
  placeholder?: string;
  inputAriaLabel?: string;
  inputTitle?: string;
  dataFieldId?: string;
  options: AccountOption[];
  traceLabel?: string;
  onTrace?: (line: string) => void;
};

export default function AccountDropdownInput({
  value,
  onChange,
  className,
  placeholder,
  inputAriaLabel,
  inputTitle,
  dataFieldId,
  options,
  traceLabel,
  onTrace,
}: Props) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [showFullList, setShowFullList] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const summarizeValue = React.useCallback((raw: string) => {
    const value = String(raw || '').trim();
    if (/^0x[0-9a-fA-F]{40}$/.test(value)) return value;
    return value ? `${value.slice(0, 24)}${value.length > 24 ? '...' : ''}` : '(empty)';
  }, []);
  const trace = React.useCallback(
    (message: string) => {
      const label =
        [traceLabel, dataFieldId, inputAriaLabel]
          .map((entry) => String(entry ?? '').trim())
          .find(Boolean) ?? 'account';
      onTrace?.(`[ACCOUNT_POPUP_TRACE] dropdown(${label}) ${message}`);
    },
    [dataFieldId, inputAriaLabel, onTrace, traceLabel],
  );

  React.useEffect(() => {
    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (containerRef.current?.contains(target)) return;
      if (!isOpen && !showFullList) return;
      trace('outside pointer close');
      setIsOpen(false);
      setShowFullList(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
    };
  }, [isOpen, showFullList, trace]);

  const normalizedQuery = String(value || '').trim().toLowerCase();
  const visibleOptions = React.useMemo(() => {
    if (showFullList || !normalizedQuery) return options;
    return options.filter(
      (option) =>
        option.value.toLowerCase().includes(normalizedQuery) || option.label.toLowerCase().includes(normalizedQuery),
    );
  }, [normalizedQuery, options, showFullList]);
  React.useEffect(() => {
    trace(
      `state open=${String(isOpen)} fullList=${String(showFullList)} query=${summarizeValue(value)} visibleOptions=${visibleOptions.length} totalOptions=${options.length}`,
    );
  }, [isOpen, options.length, showFullList, summarizeValue, trace, value, visibleOptions.length]);

  return (
    <div ref={containerRef} className="relative w-full min-w-0">
      <input
        type="text"
        data-field-id={dataFieldId}
        aria-label={inputAriaLabel}
        title={inputTitle}
        className={`${className} pr-10`}
        value={value}
        onFocus={() => {
          trace(`focus open query=${summarizeValue(value)}`);
          setIsOpen(true);
          setShowFullList(false);
        }}
        onBlur={() => {
          trace('blur schedule close');
          window.setTimeout(() => {
            trace('blur close applied');
            setIsOpen(false);
            setShowFullList(false);
          }, 100);
        }}
        onChange={(e) => {
          trace(`input change raw=${summarizeValue(e.target.value)}`);
          onChange(e.target.value);
          setIsOpen(true);
          setShowFullList(false);
        }}
        placeholder={placeholder}
      />
      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault();
          trace(`chevron mouseDown currentOpen=${String(isOpen)} currentFullList=${String(showFullList)} nextOpen=${String(!isOpen || !showFullList)}`);
          setIsOpen((prev) => !prev || !showFullList);
          setShowFullList(true);
        }}
        className="absolute inset-y-0 right-0 inline-flex w-9 items-center justify-center rounded-r-lg text-[#8FA8FF] transition-colors hover:text-white"
        title="Show all accounts"
        aria-label="Show all accounts"
      >
        <SelectChevron open={isOpen} />
      </button>
      {isOpen && visibleOptions.length > 0 ? (
        <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-20 max-h-56 overflow-y-auto rounded-lg border border-[#334155] bg-[#0E111B] shadow-lg">
          {visibleOptions.map((option) => (
            <button
              key={`${option.value}-${option.label}`}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                trace(`option mouseDown selected=${summarizeValue(option.value)} label=${summarizeValue(option.label)}`);
                onChange(option.value);
                setIsOpen(false);
                setShowFullList(false);
              }}
              className="block w-full px-3 py-2 text-left text-sm text-white transition-colors hover:bg-[#1E293B]"
              title={option.label}
            >
              {option.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
