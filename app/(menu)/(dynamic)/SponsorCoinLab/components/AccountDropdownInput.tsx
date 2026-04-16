import React from 'react';

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
}: Props) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [showFullList, setShowFullList] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (containerRef.current?.contains(target)) return;
      setIsOpen(false);
      setShowFullList(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
    };
  }, []);

  const normalizedQuery = String(value || '').trim().toLowerCase();
  const visibleOptions = React.useMemo(() => {
    if (showFullList || !normalizedQuery) return options;
    return options.filter(
      (option) =>
        option.value.toLowerCase().includes(normalizedQuery) || option.label.toLowerCase().includes(normalizedQuery),
    );
  }, [normalizedQuery, options, showFullList]);

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
          setIsOpen(true);
          setShowFullList(false);
        }}
        onBlur={() => {
          window.setTimeout(() => {
            setIsOpen(false);
            setShowFullList(false);
          }, 100);
        }}
        onChange={(e) => {
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
          setIsOpen((prev) => !prev || !showFullList);
          setShowFullList(true);
        }}
        className="absolute inset-y-0 right-0 inline-flex w-9 items-center justify-center rounded-r-lg text-[#8FA8FF] transition-colors hover:text-white"
        title="Show all accounts"
        aria-label="Show all accounts"
      >
        v
      </button>
      {isOpen && visibleOptions.length > 0 ? (
        <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-20 max-h-56 overflow-y-auto rounded-lg border border-[#334155] bg-[#0E111B] shadow-lg">
          {visibleOptions.map((option) => (
            <button
              key={`${option.value}-${option.label}`}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
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
