'use client';

import React, { useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ExchangeContextState } from '@/lib/context/ExchangeProvider';
import { useWalletActionOverlay } from '@/lib/context/WalletActionOverlayContext';
import CloseButton from '@/components/views/Buttons/CloseButton';
import { CreateAccountAvatarPanel, CreateAccountFormPanel } from './components';
import { useCreateAccountForm } from './hooks';
import { ACCEPTED_IMAGE_INPUT_ACCEPT, DEFAULT_ACCOUNT_LOGO_URL } from './utils';

export default function CreateAccountPage() {
  const router = useRouter();
  const ctx = useContext(ExchangeContextState);
  const { runWithWalletAction } = useWalletActionOverlay();
  const connected = Boolean(ctx?.exchangeContext?.network?.connected);
  const activeAddress = ctx?.exchangeContext?.accounts?.activeAccount?.address;

  const {
    publicKey,
    formData,
    errors,
    handleChange,
    handleFieldBlur,
    handleRevertChanges,
    handleSubmit,
    handleLogoFileChange,
    logoFileInputRef,
    descriptionTextareaRef,
    logoPreviewSrc,
    pageTitle,
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

  return (
    <main className="relative w-full p-6 text-white">
      <CloseButton
        id="createAccountBackButton"
        closeCallback={() => router.back()}
        title="Go Back"
        ariaLabel="Go Back"
      />

      <div className="relative mb-6 flex items-center justify-center">
        <h1 className="text-center text-2xl font-bold text-[#5981F3]">{pageTitle}</h1>
        {showBorderToggleButton ? (
          <div className="absolute right-0">
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
          </div>
        ) : null}
      </div>

      <form onSubmit={handleSubmit} className="w-full">
        <div className="grid w-full grid-cols-1 items-start justify-center gap-0 lg:grid-cols-[700px_700px]">
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
            onChange={handleChange}
            onFieldBlur={handleFieldBlur}
            onRevert={handleRevertChanges}
          />
        </div>
      </form>
    </main>
  );
}
