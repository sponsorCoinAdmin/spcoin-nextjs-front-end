'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Wallet, X } from 'lucide-react';
import { useAccount } from 'wagmi';

import { SP_COIN_DISPLAY, type spCoinAccount } from '@/lib/structure';
import { useWalletActionOverlay } from '@/lib/context/WalletActionOverlayContext';
import { useExchangeContext } from '@/lib/context/hooks';
import { usePanelVisible } from '@/lib/context/exchangeContext/hooks/usePanelVisible';
import { useSpCoinWallet } from '@/lib/spCoinWallet';
import AccountRow from '@/lib/spCoinWallet/AccountRow';
import type { SpCoinWalletAccount } from '@/lib/spCoinWallet';
import { isSpCoinWalletAccount } from '@/lib/spCoinWallet';
import { ACCEPTED_IMAGE_INPUT_ACCEPT } from '@/app/(menu)/(dynamic)/(accounts)/CreateAccount/utils';
import { useCreateAccountForm } from '@/app/(menu)/(dynamic)/(accounts)/CreateAccount/hooks';
import CreateAccountAvatarPanel from '@/app/(menu)/(dynamic)/(accounts)/CreateAccount/components/CreateAccountAvatarPanel';
import CreateAccountFormPanel from '@/app/(menu)/(dynamic)/(accounts)/CreateAccount/components/CreateAccountFormPanel';


interface AccountPanelContentProps {
  account: spCoinAccount;
  onClose?: () => void;
  showHeader?: boolean;
  showSummaryRow?: boolean;
  mode?:
    | SP_COIN_DISPLAY.ACTIVE_ACCOUNT
    | SP_COIN_DISPLAY.SPONSOR_ACCOUNT
    | SP_COIN_DISPLAY.RECIPIENT_ACCOUNT
    | SP_COIN_DISPLAY.AGENT_ACCOUNT;
}

interface AccountHeaderProps {
  title: string;
  logoURL?: string;
  editAccountHref?: string;
  onClose?: () => void;
}

function AccountHeader({ title, logoURL, editAccountHref, onClose }: AccountHeaderProps) {
  const router = useRouter();
  const { closeWallet } = useSpCoinWallet();
  const iconClassName = 'flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#11162A]';
  const iconContent = logoURL ? (
    <img src={logoURL} alt={title} className="h-full w-full object-contain" />
  ) : (
    <Wallet className="h-5 w-5 text-[#7893ff]" />
  );

  const handleEditClick = () => {
    if (!editAccountHref) return;
    closeWallet();
    sessionStorage.setItem('spcoin-reopen-wallet-after-edit', 'true');
    onClose?.();
    router.push(editAccountHref);
  };

  return (
    <div className="relative border-b border-slate-700/70 px-5 pt-8 pb-4">
      <div className="flex items-center gap-3">
        {editAccountHref ? (
          <button
            type="button"
            onClick={handleEditClick}
            className={`${iconClassName} transition-opacity hover:opacity-90`}
            aria-label={`Edit ${title}`}
            title={`Edit ${title}`}
          >
            {iconContent}
          </button>
        ) : (
          <span className={iconClassName}>{iconContent}</span>
        )}
      </div>
      <h2 className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 text-center text-xl font-bold leading-tight">
        {title}
      </h2>
      {onClose ? (
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-[#303b68] hover:bg-[#3c487a]"
          aria-label="Close account details"
        >
          <X className="h-6 w-6 text-[#91a5ff]" />
        </button>
      ) : null}
    </div>
  );
}

export default function AccountPanelContent({
  account,
  onClose,
  showHeader = true,
  showSummaryRow = true,
  mode,
}: AccountPanelContentProps) {
  const { address: metamaskAddress, isConnected } = useAccount();
  const { runWithWalletAction } = useWalletActionOverlay();
  const { exchangeContext } = useExchangeContext();
  const appChainId = Number(exchangeContext?.network?.appChainId ?? 0);
  const walletSource = useSpCoinWallet().walletSource;
  const menuTabHeaderOpen = usePanelVisible(SP_COIN_DISPLAY.MENU_TAB_HEADER_BAR);
  const activeAccountHeaderOpen = usePanelVisible(SP_COIN_DISPLAY.ACTIVE_ACCOUNT_HEADER_BAR);
  const addressHeaderOpen = usePanelVisible(SP_COIN_DISPLAY.ADDRESS_HEADER_BAR);
  const logoVisible = usePanelVisible(SP_COIN_DISPLAY.ACCOUNT_LOGO);
  const metaDataVisible = usePanelVisible(SP_COIN_DISPLAY.ACCOUNT_META_DATA);

  const {
    publicKey,
    formData,
    errors,
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
    isLoading,
    isSaving,
    isEditMode,
    hasUnsavedChanges,
    canCreateMissingAccount,
    disableSubmit,
    disableRevert,
    isRevertNoop,
    submitLabel,
  } = useCreateAccountForm({
    connected: Boolean(isConnected || walletSource === 'hardhat'),
    activeAddress: metamaskAddress,
    targetAddress: String(account?.address ?? '').trim(),
    authSignerSource: walletSource === 'hardhat' ? 'ec2-base' : 'metamask',
    hardhatDeploymentAccountNumber: 0,
    appChainId,
    hardhatSignerAvailable: true,
    runWithWalletAction,
  });

  if (!account) return null;

  const title = account.name ? `Account ${account.name}` : 'Account Details';
  const editAccountHref = isSpCoinWalletAccount(account.address)
    ? `/EditAccount?account=${encodeURIComponent(String(account.address ?? '').trim())}`
    : undefined;
  const selectedWalletRow: SpCoinWalletAccount | undefined =
    !showHeader && !showSummaryRow
      ? {
          address: String(account.address ?? '').trim(),
          label: String(account.name || 'Unnamed account').trim(),
          name: String(account.name || 'Unnamed account').trim(),
          symbol: String(account.symbol || '').trim(),
          logoURL: account.logoURL,
          source: walletSource,
        }
      : undefined;
  const avatarResizeSignal = [
    menuTabHeaderOpen,
    activeAccountHeaderOpen,
    addressHeaderOpen,
    mode,
  ].join(':');

  return (
    <div id="ACCOUNT_INFO" className="flex min-h-full shrink-0 flex-col bg-[#0b0e19]">
      {showHeader ? (
        <AccountHeader
          title={title}
          logoURL={account.logoURL}
          onClose={onClose}
          editAccountHref={editAccountHref}
        />
      ) : null}

      <form onSubmit={handleSubmit} className="flex flex-col">

        <div
          id="ACTIVE_ACCOUNT_BODY"
          className={
            mode === SP_COIN_DISPLAY.ACTIVE_ACCOUNT
              ? '-mx-4 -mb-[10px] flex flex-col gap-2 overflow-x-hidden rounded-b-[13px] px-4 pt-[2px] pb-0'
              : 'flex flex-col gap-2 overflow-x-hidden'
          }
        >
          {logoVisible ? (
            <div id="ACCOUNT_LOGO" className="shrink-0 overflow-visible">
              <CreateAccountAvatarPanel
                panelMarginClass="mb-0 min-h-0"
                avatarPanelBorderClass=""
                avatarHeading=""
                logoPreviewSrc={logoPreviewSrc}
                connected={Boolean(isConnected || walletSource === 'hardhat')}
                isEditMode={isEditMode}
                inputLocked={!isEditMode}
                previewButtonLabel="Select Preview Image"
                loadingInputMessage="Loading or updating account data. Input is temporarily disabled."
                isLoading={isLoading}
                acceptedInput={ACCEPTED_IMAGE_INPUT_ACCEPT}
                logoFileInputRef={logoFileInputRef}
                onFileChange={handleLogoFileChange}
                selectedRowContent={
                  selectedWalletRow ? (
                    <AccountRow
                      account={selectedWalletRow}
                      isActiveMarker={mode === SP_COIN_DISPLAY.ACTIVE_ACCOUNT}
                    />
                  ) : undefined
                }
                showImage={true}
                showButton={true}
                minPreviewSize={180}
                overflowMinPreviewSize={96}
                maxPreviewSize={420}
                minControlWidth={220}
                uploadControlTextClassName="px-4 text-center text-sm font-bold"
                previewSizeBuffer={0}
                previewHeightBuffer={8}
                sectionBottomBuffer={0}
                lockSectionHeight={false}
                fillParentHeight={false}
                sizingBoundarySelector="#ACTIVE_ACCOUNT_BODY"
                resizeSignal={avatarResizeSignal}
              />
            </div>
          ) : null}

          {metaDataVisible ? (
            <div id="ACCOUNT_META_DATA" className="shrink-0 overflow-visible">
              <CreateAccountFormPanel
                panelMarginClass="mb-0 !h-auto"
                accountPanelBorderClass=""
                contentWidthClass="max-w-[56rem]"
                idPrefix="account-component-"
                formHeading=""
                account={account}
                connected={Boolean(isConnected || walletSource === 'hardhat')}
                publicKey={publicKey}
                publicKeyLocked
                formData={formData}
                errors={errors}
                descriptionTextareaRef={descriptionTextareaRef}
                inputLocked={!isEditMode}
                isLoading={isLoading}
                loadingInputMessage="Loading or updating account data. Input is temporarily disabled."
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
          ) : null}
        </div>
      </form>
    </div>
  );
}
