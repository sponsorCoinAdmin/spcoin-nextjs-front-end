// File: app/(menu)/(dynamic)/SponsorCoinLab/components/Erc20ReadController.tsx
import React from 'react';
import AccountDropdownInput from './AccountDropdownInput';
import AccountSelection from './AccountSelection';

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
  hasEditorScriptSelected: boolean;
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
    hasEditorScriptSelected,
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
    <div className="grid grid-cols-1 gap-3">
      <div className="grid items-center gap-3 md:grid-cols-[auto_minmax(0,1fr)]">
        <label htmlFor="erc20-read-method" className="text-sm font-semibold text-[#8FA8FF]">
          JSON Method
        </label>
        <select
          id="erc20-read-method"
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
      </div>
      {activeReadLabels.requiresAddressA && (
        <AccountSelection
          label={activeReadLabels.addressALabel}
          title={`Toggle ${activeReadLabels.addressALabel}`}
          isOpen={Boolean(openAddressFields.addressA)}
          onToggle={() => setOpenAddressFields((prev) => ({ ...prev, addressA: !prev.addressA }))}
          control={
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
          }
          metadata={getMetadataForAddress(readAddressA || '')}
        />
      )}
      {activeReadLabels.requiresAddressB && (
        <AccountSelection
          label={activeReadLabels.addressBLabel}
          title={`Toggle ${activeReadLabels.addressBLabel}`}
          isOpen={Boolean(openAddressFields.addressB)}
          onToggle={() => setOpenAddressFields((prev) => ({ ...prev, addressB: !prev.addressB }))}
          control={
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
          }
          metadata={getMetadataForAddress(readAddressB || '')}
        />
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
            ? 'Missing Parameters'
            : `Run ${activeReadLabels.title}`}
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
          title={!hasEditorScriptSelected ? 'Create a Script in the Editor Editor' : undefined}
        >
          {isAddToScriptBlockedByNoChanges
            ? hoveredBlockedAction === 'add'
              ? 'No Update Changes'
              : addToScriptButtonLabel
            : !hasEditorScriptSelected && hoveredBlockedAction === 'add'
            ? 'No Editor Script'
            : !canAddCurrentMethodToScript && hoveredBlockedAction === 'add'
            ? 'Missing Parameters'
            : addToScriptButtonLabel}
        </button>
      </div>
    </div>
  );
}
