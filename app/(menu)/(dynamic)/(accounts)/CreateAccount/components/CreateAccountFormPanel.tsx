'use client';

import React, { useState } from 'react';
import ConnectNetworkButtonProps from '@/components/views/Buttons/Connect/ConnectNetworkButton';
import type {
  AccountFormData,
  AccountFormErrors,
  AccountFormField,
} from '../types';
import { FIELD_PLACEHOLDERS, FIELD_TITLES } from '../utils';
import {
  getAbsoluteFieldError,
  shouldOpenLinkFromInputClick,
  toPreviewHref,
} from '../utils';

type Props = {
  panelMarginClass: string;
  accountPanelBorderClass: string;
  connected: boolean;
  publicKey: string;
  formData: AccountFormData;
  errors: AccountFormErrors;
  descriptionTextareaRef: React.RefObject<HTMLTextAreaElement>;
  inputLocked: boolean;
  isLoading: boolean;
  loadingInputMessage: string;
  isSaving: boolean;
  isEditMode: boolean;
  submitLabel: string;
  hasUnsavedChanges: boolean;
  canCreateMissingAccount: boolean;
  disableSubmit: boolean;
  disableRevert: boolean;
  isRevertNoop: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onFieldBlur: (field: AccountFormField) => void;
  onRevert: () => void;
};

export default function CreateAccountFormPanel({
  panelMarginClass,
  accountPanelBorderClass,
  connected,
  publicKey,
  formData,
  errors,
  descriptionTextareaRef,
  inputLocked,
  isLoading,
  loadingInputMessage,
  isSaving,
  isEditMode,
  submitLabel,
  hasUnsavedChanges,
  canCreateMissingAccount,
  disableSubmit,
  disableRevert,
  isRevertNoop,
  onChange,
  onFieldBlur,
  onRevert,
}: Props) {
  const [hoveredInput, setHoveredInput] = useState<string | null>(null);
  const [hoveringLinkTextField, setHoveringLinkTextField] = useState<
    AccountFormField | null
  >(null);
  const [hoverTarget, setHoverTarget] = useState<'createAccount' | 'revertChanges' | null>(
    null,
  );

  const baseInputClasses =
    'w-full rounded border border-white bg-[#1A1D2E] p-2 text-white focus:outline-none focus:ring-0';
  const requiredInputClasses = `${baseInputClasses} placeholder:text-red-500`;
  const optionalInputClasses = `${baseInputClasses} placeholder:text-green-400`;
  const labelCellClasses =
    'mb-0 text-right min-h-[42px] px-2 text-white flex items-center justify-end';
  const disconnectedInputMessage =
    'Connection Required and input is prohibited until connection is established.';
  const inputErrorClasses = 'border-red-500 bg-red-900/40';
  const loadingFieldClasses = 'bg-red-900/60 border-red-500 cursor-not-allowed';
  const lockedInputMessage = isLoading ? loadingInputMessage : disconnectedInputMessage;
  const noChangesToUpdate = submitLabel === 'Update Account' && !hasUnsavedChanges;
  const getLoadingClassesForField = (fieldName: string): string =>
    isLoading && hoveredInput === fieldName ? loadingFieldClasses : '';

  const formFieldRows: Array<{
    label: string;
    name: AccountFormField;
    labelTitle: string;
  }> = [
    { label: 'Name', name: 'name', labelTitle: FIELD_TITLES.name },
    { label: 'Symbol', name: 'symbol', labelTitle: FIELD_TITLES.symbol },
    { label: 'Email Address', name: 'email', labelTitle: FIELD_TITLES.email },
    { label: 'Website', name: 'website', labelTitle: FIELD_TITLES.website },
    { label: 'Description', name: 'description', labelTitle: FIELD_TITLES.description },
  ];

  return (
    <section
      className={`${panelMarginClass} ${accountPanelBorderClass} order-2 flex h-full w-full flex-col items-start justify-start pl-0 pt-4 pb-0 pr-0`}
    >
      <div className="mb-4 grid w-full max-w-[46rem] grid-cols-[max-content_28rem]">
        <div className="invisible h-0 overflow-hidden px-2 whitespace-nowrap">
          Account Public Key
        </div>
        <h2 className="w-full text-center text-lg font-semibold text-[#5981F3]">
          Account Meta Data
        </h2>
      </div>
      <div className="grid w-full max-w-[46rem] grid-cols-[max-content_28rem] items-center gap-x-4 gap-y-4">
        {!connected ? (
          <>
            <label htmlFor="publicKey" className={labelCellClasses} title={FIELD_TITLES.publicKey}>
              Account Public Key
            </label>
            <div>
              <div className="flex h-[42px] items-center justify-center rounded border border-white bg-transparent">
                <span className="text-[110%] font-normal text-red-500">Wallet Connection Required</span>
              </div>
            </div>
          </>
        ) : (
          <>
            <label htmlFor="publicKey" className={labelCellClasses} title={FIELD_TITLES.publicKey}>
              Account Public Key
            </label>
            <div>
              <div className="flex items-center gap-1">
                <input
                  id="publicKey"
                  type="text"
                  value={publicKey}
                  readOnly
                  tabIndex={-1}
                  placeholder={
                    hoveredInput === 'publicKey'
                      ? isLoading
                        ? loadingInputMessage
                        : FIELD_PLACEHOLDERS.publicKey
                      : 'Required'
                  }
                  title={
                    isLoading
                      ? loadingInputMessage
                      : errors.publicKey
                      ? `Required for Code Account Operations | Error: ${errors.publicKey}`
                      : 'Required for Code Account Operations'
                  }
                  className={`${requiredInputClasses}${errors.publicKey ? ` ${inputErrorClasses}` : ''}${getLoadingClassesForField('publicKey') ? ` ${getLoadingClassesForField('publicKey')}` : ''} cursor-default select-none`}
                  style={{ cursor: 'default', caretColor: 'transparent' }}
                  onMouseDown={(e) => e.preventDefault()}
                  onFocus={(e) => e.currentTarget.blur()}
                  onMouseEnter={() => setHoveredInput('publicKey')}
                  onMouseLeave={() => setHoveredInput(null)}
                />
                <span
                  className={`inline-flex h-[42px] w-8 shrink-0 items-center justify-center text-center text-2xl font-bold leading-[1] ${
                    errors.publicKey ? 'text-red-500' : 'text-transparent'
                  }`}
                  aria-hidden={!errors.publicKey}
                  title={errors.publicKey ? `Error: ${errors.publicKey}` : undefined}
                >
                  X
                </span>
              </div>
              {errors.publicKey ? (
                <p className="mt-1 text-sm text-red-500">{errors.publicKey}</p>
              ) : null}
            </div>
          </>
        )}

        {formFieldRows.map(({ label, name, labelTitle }) => (
          <React.Fragment key={name}>
            <label
              htmlFor={name}
              className={`${labelCellClasses}${name === 'description' ? ' self-start h-auto items-start pt-2' : ''}`}
              title={labelTitle}
            >
              {label}
            </label>
            <div>
              {(() => {
                const key = name;
                const href = toPreviewHref(key, String(formData[key] ?? ''));
                const isLinkField = key === 'email' || key === 'website';
                const absoluteFieldError = getAbsoluteFieldError(
                  key,
                  String(formData[key] ?? ''),
                );
                const fieldError = absoluteFieldError ?? errors[key];
                const inputTitle = !connected
                  ? disconnectedInputMessage
                  : isLoading
                  ? loadingInputMessage
                  : href
                  ? `${labelTitle} (click to open in Edit mode)`
                  : labelTitle;
                const composedTitle = fieldError
                  ? `${inputTitle} | Error: ${fieldError}`
                  : inputTitle;

                return (
                  <>
                    <div className="flex items-start gap-1">
                      {key === 'description' ? (
                        <textarea
                          id={name}
                          name={name}
                          ref={descriptionTextareaRef}
                          value={connected ? formData[key] : ''}
                          onChange={onChange}
                          readOnly={inputLocked}
                          rows={1}
                          placeholder={
                            hoveredInput === name
                              ? inputLocked
                                ? lockedInputMessage
                                : FIELD_PLACEHOLDERS[key]
                              : 'Optional'
                          }
                          title={composedTitle}
                          className={`${optionalInputClasses} min-h-[42px] resize-none overflow-hidden whitespace-pre-wrap break-words ${fieldError ? ` ${inputErrorClasses}` : ''}${getLoadingClassesForField(name) ? ` ${getLoadingClassesForField(name)}` : ''}`}
                          onMouseEnter={() => setHoveredInput(name)}
                          onMouseLeave={() => setHoveredInput(null)}
                          onBlur={() => onFieldBlur(key)}
                        />
                      ) : (
                        <input
                          id={name}
                          name={name}
                          type="text"
                          value={connected ? formData[key] : ''}
                          onChange={onChange}
                          readOnly={inputLocked}
                          placeholder={
                            hoveredInput === name
                              ? inputLocked
                                ? lockedInputMessage
                                : FIELD_PLACEHOLDERS[key]
                              : 'Optional'
                          }
                          title={composedTitle}
                          className={`${optionalInputClasses}${isLinkField && href && hoveringLinkTextField === key ? ' underline text-blue-300 cursor-pointer' : ''}${fieldError ? ` ${inputErrorClasses}` : ''}${getLoadingClassesForField(name) ? ` ${getLoadingClassesForField(name)}` : ''}`}
                          onClick={(e) => {
                            if (!href || inputLocked) return;
                            const clickedOnText = shouldOpenLinkFromInputClick(
                              e.currentTarget,
                              String(formData[key] ?? ''),
                              e,
                            );
                            if (!clickedOnText) {
                              const inputEl = e.currentTarget;
                              inputEl.focus();
                              const endPos = inputEl.value.length;
                              inputEl.setSelectionRange(endPos, endPos);
                              return;
                            }
                            if (href.startsWith('mailto:')) {
                              window.location.href = href;
                              return;
                            }
                            window.open(href, '_blank', 'noopener,noreferrer');
                          }}
                          onMouseEnter={() => setHoveredInput(name)}
                          onMouseMove={(e) => {
                            setHoveredInput(name);
                            if (!href) {
                              if (hoveringLinkTextField === key) {
                                setHoveringLinkTextField(null);
                              }
                              return;
                            }
                            const overText = shouldOpenLinkFromInputClick(
                              e.currentTarget,
                              String(formData[key] ?? ''),
                              e,
                            );
                            setHoveringLinkTextField(overText ? key : null);
                          }}
                          onMouseLeave={() => {
                            setHoveredInput(null);
                            if (hoveringLinkTextField === key) {
                              setHoveringLinkTextField(null);
                            }
                          }}
                          onBlur={() => onFieldBlur(key)}
                        />
                      )}
                      <span
                        className={`inline-flex h-[42px] w-8 shrink-0 items-center justify-center text-center text-2xl font-bold leading-[1] ${
                          fieldError ? 'text-red-500' : 'text-transparent'
                        }`}
                        aria-hidden={!fieldError}
                        title={fieldError ? `Error: ${fieldError}` : undefined}
                      >
                        X
                      </span>
                    </div>
                    {fieldError ? (
                      <p className="mt-1 text-sm text-red-500">{fieldError}</p>
                    ) : null}
                  </>
                );
              })()}
            </div>
          </React.Fragment>
        ))}

        <div className="text-right" />
        {!connected ? (
          <div className="flex h-[42px] w-full items-center rounded border border-white bg-transparent [&>div]:h-full [&>div]:w-full [&>div>div]:h-full [&>div>div]:w-full [&>div>div>button]:!h-full [&>div>div>button]:!w-full [&>div>div>button]:!justify-center [&>div>div>button]:!font-bold [&>div>div>button]:!bg-green-500 [&>div>div>button]:!text-black [&>div>div>button]:!text-[120%] [&>div>div>button]:!px-3 [&>div>div>button]:!py-0 [&>div>div>button]:!rounded [&>div>div>button]:hover:!bg-green-400 [&>div>div>button>img]:!h-6 [&>div>div>button>img]:!w-6">
            <ConnectNetworkButtonProps
              showName={false}
              showSymbol={false}
              showNetworkIcon={false}
              showChevron={false}
              showConnect={true}
              showDisconnect={false}
              showHoverBg={false}
              titleDisplay={true}
              trimHorizontalPaddingPx={0}
              connectLabel="Connect Wallet"
            />
          </div>
        ) : (
          <div className="flex w-[calc(100%-1.5rem)] gap-2">
            <button
              type={!isEditMode ? 'button' : 'submit'}
              aria-disabled={disableSubmit}
              className={`h-[42px] flex-1 rounded px-4 py-2 text-center font-bold text-black transition-colors ${
                noChangesToUpdate
                  ? 'bg-[#E5B94F] text-black hover:bg-[#E5B94F] transition-none cursor-default'
                  : !isEditMode
                  ? hoverTarget === 'createAccount'
                    ? 'bg-red-500 text-black'
                    : 'bg-[#E5B94F] text-black'
                  : disableSubmit
                  ? noChangesToUpdate
                    ? 'bg-red-500 text-black cursor-default'
                    : 'bg-red-500 text-black cursor-not-allowed'
                  : hoverTarget === 'createAccount'
                  ? hasUnsavedChanges || canCreateMissingAccount
                    ? 'bg-green-500 text-black'
                    : 'bg-red-500 text-black'
                  : 'bg-[#E5B94F] text-black'
              }`}
              title={
                submitLabel === 'Update Account'
                  ? !hasUnsavedChanges
                    ? 'No changes to Update'
                    : submitLabel
                  : undefined
              }
              disabled={disableSubmit}
              onMouseEnter={() => {
                if (noChangesToUpdate) return;
                setHoverTarget('createAccount');
              }}
              onMouseLeave={() => {
                if (noChangesToUpdate) return;
                setHoverTarget(null);
              }}
            >
              {isSaving ? 'Saving...' : submitLabel}
            </button>
            <button
              type="button"
              aria-disabled={disableRevert}
              className={`h-[42px] flex-1 rounded px-4 py-2 text-center font-bold text-black transition-colors ${
                isRevertNoop
                  ? 'bg-[#E5B94F] text-black hover:bg-[#E5B94F] transition-none cursor-default'
                  : !isEditMode
                  ? hoverTarget === 'revertChanges'
                    ? 'bg-red-500 text-black'
                    : 'bg-[#E5B94F] text-black'
                  : disableRevert
                  ? 'bg-red-500 text-black cursor-not-allowed'
                  : hoverTarget === 'revertChanges'
                  ? hasUnsavedChanges
                    ? 'bg-green-500 text-black'
                    : 'bg-red-500 text-black'
                  : 'bg-[#E5B94F] text-black'
              }`}
              title={
                disableRevert || !hasUnsavedChanges
                  ? 'No changes to revert'
                  : 'Revert all pending changes'
              }
              disabled={disableRevert}
              onClick={() => {
                if (isRevertNoop) return;
                onRevert();
              }}
              onMouseEnter={() => {
                if (isRevertNoop) return;
                setHoverTarget('revertChanges');
              }}
              onMouseLeave={() => {
                if (isRevertNoop) return;
                setHoverTarget(null);
              }}
            >
              Revert Changes
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
