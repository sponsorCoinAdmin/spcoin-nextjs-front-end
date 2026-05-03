import React from 'react';
import {
  AMOUNT_UNIT_OPTIONS,
  convertAmountDisplayValue,
  normalizeRawAmountInput,
  normalizeTokenAmountInput,
  type AmountUnit,
} from '../utils/amountUnits';
import { NativeSelectChevron } from './SelectChevron';

type Props = {
  label: string;
  value: string;
  unit: AmountUnit;
  onValueChange: (value: string) => void;
  onUnitChange: (unit: AmountUnit) => void;
  inputStyle: string;
  dataFieldId: string;
  inputClassName?: string;
  placeholder?: string;
  decimals: number;
};

export default function AmountInputRow({
  label,
  value,
  unit,
  onValueChange,
  onUnitChange,
  inputStyle,
  dataFieldId,
  inputClassName = '',
  placeholder,
  decimals,
}: Props) {
  const resolvedPlaceholder =
    placeholder ?? (unit === 'TOKEN' ? 'Token amount' : 'Raw base-unit amount');
  const handleValueChange = (nextValue: string) => {
    onValueChange(unit === 'RAW' ? normalizeRawAmountInput(nextValue) : normalizeTokenAmountInput(nextValue));
  };
  const handleUnitChange = (nextUnit: AmountUnit) => {
    try {
      onValueChange(convertAmountDisplayValue(value, unit, nextUnit, decimals));
    } catch {
      onValueChange(nextUnit === 'RAW' ? normalizeRawAmountInput(value) : value);
    }
    onUnitChange(nextUnit);
  };

  return (
    <label className="grid items-center gap-3 md:grid-cols-[auto_minmax(0,1fr)]">
      <span className="text-sm font-semibold text-[#8FA8FF]">{label}</span>
      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_96px] gap-2">
        <input
          type="text"
          data-field-id={dataFieldId}
          aria-label={label}
          title={label}
          className={`${inputStyle}${inputClassName}`}
          value={value}
          inputMode={unit === 'RAW' ? 'numeric' : 'decimal'}
          pattern={unit === 'RAW' ? '[0-9]*' : undefined}
          onChange={(event) => handleValueChange(event.target.value)}
          placeholder={resolvedPlaceholder}
        />
        <div className="relative min-w-0">
          <select
            aria-label={`${label} unit`}
            title={`${label} unit`}
            className="peer w-full appearance-none rounded-lg border border-[#334155] bg-[#0E111B] px-3 py-2 pr-8 text-sm text-white"
            value={unit}
            onChange={(event) => handleUnitChange(event.target.value as AmountUnit)}
          >
            {AMOUNT_UNIT_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <NativeSelectChevron />
        </div>
      </div>
    </label>
  );
}
