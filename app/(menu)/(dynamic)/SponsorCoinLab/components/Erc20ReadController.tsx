// File: app/(menu)/(dynamic)/SponsorCoinLab/components/Erc20ReadController.tsx
import React from 'react';
import Image from 'next/image';
import AccountDropdownInput from './AccountDropdownInput';

type ActiveReadLabels = {
  title: string;
  addressALabel: string;
  addressAPlaceholder: string;
  addressBLabel: string;
  addressBPlaceholder: string;
  requiresAddressA: boolean;
  requiresAddressB: boolean;
};

type Props = {
  invalidFieldIds: string[];
  clearInvalidField: (fieldId: string) => void;
  writeTraceEnabled: boolean;
  toggleWriteTrace: () => void;
  hardhatAccounts: Array<{ address: string; privateKey?: string }>;
  hardhatAccountMetadata: Record<string, { name?: string; symbol?: string; logoURL: string }>;
  selectedReadMethod: string;
  erc20ReadOptions: string[];
  setSelectedReadMethod: (value: string) => void;
  activeReadLabels: ActiveReadLabels;
  readAddressA: string;
  setReadAddressA: (value: string) => void;
  readAddressB: string;
  setReadAddressB: (value: string) => void;
  canRunSelectedReadMethod: boolean;
  canAddCurrentMethodToScript: boolean;
  isAddToScriptBlockedByNoChanges: boolean;
  addToScriptButtonLabel: string;
  missingFieldIds: string[];
  runSelectedReadMethod: () => void;
  addCurrentMethodToScript: () => void;
};

export default function Erc20ReadController(props: Props) {
  const {
    invalidFieldIds,
    clearInvalidField,
    writeTraceEnabled,
    toggleWriteTrace,
    hardhatAccounts,
    hardhatAccountMetadata,
    selectedReadMethod,
    erc20ReadOptions,
    setSelectedReadMethod,
    activeReadLabels,
    readAddressA,
    setReadAddressA,
    readAddressB,
    setReadAddressB,
    canRunSelectedReadMethod,
    canAddCurrentMethodToScript,
    isAddToScriptBlockedByNoChanges,
    addToScriptButtonLabel,
    missingFieldIds,
    runSelectedReadMethod,
    addCurrentMethodToScript,
  } = props;
  const [hoveredBlockedAction, setHoveredBlockedAction] = React.useState<'execute' | 'add' | null>(null);
  const activeHoverInvalidFieldIds = hoveredBlockedAction ? missingFieldIds : [];
  const invalidClass = (fieldId: string) =>
    invalidFieldIds.includes(fieldId) || activeHoverInvalidFieldIds.includes(fieldId)
      ? ' border-red-500 bg-red-950/40 focus:border-red-400'
      : '';
  const actionButtonClassName =
    'h-[36px] rounded px-4 py-[0.28rem] text-center font-bold text-black transition-colors bg-[#E5B94F] hover:bg-green-500';
  const getActionButtonClassName = (isEnabled: boolean, buttonKind: 'execute' | 'add') =>
    buttonKind === 'add' && isAddToScriptBlockedByNoChanges
      ? `h-[36px] rounded px-4 py-[0.28rem] text-center font-bold transition-colors ${
          hoveredBlockedAction === buttonKind ? 'cursor-not-allowed bg-red-600 text-white' : 'bg-[#E5B94F] text-black'
        }`
      : isEnabled
      ? actionButtonClassName
      : `h-[36px] rounded px-4 py-[0.28rem] text-center font-bold transition-colors ${
          hoveredBlockedAction === buttonKind ? 'bg-red-600 text-white' : 'bg-[#E5B94F] text-black hover:bg-[#d7ae45]'
        }`;
  const normalizeAccountValue = (value: string) => {
    const trimmed = String(value || '').trim();
    return /^0[xX][0-9a-fA-F]{40}$/.test(trimmed) ? `0x${trimmed.slice(2).toLowerCase()}` : trimmed;
  };
  const [openAddressFields, setOpenAddressFields] = React.useState<Record<string, boolean>>({});
  const getMetadataForAddress = (address: string) =>
    hardhatAccountMetadata[String(address || '').trim().toLowerCase()];
  const formatAccountOptionLabel = (address: string, index: number) => {
    const metadata = getMetadataForAddress(address);
    const name = String(metadata?.name || '').trim() || 'Unnamed account';
    const symbol = String(metadata?.symbol || '').trim() || 'No symbol';
    return `Account ${index}, ${address}, ${name}(${symbol})`;
  };
  const accountOptions = React.useMemo(
    () =>
      hardhatAccounts.map((account, idx) => ({
        value: normalizeAccountValue(account.address),
        label: formatAccountOptionLabel(account.address, idx),
      })),
    [hardhatAccounts],
  );

  return (
    <div className="mt-4 grid grid-cols-1 gap-3">
      <div className="grid items-center gap-3 md:grid-cols-[auto_minmax(0,1fr)_auto]">
        <span className="text-sm font-semibold text-[#8FA8FF]">Method</span>
        <select
          className="w-fit min-w-[14ch] rounded-lg border border-[#334155] bg-[#0E111B] px-3 py-2 text-sm text-white"
          value={selectedReadMethod}
          onChange={(e) => setSelectedReadMethod(e.target.value)}
        >
          {erc20ReadOptions.map((name) => (
            <option key={`erc20-read-${name}`} value={name}>
              {name}
            </option>
          ))}
        </select>
        <button type="button" className={`${actionButtonClassName} justify-self-end`} onClick={toggleWriteTrace}>
          {writeTraceEnabled ? 'Trace On' : 'Trace Off'}
        </button>
      </div>
      {activeReadLabels.requiresAddressA && (
        <div className={`grid grid-cols-1 gap-3${openAddressFields.addressA ? ' rounded-xl border border-[#31416F] bg-[#0B1220] p-3' : ''}`}>
          <label className="grid items-center gap-3 md:grid-cols-[auto_minmax(0,1fr)]">
            <button
              type="button"
              onClick={() => setOpenAddressFields((prev) => ({ ...prev, addressA: !prev.addressA }))}
              className="w-fit text-left text-sm font-semibold text-[#8FA8FF] transition-colors hover:text-white"
              title={`Toggle ${activeReadLabels.addressALabel}`}
            >
              {activeReadLabels.addressALabel}
            </button>
            <AccountDropdownInput
              dataFieldId="erc20-read-address-a"
              className={`w-full rounded-lg border border-[#334155] bg-[#0E111B] px-3 py-2 text-sm text-white${invalidClass('erc20-read-address-a')}`}
              value={readAddressA}
              onChange={(value) => {
                clearInvalidField('erc20-read-address-a');
                setReadAddressA(normalizeAccountValue(value));
              }}
              placeholder="Select account"
              options={accountOptions}
            />
          </label>
          {openAddressFields.addressA && (
            <div className="grid items-center gap-3 md:grid-cols-[auto_minmax(0,1fr)]">
              <span className="text-sm font-semibold text-[#8FA8FF]">Metadata</span>
              <div className="flex items-center gap-3 rounded-lg border border-[#334155] bg-[#0E111B] px-3 py-2 text-sm text-white">
                <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg bg-[#11162A]">
                  {getMetadataForAddress(readAddressA || '')?.logoURL ? (
                    <Image src={getMetadataForAddress(readAddressA || '')!.logoURL} alt={getMetadataForAddress(readAddressA || '')?.name || activeReadLabels.addressALabel} width={40} height={40} className="h-full w-full object-contain" unoptimized />
                  ) : (
                    <span className="text-[10px] text-slate-400">No logo</span>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="truncate font-medium text-white">{getMetadataForAddress(readAddressA || '')?.name || 'Unnamed account'}</div>
                  <div className="truncate text-xs text-slate-400">{getMetadataForAddress(readAddressA || '')?.symbol || 'No symbol'}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      {activeReadLabels.requiresAddressB && (
        <div className={`grid grid-cols-1 gap-3${openAddressFields.addressB ? ' rounded-xl border border-[#31416F] bg-[#0B1220] p-3' : ''}`}>
          <label className="grid items-center gap-3 md:grid-cols-[auto_minmax(0,1fr)]">
            <button
              type="button"
              onClick={() => setOpenAddressFields((prev) => ({ ...prev, addressB: !prev.addressB }))}
              className="w-fit text-left text-sm font-semibold text-[#8FA8FF] transition-colors hover:text-white"
              title={`Toggle ${activeReadLabels.addressBLabel}`}
            >
              {activeReadLabels.addressBLabel}
            </button>
            <AccountDropdownInput
              dataFieldId="erc20-read-address-b"
              className={`w-full rounded-lg border border-[#334155] bg-[#0E111B] px-3 py-2 text-sm text-white${invalidClass('erc20-read-address-b')}`}
              value={readAddressB}
              onChange={(value) => {
                clearInvalidField('erc20-read-address-b');
                setReadAddressB(normalizeAccountValue(value));
              }}
              placeholder="Select account"
              options={accountOptions}
            />
          </label>
          {openAddressFields.addressB && (
            <div className="grid items-center gap-3 md:grid-cols-[auto_minmax(0,1fr)]">
              <span className="text-sm font-semibold text-[#8FA8FF]">Metadata</span>
              <div className="flex items-center gap-3 rounded-lg border border-[#334155] bg-[#0E111B] px-3 py-2 text-sm text-white">
                <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg bg-[#11162A]">
                  {getMetadataForAddress(readAddressB || '')?.logoURL ? (
                    <Image src={getMetadataForAddress(readAddressB || '')!.logoURL} alt={getMetadataForAddress(readAddressB || '')?.name || activeReadLabels.addressBLabel} width={40} height={40} className="h-full w-full object-contain" unoptimized />
                  ) : (
                    <span className="text-[10px] text-slate-400">No logo</span>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="truncate font-medium text-white">{getMetadataForAddress(readAddressB || '')?.name || 'Unnamed account'}</div>
                  <div className="truncate text-xs text-slate-400">{getMetadataForAddress(readAddressB || '')?.symbol || 'No symbol'}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      <div className="flex gap-2">
        <button
          type="button"
          className={`${getActionButtonClassName(canRunSelectedReadMethod, 'execute')} min-w-[50%] shrink-0`}
          onClick={() => void runSelectedReadMethod()}
          onMouseEnter={() => {
            if (!canRunSelectedReadMethod) setHoveredBlockedAction('execute');
          }}
          onMouseLeave={() => setHoveredBlockedAction(null)}
        >
          {!canRunSelectedReadMethod && hoveredBlockedAction === 'execute'
            ? 'Missing Required Parameters'
            : `Execute ${activeReadLabels.title}`}
        </button>
        <button
          type="button"
          className={`${getActionButtonClassName(canAddCurrentMethodToScript, 'add')} min-w-0 flex-1`}
          onClick={() => {
            if (isAddToScriptBlockedByNoChanges) return;
            addCurrentMethodToScript();
          }}
          onMouseEnter={() => {
            if (!canAddCurrentMethodToScript || isAddToScriptBlockedByNoChanges) setHoveredBlockedAction('add');
          }}
          onMouseLeave={() => setHoveredBlockedAction(null)}
        >
          {isAddToScriptBlockedByNoChanges
            ? hoveredBlockedAction === 'add'
              ? 'No Update Changes'
              : addToScriptButtonLabel
            : !canAddCurrentMethodToScript && hoveredBlockedAction === 'add'
            ? 'Missing Required Parameters'
            : addToScriptButtonLabel}
        </button>
      </div>
    </div>
  );
}
