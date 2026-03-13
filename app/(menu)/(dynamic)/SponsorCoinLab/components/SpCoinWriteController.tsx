// File: app/(menu)/(dynamic)/SponsorCoinLab/components/SpCoinWriteController.tsx
import React from 'react';
import Image from 'next/image';
import BackdateCalendarPopup from './BackdateCalendarPopup';

type ParamDefLike = { label: string; placeholder: string; type: string };
type MethodDef = { title: string; params: ParamDefLike[]; executable?: boolean };

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
  spCoinWriteOptions: string[];
  spCoinWriteMethodDefs: Record<string, MethodDef>;
  activeSpCoinWriteDef: MethodDef;
  spWriteParams: string[];
  updateSpWriteParamAtIndex: (idx: number, value: string) => void;
  onOpenBackdatePicker: (idx: number) => void;
  inputStyle: string;
  buttonStyle: string;
  writeTraceEnabled: boolean;
  toggleWriteTrace: () => void;
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
    spCoinWriteOptions,
    spCoinWriteMethodDefs,
    activeSpCoinWriteDef,
    spWriteParams,
    updateSpWriteParamAtIndex,
    onOpenBackdatePicker,
    inputStyle,
    buttonStyle,
    writeTraceEnabled,
    toggleWriteTrace,
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
  const invalidClass = (fieldId: string) =>
    invalidFieldIds.includes(fieldId) ? ' border-red-500 bg-red-950/40 focus:border-red-400' : '';
  const actionButtonClassName =
    'h-[42px] rounded px-4 py-2 text-center font-bold text-black transition-colors bg-[#E5B94F] hover:bg-green-500';
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
    <div className="mt-4 grid grid-cols-1 gap-3">
      <div className="grid items-center gap-3 md:grid-cols-[auto_minmax(0,1fr)_auto]">
        <span className="text-sm font-semibold text-[#8FA8FF]">SpCoin Write Method</span>
        <select
          className="w-fit min-w-[18ch] rounded-lg border border-[#334155] bg-[#0E111B] px-3 py-2 text-sm text-white"
          value={selectedSpCoinWriteMethod}
          onChange={(e) => setSelectedSpCoinWriteMethod(e.target.value)}
        >
          {spCoinWriteOptions.map((name) => (
            <option
              key={`sp-write-${name}`}
              value={name}
              style={{ color: spCoinWriteMethodDefs[name].executable === false ? '#ef4444' : undefined }}
            >
              {name}
            </option>
          ))}
        </select>
        <button type="button" className={`${buttonStyle} justify-self-end`} onClick={toggleWriteTrace}>
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
            <>
              <input
                type="text"
                list="spcoin-write-sender-options"
                data-field-id="spcoin-write-sender"
                className={`w-full rounded-lg border border-[#334155] bg-[#0E111B] px-3 py-2 text-sm text-white${invalidClass('spcoin-write-sender')}`}
                value={selectedWriteSenderAddress}
                onChange={(e) => {
                  clearInvalidField('spcoin-write-sender');
                  setSelectedWriteSenderAddress(normalizeAccountValue(e.target.value));
                }}
                placeholder="Select account"
              />
              <datalist id="spcoin-write-sender-options">
                {hardhatAccounts.map((account, idx) => (
                  <option
                    key={`write-sender-${idx}-${account.address}`}
                    value={normalizeAccountValue(account.address)}
                    label={formatAccountOptionLabel(account.address, idx)}
                  />
                ))}
              </datalist>
            </>
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
                  {getMetadataForAddress(selectedWriteSenderAddress || '')?.logoURL ? (
                    <Image
                      src={getMetadataForAddress(selectedWriteSenderAddress || '')!.logoURL}
                      alt={getMetadataForAddress(selectedWriteSenderAddress || '')?.name || 'Selected account'}
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
                    {getMetadataForAddress(selectedWriteSenderAddress || '')?.name || 'Unnamed account'}
                  </div>
                  <div className="truncate text-xs text-slate-400">
                    {getMetadataForAddress(selectedWriteSenderAddress || '')?.symbol || 'No symbol'}
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
      {activeSpCoinWriteDef.params.map((param, idx) => (
        <div key={`sp-write-param-${param.label}-${idx}`} className="grid grid-cols-1 gap-3">
          {param.type === 'address' ? (
            <div
              className={`grid grid-cols-1 gap-3${
                openAddressFields[idx] ? ' rounded-xl border border-[#31416F] bg-[#0B1220] p-3' : ''
              }`}
            >
              <label className="grid items-center gap-3 md:grid-cols-[auto_minmax(0,1fr)]">
                <button
                  type="button"
                  onClick={() => setOpenAddressFields((prev) => ({ ...prev, [idx]: !prev[idx] }))}
                  className="w-fit text-left text-sm font-semibold text-[#8FA8FF] transition-colors hover:text-white"
                  title={`Toggle ${param.label}`}
                >
                  {param.label}
                </button>
                <>
                  <input
                    type="text"
                    list={`spcoin-write-address-options-${idx}`}
                    data-field-id={`spcoin-write-param-${idx}`}
                    className={`w-full rounded-lg border border-[#334155] bg-[#0E111B] px-3 py-2 text-sm text-white${invalidClass(`spcoin-write-param-${idx}`)}`}
                    value={spWriteParams[idx] || ''}
                    onChange={(e) => {
                      clearInvalidField(`spcoin-write-param-${idx}`);
                      updateSpWriteParamAtIndex(idx, normalizeAccountValue(e.target.value));
                    }}
                    placeholder="Select account"
                  />
                  <datalist id={`spcoin-write-address-options-${idx}`}>
                    {hardhatAccounts.map((account, accountIdx) => (
                      <option
                        key={`sp-write-address-${idx}-${accountIdx}-${account.address}`}
                        value={normalizeAccountValue(account.address)}
                        label={formatAccountOptionLabel(account.address, accountIdx)}
                      />
                    ))}
                  </datalist>
                </>
              </label>
              {openAddressFields[idx] && (
                <>
                  <div className="grid items-center gap-3 md:grid-cols-[auto_minmax(0,1fr)]">
                    <span className="text-sm font-semibold text-[#8FA8FF]">Metadata</span>
                    <div className="flex items-center gap-3 rounded-lg border border-[#334155] bg-[#0E111B] px-3 py-2 text-sm text-white">
                      <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg bg-[#11162A]">
                        {getMetadataForAddress(spWriteParams[idx] || '')?.logoURL ? (
                          <Image
                            src={getMetadataForAddress(spWriteParams[idx] || '')!.logoURL}
                            alt={getMetadataForAddress(spWriteParams[idx] || '')?.name || param.label}
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
                          {getMetadataForAddress(spWriteParams[idx] || '')?.name || 'Unnamed account'}
                        </div>
                        <div className="truncate text-xs text-slate-400">
                          {getMetadataForAddress(spWriteParams[idx] || '')?.symbol || 'No symbol'}
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
                        value={getPrivateKeyForAddress(spWriteParams[idx] || '')}
                        placeholder="Selected account private key"
                      />
                    </label>
                  ) : null}
                </>
              )}
            </div>
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
              <input
                type="text"
                data-field-id={`spcoin-write-param-${idx}`}
                className={`${inputStyle}${invalidClass(`spcoin-write-param-${idx}`)}`}
                list={`sp-write-recipient-rate-options-${selectedSpCoinWriteMethod}-${idx}`}
                value={spWriteParams[idx] || ''}
                onChange={(e) => {
                  clearInvalidField(`spcoin-write-param-${idx}`);
                  updateSpWriteParamAtIndex(idx, e.target.value);
                }}
                placeholder={`Select, type, or paste ${param.label}`}
              />
              <datalist id={`sp-write-recipient-rate-options-${selectedSpCoinWriteMethod}-${idx}`}>
                {recipientRateKeyOptions.map((value) => (
                  <option key={`recipient-rate-${idx}-${value}`} value={value} />
                ))}
              </datalist>
              {recipientRateKeyHelpText ? <span className="text-xs text-slate-300">{recipientRateKeyHelpText}</span> : null}
              </div>
            </>
          ) : ['Agent Rate Key', 'Agent Rate'].includes(param.label) ? (
            <>
              <span className="text-sm font-semibold text-[#8FA8FF]">{param.label}</span>
              <div className="grid gap-2">
              <input
                type="text"
                data-field-id={`spcoin-write-param-${idx}`}
                className={`${inputStyle}${invalidClass(`spcoin-write-param-${idx}`)}`}
                list={`sp-write-agent-rate-options-${selectedSpCoinWriteMethod}-${idx}`}
                value={spWriteParams[idx] || ''}
                onChange={(e) => {
                  clearInvalidField(`spcoin-write-param-${idx}`);
                  updateSpWriteParamAtIndex(idx, e.target.value);
                }}
                placeholder={`Select, type, or paste ${param.label}`}
              />
              <datalist id={`sp-write-agent-rate-options-${selectedSpCoinWriteMethod}-${idx}`}>
                {agentRateKeyOptions.map((value) => (
                  <option key={`agent-rate-${idx}-${value}`} value={value} />
                ))}
              </datalist>
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
          className={`${actionButtonClassName} min-w-[50%] shrink-0`}
          onClick={runSelectedSpCoinWriteMethod}
        >
          Execute {activeSpCoinWriteDef.title}
        </button>
        <button
          type="button"
          className={`${actionButtonClassName} min-w-0 flex-1`}
          onClick={addCurrentMethodToScript}
        >
          Add To Script
        </button>
      </div>
    </div>
  );
}
