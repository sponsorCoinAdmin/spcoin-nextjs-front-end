'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import { useWalletActionOverlay } from '@/lib/context/WalletActionOverlayContext';
import CloseButton from '@/components/views/Buttons/CloseButton';
import ValidationPopup from '../../SponsorCoinLab/components/ValidationPopup';
import EditAccountAvatarDropdown from './components/EditAccountAvatarDropdown';
import { CreateAccountAvatarPanel, CreateAccountFormPanel } from '../CreateAccount/components';
import { useCreateAccountForm } from '../CreateAccount/hooks';
import { ACCEPTED_IMAGE_INPUT_ACCEPT, DEFAULT_ACCOUNT_LOGO_URL } from '../CreateAccount/utils';
import spCoin_png from '@/public/assets/miscellaneous/spCoin.png';

export default function EditAccountPageClient() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const { runWithWalletAction } = useWalletActionOverlay();
  const connected = Boolean(isConnected);
  const activeAddress = address;

  const {
    publicKey,
    formData,
    errors,
    setFormData,
    handlePublicKeyChange,
    handlePublicKeyBlur,
    handleChange,
    handleFieldBlur,
    handleRevertChanges,
    handleSubmit,
    handleLogoFileChange,
    logoFileInputRef,
    descriptionTextareaRef,
    logoPreviewSrc,
    pageTitle,
    invalidAddressPopupPreviousAddress,
    handleInvalidAddressContinue,
    handleInvalidAddressRevert,
    submitLabel,
    isRevertNoop,
    isLoading,
    isSaving,
    isEditMode,
    isActive,
    hasUnsavedChanges,
    canCreateMissingAccount,
    disableSubmit,
    disableRevert,
  } = useCreateAccountForm({
    connected,
    activeAddress: activeAddress ? String(activeAddress) : undefined,
    runWithWalletAction,
  });

  const [showAllBorders, setShowAllBorders] = useState(false);
  const [showBorderToggleButton, setShowBorderToggleButton] = useState(false);
  const [expandedPanel, setExpandedPanel] = useState<'avatar' | 'form' | null>(null);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!event.altKey || event.key.toLowerCase() !== 't') return;
      event.preventDefault();
      setShowBorderToggleButton((prev) => {
        const next = !prev;
        if (next) setShowAllBorders(true);
        return next;
      });
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const panelMarginClass = 'mx-0';
  const accountPanelBorderClass = showAllBorders
    ? 'border-2 border-yellow-400'
    : 'border-2 border-transparent';
  const avatarPanelBorderClass = showAllBorders
    ? 'border-2 border-red-500'
    : 'border-2 border-transparent';
  const loadingInputMessage =
    'Loading or updating account data. Input is temporarily disabled.';
  const inputLocked = !isActive;
  const previewButtonLabel = 'Select Preview Image';
  const trimmedName = formData.name.trim();
  const trimmedSymbol = formData.symbol.trim();
  const avatarIsMissing =
    !logoPreviewSrc || logoPreviewSrc.startsWith(DEFAULT_ACCOUNT_LOGO_URL);
  const avatarHeading = avatarIsMissing
    ? 'Missing Avatar'
    : trimmedName
      ? `${trimmedName}'s Avatar`
      : trimmedSymbol
        ? `${trimmedSymbol}'s Avatar`
        : 'Users Avatar';
  const cardClass =
    'rounded-2xl border border-[#2B3A67] bg-[#11162A] p-5 shadow-[0_12px_40px_rgba(0,0,0,0.25)]';
  const showAvatarPanel = expandedPanel === null || expandedPanel === 'avatar';
  const showFormPanel = expandedPanel === null || expandedPanel === 'form';
  return (
    <main className="relative flex w-full flex-col overflow-hidden bg-[#0B1020] px-6 pt-3 pb-6 text-white">
      <div className="mb-3 grid grid-cols-[1fr_auto_1fr] items-center">
        <div className="flex items-center">
          <Image
            src={spCoin_png}
            alt="Sponsor Coin Logo"
            priority
            className="h-8 w-auto"
          />
        </div>
        <h1 className="text-center text-2xl font-bold text-[#5981F3]">{pageTitle}</h1>
        <div className="flex items-center justify-self-end gap-2">
          {showBorderToggleButton ? (
            <button
              type="button"
              className={`rounded border px-3 py-1 text-sm font-semibold text-black ${
                showAllBorders
                  ? 'border-green-500 bg-green-500 hover:bg-green-400'
                  : 'border-red-500 bg-red-500 hover:bg-red-400'
              }`}
              onClick={() => setShowAllBorders((prev) => !prev)}
            >
              Toggle Borders
            </button>
          ) : null}
          <CloseButton
            id="createAccountBackButton"
            closeCallback={() => router.back()}
            title="Go Back"
            ariaLabel="Go Back"
            className="h-10 w-10 rounded-full bg-[#243056] text-3xl leading-none text-[#5981F3] flex items-center justify-center transition-colors hover:bg-[#5981F3] hover:text-[#243056]"
          />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex min-h-0 w-full flex-1 flex-col">
        <div
          className={`flex min-h-0 flex-1 overflow-hidden gap-6 ${
            expandedPanel ? 'flex-col' : 'flex-col xl:flex-row'
          }`}
        >
          {showAvatarPanel ? (
            <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-visible rounded-2xl bg-[#192134] p-4">
              <div
                className="relative mb-4 w-full"
                onDoubleClick={() =>
                  setExpandedPanel((current) => (current === 'avatar' ? null : 'avatar'))
                }
                title={
                  expandedPanel === 'avatar'
                    ? 'Double-click to return to shared view'
                    : 'Double-click to expand'
                }
              >
                <div className="grid min-h-10 grid-cols-[auto_1fr_auto] items-center gap-3 pr-12">
                  <div className="flex items-center">
                    <EditAccountAvatarDropdown
                      avatarSrc={logoPreviewSrc}
                      disabled={!connected}
                      selectedNetworkIds={formData.recipientNetwork}
                      onToggleNetwork={(networkId) =>
                        setFormData((current) => {
                          const nextSelected = current.recipientNetwork.includes(networkId)
                            ? current.recipientNetwork.filter((id) => id !== networkId)
                            : [...current.recipientNetwork, networkId];
                          return { ...current, recipientNetwork: nextSelected };
                        })
                      }
                    />
                  </div>
                  <h2 className="text-center text-xl font-semibold text-[#8FA8FF]">
                    Account Avatar
                  </h2>
                  <div />
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setExpandedPanel((current) => (current === 'avatar' ? null : 'avatar'))
                  }
                  onDoubleClick={(event) => event.stopPropagation()}
                  className="absolute -right-[9px] -top-[10px] flex h-10 w-10 items-center justify-center rounded-full bg-[#243056] text-3xl leading-none text-[#5981F3] transition-colors hover:bg-[#5981F3] hover:text-[#243056]"
                  title={expandedPanel === 'avatar' ? 'Return to shared view' : 'Expand this card'}
                  aria-label={expandedPanel === 'avatar' ? 'Return to shared view' : 'Expand this card'}
                >
                  {expandedPanel === 'avatar' ? '×' : '+'}
                </button>
              </div>
              <div className={`${cardClass} scrollbar-hide flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto pr-2`}>
                <CreateAccountAvatarPanel
                  panelMarginClass={panelMarginClass}
                  avatarPanelBorderClass={avatarPanelBorderClass}
                  avatarHeading={avatarHeading}
                  logoPreviewSrc={logoPreviewSrc}
                  connected={connected}
                  isEditMode={isEditMode}
                  inputLocked={inputLocked}
                  previewButtonLabel={previewButtonLabel}
                  loadingInputMessage={loadingInputMessage}
                  isLoading={isLoading}
                  acceptedInput={ACCEPTED_IMAGE_INPUT_ACCEPT}
                  logoFileInputRef={logoFileInputRef}
                  onFileChange={handleLogoFileChange}
                />
              </div>
            </section>
          ) : null}

          {showFormPanel ? (
            <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-2xl bg-[#192134] p-4">
              <div
                className="relative z-20 mb-4 w-full overflow-visible"
                onDoubleClick={() =>
                  setExpandedPanel((current) => (current === 'form' ? null : 'form'))
                }
                title={
                  expandedPanel === 'form'
                    ? 'Double-click to return to shared view'
                    : 'Double-click to expand'
                }
              >
                <div className="grid min-h-10 grid-cols-[auto_1fr_auto] items-center gap-3 pr-12">
                  <div />
                  <h2 className="text-center text-xl font-semibold text-[#8FA8FF]">
                    Account Meta Data
                  </h2>
                  <div />
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setExpandedPanel((current) => (current === 'form' ? null : 'form'))
                  }
                  onDoubleClick={(event) => event.stopPropagation()}
                  className="absolute -right-[9px] -top-[10px] flex h-10 w-10 items-center justify-center rounded-full bg-[#243056] text-3xl leading-none text-[#5981F3] transition-colors hover:bg-[#5981F3] hover:text-[#243056]"
                  title={expandedPanel === 'form' ? 'Return to shared view' : 'Expand this card'}
                  aria-label={expandedPanel === 'form' ? 'Return to shared view' : 'Expand this card'}
                >
                  {expandedPanel === 'form' ? '×' : '+'}
                </button>
              </div>
              <div className={`${cardClass} scrollbar-hide flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto pr-2`}>
                <CreateAccountFormPanel
                  panelMarginClass={panelMarginClass}
                  accountPanelBorderClass={accountPanelBorderClass}
                  connected={connected}
                  publicKey={publicKey}
                  formData={formData}
                  errors={errors}
                  descriptionTextareaRef={descriptionTextareaRef}
                  inputLocked={inputLocked}
                  isLoading={isLoading}
                  loadingInputMessage={loadingInputMessage}
                  isSaving={isSaving}
                  isEditMode={isEditMode}
                  submitLabel={submitLabel}
                  hasUnsavedChanges={hasUnsavedChanges}
                  canCreateMissingAccount={canCreateMissingAccount}
                  disableSubmit={disableSubmit}
                  disableRevert={disableRevert}
                  isRevertNoop={isRevertNoop}
                  onPublicKeyChange={handlePublicKeyChange}
                  onPublicKeyBlur={handlePublicKeyBlur}
                  onChange={handleChange}
                  onFieldBlur={handleFieldBlur}
                  onRevert={handleRevertChanges}
                />
              </div>
            </section>
          ) : null}
        </div>
      </form>
      {invalidAddressPopupPreviousAddress ? (
        <ValidationPopup
          fields={[]}
          title="Invalid Address"
          message="The account address is not valid. Continue editing this value or revert to the previous address."
          buttonStyle="rounded-lg bg-green-500 px-3 py-[0.28rem] text-sm font-semibold text-black transition-colors hover:bg-green-400"
          cancelLabel="Continue"
          confirmLabel="Revert"
          onClose={handleInvalidAddressContinue}
          onConfirm={handleInvalidAddressRevert}
        />
      ) : null}
    </main>
  );
}
