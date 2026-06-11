'use client';

import React, { useState } from 'react';
import WalletConnectComponentProps from '@/components/views/Buttons/Connect/WalletConnectComponent';
import { msTableTw } from '@/components/views/RadioOverlayPanels/msTableTw';
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
  contentWidthClass?: string;
  idPrefix?: string;
  formHeading?: string;
  topRowContent?: React.ReactNode;
  connected: boolean;
  publicKey: string;
  publicKeyLocked?: boolean;
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
  errorValueDisplay?: boolean;
  onPublicKeyChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPublicKeyBlur: () => void | Promise<void>;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onFieldBlur: (field: AccountFormField) => void;
  onRevert: () => void;
};

export default function CreateAccountFormPanel({
  panelMarginClass,
  accountPanelBorderClass,
  contentWidthClass = 'max-w-[56rem]',
  idPrefix = '',
  formHeading = 'Account Meta Data',
  topRowContent,
  connected,
  publicKey,
  publicKeyLocked = false,
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
  errorValueDisplay = false,
  onPublicKeyChange,
  onPublicKeyBlur,
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

  const th = 'px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-300/80';
  const cell = 'px-3 py-3 text-sm align-middle';
  const baseInputClasses =
    'w-full rounded bg-transparent text-white focus:outline-none focus:ring-0';
  const requiredInputClasses = `${baseInputClasses} placeholder:text-red-500`;
  const optionalInputClasses = `${baseInputClasses} placeholder:text-green-400`;
  const zebraA = 'bg-[rgba(56,78,126,0.35)]';
  const zebraB = 'bg-[rgba(156,163,175,0.25)]';
  const tableGrid = 'grid grid-cols-[max-content_minmax(0,1fr)]';
  const disconnectedInputMessage =
    'Connection Required and input is prohibited until connection is established.';
  const disconnectedMetaMaskMessage = 'MetaMask Connection Required';
  const inputErrorClasses = 'border-red-500';
  const errorValueClasses = errorValueDisplay ? ' border-red-500 font-semibold text-red-500' : '';
  const loadingFieldClasses = 'bg-red-900/60 border-red-500 cursor-not-allowed';
  const lockedInputMessage = isLoading ? loadingInputMessage : disconnectedInputMessage;
  const noChangesToUpdate = submitLabel !== 'Create Account' && !hasUnsavedChanges;
  const getLoadingClassesForField = (fieldName: string): string =>
    isLoading && hoveredInput === fieldName ? loadingFieldClasses : '';
  const fieldId = (fieldName: string) => `${idPrefix}${fieldName}`;

  const formFieldRows: Array<{
    label: string;
    name: AccountFormField;
    labelTitle: string;
  }> = [
    { label: 'Name', name: 'name', labelTitle: FIELD_TITLES.name },
    { label: 'Symbol', name: 'symbol', labelTitle: FIELD_TITLES.symbol },
    { label: 'Email Address', name: 'email', labelTitle: FIELD_TITLES.email },
    { label: 'Website', name: 'website', labelTitle: FIELD_TITLES.website },
  ];

  return (
    <section
      className={`${panelMarginClass} ${accountPanelBorderClass} order-2 flex h-full w-full flex-col items-start justify-start px-0 pt-4 pb-4`}
    >
      {formHeading || topRowContent ? (
        <div className={`mb-4 w-full ${contentWidthClass}`}>
          {formHeading ? (
            <div className="grid w-full grid-cols-1 md:grid-cols-[minmax(10rem,max-content)_minmax(0,1fr)]">
              <div className="invisible hidden h-0 overflow-hidden px-2 whitespace-nowrap md:block">
                Account Address
              </div>
              <h2 className="w-full text-center text-lg font-semibold text-[#5981F3]">
                {formHeading}
              </h2>
            </div>
          ) : null}
          {topRowContent ? <div className={formHeading ? 'mt-3 w-full' : 'w-full'}>{topRowContent}</div> : null}
        </div>
      ) : null}
      <div className="scrollbar-hide mb-4 mt-0 w-full min-w-0 overflow-x-hidden overflow-y-auto rounded-xl border border-black">
        <div className={`w-full min-w-0 ${tableGrid}`}>
          <div className="contents">
            <div className={`${msTableTw.theadRow} ${th} whitespace-nowrap border-b border-black`}>Field Name</div>
            <div className={`${msTableTw.theadRow} ${th} border-b border-black`}>value</div>
          </div>

          <div className="contents">
            <div className={`${zebraA} ${cell} whitespace-nowrap border-b border-black`}>Account Address</div>
            <div className={`${zebraA} ${cell} min-w-0 border-b border-black`}>
              <input
                id={fieldId('publicKey')}
                type="text"
                name="publicKey"
                value={connected ? publicKey : disconnectedMetaMaskMessage}
                readOnly={!connected || inputLocked || publicKeyLocked}
                placeholder={
                  !connected
                    ? disconnectedMetaMaskMessage
                    : hoveredInput === 'publicKey'
                    ? FIELD_PLACEHOLDERS.publicKey
                    : 'Required'
                }
                title={
                  !connected
                    ? disconnectedMetaMaskMessage
                    : errors.publicKey
                    ? `Required for Code Account Operations | Error: ${errors.publicKey}`
                    : 'Required for Code Account Operations'
                }
                className={`${requiredInputClasses}${!connected ? ' text-center font-bold text-red-500' : ''}${errorValueClasses}${errors.publicKey ? ` ${inputErrorClasses}` : ''}${getLoadingClassesForField('publicKey') ? ` ${getLoadingClassesForField('publicKey')}` : ''}`}
                onChange={onPublicKeyChange}
                onBlur={onPublicKeyBlur}
                onMouseEnter={() => setHoveredInput('publicKey')}
                onMouseLeave={() => setHoveredInput(null)}
              />
              {errors.publicKey ? (
                <p className="text-sm text-red-500">{errors.publicKey}</p>
              ) : null}
            </div>
          </div>

          {formFieldRows.map(({ label, name, labelTitle }, index) => (
            <div className="contents" key={name}>
              <div
                className={`${(index + 2) % 2 === 0 ? zebraB : zebraA} ${cell} whitespace-nowrap border-b border-black`}
                title={labelTitle}
              >
                {label}
              </div>
              <div className={`${(index + 2) % 2 === 0 ? zebraB : zebraA} ${cell} min-w-0 border-b border-black`}>
                {(() => {
                  const key = name;
                  const href = toPreviewHref(key, String(formData[key] ?? ''));
                  const isLinkField = key === 'email' || key === 'website';
                  const absoluteFieldError = getAbsoluteFieldError(
                    key,
                    String(formData[key] ?? ''),
                  );
                  const fieldError = absoluteFieldError ?? errors[key];
                  const composedTitle = fieldError
                    ? `${labelTitle} | Error: ${fieldError}`
                    : labelTitle;

                  return (
                    <>
                      <input
                        id={fieldId(name)}
                        name={name}
                        type="text"
                        value={connected ? formData[key] : ''}
                        onChange={onChange}
                        readOnly={inputLocked}
                        placeholder={hoveredInput === name ? inputLocked ? lockedInputMessage : FIELD_PLACEHOLDERS[key] : 'Optional'}
                        title={composedTitle}
                        className={`${optionalInputClasses}${errorValueClasses}${isLinkField && href && hoveringLinkTextField === key ? ' underline text-blue-300 cursor-pointer' : ''}${fieldError ? ` ${inputErrorClasses}` : ''}${getLoadingClassesForField(name) ? ` ${getLoadingClassesForField(name)}` : ''}`}
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
                            inputEl.setSelectionRange(inputEl.value.length, inputEl.value.length);
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
                      {fieldError ? (
                        <p className="text-sm text-red-500">{fieldError}</p>
                      ) : null}
                    </>
                  );
                })()}
              </div>
            </div>
          ))}

          <div className={`${zebraB} ${cell} col-span-2 min-w-0`}>
            <div className="whitespace-nowrap text-center">Description:</div>
            <div className="box-border w-full min-w-0 whitespace-normal break-all pr-[5px]">
              <textarea
                id={fieldId('description')}
                name="description"
                ref={descriptionTextareaRef}
                value={connected ? formData.description : ''}
                onChange={onChange}
                readOnly={inputLocked}
                rows={1}
                placeholder={hoveredInput === 'description' ? inputLocked ? lockedInputMessage : FIELD_PLACEHOLDERS.description : 'Optional'}
                title={formData.description && errors.description ? `Account Description | Error: ${errors.description}` : 'Account Description'}
                className={`${optionalInputClasses}${errorValueClasses} min-h-[42px] resize-none overflow-hidden whitespace-pre-wrap break-words ${errors.description ? ` ${inputErrorClasses}` : ''}${getLoadingClassesForField('description') ? ` ${getLoadingClassesForField('description')}` : ''}`}
                onMouseEnter={() => setHoveredInput('description')}
                onMouseLeave={() => setHoveredInput(null)}
                onBlur={() => onFieldBlur('description')}
              />
              {errors.description ? (
                <p className="text-sm text-red-500">{errors.description}</p>
              ) : null}
            </div>
          </div>

          <div className="contents">
            <div className="col-span-2 border-t border-black/30">
              {!connected ? (
                <WalletConnectComponentProps
                  showName={false}
                  showSymbol={false}
                  showNetworkIcon={false}
                  showChevron={false}
                  showConnect={true}
                  showDisconnect={false}
                  showHoverBg={false}
                  trimHorizontalPaddingPx={0}
                  connectLabel="Connect Wallet"
                />
              ) : (
                <div className="flex">
                  <button
                    type={!isEditMode ? 'button' : 'submit'}
                    aria-disabled={disableSubmit}
                    className={`flex-1 rounded-l-md rounded-r-none rounded-tl-none rounded-tr-none border-r border-black/50 py-2 text-center font-bold text-black transition-colors ${
                      noChangesToUpdate
                        ? 'bg-[#E5B94F] text-black hover:bg-[#E5B94F] transition-none cursor-default'
                        : !isEditMode
                        ? hoverTarget === 'createAccount'
                          ? 'bg-red-500 text-black'
                          : 'bg-[#E5B94F] text-black'
                        : disableSubmit
                        ? 'bg-red-500 text-black cursor-not-allowed'
                        : hoverTarget === 'createAccount'
                        ? hasUnsavedChanges || canCreateMissingAccount
                          ? 'bg-green-500 text-black'
                          : 'bg-red-500 text-black'
                        : 'bg-[#E5B94F] text-black'
                    }`}
                    title={
                      submitLabel === 'Create Account'
                        ? undefined
                        : !hasUnsavedChanges
                        ? submitLabel === 'Edit Account'
                          ? 'No changes to Edit'
                          : 'No changes to Update'
                        : submitLabel
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
                    className={`flex-1 rounded-bl-none rounded-br-md rounded-tl-none rounded-tr-none py-2 text-center font-bold text-black transition-colors ${
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
          </div>
        </div>
      </div>
    </section>
  );
}