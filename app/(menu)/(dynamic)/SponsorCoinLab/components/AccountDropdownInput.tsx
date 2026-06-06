import React from 'react';
import { useSpCoinWallet } from '@/lib/spCoinWallet';
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
  const { openAccountSelection } = useSpCoinWallet();
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
  const displayValue = String(value || '').trim() || placeholder || 'Select account';
  const openWallet = React.useCallback(() => {
    const label =
      [traceLabel, dataFieldId, inputAriaLabel, inputTitle]
        .map((entry) => String(entry ?? '').trim())
        .find(Boolean) ?? 'Select account';
    trace(`wallet open current=${summarizeValue(value)} totalOptions=${options.length}`);
    openAccountSelection({
      label,
      currentAddress: value,
      preferredSource: 'hardhat',
      onSelect: (account) => {
        trace(`wallet selected=${summarizeValue(account.address)} label=${summarizeValue(account.label ?? '')}`);
        onChange(account.address);
      },
    });
  }, [
    dataFieldId,
    inputAriaLabel,
    inputTitle,
    onChange,
    openAccountSelection,
    options.length,
    summarizeValue,
    trace,
    traceLabel,
    value,
  ]);

  return (
    <div className="relative w-full min-w-0">
      <button
        type="button"
        data-field-id={dataFieldId}
        aria-label={inputAriaLabel}
        title={inputTitle}
        onClick={openWallet}
        className={`${className} flex items-center justify-between gap-3 pr-3 text-left`}
      >
        <span className={value ? 'min-w-0 truncate text-white' : 'min-w-0 truncate text-[#9CA3AF]'}>
          {displayValue}
        </span>
        <span className="inline-flex shrink-0 items-center justify-center text-[#8FA8FF] transition-colors">
          <SelectChevron open={false} />
        </span>
      </button>
    </div>
  );
}
