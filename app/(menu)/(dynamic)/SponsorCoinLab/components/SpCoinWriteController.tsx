// File: app/(menu)/(dynamic)/SponsorCoinLab/components/SpCoinWriteController.tsx
import React from 'react';
import BackdateCalendarPopup from './BackdateCalendarPopup';
import AccountDropdownInput from './AccountDropdownInput';
import AccountSelection from './AccountSelection';
import RateSliderRow from './RateSliderRow';
import { getMethodOptionColor } from './methodOptionColors';
import { NativeSelectChevron } from './SelectChevron';
import type { MethodDef } from '../jsonMethods/shared/types';

type Props = {
  invalidFieldIds: string[];
  clearInvalidField: (fieldId: string) => void;
  markEditorAsUserEdited: () => void;
  mode: 'metamask' | 'hardhat';
  hardhatAccounts: Array<{ address: string; privateKey?: string }>;
  hardhatAccountMetadata: Record<string, { name?: string; symbol?: string; logoURL: string }>;
  selectedWriteSenderAddress: string;
  setSelectedWriteSenderAddress: (value: string) => void;
  writeSenderDisplayValue: string;
  writeSenderPrivateKeyDisplay: string;
  showWriteSenderPrivateKey: boolean;
  toggleShowWriteSenderPrivateKey: () => void;
  recipientRateKeyOptions: string[];
  agentRateKeyOptions: string[];
  recipientRateKeyHelpText: string;
  agentRateKeyHelpText: string;
  recipientRateRange?: [number, number];
  agentRateRange?: [number, number];
  selectedSpCoinWriteMethod: string;
  setSelectedSpCoinWriteMethod: (value: string) => void;
  spCoinWorldWriteOptions: string[];
  spCoinSenderWriteOptions: string[];
  spCoinAdminWriteOptions: string[];
  spCoinTodoWriteOptions: string[];
  showOnChainMethods: boolean;
  showOffChainMethods: boolean;
  spCoinOnChainWriteMethods: string[];
  spCoinOffChainWriteMethods: string[];
  spCoinWriteMethodDefs: Record<string, MethodDef>;
  activeSpCoinWriteDef: MethodDef;
  spWriteParams: string[];
  updateSpWriteParamAtIndex: (idx: number, value: string) => void;
  onOpenBackdatePicker: (idx: number) => void;
  inputStyle: string;
  buttonStyle: string;
  writeTraceEnabled: boolean;
  toggleWriteTrace: () => void;
  canRunSelectedSpCoinWriteMethod: boolean;
  canAddCurrentMethodToScript: boolean;
  hasEditorScriptSelected: boolean;
  isAddToScriptBlockedByNoChanges: boolean;
  addToScriptButtonLabel: string;
  missingFieldIds: string[];
  runSelectedSpCoinWriteMethod: () => void;
  addCurrentMethodToScript: () => void;
  hideMethodSelect?: boolean;
  hideActionButtons?: boolean;
  hideAddToScript?: boolean;
  formatDateTimeDisplay: (datePart: string, hours: string, minutes: string, seconds: string) => string;
  formatDateInput: (date: Date) => string;
  backdateHours: string;
  setBackdateHours: (value: string) => void;
  backdateMinutes: string;
  setBackdateMinutes: (value: string) => void;
  backdateSeconds: string;
  setBackdateSeconds: (value: string) => void;
  setBackdateYears: (value: string) => void;
  setBackdateMonths: (value: string) => void;
  setBackdateDays: (value: string) => void;
  backdatePopupParamIdx: number | null;
  setBackdatePopupParamIdx: (value: number | null) => void;
  shiftCalendarMonth: (delta: number) => void;
  calendarMonthOptions: Array<{ label: string; monthIndex: number }>;
  calendarViewMonth: number;
  setCalendarViewMonth: (value: number) => void;
  calendarYearOptions: number[];
  calendarViewYear: number;
  setCalendarViewYear: (value: number) => void;
  isViewingCurrentMonth: boolean;
  setHoverCalendarWarning: (value: string) => void;
  CALENDAR_WEEK_DAYS: string[];
  calendarDayCells: Array<{ day: number | null; key: string }>;
  isViewingFutureMonth: boolean;
  today: Date;
  selectedBackdateDate: Date | null;
  hoverCalendarWarning: string;
  maxBackdateYears: number;
  backdateYears: string;
  backdateMonths: string;
  backdateDays: string;
  applyBackdateBy: (yearsRaw: string, monthsRaw: string, daysRaw: string, targetIdx?: number | null) => void;
};

export default function SpCoinWriteController(props: Props) {
  const {
    invalidFieldIds,
    clearInvalidField,
    markEditorAsUserEdited,
    mode,
    hardhatAccounts,
    hardhatAccountMetadata,
    selectedWriteSenderAddress,
    setSelectedWriteSenderAddress,
    writeSenderDisplayValue,
    writeSenderPrivateKeyDisplay,
    showWriteSenderPrivateKey,
    toggleShowWriteSenderPrivateKey,
    recipientRateKeyOptions,
    agentRateKeyOptions,
    recipientRateKeyHelpText,
    agentRateKeyHelpText,
    recipientRateRange,
    agentRateRange,
    selectedSpCoinWriteMethod,
    setSelectedSpCoinWriteMethod,
    spCoinWorldWriteOptions,
    spCoinSenderWriteOptions,
    spCoinAdminWriteOptions,
    spCoinTodoWriteOptions,
    showOnChainMethods,
    showOffChainMethods,
    spCoinOnChainWriteMethods,
    spCoinOffChainWriteMethods,
    spCoinWriteMethodDefs,
    activeSpCoinWriteDef,
    spWriteParams,
    updateSpWriteParamAtIndex,
    onOpenBackdatePicker,
    inputStyle,
    buttonStyle,
    canRunSelectedSpCoinWriteMethod,
    canAddCurrentMethodToScript,
    hasEditorScriptSelected,
    isAddToScriptBlockedByNoChanges,
    addToScriptButtonLabel,
    missingFieldIds,
    runSelectedSpCoinWriteMethod,
    addCurrentMethodToScript,
    hideMethodSelect = false,
    hideActionButtons = false,
    hideAddToScript = false,
    formatDateTimeDisplay,
    formatDateInput,
    backdateHours,
    setBackdateHours,
    backdateMinutes,
    setBackdateMinutes,
    backdateSeconds,
    setBackdateSeconds,
    setBackdateYears,
    setBackdateMonths,
    setBackdateDays,
    backdatePopupParamIdx,
    setBackdatePopupParamIdx,
    shiftCalendarMonth,
    calendarMonthOptions,
    calendarViewMonth,
    setCalendarViewMonth,
    calendarYearOptions,
    calendarViewYear,
    setCalendarViewYear,
    isViewingCurrentMonth,
    setHoverCalendarWarning,
    CALENDAR_WEEK_DAYS,
    calendarDayCells,
    isViewingFutureMonth,
    today,
    selectedBackdateDate,
    hoverCalendarWarning,
    maxBackdateYears,
    backdateYears,
    backdateMonths,
    backdateDays,
    applyBackdateBy,
  } = props;
  const [openAddressFields, setOpenAddressFields] = React.useState<Record<number, boolean>>({});
  const [hoveredBlockedAction, setHoveredBlockedAction] = React.useState<'execute' | 'add' | null>(null);
  const [recipientRateValue, setRecipientRateValue] = React.useState('0');
  const [agentRateValue, setAgentRateValue] = React.useState('0');
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
  const recipientRateSliderMethods = new Set([
    'addAgent',
    'addAgents',
    'addRecipientTransaction',
    'addAgentTransaction',
    'deleteRecipientSponsorRate',
    'deleteRecipientTransaction',
    'deleteRecipientRate',
    'deleteAgent',
    'deleteAgentNode',
    'unSponsorAgent',
    'deleteAgentRate',
    'addBackDatedRecipientTransaction',
    'addBackDatedAgentTransaction',
  ]);
  const agentRateSliderMethods = new Set([
    'addAgentTransaction',
    'unSponsorAgent',
    'deleteAgentRate',
    'addBackDatedRecipientTransaction',
    'addBackDatedAgentTransaction',
  ]);
  const getPrivateKeyForAddress = (address: string) =>
    hardhatAccounts.find((account) => account.address.toLowerCase() === String(address || '').trim().toLowerCase())
      ?.privateKey || '';
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
  React.useEffect(() => {
    setOpenAddressFields({});
  }, [selectedSpCoinWriteMethod]);
  React.useEffect(() => {
    const recipientRateIdx = activeSpCoinWriteDef.params.findIndex((param) =>
      ['Recipient Rate Key', 'Recipient Rate'].includes(param.label),
    );
    if (!recipientRateSliderMethods.has(selectedSpCoinWriteMethod) || recipientRateIdx < 0) return;
    const fallback = String(Array.isArray(recipientRateRange) ? Number(recipientRateRange[0]) : 0);
    const nextValue = String(spWriteParams[recipientRateIdx] || '').trim() || fallback;
    setRecipientRateValue(nextValue);
    if (String(spWriteParams[recipientRateIdx] || '').trim() === nextValue) return;
    updateSpWriteParamAtIndex(recipientRateIdx, nextValue);
  }, [
    activeSpCoinWriteDef.params,
    recipientRateRange,
    recipientRateSliderMethods,
    selectedSpCoinWriteMethod,
    spWriteParams,
    updateSpWriteParamAtIndex,
  ]);
  React.useEffect(() => {
    const agentRateIdx = activeSpCoinWriteDef.params.findIndex((param) =>
      ['Agent Rate Key', 'Agent Rate'].includes(param.label),
    );
    if (!agentRateSliderMethods.has(selectedSpCoinWriteMethod) || agentRateIdx < 0) return;
    const fallback = String(Array.isArray(agentRateRange) ? Number(agentRateRange[0]) : 0);
    const nextValue = String(spWriteParams[agentRateIdx] || '').trim() || fallback;
    setAgentRateValue(nextValue);
    if (String(spWriteParams[agentRateIdx] || '').trim() === nextValue) return;
    updateSpWriteParamAtIndex(agentRateIdx, nextValue);
  }, [
    activeSpCoinWriteDef.params,
    agentRateRange,
    agentRateSliderMethods,
    selectedSpCoinWriteMethod,
    spWriteParams,
    updateSpWriteParamAtIndex,
  ]);
  React.useEffect(() => {
    const addressFieldIndexes = activeSpCoinWriteDef.params
      .map((param, idx) => ({ param, idx }))
      .filter(({ param }) => mode === 'hardhat' && param.type === 'address');
    if (addressFieldIndexes.length === 0) return;
    setOpenAddressFields((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const { idx } of addressFieldIndexes) {
        if (invalidFieldIds.includes(`spcoin-write-param-${idx}`) && !next[idx]) {
          next[idx] = true;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [activeSpCoinWriteDef.params, invalidFieldIds, mode]);
  const isMethodVisible = React.useCallback(
    (name: string) => {
      const isOnChain = spCoinOnChainWriteMethods.includes(name);
      const isOffChain = spCoinOffChainWriteMethods.includes(name);
      return (showOnChainMethods && isOnChain) || (showOffChainMethods && isOffChain);
    },
    [showOffChainMethods, showOnChainMethods, spCoinOffChainWriteMethods, spCoinOnChainWriteMethods],
  );
  const visibleWorldWriteOptions = spCoinWorldWriteOptions.filter(isMethodVisible);
  const visibleSenderWriteOptions = spCoinSenderWriteOptions.filter(isMethodVisible);
  const visibleAdminWriteOptions = spCoinAdminWriteOptions.filter(isMethodVisible);
  const visibleTodoWriteOptions = spCoinTodoWriteOptions.filter(isMethodVisible);
  React.useEffect(() => {
    const visibleMethods = [
      ...visibleWorldWriteOptions,
      ...visibleSenderWriteOptions,
      ...visibleAdminWriteOptions,
      ...visibleTodoWriteOptions,
    ];
    if (visibleMethods.length === 0) return;
    if (!visibleMethods.includes(selectedSpCoinWriteMethod)) {
      setSelectedSpCoinWriteMethod(visibleMethods[0]);
    }
  }, [
    selectedSpCoinWriteMethod,
    setSelectedSpCoinWriteMethod,
    visibleAdminWriteOptions,
    visibleSenderWriteOptions,
    visibleTodoWriteOptions,
    visibleWorldWriteOptions,
  ]);
  const visibleWriteMethods = [
    ...visibleWorldWriteOptions,
    ...visibleSenderWriteOptions,
    ...visibleAdminWriteOptions,
    ...visibleTodoWriteOptions,
  ];
  const hasVisibleWriteMethods = visibleWriteMethods.length > 0;
  const displayedWriteMethod =
    hasVisibleWriteMethods && visibleWriteMethods.includes(selectedSpCoinWriteMethod)
      ? selectedSpCoinWriteMethod
      : '__no_methods__';
  return (
    <div className="grid grid-cols-1 gap-3">
      {!hideMethodSelect ? <div className="grid items-center gap-3 md:grid-cols-[auto_minmax(0,1fr)_auto]">
        <span className="text-sm font-semibold text-[#8FA8FF]">JSON Method</span>
        <div className="relative w-full min-w-0">
          <select
            aria-label="SpCoin write JSON method"
            title="SpCoin write JSON method"
            className="peer w-full min-w-0 appearance-none rounded-lg border border-[#334155] bg-[#0E111B] px-3 py-2 pr-10 text-sm text-white"
            value={displayedWriteMethod}
            onChange={(e) => setSelectedSpCoinWriteMethod(e.target.value)}
            disabled={!hasVisibleWriteMethods}
          >
          {!hasVisibleWriteMethods ? <option value="__no_methods__">No methods available</option> : null}
          <option
            key="sp-write-world-divider"
            value="__write-world-divider__"
            disabled
            style={{ backgroundColor: '#E5B94F', color: '#111827', fontWeight: '700', textAlign: 'center' }}
          >
            ---- World Access ----
          </option>
          {visibleWorldWriteOptions.map((name) => (
            <option
              key={`sp-write-${name}`}
              value={name}
              style={{ color: getMethodOptionColor(name, spCoinWriteMethodDefs[name].executable) }}
            >
              {spCoinWriteMethodDefs[name]?.title || name}
            </option>
          ))}
          {visibleSenderWriteOptions.length > 0 ? (
            <React.Fragment>
              <option
                key="sp-write-sender-divider"
                value="__write-sender-divider__"
                disabled
                style={{ backgroundColor: '#E5B94F', color: '#111827', fontWeight: '700', textAlign: 'center' }}
              >
                ---- Sender Access ----
              </option>
              {visibleSenderWriteOptions.map((name) => (
                <option
                  key={`sp-write-sender-${name}`}
                  value={name}
                  style={{ color: getMethodOptionColor(name, spCoinWriteMethodDefs[name].executable) }}
                >
                  {spCoinWriteMethodDefs[name]?.title || name}
                </option>
              ))}
            </React.Fragment>
          ) : null}
          {visibleAdminWriteOptions.length > 0 ? (
            <React.Fragment>
              <option
                key="sp-write-admin-divider"
                value="__write-admin-divider__"
                disabled
                style={{ backgroundColor: '#E5B94F', color: '#111827', fontWeight: '700', textAlign: 'center' }}
              >
                ---- Admin Access ----
              </option>
              {visibleAdminWriteOptions.map((name) => (
                <option
                  key={`sp-write-admin-${name}`}
                  value={name}
                  style={{ color: getMethodOptionColor(name, spCoinWriteMethodDefs[name].executable) }}
                >
                  {spCoinWriteMethodDefs[name]?.title || name}
                </option>
              ))}
            </React.Fragment>
          ) : null}
          {visibleTodoWriteOptions.length > 0 ? (
            <React.Fragment>
              <option
                key="sp-write-todo-divider"
                value="__write-todo-divider__"
                disabled
                style={{ backgroundColor: '#E5B94F', color: '#111827', fontWeight: '700', textAlign: 'center' }}
              >
                ---- ToDos ----
              </option>
              {visibleTodoWriteOptions.map((name) => (
                <option
                  key={`sp-write-todo-${name}`}
                  value={name}
                  style={{ color: getMethodOptionColor(name, spCoinWriteMethodDefs[name].executable) }}
                >
                  {spCoinWriteMethodDefs[name]?.title || name}
                </option>
              ))}
            </React.Fragment>
          ) : null}
          </select>
          <NativeSelectChevron />
        </div>
      </div> : null}
      <div id="JSON_METHOD" className="grid grid-cols-1 gap-3 rounded-lg border border-[#31416F] p-3">
      {!hasVisibleWriteMethods ? <div className="text-sm text-slate-400">(no SpCoin write methods match the current filter)</div> : null}
      {hasVisibleWriteMethods ? <AccountSelection
        label="msg.sender"
        title="Toggle msg.sender Private Key"
        isOpen={showWriteSenderPrivateKey}
        onToggle={toggleShowWriteSenderPrivateKey}
        control={
          mode === 'hardhat' ? (
            <AccountDropdownInput
              dataFieldId="spcoin-write-sender"
              inputAriaLabel="Sender account"
              inputTitle="Sender account"
              className={`w-full rounded-lg border border-[#334155] bg-[#0E111B] px-3 py-2 text-sm text-white${invalidClass('spcoin-write-sender')}`}
              value={selectedWriteSenderAddress}
              onChange={(value) => {
                markEditorAsUserEdited();
                clearInvalidField('spcoin-write-sender');
                setSelectedWriteSenderAddress(normalizeAccountValue(value));
              }}
              placeholder="Select account"
              options={accountOptions}
            />
          ) : (
            <input
              aria-label="Connected signer address"
              title="Connected signer address"
              className={inputStyle}
              readOnly
              value={writeSenderDisplayValue}
              placeholder="Connected signer address"
            />
          )
        }
        metadata={getMetadataForAddress(selectedWriteSenderAddress || '')}
        extraDetails={
          mode === 'hardhat' ? (
            <label className="grid items-center gap-3 md:grid-cols-[auto_minmax(0,1fr)]">
              <span className="text-sm font-semibold text-[#8FA8FF]">Private Key</span>
              <input
                aria-label="Selected signer private key"
                title="Selected signer private key"
                className={inputStyle}
                readOnly
                value={writeSenderPrivateKeyDisplay}
                placeholder="Selected signer private key"
              />
            </label>
          ) : null
        }
      /> : null}
      {hasVisibleWriteMethods ? activeSpCoinWriteDef.params.map((param, idx) => (
        <div key={`sp-write-param-${param.label}-${idx}`} className="grid grid-cols-1 gap-3">
          {param.type === 'address' ? (
            <AccountSelection
              label={param.label}
              title={`Toggle ${param.label}`}
              isOpen={Boolean(openAddressFields[idx])}
              onToggle={() => setOpenAddressFields((prev) => ({ ...prev, [idx]: !prev[idx] }))}
              control={
                <AccountDropdownInput
                  dataFieldId={`spcoin-write-param-${idx}`}
                  inputAriaLabel={param.label}
                  inputTitle={param.label}
                  className={`w-full rounded-lg border border-[#334155] bg-[#0E111B] px-3 py-2 text-sm text-white${invalidClass(`spcoin-write-param-${idx}`)}`}
                  value={spWriteParams[idx] || ''}
                  onChange={(value) => {
                    markEditorAsUserEdited();
                    clearInvalidField(`spcoin-write-param-${idx}`);
                    updateSpWriteParamAtIndex(idx, normalizeAccountValue(value));
                  }}
                  placeholder="Select account"
                  options={accountOptions}
                />
              }
              metadata={getMetadataForAddress(spWriteParams[idx] || '')}
              extraDetails={
                mode === 'hardhat' ? (
                  <label className="grid items-center gap-3 md:grid-cols-[auto_minmax(0,1fr)]">
                    <span className="text-sm font-semibold text-[#8FA8FF]">Private Key</span>
                    <input
                      aria-label="Selected account private key"
                      title="Selected account private key"
                      className={inputStyle}
                      readOnly
                      value={getPrivateKeyForAddress(spWriteParams[idx] || '')}
                      placeholder="Selected account private key"
                    />
                  </label>
                ) : null
              }
            />
          ) : param.type === 'date' ? (
            <>
      <div className="grid items-center gap-3 rounded-lg bg-green-100/10 px-3 py-2 md:grid-cols-[auto_minmax(0,1fr)]">
                <span className="text-sm font-semibold text-[#8FA8FF]">{param.label}</span>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    aria-label={param.label}
                    title={param.label}
                    readOnly
                    className={`${inputStyle} cursor-pointer`}
                    value={formatDateTimeDisplay(
                      spWriteParams[idx] || formatDateInput(new Date()),
                      backdateHours,
                      backdateMinutes,
                      backdateSeconds,
                    )}
                    onClick={() => onOpenBackdatePicker(idx)}
                    onFocus={() => onOpenBackdatePicker(idx)}
                  />
                </div>
              </div>
            </>
          ) : ['Recipient Rate Key', 'Recipient Rate'].includes(param.label) &&
            recipientRateSliderMethods.has(selectedSpCoinWriteMethod) ? (
            <>
              <RateSliderRow
                label="Recipient Rate"
                fieldId={`spcoin-write-param-${idx}`}
                invalid={
                  invalidFieldIds.includes(`spcoin-write-param-${idx}`) ||
                  activeHoverInvalidFieldIds.includes(`spcoin-write-param-${idx}`)
                }
                range={Array.isArray(recipientRateRange) ? recipientRateRange : [0, 100]}
                value={recipientRateValue}
                onChange={(nextValue) => {
                  markEditorAsUserEdited();
                  clearInvalidField(`spcoin-write-param-${idx}`);
                  setRecipientRateValue(nextValue);
                  updateSpWriteParamAtIndex(idx, nextValue);
                }}
                helpText={recipientRateKeyHelpText}
              />
            </>
          ) : ['Agent Rate Key', 'Agent Rate'].includes(param.label) &&
            agentRateSliderMethods.has(selectedSpCoinWriteMethod) ? (
            <>
              <RateSliderRow
                label="Agent Rate"
                fieldId={`spcoin-write-param-${idx}`}
                invalid={
                  invalidFieldIds.includes(`spcoin-write-param-${idx}`) ||
                  activeHoverInvalidFieldIds.includes(`spcoin-write-param-${idx}`)
                }
                range={Array.isArray(agentRateRange) ? agentRateRange : [0, 100]}
                value={agentRateValue}
                onChange={(nextValue) => {
                  markEditorAsUserEdited();
                  clearInvalidField(`spcoin-write-param-${idx}`);
                  setAgentRateValue(nextValue);
                  updateSpWriteParamAtIndex(idx, nextValue);
                }}
                helpText={agentRateKeyHelpText}
              />
            </>
          ) : ['Recipient Rate Key', 'Recipient Rate'].includes(param.label) ? (
            <>
              <div className="grid gap-2">
                <div className="grid items-center gap-3 md:grid-cols-[auto_minmax(0,1fr)]">
                  <span className="text-sm font-semibold text-[#8FA8FF]">{param.label}</span>
                  <AccountDropdownInput
                    data-field-id={`spcoin-write-param-${idx}`}
                    inputAriaLabel={param.label}
                    inputTitle={param.label}
                    className={`${inputStyle}${invalidClass(`spcoin-write-param-${idx}`)}`}
                    value={spWriteParams[idx] || ''}
                    onChange={(value) => {
                      markEditorAsUserEdited();
                      clearInvalidField(`spcoin-write-param-${idx}`);
                      updateSpWriteParamAtIndex(idx, value);
                    }}
                    placeholder={`Select or type ${param.label}`}
                    options={recipientRateKeyOptions.map((value) => ({
                      value,
                      label: value,
                    }))}
                  />
                </div>
                {recipientRateKeyHelpText ? <span className="text-xs text-slate-300">{recipientRateKeyHelpText}</span> : null}
              </div>
            </>
          ) : ['Agent Rate Key', 'Agent Rate'].includes(param.label) ? (
            <>
              <div className="grid gap-2">
                <div className="grid items-center gap-3 md:grid-cols-[auto_minmax(0,1fr)]">
                  <span className="text-sm font-semibold text-[#8FA8FF]">{param.label}</span>
                  <AccountDropdownInput
                    data-field-id={`spcoin-write-param-${idx}`}
                    inputAriaLabel={param.label}
                    inputTitle={param.label}
                    className={`${inputStyle}${invalidClass(`spcoin-write-param-${idx}`)}`}
                    value={spWriteParams[idx] || ''}
                    onChange={(value) => {
                      markEditorAsUserEdited();
                      clearInvalidField(`spcoin-write-param-${idx}`);
                      updateSpWriteParamAtIndex(idx, value);
                    }}
                    placeholder={`Select or type ${param.label}`}
                    options={agentRateKeyOptions.map((value) => ({
                      value,
                      label: value,
                    }))}
                  />
                </div>
                {agentRateKeyHelpText ? <span className="text-xs text-slate-300">{agentRateKeyHelpText}</span> : null}
              </div>
            </>
          ) : (
            <>
              <div className="grid items-center gap-3 md:grid-cols-[auto_minmax(0,1fr)]">
                <span className="text-sm font-semibold text-[#8FA8FF]">{param.label}</span>
                <input
                  type="text"
                  data-field-id={`spcoin-write-param-${idx}`}
                  aria-label={param.label}
                  title={param.label}
                  className={`${inputStyle}${invalidClass(`spcoin-write-param-${idx}`)}`}
                  value={spWriteParams[idx] || ''}
                  onChange={(e) => {
                    markEditorAsUserEdited();
                    clearInvalidField(`spcoin-write-param-${idx}`);
                    updateSpWriteParamAtIndex(idx, e.target.value);
                  }}
                  placeholder={param.placeholder}
                />
              </div>
            </>
          )}
        </div>
      )) : null}
      <BackdateCalendarPopup
        backdatePopupParamIdx={backdatePopupParamIdx}
        setBackdatePopupParamIdx={setBackdatePopupParamIdx}
        buttonStyle={buttonStyle}
        inputStyle={inputStyle}
        shiftCalendarMonth={shiftCalendarMonth}
        calendarMonthOptions={calendarMonthOptions}
        calendarViewMonth={calendarViewMonth}
        setCalendarViewMonth={setCalendarViewMonth}
        calendarYearOptions={calendarYearOptions}
        calendarViewYear={calendarViewYear}
        setCalendarViewYear={setCalendarViewYear}
        isViewingCurrentMonth={isViewingCurrentMonth}
        setHoverCalendarWarning={setHoverCalendarWarning}
        CALENDAR_WEEK_DAYS={CALENDAR_WEEK_DAYS}
        calendarDayCells={calendarDayCells}
        isViewingFutureMonth={isViewingFutureMonth}
        today={today}
        selectedBackdateDate={selectedBackdateDate}
        hoverCalendarWarning={hoverCalendarWarning}
        spWriteParams={spWriteParams}
        formatDateInput={formatDateInput}
        formatDateTimeDisplay={formatDateTimeDisplay}
        updateSpWriteParamAtIndex={updateSpWriteParamAtIndex}
        backdateHours={backdateHours}
        setBackdateHours={setBackdateHours}
        backdateMinutes={backdateMinutes}
        setBackdateMinutes={setBackdateMinutes}
        backdateSeconds={backdateSeconds}
        setBackdateSeconds={setBackdateSeconds}
        setBackdateYears={setBackdateYears}
        setBackdateMonths={setBackdateMonths}
        setBackdateDays={setBackdateDays}
        maxBackdateYears={maxBackdateYears}
        backdateYears={backdateYears}
        backdateMonths={backdateMonths}
        backdateDays={backdateDays}
        applyBackdateBy={applyBackdateBy}
      />
      {!hideActionButtons ? <div className="mt-3 flex gap-2">
        <button
          type="button"
          className={`${getActionButtonClassName(canRunSelectedSpCoinWriteMethod, 'execute')} min-w-[50%] shrink-0`}
          onClick={() => void runSelectedSpCoinWriteMethod()}
          disabled={!hasVisibleWriteMethods}
          onMouseEnter={() => {
            if (!canRunSelectedSpCoinWriteMethod) setHoveredBlockedAction('execute');
          }}
          onMouseLeave={() => setHoveredBlockedAction(null)}
        >
          {!canRunSelectedSpCoinWriteMethod && hoveredBlockedAction === 'execute'
            ? 'Missing Parameters'
            : `Run ${activeSpCoinWriteDef.title}`}
        </button>
        {!hideAddToScript ? (
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
        ) : null}
      </div> : null}
      </div>
    </div>
  );
}
