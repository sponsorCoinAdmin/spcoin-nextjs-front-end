// File: app/(menu)/(dynamic)/SponsorCoinLab/components/SpCoinWriteController.tsx
import React from 'react';
import BackdateCalendarPopup from './BackdateCalendarPopup';
import AccountDropdownInput from './AccountDropdownInput';
import AccountSelection from './AccountSelection';
import type { MethodDef } from '../methods/shared/types';

type Props = {
  invalidFieldIds: string[];
  clearInvalidField: (fieldId: string) => void;
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
  selectedSpCoinWriteMethod: string;
  setSelectedSpCoinWriteMethod: (value: string) => void;
  spCoinWorldWriteOptions: string[];
  spCoinSenderWriteOptions: string[];
  spCoinAdminWriteOptions: string[];
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
    selectedSpCoinWriteMethod,
    setSelectedSpCoinWriteMethod,
    spCoinWorldWriteOptions,
    spCoinSenderWriteOptions,
    spCoinAdminWriteOptions,
    spCoinWriteMethodDefs,
    activeSpCoinWriteDef,
    spWriteParams,
    updateSpWriteParamAtIndex,
    onOpenBackdatePicker,
    inputStyle,
    buttonStyle,
    writeTraceEnabled,
    toggleWriteTrace,
    canRunSelectedSpCoinWriteMethod,
    canAddCurrentMethodToScript,
    hasEditorScriptSelected,
    isAddToScriptBlockedByNoChanges,
    addToScriptButtonLabel,
    missingFieldIds,
    runSelectedSpCoinWriteMethod,
    addCurrentMethodToScript,
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
  return (
    <div className="grid grid-cols-1 gap-3">
      <div className="grid items-center gap-3 md:grid-cols-[auto_minmax(0,1fr)_auto]">
        <span className="text-sm font-semibold text-[#8FA8FF]">Method</span>
        <select
          className="w-fit min-w-[18ch] rounded-lg border border-[#334155] bg-[#0E111B] px-3 py-2 text-sm text-white"
          value={selectedSpCoinWriteMethod}
          onChange={(e) => setSelectedSpCoinWriteMethod(e.target.value)}
        >
          <option
            key="sp-write-world-divider"
            value="__write-world-divider__"
            disabled
            style={{ backgroundColor: '#E5B94F', color: '#111827', fontWeight: '700', textAlign: 'center' }}
          >
            ---- World Access ----
          </option>
          {spCoinWorldWriteOptions.map((name) => (
            <option
              key={`sp-write-${name}`}
              value={name}
              style={{ color: spCoinWriteMethodDefs[name].executable === false ? '#ef4444' : undefined }}
            >
              {name}
            </option>
          ))}
          {spCoinSenderWriteOptions.length > 0 ? (
            <React.Fragment>
              <option
                key="sp-write-sender-divider"
                value="__write-sender-divider__"
                disabled
                style={{ backgroundColor: '#E5B94F', color: '#111827', fontWeight: '700', textAlign: 'center' }}
              >
                ---- Sender Access ----
              </option>
              {spCoinSenderWriteOptions.map((name) => (
                <option
                  key={`sp-write-sender-${name}`}
                  value={name}
                  style={{ color: spCoinWriteMethodDefs[name].executable === false ? '#ef4444' : undefined }}
                >
                  {name}
                </option>
              ))}
            </React.Fragment>
          ) : null}
          {spCoinAdminWriteOptions.length > 0 ? (
            <React.Fragment>
              <option
                key="sp-write-admin-divider"
                value="__write-admin-divider__"
                disabled
                style={{ backgroundColor: '#E5B94F', color: '#111827', fontWeight: '700', textAlign: 'center' }}
              >
                ---- Admin Access ----
              </option>
              {spCoinAdminWriteOptions.map((name) => (
                <option
                  key={`sp-write-admin-${name}`}
                  value={name}
                  style={{ color: spCoinWriteMethodDefs[name].executable === false ? '#ef4444' : undefined }}
                >
                  {name}
                </option>
              ))}
            </React.Fragment>
          ) : null}
        </select>
        <button type="button" className={`${actionButtonClassName} justify-self-end`} onClick={toggleWriteTrace}>
          {writeTraceEnabled ? 'Trace On' : 'Trace Off'}
        </button>
      </div>
      <AccountSelection
        label="msg.sender"
        title="Toggle msg.sender Private Key"
        isOpen={showWriteSenderPrivateKey}
        onToggle={toggleShowWriteSenderPrivateKey}
        control={
          mode === 'hardhat' ? (
            <AccountDropdownInput
              dataFieldId="spcoin-write-sender"
              className={`w-full rounded-lg border border-[#334155] bg-[#0E111B] px-3 py-2 text-sm text-white${invalidClass('spcoin-write-sender')}`}
              value={selectedWriteSenderAddress}
              onChange={(value) => {
                clearInvalidField('spcoin-write-sender');
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
        metadata={getMetadataForAddress(selectedWriteSenderAddress || '')}
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
      />
      {activeSpCoinWriteDef.params.map((param, idx) => (
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
                  className={`w-full rounded-lg border border-[#334155] bg-[#0E111B] px-3 py-2 text-sm text-white${invalidClass(`spcoin-write-param-${idx}`)}`}
                  value={spWriteParams[idx] || ''}
                  onChange={(value) => {
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
              <span className="text-sm font-semibold text-[#8FA8FF]">{param.label}</span>
            <div className="flex items-center gap-2">
              <input
                type="text"
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
            </>
          ) : ['Recipient Rate Key', 'Recipient Rate'].includes(param.label) ? (
            <>
              <span className="text-sm font-semibold text-[#8FA8FF]">{param.label}</span>
              <div className="grid gap-2">
                <AccountDropdownInput
                  data-field-id={`spcoin-write-param-${idx}`}
                  className={`${inputStyle}${invalidClass(`spcoin-write-param-${idx}`)}`}
                  value={spWriteParams[idx] || ''}
                  onChange={(value) => {
                    clearInvalidField(`spcoin-write-param-${idx}`);
                    updateSpWriteParamAtIndex(idx, value);
                  }}
                  placeholder={`Select or type ${param.label}`}
                  options={recipientRateKeyOptions.map((value) => ({
                    value,
                    label: value,
                  }))}
                />
                {recipientRateKeyHelpText ? <span className="text-xs text-slate-300">{recipientRateKeyHelpText}</span> : null}
              </div>
            </>
          ) : ['Agent Rate Key', 'Agent Rate'].includes(param.label) ? (
            <>
              <span className="text-sm font-semibold text-[#8FA8FF]">{param.label}</span>
              <div className="grid gap-2">
                <AccountDropdownInput
                  data-field-id={`spcoin-write-param-${idx}`}
                  className={`${inputStyle}${invalidClass(`spcoin-write-param-${idx}`)}`}
                  value={spWriteParams[idx] || ''}
                  onChange={(value) => {
                    clearInvalidField(`spcoin-write-param-${idx}`);
                    updateSpWriteParamAtIndex(idx, value);
                  }}
                  placeholder={`Select or type ${param.label}`}
                  options={agentRateKeyOptions.map((value) => ({
                    value,
                    label: value,
                  }))}
                />
                {agentRateKeyHelpText ? <span className="text-xs text-slate-300">{agentRateKeyHelpText}</span> : null}
              </div>
            </>
          ) : (
            <>
              <span className="text-sm font-semibold text-[#8FA8FF]">{param.label}</span>
              <input
                type="text"
                data-field-id={`spcoin-write-param-${idx}`}
                className={`${inputStyle}${invalidClass(`spcoin-write-param-${idx}`)}`}
                value={spWriteParams[idx] || ''}
                onChange={(e) => {
                  clearInvalidField(`spcoin-write-param-${idx}`);
                  updateSpWriteParamAtIndex(idx, e.target.value);
                }}
                placeholder={param.placeholder}
              />
            </>
          )}
        </div>
      ))}
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
      <div className="flex gap-2">
        <button
          type="button"
          className={`${getActionButtonClassName(canRunSelectedSpCoinWriteMethod, 'execute')} min-w-[50%] shrink-0`}
          onClick={() => void runSelectedSpCoinWriteMethod()}
          onMouseEnter={() => {
            if (!canRunSelectedSpCoinWriteMethod) setHoveredBlockedAction('execute');
          }}
          onMouseLeave={() => setHoveredBlockedAction(null)}
        >
          {!canRunSelectedSpCoinWriteMethod && hoveredBlockedAction === 'execute'
            ? 'Missing Parameters'
            : `Run ${activeSpCoinWriteDef.title}`}
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
