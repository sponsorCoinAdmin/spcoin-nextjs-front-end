'use client';

type Props = {
  label: string;
  value: string | number;
  range: [number, number];
  onChange: (value: string) => void;
  fieldId?: string;
  invalid?: boolean;
  helpText?: string;
};

export function normalizeRateSliderValue(value: string | number, range: [number, number]) {
  const [min, max] = range;
  const parsed = Number(String(value ?? '').trim());
  if (!Number.isFinite(parsed)) return min;
  return Math.min(max, Math.max(min, parsed));
}

export default function RateSliderRow({
  label,
  value,
  range,
  onChange,
  fieldId,
  invalid = false,
  helpText,
}: Props) {
  const normalizedValue = normalizeRateSliderValue(value, range);

  return (
    <div className="grid gap-3">
      <div className="grid items-center gap-3 md:grid-cols-[auto_minmax(0,1fr)_auto]">
        <span className="text-sm font-semibold text-[#8FA8FF]">{label}</span>
        <input
          type="range"
          data-field-id={fieldId}
          aria-label={label}
          title={`Adjust ${label}`}
          className={`h-[1px] w-full cursor-pointer appearance-none rounded-none border-0 bg-white outline-none${
            invalid ? ' border-red-500 bg-red-950/40 focus:border-red-400' : ''
          }`}
          min={range[0]}
          max={range[1]}
          step={1}
          value={normalizedValue}
          onChange={(event) => onChange(event.target.value)}
        />
        <div className="inline-flex min-w-[110px] items-center justify-center rounded-full bg-[#243056] px-3 py-1 text-sm font-bold text-white">
          {`${label}: ${normalizedValue}%`}
        </div>
      </div>
      {helpText ? <span className="text-xs text-slate-300">{helpText}</span> : null}
    </div>
  );
}
