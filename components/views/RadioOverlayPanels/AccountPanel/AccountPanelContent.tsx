'use client';

import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Wallet, X } from 'lucide-react';
import { useAccount } from 'wagmi';

import { SP_COIN_DISPLAY, type spCoinAccount } from '@/lib/structure';
import { useWalletActionOverlay } from '@/lib/context/WalletActionOverlayContext';
import { useExchangeContext } from '@/lib/context/hooks';
import { useSpCoinWallet } from '@/lib/spCoinWallet';
import AccountRow from '@/lib/spCoinWallet/AccountRow';
import type { SpCoinWalletAccount } from '@/lib/spCoinWallet';
import { isSpCoinWalletAccount } from '@/lib/spCoinWallet';
import { ACCEPTED_IMAGE_INPUT_ACCEPT } from '@/app/(menu)/(dynamic)/(accounts)/CreateAccount/utils';
import { useCreateAccountForm } from '@/app/(menu)/(dynamic)/(accounts)/CreateAccount/hooks';
import CreateAccountAvatarPanel from '@/app/(menu)/(dynamic)/(accounts)/CreateAccount/components/CreateAccountAvatarPanel';
import CreateAccountFormPanel from '@/app/(menu)/(dynamic)/(accounts)/CreateAccount/components/CreateAccountFormPanel';

const fallback = (v: unknown) => {
  const s = (v ?? '').toString().trim();
  return s || 'N/A';
};

function formatShortAddress(addr: string) {
  const a = (addr ?? '').toString().trim();
  if (!a) return '';
  if (a.length <= 36) return ` ${a} `;
  return ` ${a.slice(0, 15)} ... ${a.slice(-15)} `;
}

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

interface AccountAddressPillProps {
  label: string;
  address: string;
}

function AccountAddressPill({ label, address }: AccountAddressPillProps) {
  return (
    <div className="mb-[2px] flex items-center gap-2 text-sm text-slate-300/80">
      <span className="whitespace-nowrap">{label}</span>
      <div className="mb-0 flex w-full min-w-0 flex-1 items-center justify-center gap-2 rounded-[22px] bg-[#243056] px-1 py-1 text-sm text-[#5981F3]">
        <span className="w-full truncate whitespace-nowrap text-center font-mono">{address}</span>
      </div>
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

  const depositLabel = useMemo(() => {
    if (mode === SP_COIN_DISPLAY.ACTIVE_ACCOUNT) return 'Active Account:';
    if (mode === SP_COIN_DISPLAY.SPONSOR_ACCOUNT) return 'Sponsor Account:';
    if (mode === SP_COIN_DISPLAY.RECIPIENT_ACCOUNT) return 'Recipient Account:';
    if (mode === SP_COIN_DISPLAY.AGENT_ACCOUNT) return 'Agent Account:';
    return 'Account:';
  }, [mode]);

  if (!account) return null;

  const depositAddr = formatShortAddress(String(account.address ?? '').trim());
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

  return (
    <div id="ACCOUNT_INFO" className="flex h-full min-h-0 flex-col bg-[#0b0e19]">
      {showHeader ? (
        <AccountHeader
          title={title}
          logoURL={account.logoURL}
          onClose={onClose}
          editAccountHref={editAccountHref}
        />
      ) : null}

      <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
        {showSummaryRow ? (
          <div className="shrink-0 px-5 pb-0 pt-[5px]">
            {depositAddr ? <AccountAddressPill label={depositLabel} address={depositAddr} /> : null}
            <h2 className="mb-[3px] w-full max-w-[56rem] text-center text-lg font-semibold text-[#5981F3]">
              {fallback(account?.name)}
            </h2>
          </div>
        ) : null}

        <div
          id={mode === SP_COIN_DISPLAY.ACTIVE_ACCOUNT ? 'ACTIVE_ACCOUNT_BODY' : undefined}
          className={
            mode === SP_COIN_DISPLAY.ACTIVE_ACCOUNT
              ? 'scrollbar-hide -mx-[30px] -mb-[10px] flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto overflow-x-hidden rounded-b-[13px] px-5 pt-[2px] pb-0'
              : ''
          }
        >
          <CreateAccountAvatarPanel
            panelMarginClass="mb-0 !h-auto"
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
            showButton={isEditMode}
          />

          <CreateAccountFormPanel
            panelMarginClass="mb-0 !h-auto"
            accountPanelBorderClass=""
            contentWidthClass="max-w-[56rem]"
            idPrefix="account-component-"
            formHeading=""
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
      </form>
    </div>
  );
}
