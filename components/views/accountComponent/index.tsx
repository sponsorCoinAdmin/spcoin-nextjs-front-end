'use client';

import React, { useContext, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Wallet, X } from 'lucide-react';
import { useAccount } from 'wagmi';

import { usePanelVisible } from '@/lib/context/exchangeContext/hooks/usePanelVisible';
import { SP_COIN_DISPLAY, type spCoinAccount } from '@/lib/structure';
import { ExchangeContextState } from '@/lib/context/ExchangeProvider';
import { useWalletActionOverlay } from '@/lib/context/WalletActionOverlayContext';
import { useExchangeContext } from '@/lib/context/hooks';
import { isSpCoinWalletAccount } from '@/lib/spCoinWallet';
import { useSpCoinWallet } from '@/lib/spCoinWallet';
import { accountRegistry, getAccountRegistryRecord, type AccountRegistryRecord } from '@/lib/context/accounts/accountRegistry';
import { ACCOUNT_REGISTRY_UPDATED_EVENT } from '@/lib/accounts/accountEvents';
import CreateAccountAvatarPanel from '@/app/(menu)/(dynamic)/(accounts)/CreateAccount/components/CreateAccountAvatarPanel';
import CreateAccountFormPanel from '@/app/(menu)/(dynamic)/(accounts)/CreateAccount/components/CreateAccountFormPanel';
import { ACCEPTED_IMAGE_INPUT_ACCEPT } from '@/app/(menu)/(dynamic)/(accounts)/CreateAccount/utils';
import { useCreateAccountForm } from '@/app/(menu)/(dynamic)/(accounts)/CreateAccount/hooks';

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

function normalizeAddressKey(value: unknown) {
  return (value ?? '').toString().trim().toLowerCase();
}

interface AccountComponentProps {
  account?: spCoinAccount;
  onClose?: () => void;
  showHeader?: boolean;
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
  onEditClick?: () => void;
}

function AccountHeader({ title, logoURL, editAccountHref, onClose, onEditClick }: AccountHeaderProps) {
  const router = useRouter();
  const { closeWallet } = useSpCoinWallet();
  const iconClassName = 'flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#11162A]';
  const iconContent = logoURL ? (
    <img
      src={logoURL}
      alt={title}
      className="h-full w-full object-contain"
    />
  ) : (
    <Wallet className="h-5 w-5 text-[#7893ff]" />
  );

  const handleEditClick = () => {
    if (onEditClick) {
      onEditClick();
    } else if (editAccountHref) {
      closeWallet();
      sessionStorage.setItem('spcoin-reopen-wallet-after-edit', 'true');
      if (onClose) {
        onClose();
      }
      router.push(editAccountHref);
    }
  };

  return (
    <div className="relative border-b border-slate-700/70 px-5 py-4">
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
    <div className="mb-2 flex items-center gap-2 text-sm text-slate-300/80">
      <span className="whitespace-nowrap">{label}</span>
      <div className="mb-0 flex w-full min-w-0 flex-1 items-center justify-center gap-2 rounded-[22px] bg-[#243056] px-1 py-1 text-sm text-[#5981F3]">
        <span className="w-full truncate whitespace-nowrap text-center font-mono">{address}</span>
      </div>
    </div>
  );
}

export default function AccountComponent({
  account: forcedAccount,
  onClose,
  showHeader = true,
  mode,
}: AccountComponentProps) {
  const ctx = useContext(ExchangeContextState);
  const accounts = ctx?.exchangeContext?.accounts;
  const [registryRefreshTick, setRegistryRefreshTick] = useState(0);

  const vActiveAccount = usePanelVisible(SP_COIN_DISPLAY.ACTIVE_ACCOUNT);
  const vActiveSponsor = usePanelVisible(SP_COIN_DISPLAY.SPONSOR_ACCOUNT);
  const vActiveRecipient = usePanelVisible(SP_COIN_DISPLAY.RECIPIENT_ACCOUNT);
  const vActiveAgent = usePanelVisible(SP_COIN_DISPLAY.AGENT_ACCOUNT);

  const depositLabel = useMemo(() => {
    if (mode === SP_COIN_DISPLAY.ACTIVE_ACCOUNT) return 'Active Account:';
    if (mode === SP_COIN_DISPLAY.SPONSOR_ACCOUNT) return 'Sponsor Account:';
    if (mode === SP_COIN_DISPLAY.RECIPIENT_ACCOUNT) return 'Recipient Account:';
    if (mode === SP_COIN_DISPLAY.AGENT_ACCOUNT) return 'Agent Account:';
    if (vActiveAccount) return 'Active Account:';
    if (vActiveSponsor) return 'Sponsor Account:';
    if (vActiveRecipient) return 'Recipient Account:';
    if (vActiveAgent) return 'Agent Account:';
    return 'Account:';
  }, [mode, vActiveAccount, vActiveSponsor, vActiveRecipient, vActiveAgent]);

  const slotAccount = useMemo(() => {
    if (forcedAccount) return forcedAccount;
    if (!accounts) return undefined;
    if (vActiveAccount) return accounts.activeAccount;
    if (vActiveSponsor) return accounts.sponsorAccount;
    if (vActiveRecipient) return accounts.recipientAccount;
    if (vActiveAgent) return accounts.agentAccount;
    return accounts.activeAccount;
  }, [accounts, forcedAccount, vActiveAccount, vActiveSponsor, vActiveRecipient, vActiveAgent]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const onRegistryUpdated = (event: Event) => {
      const detail = (event as CustomEvent<{ address?: string }>).detail;
      const changedKey = normalizeAddressKey(detail?.address);
      const currentKey = normalizeAddressKey(slotAccount?.address);
      if (changedKey && currentKey && changedKey !== currentKey) return;
      setRegistryRefreshTick((prev) => prev + 1);
    };

    window.addEventListener(ACCOUNT_REGISTRY_UPDATED_EVENT, onRegistryUpdated as EventListener);
    return () => {
      window.removeEventListener(ACCOUNT_REGISTRY_UPDATED_EVENT, onRegistryUpdated as EventListener);
    };
  }, [slotAccount?.address]);

  const accountToRender = useMemo(() => {
    const slotAddress = typeof slotAccount?.address === 'string' ? slotAccount.address.trim() : '';
    if (!slotAddress) return slotAccount;
    return getAccountRegistryRecord<AccountRegistryRecord>(accountRegistry, slotAddress) ?? slotAccount;
  }, [slotAccount, registryRefreshTick]);

  const canEditAccount =
    normalizeAddressKey(accountToRender?.address) !== '' &&
    isSpCoinWalletAccount(accountToRender?.address);

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
    targetAddress: String(accountToRender?.address ?? '').trim(),
    authSignerSource: walletSource === 'hardhat' ? 'ec2-base' : 'metamask',
    hardhatDeploymentAccountNumber: 0,
    appChainId,
    hardhatSignerAvailable: true,
    runWithWalletAction,
  });

  if (!accountToRender) return null;

  const depositAddr = formatShortAddress(String(accountToRender?.address ?? '').trim());
  const title = accountToRender.name ? `Account ${accountToRender.name}` : 'Account Details';
  const editAccountHref = `/EditAccount?account=${encodeURIComponent(
    String(accountToRender?.address ?? '').trim(),
  )}`;

  return (
    <div id="ACCOUNT_INFO" className="bg-[#0b0e19]">
      {showHeader ? (
        <AccountHeader
          title={title}
          logoURL={accountToRender.logoURL}
          onClose={onClose}
          editAccountHref={canEditAccount ? editAccountHref : undefined}
        />
      ) : null}

      <form onSubmit={handleSubmit} className="px-5 py-4">
        {depositAddr ? <AccountAddressPill label={depositLabel} address={depositAddr} /> : null}

        <CreateAccountAvatarPanel
          panelMarginClass="mb-4"
          avatarPanelBorderClass=""
          avatarHeading={fallback(accountToRender?.name)}
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
          showImage={true}
          showButton={isEditMode}
        />

        <CreateAccountFormPanel
          panelMarginClass="mb-4"
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
      </form>
    </div>
  );
}
