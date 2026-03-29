// File: app/(menu)/(dynamic)/SponsorCoinLab/components/Erc20WriteController.tsx
import React from 'react';
import AccountDropdownInput from './AccountDropdownInput';
import AccountSelection from './AccountSelection';

type ActiveWriteLabels = {
  title: string;
  addressALabel: string;
  addressAPlaceholder: string;
  addressBLabel: string;
  addressBPlaceholder: string;
  requiresAddressB: boolean;
};

type Props = {
  invalidFieldIds: string[];
  clearInvalidField: (fieldId: string) => void;
  showOnChainMethods: boolean;
  showOffChainMethods: boolean;
  writeTraceEnabled: boolean;
  toggleWriteTrace: () => void;
  mode: 'metamask' | 'hardhat';
  hardhatAccounts: Array<{ address: string; privateKey?: string }>;
  hardhatAccountMetadata: Record<string, { name?: string; symbol?: string; logoURL: string }>;
  selectedWriteSenderAddress: string;
  setSelectedWriteSenderAddress: (value: string) => void;
  writeSenderDisplayValue: string;
  writeSenderPrivateKeyDisplay: string;
  showWriteSenderPrivateKey: boolean;
  toggleShowWriteSenderPrivateKey: () => void;
  selectedWriteMethod: string;
  erc20WriteOptions: string[];
  setSelectedWriteMethod: (value: string) => void;
  activeWriteLabels: ActiveWriteLabels;
  writeAddressA: string;
  setWriteAddressA: (value: string) => void;
  writeAddressB: string;
  setWriteAddressB: (value: string) => void;
  writeAmountRaw: string;
  setWriteAmountRaw: (value: string) => void;
  inputStyle: string;
  canRunSelectedWriteMethod: boolean;
  canAddCurrentMethodToScript: boolean;
  hasEditorScriptSelected: boolean;
  isAddToScriptBlockedByNoChanges: boolean;
  addToScriptButtonLabel: string;
  missingFieldIds: string[];
  runSelectedWriteMethod: () => void;
  addCurrentMethodToScript: () => void;
};

export default function Erc20WriteController(props: Props) {
  const {
    invalidFieldIds,
    clearInvalidField,
    showOnChainMethods,
    mode,
    hardhatAccounts,
    hardhatAccountMetadata,
    selectedWriteSenderAddress,
    setSelectedWriteSenderAddress,
    writeSenderDisplayValue,
    writeSenderPrivateKeyDisplay,
    showWriteSenderPrivateKey,
    toggleShowWriteSenderPrivateKey,
    selectedWriteMethod,
    erc20WriteOptions,
    setSelectedWriteMethod,
    activeWriteLabels,
    writeAddressA,
    setWriteAddressA,
    writeAddressB,
    setWriteAddressB,
    writeAmountRaw,
    setWriteAmountRaw,
    inputStyle,
    canRunSelectedWriteMethod,
    canAddCurrentMethodToScript,
    hasEditorScriptSelected,
    isAddToScriptBlockedByNoChanges,
    addToScriptButtonLabel,
    missingFieldIds,
    runSelectedWriteMethod,
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
  const senderAddressForMetadata = mode === 'hardhat' ? selectedWriteSenderAddress : writeSenderDisplayValue;
  const senderMetadata = hardhatAccountMetadata[String(senderAddressForMetadata || '').trim().toLowerCase()];
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
  const visibleWriteOptions = React.useMemo(
    () => (showOnChainMethods ? erc20WriteOptions : []),
    [erc20WriteOptions, showOnChainMethods],
  );
  React.useEffect(() => {
    if (visibleWriteOptions.length === 0) return;
    if (visibleWriteOptions.includes(selectedWriteMethod)) return;
    setSelectedWriteMethod(visibleWriteOptions[0]);
  }, [selectedWriteMethod, setSelectedWriteMethod, visibleWriteOptions]);
  const hasVisibleWriteMethods = visibleWriteOptions.length > 0;
  const displayedWriteMethod =
    hasVisibleWriteMethods && visibleWriteOptions.includes(selectedWriteMethod) ? selectedWriteMethod : '__no_methods__';
  return (
    <div className="grid grid-cols-1 gap-3">
      <div className="grid items-center gap-3 md:grid-cols-[auto_minmax(0,1fr)]">
        <span className="text-sm font-semibold text-[#8FA8FF]">JSON Method</span>
        <select
          className="w-fit min-w-[14ch] rounded-lg border border-[#334155] bg-[#0E111B] px-3 py-2 text-sm text-white"
          value={displayedWriteMethod}
          onChange={(e) => setSelectedWriteMethod(e.target.value)}
          disabled={!hasVisibleWriteMethods}
        >
          {!hasVisibleWriteMethods ? <option value="__no_methods__">No methods available</option> : null}
          {visibleWriteOptions.map((name) => (
            <option key={`erc20-write-${name}`} value={name}>
              {name}
            </option>
          ))}
        </select>
      </div>
      {!hasVisibleWriteMethods ? <div className="text-sm text-slate-400">(no on-chain ERC20 write methods match the current filter)</div> : null}
      {hasVisibleWriteMethods ? <AccountSelection
        label="msg.sender"
        title="Toggle msg.sender Private Key"
        isOpen={showWriteSenderPrivateKey}
        onToggle={toggleShowWriteSenderPrivateKey}
        control={
          mode === 'hardhat' ? (
            <AccountDropdownInput
              dataFieldId="erc20-write-sender"
              className={`w-full rounded-lg border border-[#334155] bg-[#0E111B] px-3 py-2 text-sm text-white${invalidClass('erc20-write-sender')}`}
              value={selectedWriteSenderAddress}
              onChange={(value) => {
                clearInvalidField('erc20-write-sender');
                setSelectedWriteSenderAddress(normalizeAccountValue(value));
              }}
              placeholder="Select account"
              options={accountOptions}
            />
          ) : (
            <input
              className={inputStyle}
              readOnly
              value={writeSenderDisplayValue}
              placeholder="Connected signer address"
            />
          )
        }
        metadata={senderMetadata}
        extraDetails={
          mode === 'hardhat' ? (
            <label className="grid items-center gap-3 md:grid-cols-[auto_minmax(0,1fr)]">
              <span className="text-sm font-semibold text-[#8FA8FF]">Private Key</span>
              <input
                className={inputStyle}
                readOnly
                value={writeSenderPrivateKeyDisplay}
                placeholder="Selected signer private key"
              />
            </label>
          ) : null
        }
      /> : null}
      {hasVisibleWriteMethods ? <AccountSelection
        label={activeWriteLabels.addressALabel}
        title={`Toggle ${activeWriteLabels.addressALabel}`}
        isOpen={Boolean(openAddressFields.addressA)}
        onToggle={() => setOpenAddressFields((prev) => ({ ...prev, addressA: !prev.addressA }))}
        control={
          <AccountDropdownInput
            dataFieldId="erc20-write-address-a"
            className={`w-full rounded-lg border border-[#334155] bg-[#0E111B] px-3 py-2 text-sm text-white${invalidClass('erc20-write-address-a')}`}
            value={writeAddressA}
            onChange={(value) => {
              clearInvalidField('erc20-write-address-a');
              setWriteAddressA(normalizeAccountValue(value));
            }}
            placeholder="Select account"
            options={accountOptions}
          />
        }
        metadata={getMetadataForAddress(writeAddressA || '')}
      /> : null}
      {hasVisibleWriteMethods && activeWriteLabels.requiresAddressB && (
        <AccountSelection
          label={activeWriteLabels.addressBLabel}
          title={`Toggle ${activeWriteLabels.addressBLabel}`}
          isOpen={Boolean(openAddressFields.addressB)}
          onToggle={() => setOpenAddressFields((prev) => ({ ...prev, addressB: !prev.addressB }))}
          control={
            <AccountDropdownInput
              dataFieldId="erc20-write-address-b"
              className={`w-full rounded-lg border border-[#334155] bg-[#0E111B] px-3 py-2 text-sm text-white${invalidClass('erc20-write-address-b')}`}
              value={writeAddressB}
              onChange={(value) => {
                clearInvalidField('erc20-write-address-b');
                setWriteAddressB(normalizeAccountValue(value));
              }}
              placeholder="Select account"
              options={accountOptions}
            />
          }
          metadata={getMetadataForAddress(writeAddressB || '')}
        />
      )}
      <label className="grid items-center gap-3 md:grid-cols-[auto_minmax(0,1fr)]">
        <span className="text-sm font-semibold text-[#8FA8FF]">Amount (raw uint256)</span>
        <input
          data-field-id="erc20-write-amount"
          className={`${inputStyle}${invalidClass('erc20-write-amount')}`}
          value={writeAmountRaw}
          onChange={(e) => {
            clearInvalidField('erc20-write-amount');
            setWriteAmountRaw(e.target.value);
          }}
          placeholder={`${activeWriteLabels.title}(amount raw uint256)`}
        />
      </label>
      <div className="flex gap-2">
        <button
          type="button"
          className={`${getActionButtonClassName(canRunSelectedWriteMethod, 'execute')} min-w-[50%] shrink-0`}
          onClick={() => void runSelectedWriteMethod()}
          disabled={!hasVisibleWriteMethods}
          onMouseEnter={() => {
            if (!canRunSelectedWriteMethod) setHoveredBlockedAction('execute');
          }}
          onMouseLeave={() => setHoveredBlockedAction(null)}
        >
          {!canRunSelectedWriteMethod && hoveredBlockedAction === 'execute'
            ? 'Missing Parameters'
            : `Run ${activeWriteLabels.title}`}
        </button>
        <button
          type="button"
          className={`${getActionButtonClassName(canAddCurrentMethodToScript, 'add')} min-w-0 flex-1`}
          onClick={() => {
            if (isAddToScriptBlockedByNoChanges) return;
            addCurrentMethodToScript();
          }}
          disabled={!hasVisibleWriteMethods}
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
