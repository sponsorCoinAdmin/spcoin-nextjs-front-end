'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAccount } from 'wagmi';
import { useWalletActionOverlay } from '@/lib/context/WalletActionOverlayContext';
import { useExchangeContext } from '@/lib/context/hooks';
import OpenCloseBtn from '@/components/views/Buttons/OpenCloseBtn';
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

  const panelMarginClass = 'mx-0';
  const sponsorInnerPanelClass = 'rounded-xl border border-[#31416F] bg-[#0B1220]';
  const accountPanelBorderClass = showAllBorders
    ? `${sponsorInnerPanelClass} outline outline-2 outline-yellow-400`
    : sponsorInnerPanelClass;
  const avatarPanelBorderClass = showAllBorders
    ? `${sponsorInnerPanelClass} outline outline-2 outline-red-500`
    : sponsorInnerPanelClass;
  const loadingInputMessage =
    'Loading or updating account data. Input is temporarily disabled.';
  const accountDataHeading = `${formData.name.trim() || 'Account'} Account Data`;
  const outerCardClass =
    'rounded-2xl border border-[#2B3A67] bg-[#11162A] p-5 shadow-[0_12px_40px_rgba(0,0,0,0.25)]';
  const releaseStyleOuterShellClass = 'rounded-2xl bg-[#192134] p-4';
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
          <OpenCloseBtn
            id="createAccountBackButton"
            onClick={() => router.back()}
            expandedTitle="Go Back"
            expandedAriaLabel="Go Back"
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
            <section
              className={`${releaseStyleOuterShellClass} flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden`}
            >
              <div
                className="relative z-20 mb-4 w-full overflow-visible"
                onDoubleClick={() =>
                  setExpandedPanel((current) => (current === 'avatar' ? null : 'avatar'))
                }
                title={
                  expandedPanel === 'avatar'
                    ? 'Double-click to return to shared view'
                    : 'Double-click to expand'
                }
              >
                <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-3 pb-[0.32rem]">
                  <div className="flex min-h-10 items-center" />
                  <div className="min-w-0 justify-self-center text-center">
                    <h2 className="text-center text-xl font-semibold text-[#8FA8FF]">
                      Account Avatar
                    </h2>
                  </div>
                  <div className="flex shrink-0 items-center justify-self-end gap-2" onDoubleClick={(event) => event.stopPropagation()}>
                    <OpenCloseBtn
                      onClick={() =>
                        setExpandedPanel((current) => (current === 'avatar' ? null : 'avatar'))
                      }
                      onDoubleClick={(event) => event.stopPropagation()}
                      isExpanded={expandedPanel === 'avatar'}
                      className="relative -right-[9px] -top-[10px]"
                      glyphClassName="pb-[2px] text-[2.2rem]"
                    />
                  </div>
                </div>
              </div>
              <div
                className={`${outerCardClass} scrollbar-hide flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto pr-2`}
              >
                  <CreateAccountAvatarPanel
                    panelMarginClass={panelMarginClass}
                    avatarPanelBorderClass={avatarPanelBorderClass}
                    avatarHeading={formData.name.trim() ? `${formData.name.trim()}'s Avatar` : 'Users Avatar'}
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
                  />
              </div>
            </section>
          ) : null}

          {showFormPanel ? (
            <section
              className={`${releaseStyleOuterShellClass} flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden`}
            >
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
                <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-3 pb-[0.32rem]">
                  <div className="flex min-h-10 items-center" />
                  <div className="min-w-0 justify-self-center text-center">
                    <h2 className="text-center text-xl font-semibold text-[#8FA8FF]">
                      Account Meta Data
                    </h2>
                  </div>
                  <div className="flex shrink-0 items-center justify-self-end gap-2" onDoubleClick={(event) => event.stopPropagation()}>
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
                className={`${outerCardClass} scrollbar-hide flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto pr-2`}
              >
                  <div className="-mt-[5px] mb-4 flex w-full flex-wrap items-center justify-between gap-4 text-sm">
                    {showHardhatAccountSelector ? (
                      <div className="flex items-center gap-3">
                        <label className="flex min-w-[9rem] justify-start text-[#8FA8FF]">
                          <div className="flex items-center justify-start gap-2">
                            <span className="text-sm font-semibold text-[#8FA8FF]">Account #</span>
                            <select
                              aria-label="Account #"
                              title="Hardhat Deployment Account Number"
                              value={hardhatDeploymentAccountNumber}
                              disabled={isSaving}
                              onChange={(event) => {
                                void handleHardhatDeploymentAccountChange(event);
                              }}
                              className="h-[1.55rem] rounded border border-[#5981F3] bg-[#11162A] px-3 py-0 text-sm font-semibold leading-none text-white focus:outline-none"
                            >
                              {Array.from({ length: hardhatDeploymentAccountCount }, (_, index) => (
                                <option key={index} value={index}>
                                  {index}
                                </option>
                              ))}
                            </select>
                          </div>
                        </label>
                      </div>
                    ) : null}
                    <div className="ml-auto flex items-center gap-4">
                      {hardhatSignerAvailable ? (
                        <label className="flex items-center gap-2 text-[#8FA8FF]">
                          <input
                            type="radio"
                            name="edit-account-signer-source"
                            value="ec2-base"
                            checked={authSignerSource === 'ec2-base'}
                            disabled={isSaving}
                            onChange={() => {
                              void handleHardhatSignerSourceChange();
                            }}
                            className="h-3.5 w-3.5 appearance-none rounded-full border border-[#8FA8FF] bg-transparent checked:border-green-500 checked:bg-green-500"
                          />
                          <span>Hardhat "Ec2-BASE"</span>
                        </label>
                      ) : null}
                      <label className="flex items-center gap-2 text-[#8FA8FF]">
                        <input
                          type="radio"
                          name="edit-account-signer-source"
                          value="metamask"
                          checked={authSignerSource === 'metamask'}
                          disabled={isSaving}
                          onChange={() => {
                            void handleMetaMaskSignerSourceChange();
                          }}
                          className="h-3.5 w-3.5 appearance-none rounded-full border border-[#8FA8FF] bg-transparent checked:border-green-500 checked:bg-green-500"
                        />
                        <span>MetaMask</span>
                      </label>
                    </div>
                  </div>
                  <CreateAccountFormPanel
                    panelMarginClass={panelMarginClass}
                    accountPanelBorderClass={accountPanelBorderClass}
                    formHeading={accountDataHeading}
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
