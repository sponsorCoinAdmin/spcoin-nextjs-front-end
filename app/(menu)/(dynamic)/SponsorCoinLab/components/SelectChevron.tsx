type SelectChevronProps = {
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

export function NativeSelectChevron() {
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute inset-y-0 right-0 inline-flex w-9 items-center justify-center text-[#8FA8FF]"
    >
      <span className="peer-focus:hidden">v</span>
      <span className="hidden peer-focus:inline">^</span>
    </span>
  );
}
