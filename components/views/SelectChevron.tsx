type SelectChevronProps = {
  open?: boolean;
  className?: string;
};

type NativeSelectChevronProps = {
  open?: boolean;
  className?: string;
};

export function SelectChevron({ open = false, className = '' }: SelectChevronProps) {
  return (
    <span aria-hidden="true" className={`shrink-0 text-[#8FA8FF] ${className}`}>
      {open ? '^' : 'v'}
    </span>
  );
}

export function NativeSelectChevron({ open: controlledOpen, className = '' }: NativeSelectChevronProps) {
  const chevronClassName =
    `native-select-chevron pointer-events-none absolute inset-y-0 right-0 inline-flex w-9 items-center justify-center text-[#8FA8FF] ${className}`.trim();

  if (controlledOpen !== undefined) {
    return (
      <span aria-hidden="true" className={chevronClassName}>
        {controlledOpen ? '^' : 'v'}
      </span>
    );
  }

  return (
    <>
      <span aria-hidden="true" className={`${chevronClassName} native-select-chevron-down`}>
        v
      </span>
      <span aria-hidden="true" className={`${chevronClassName} native-select-chevron-up`}>
        ^
      </span>
    </>
  );
}
