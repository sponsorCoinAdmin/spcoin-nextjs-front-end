'use client';

import { useMemo } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useAccount } from 'wagmi';
import { useWalletActionOverlay } from '@/lib/context/WalletActionOverlayContext';
import { useExchangeContext } from '@/lib/context/hooks';
import { useSpCoinWallet } from '@/lib/spCoinWallet';
import { useCreateAccountForm } from '@/app/(menu)/(dynamic)/(accounts)/CreateAccount/hooks/useCreateAccountForm';
import CreateAccountFormPanel from '@/app/(menu)/(dynamic)/(accounts)/CreateAccount/components/CreateAccountFormPanel';

type Props = {
  targetAddress?: string;
  onBack: () => void;
};

export default function AccountFormView({ targetAddress, onBack }: Props) {
  const { address, isConnected } = useAccount();
  const { runWithWalletAction } = useWalletActionOverlay();
  const { exchangeContext } = useExchangeContext();
  const { session } = useSpCoinWallet();

  const appChainId = Number(exchangeContext?.network?.appChainId ?? 0);
  const hardhatSignerAvailable = session.signerSource === 'hardhat';
  const isEditMode = Boolean(targetAddress);

  const authSignerSource = useMemo<'ec2-base' | 'metamask'>(() => {
    return hardhatSignerAvailable ? 'ec2-base' : 'metamask';
  }, [hardhatSignerAvailable]);

  const activeAddress =
    authSignerSource === 'metamask' ? String(address ?? '').trim() || undefined : undefined;

  const form = useCreateAccountForm({
    connected: isConnected || hardhatSignerAvailable,
    activeAddress,
    targetAddress,
    authSignerSource,
    hardhatDeploymentAccountNumber: 0,
    appChainId,
    hardhatSignerAvailable,
    runWithWalletAction,
  });

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center gap-2 border-b border-slate-700/70 px-3 py-2">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center justify-center rounded p-1 text-slate-400 transition-colors hover:text-white"
          title="Back to account list"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-semibold text-white">
          {isEditMode ? 'Edit Account' : 'Create Account'}
        </span>
      </div>

      <div className="scrollbar-hide min-h-0 flex-1 overflow-y-auto px-2">
        <form onSubmit={form.handleSubmit}>
          <CreateAccountFormPanel
            panelMarginClass=""
            accountPanelBorderClass=""
            contentWidthClass="max-w-none"
            idPrefix="wallet-manage-"
            formHeading=""
            accountAddress={targetAddress}
            connected={isConnected || hardhatSignerAvailable}
            publicKey={form.publicKey}
            publicKeyLocked={isEditMode}
            formData={form.formData}
            errors={form.errors}
            descriptionTextareaRef={form.descriptionTextareaRef}
            inputLocked={form.isLoading}
            isLoading={form.isLoading}
            loadingInputMessage="Loading account data…"
            isSaving={form.isSaving}
            isEditMode={form.isEditMode}
            submitLabel={form.submitLabel}
            hasUnsavedChanges={form.hasUnsavedChanges}
            canCreateMissingAccount={form.canCreateMissingAccount}
            disableSubmit={form.disableSubmit}
            disableRevert={form.disableRevert}
            isRevertNoop={form.isRevertNoop}
            onPublicKeyChange={form.handlePublicKeyChange}
            onPublicKeyBlur={form.handlePublicKeyBlur}
            onChange={form.handleChange}
            onFieldBlur={form.handleFieldBlur}
            onRevert={form.handleRevertChanges}
          />
        </form>
      </div>
    </div>
  );
}
