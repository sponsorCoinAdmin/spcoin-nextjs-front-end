// File: app/(menu)/(dynamic)/SponsorCoinLab/components/Erc20WriteController.tsx
import React from 'react';
import Image from 'next/image';
import AccountDropdownInput from './AccountDropdownInput';

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
    writeTraceEnabled,
    toggleWriteTrace,
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
  return (
    <div className="mt-4 grid grid-cols-1 gap-3">
      <div className="grid items-center gap-3 md:grid-cols-[auto_minmax(0,1fr)_auto]">
        <span className="text-sm font-semibold text-[#8FA8FF]">Method</span>
        <select
          className="w-fit min-w-[14ch] rounded-lg border border-[#334155] bg-[#0E111B] px-3 py-2 text-sm text-white"
          value={selectedWriteMethod}
          onChange={(e) => setSelectedWriteMethod(e.target.value)}
        >
          {erc20WriteOptions.map((name) => (
            <option key={`erc20-write-${name}`} value={name}>
              {name}
            </option>
          ))}
        </select>
        <button type="button" className={`${actionButtonClassName} justify-self-end`} onClick={toggleWriteTrace}>
          {writeTraceEnabled ? 'Trace On' : 'Trace Off'}
        </button>
      </div>
      <div className={`grid grid-cols-1 gap-3${showWriteSenderPrivateKey ? ' rounded-xl border border-[#31416F] bg-[#0B1220] p-3' : ''}`}>
        <label className="grid items-center gap-3 md:grid-cols-[auto_minmax(0,1fr)]">
          <button
            type="button"
            onClick={toggleShowWriteSenderPrivateKey}
            className="w-fit text-left text-sm font-semibold text-[#8FA8FF] transition-colors hover:text-white"
            title="Toggle msg.sender Private Key"
          >
            msg.sender
          </button>
          {mode === 'hardhat' ? (
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
          )}
        </label>
        {showWriteSenderPrivateKey && (
          <>
            <div className="grid items-center gap-3 md:grid-cols-[auto_minmax(0,1fr)]">
              <span className="text-sm font-semibold text-[#8FA8FF]">Metadata</span>
              <div className="flex items-center gap-3 rounded-lg border border-[#334155] bg-[#0E111B] px-3 py-2 text-sm text-white">
                <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg bg-[#11162A]">
                  {senderMetadata?.logoURL ? (
                    <Image
                      src={senderMetadata.logoURL}
                      alt={senderMetadata?.name || 'Selected account'}
                      width={40}
                      height={40}
                      className="h-full w-full object-contain"
                      unoptimized
                    />
                  ) : (
                    <span className="text-[10px] text-slate-400">No logo</span>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="truncate font-medium text-white">
                    {senderMetadata?.name || 'Unnamed account'}
                  </div>
                  <div className="truncate text-xs text-slate-400">
                    {senderMetadata?.symbol || 'No symbol'}
                  </div>
                </div>
              </div>
            </div>
            {mode === 'hardhat' ? (
              <label className="grid items-center gap-3 md:grid-cols-[auto_minmax(0,1fr)]">
                <span className="text-sm font-semibold text-[#8FA8FF]">Private Key</span>
                <input
                  className={inputStyle}
                  readOnly
                  value={writeSenderPrivateKeyDisplay}
                  placeholder="Selected signer private key"
                />
              </label>
            ) : null}
          </>
        )}
      </div>
      <div className={`grid grid-cols-1 gap-3${openAddressFields.addressA ? ' rounded-xl border border-[#31416F] bg-[#0B1220] p-3' : ''}`}>
        <label className="grid items-center gap-3 md:grid-cols-[auto_minmax(0,1fr)]">
          <button
            type="button"
            onClick={() => setOpenAddressFields((prev) => ({ ...prev, addressA: !prev.addressA }))}
            className="w-fit text-left text-sm font-semibold text-[#8FA8FF] transition-colors hover:text-white"
            title={`Toggle ${activeWriteLabels.addressALabel}`}
          >
            {activeWriteLabels.addressALabel}
          </button>
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
        </label>
        {openAddressFields.addressA && (
          <div className="grid items-center gap-3 md:grid-cols-[auto_minmax(0,1fr)]">
            <span className="text-sm font-semibold text-[#8FA8FF]">Metadata</span>
            <div className="flex items-center gap-3 rounded-lg border border-[#334155] bg-[#0E111B] px-3 py-2 text-sm text-white">
              <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg bg-[#11162A]">
                {getMetadataForAddress(writeAddressA || '')?.logoURL ? (
                  <Image
                    src={getMetadataForAddress(writeAddressA || '')!.logoURL}
                    alt={getMetadataForAddress(writeAddressA || '')?.name || activeWriteLabels.addressALabel}
                    width={40}
                    height={40}
                    className="h-full w-full object-contain"
                    unoptimized
                  />
                ) : (
                  <span className="text-[10px] text-slate-400">No logo</span>
                )}
              </div>
              <div className="min-w-0">
                <div className="truncate font-medium text-white">
                  {getMetadataForAddress(writeAddressA || '')?.name || 'Unnamed account'}
                </div>
                <div className="truncate text-xs text-slate-400">
                  {getMetadataForAddress(writeAddressA || '')?.symbol || 'No symbol'}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      {activeWriteLabels.requiresAddressB && (
        <div className={`grid grid-cols-1 gap-3${openAddressFields.addressB ? ' rounded-xl border border-[#31416F] bg-[#0B1220] p-3' : ''}`}>
          <label className="grid items-center gap-3 md:grid-cols-[auto_minmax(0,1fr)]">
            <button
              type="button"
              onClick={() => setOpenAddressFields((prev) => ({ ...prev, addressB: !prev.addressB }))}
              className="w-fit text-left text-sm font-semibold text-[#8FA8FF] transition-colors hover:text-white"
              title={`Toggle ${activeWriteLabels.addressBLabel}`}
            >
              {activeWriteLabels.addressBLabel}
            </button>
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
          </label>
          {openAddressFields.addressB && (
            <div className="grid items-center gap-3 md:grid-cols-[auto_minmax(0,1fr)]">
              <span className="text-sm font-semibold text-[#8FA8FF]">Metadata</span>
              <div className="flex items-center gap-3 rounded-lg border border-[#334155] bg-[#0E111B] px-3 py-2 text-sm text-white">
                <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg bg-[#11162A]">
                  {getMetadataForAddress(writeAddressB || '')?.logoURL ? (
                    <Image
                      src={getMetadataForAddress(writeAddressB || '')!.logoURL}
                      alt={getMetadataForAddress(writeAddressB || '')?.name || activeWriteLabels.addressBLabel}
                      width={40}
                      height={40}
                      className="h-full w-full object-contain"
                      unoptimized
                    />
                  ) : (
                    <span className="text-[10px] text-slate-400">No logo</span>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="truncate font-medium text-white">
                    {getMetadataForAddress(writeAddressB || '')?.name || 'Unnamed account'}
                  </div>
                  <div className="truncate text-xs text-slate-400">
                    {getMetadataForAddress(writeAddressB || '')?.symbol || 'No symbol'}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
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
