'use client';

import React, { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAccount } from 'wagmi';
import { useWalletActionOverlay } from '@/lib/context/WalletActionOverlayContext';
import { useExchangeContext } from '@/lib/context/hooks';
import OpenCloseBtn from '@/components/views/Buttons/OpenCloseBtn';
import WalletAccountSelection from '@/components/views/Buttons/WalletAccountSelection';
import ValidationPopup from '../../SponsorCoinLab/components/ValidationPopup';
import { CreateAccountAvatarPanel, CreateAccountFormPanel } from '../CreateAccount/components';
import { useCreateAccountForm } from '../CreateAccount/hooks';
import { ACCEPTED_IMAGE_INPUT_ACCEPT, normalizeAddress } from '../CreateAccount/utils';
import spCoin_png from '@/public/assets/miscellaneous/spCoin.png';

export default function EditAccountPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { address, isConnected } = useAccount();
  const { runWithWalletAction } = useWalletActionOverlay();
  const { exchangeContext } = useExchangeContext();
  const connected = Boolean(isConnected);
  const activeAddress = address;
  const requestedAccountAddress = String(searchParams.get('account') ?? '').trim() || undefined;
  const appChainId = Number(exchangeContext?.network?.appChainId ?? 0);
  const hardhatSignerAvailable = appChainId === 31337;
  const [authSignerSource, setAuthSignerSource] = useState<'ec2-base' | 'metamask'>(
    hardhatSignerAvailable ? 'ec2-base' : 'metamask',
  );
  const [hardhatDeploymentAccountNumber, setHardhatDeploymentAccountNumber] = useState(0);
  const [hardhatDeploymentAccounts, setHardhatDeploymentAccounts] = useState<string[]>([]);
  const [hardhatDeploymentAccountCount, setHardhatDeploymentAccountCount] = useState(20);
  const editSessionReady = connected || (hardhatSignerAvailable && authSignerSource === 'ec2-base');

  const {
    publicKey,
    formData,
    errors,
    handlePublicKeyChange,
    handlePublicKeyBlur,
    handleSelectPublicKey,
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
    hasUnsavedChanges,
    canCreateMissingAccount,
    disableSubmit,
    disableRevert,
  } = useCreateAccountForm({
    connected: editSessionReady,
    activeAddress: activeAddress ? String(activeAddress) : undefined,
    targetAddress: requestedAccountAddress,
    authSignerSource,
    hardhatDeploymentAccountNumber,
    appChainId,
    runWithWalletAction,
  });

  const [showAllBorders, setShowAllBorders] = useState(false);
  const [showBorderToggleButton, setShowBorderToggleButton] = useState(false);
  const [expandedPanel, setExpandedPanel] = useState<'avatar' | 'form' | null>(null);

  useEffect(() => {
    if (!hardhatSignerAvailable && authSignerSource !== 'metamask') {
      setAuthSignerSource('metamask');
    }
  }, [authSignerSource, hardhatSignerAvailable]);

  useEffect(() => {
    const syncSelectedSignerAccount = async () => {
      if (authSignerSource === 'ec2-base') {
        if (!hardhatSignerAvailable) return;
        const nextAddress = String(
          hardhatDeploymentAccounts[hardhatDeploymentAccountNumber] ?? '',
        ).trim();
        if (!nextAddress) return;
        if (
          publicKey &&
          normalizeAddress(String(publicKey)) === normalizeAddress(nextAddress)
        ) {
          return;
        }
        await handleSelectPublicKey(nextAddress);
        return;
      }

      const nextAddress = String(activeAddress ?? '').trim();
      if (!nextAddress) return;
      if (
        publicKey &&
        normalizeAddress(String(publicKey)) === normalizeAddress(nextAddress)
      ) {
        return;
      }
      await handleSelectPublicKey(nextAddress);
    };

    void syncSelectedSignerAccount();
  }, [
    activeAddress,
    authSignerSource,
    hardhatDeploymentAccountNumber,
    hardhatDeploymentAccounts,
    hardhatSignerAvailable,
    handleSelectPublicKey,
    publicKey,
  ]);

  useEffect(() => {
    if (!hardhatSignerAvailable) return;

    const abortController = new AbortController();

    const loadHardhatAccounts = async () => {
      try {
        const response = await fetch('/assets/spCoinLab/networks/31337/testAccounts.json', {
          cache: 'no-store',
          signal: abortController.signal,
        });
        if (!response.ok) return;

        const entries = (await response.json()) as Array<{ address?: string }>;
        if (abortController.signal.aborted || !entries.length) return;

        const normalizedAccounts = entries
          .map((entry) => String(entry?.address ?? '').trim())
          .filter(Boolean)
          .map((entryAddress) => normalizeAddress(entryAddress));

        setHardhatDeploymentAccounts(normalizedAccounts);
        setHardhatDeploymentAccountCount(entries.length);

        const normalizedPublicKey = String(publicKey ?? '').trim();
        if (!normalizedPublicKey) return;

        const matchedIndex = normalizedAccounts.findIndex(
          (entryAddress) => entryAddress === normalizeAddress(normalizedPublicKey),
        );

        if (matchedIndex >= 0) {
          setHardhatDeploymentAccountNumber(matchedIndex);
        }
      } catch {
        // Keep the default selector range when the local account seed list is unavailable.
      }
    };

    void loadHardhatAccounts();
    return () => abortController.abort();
  }, [hardhatSignerAvailable, publicKey]);

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

  const panelMarginClass = 'mx-auto';
  const sponsorInnerPanelClass = 'rounded-xl border border-[#31416F] bg-[#0B1220]';
  const sponsorSwappedPanelClass = 'rounded-xl border border-[#31416F] bg-[#11162A]';
  const avatarPanelBorderClass = showAllBorders
    ? `${sponsorInnerPanelClass} outline outline-2 outline-red-500`
    : sponsorInnerPanelClass;
  const loadingInputMessage =
    'Loading or updating account data. Input is temporarily disabled.';
  const accountDataHeading = `${formData.name.trim() || 'Account'} Account Data`;
  const swappedOuterCardClass =
    'rounded-2xl border border-[#2B3A67] bg-[#0B1220] p-4 shadow-[0_12px_40px_rgba(0,0,0,0.25)] md:p-5';
  const releaseStyleOuterShellClass = 'rounded-[28px] bg-[#192134] p-4 md:p-5';
  const showAvatarPanel = expandedPanel === null || expandedPanel === 'avatar';
  const showFormPanel = expandedPanel === null || expandedPanel === 'form';
  const showHardhatAccountSelector = hardhatSignerAvailable && authSignerSource === 'ec2-base';

  const handleHardhatDeploymentAccountChange = async (
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const nextAccountNumber = Number(event.target.value);
    setHardhatDeploymentAccountNumber(nextAccountNumber);

    const nextAddress = String(hardhatDeploymentAccounts[nextAccountNumber] ?? '').trim();
    if (!nextAddress) return;

    await handleSelectPublicKey(nextAddress);
  };

  const handleHardhatSignerSourceChange = async () => {
    setAuthSignerSource('ec2-base');

    const nextAddress = String(hardhatDeploymentAccounts[hardhatDeploymentAccountNumber] ?? '').trim();
    if (!nextAddress) return;

    await handleSelectPublicKey(nextAddress);
  };

  const handleMetaMaskSignerSourceChange = async () => {
    setAuthSignerSource('metamask');

    const nextAddress = String(activeAddress ?? '').trim();
    if (!nextAddress) return;

    await handleSelectPublicKey(nextAddress);
  };

  const renderAvatarCard = (
    panelKey: 'avatar' | 'form',
    outerTitle: string,
    showAvatarImage = true,
    showAvatarButton = true,
    headingContent?: ReactNode,
  ) => (
    <section
      className={`${releaseStyleOuterShellClass} flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden`}
    >
      <div
        className="relative z-20 w-full overflow-visible"
        onDoubleClick={() =>
          setExpandedPanel((current) => (current === panelKey ? null : panelKey))
        }
        title={
          expandedPanel === panelKey
            ? 'Double-click to return to shared view'
            : 'Double-click to expand'
        }
      >
        <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-3 pb-[0.32rem]">
          <div className="flex min-h-10 items-center" />
          <div className="min-w-0 justify-self-center text-center">
            <h2 className="text-center text-xl font-semibold text-[#8FA8FF]">
              {outerTitle}
            </h2>
          </div>
          <div
            className="flex shrink-0 items-center justify-self-end gap-2"
            onDoubleClick={(event) => event.stopPropagation()}
          >
            <OpenCloseBtn
              onClick={() =>
                setExpandedPanel((current) => (current === panelKey ? null : panelKey))
              }
              onDoubleClick={(event) => event.stopPropagation()}
              isExpanded={expandedPanel === panelKey}
              className="relative -right-[9px] -top-[10px]"
              glyphClassName="pb-[2px] text-[2.2rem]"
            />
          </div>
        </div>
      </div>
      <div className="scrollbar-hide flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto pr-1">
        <CreateAccountAvatarPanel
          panelMarginClass={panelMarginClass}
          avatarPanelBorderClass={avatarPanelBorderClass}
          avatarHeading={formData.name.trim() ? `${formData.name.trim()}'s Avatar` : 'Users Avatar'}
          headingContent={headingContent}
          logoPreviewSrc={logoPreviewSrc}
          connected={editSessionReady}
          isEditMode={isEditMode}
          inputLocked={false}
          previewButtonLabel="Select Preview Image"
          loadingInputMessage={loadingInputMessage}
          isLoading={isLoading}
          acceptedInput={ACCEPTED_IMAGE_INPUT_ACCEPT}
          logoFileInputRef={logoFileInputRef}
          onFileChange={handleLogoFileChange}
          showImage={showAvatarImage}
          showButton={showAvatarButton}
        />
      </div>
    </section>
  );

  const renderMetaDataCard = () => (
    <section
      className={`${releaseStyleOuterShellClass} flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden`}
    >
      <div
        className="relative z-20 w-full overflow-visible"
        onDoubleClick={() =>
          setExpandedPanel((current) => (current === 'form' ? null : 'form'))
        }
        title={
          expandedPanel === 'form'
            ? 'Double-click to return to shared view'
            : 'Double-click to expand'
        }
      >
        <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-3 pb-[0.32rem]">
          <div className="flex min-h-10 items-center" />
          <div className="min-w-0 justify-self-center text-center">
            <h2 className="text-center text-xl font-semibold text-[#8FA8FF]">
              Account Meta Data
            </h2>
          </div>
          <div
            className="flex shrink-0 items-center justify-self-end gap-2"
            onDoubleClick={(event) => event.stopPropagation()}
          >
            <OpenCloseBtn
              onClick={() =>
                setExpandedPanel((current) => (current === 'form' ? null : 'form'))
              }
              onDoubleClick={(event) => event.stopPropagation()}
              isExpanded={expandedPanel === 'form'}
              className="relative -right-[9px] -top-[10px]"
              glyphClassName="pb-[2px] text-[2.2rem]"
            />
          </div>
        </div>
      </div>
      <div
        className={`${swappedOuterCardClass} scrollbar-hide flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto pr-1`}
      >
        <h2 className="mx-auto mb-4 w-full max-w-[46rem] text-center text-lg font-semibold text-[#5981F3]">
          {accountDataHeading}
        </h2>
        <CreateAccountFormPanel
          panelMarginClass={panelMarginClass}
          accountPanelBorderClass={showAllBorders
            ? `${sponsorSwappedPanelClass} outline outline-2 outline-yellow-400`
            : sponsorSwappedPanelClass}
          contentWidthClass="max-w-none"
          idPrefix="edit-account-top-right-"
          formHeading=""
          topRowContent={(
            <WalletAccountSelection
              className="px-3"
              showHardhatAccountSelector={showHardhatAccountSelector}
              hardhatSignerAvailable={hardhatSignerAvailable}
              authSignerSource={authSignerSource}
              hardhatDeploymentAccountNumber={hardhatDeploymentAccountNumber}
              hardhatDeploymentAccountCount={hardhatDeploymentAccountCount}
              isSaving={isSaving}
              onHardhatDeploymentAccountChange={handleHardhatDeploymentAccountChange}
              onHardhatSignerSourceChange={handleHardhatSignerSourceChange}
              onMetaMaskSignerSourceChange={handleMetaMaskSignerSourceChange}
            />
          )}
          connected={editSessionReady}
          publicKey={publicKey}
          publicKeyLocked
          formData={formData}
          errors={errors}
          descriptionTextareaRef={descriptionTextareaRef}
          inputLocked={false}
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
  );

  return (
    <main className="relative flex w-full flex-col overflow-hidden bg-[#0B1020] px-4 pt-3 pb-6 text-white md:px-6">
      <div className="mx-auto flex w-full max-w-[1720px] flex-1 flex-col">
        <div className="mb-4 grid grid-cols-[auto_1fr_auto] items-center gap-3">
          <div className="flex items-center">
            <Image
              src={spCoin_png}
              alt="Sponsor Coin Logo"
              priority
              className="h-8 w-auto"
            />
          </div>
          <h1 className="text-center text-2xl font-bold text-[#5981F3] md:text-[2.15rem]">
            {pageTitle}
          </h1>
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
            <OpenCloseBtn
              id="createAccountBackButton"
              onClick={() => router.back()}
              expandedTitle="Go Back"
              expandedAriaLabel="Go Back"
            />
          </div>
        </div>

      <form onSubmit={handleSubmit} className="flex min-h-0 w-full flex-1 flex-col gap-6">
        <div
          className={`grid min-h-0 gap-6 ${
            expandedPanel ? 'grid-cols-1' : 'grid-cols-1 2xl:grid-cols-2'
          }`}
        >
          {showAvatarPanel ? renderAvatarCard('avatar', 'Account Avatar') : null}
          {showFormPanel ? renderMetaDataCard() : null}
        </div>
      </form>
      </div>
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
