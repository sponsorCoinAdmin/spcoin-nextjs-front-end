import React, { type Dispatch, type SetStateAction } from 'react';
import Image from 'next/image';
import type { ConnectionMode } from '../scriptBuilder/types';
import LabCardHeader from './LabCardHeader';
import AccountDropdownInput from './AccountDropdownInput';

type Props = {
  className: string;
  isExpanded: boolean;
  onToggleExpand: () => void;
  inputStyle: string;
  details: {
    showSignerAccountDetails: boolean;
    setShowSignerAccountDetails: Dispatch<SetStateAction<boolean>>;
    displayedSignerAccountAddress: string;
    selectedWriteSenderAddress: string;
    setSelectedWriteSenderAddress: (value: string) => void;
    writeSenderDisplayValue: string;
    displayedSignerAccountMetadata?: {
      logoURL?: string;
      name?: string;
      symbol?: string;
    };
    mode: ConnectionMode;
    selectedVersionSignerKey: string;
  };
  accountManagement: {
    accountActionLabelClassName: (tone: 'neutral' | 'invalid' | 'valid') => string;
    hardhatAccounts: Array<{ address: string; privateKey?: string }>;
    hardhatAccountMetadata: Record<string, { name?: string; symbol?: string; logoURL: string }>;
    selectedSponsorCoinAccountRole: 'sponsor' | 'recipient' | 'agent';
    setSelectedSponsorCoinAccountRole: (value: 'sponsor' | 'recipient' | 'agent') => void;
    managedRoleAccountAddress: string;
    setManagedRoleAccountAddress: (value: string) => void;
    managedRecipientKey: string;
    setManagedRecipientKey: (value: string) => void;
    managedRecipientRateKey: string;
    setManagedRecipientRateKey: (value: string) => void;
    managedRecipientRateKeyOptions: string[];
    managedRecipientRateKeyHelpText: string;
    sponsorCoinAccountManagementValidation: { tone: 'neutral' | 'invalid' | 'valid'; message: string };
    sponsorCoinAccountManagementStatus: string;
    onExecuteAccountAction: (action: 'add' | 'delete') => Promise<void>;
  };
};

export default function NetworkSignerCard({
  className,
  isExpanded,
  onToggleExpand,
  inputStyle,
  details,
  accountManagement,
}: Props) {
  const [selectedAccountAction, setSelectedAccountAction] = React.useState<'add' | 'delete'>('add');
  const [showManagedRoleMetadata, setShowManagedRoleMetadata] = React.useState(false);
  const [showManagedRecipientMetadata, setShowManagedRecipientMetadata] = React.useState(false);
  const [showWriteSenderDetails, setShowWriteSenderDetails] = React.useState(false);
  const normalizeAccountValue = (value: string) => {
    const trimmed = String(value || '').trim();
    return /^0[xX][0-9a-fA-F]{40}$/.test(trimmed) ? `0x${trimmed.slice(2).toLowerCase()}` : trimmed;
  };
  const getMetadataForAddress = (address: string) =>
    accountManagement.hardhatAccountMetadata[String(address || '').trim().toLowerCase()];
  const formatAccountOptionLabel = (address: string, index: number) => {
    const metadata = getMetadataForAddress(address);
    const name = String(metadata?.name || '').trim() || 'Unnamed account';
    const symbol = String(metadata?.symbol || '').trim() || 'No symbol';
    return `Account ${index}, ${address}, ${name}(${symbol})`;
  };
  const accountOptions = React.useMemo(
    () =>
      accountManagement.hardhatAccounts.map((account, idx) => ({
        value: normalizeAccountValue(account.address),
        label: formatAccountOptionLabel(account.address, idx),
      })),
    [accountManagement.hardhatAccounts],
  );
  const isAddAction = selectedAccountAction === 'add';
  const activeValidation = accountManagement.sponsorCoinAccountManagementValidation;
  const activeButtonLabel = isAddAction ? 'Add' : 'Delete';
  const actionButtonClassName =
    'w-[140px] rounded-xl bg-[#EBCA6A] px-4 py-[0.45rem] font-semibold text-black transition-colors hover:bg-green-500';
  const roleLabel =
    accountManagement.selectedSponsorCoinAccountRole === 'sponsor'
      ? 'Sponsor'
      : accountManagement.selectedSponsorCoinAccountRole === 'recipient'
      ? 'Recipient'
      : 'Agent';
  const renderAccountMetadata = (address: string) => {
    const metadata = getMetadataForAddress(address);
    if (!metadata?.logoURL && !metadata?.name && !metadata?.symbol) return null;

    return (
      <div className="grid items-center gap-3 md:grid-cols-[auto_minmax(0,1fr)]">
        <span className="text-sm font-semibold text-[#8FA8FF]">Metadata</span>
        <div className="flex items-center gap-3 rounded-lg border border-[#334155] bg-[#0E111B] px-3 py-2 text-sm text-white">
          <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg bg-[#11162A]">
            {metadata?.logoURL ? (
              <Image
                src={metadata.logoURL}
                alt={metadata?.name || 'Selected account'}
                width={40}
                height={40}
                className="h-full w-full object-contain"
                unoptimized
              />
            ) : (
              <span className="text-[10px] text-slate-400">No logo</span>
            )}
          </div>
          <div className="min-w-0">
            <div className="truncate font-medium text-white">{metadata?.name || 'Unnamed account'}</div>
            <div className="truncate text-xs text-slate-400">{metadata?.symbol || 'No symbol'}</div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <article className={className}>
      <LabCardHeader
        title="Active Sponsor Coin Signer Account"
        isExpanded={isExpanded}
        onToggleExpand={onToggleExpand}
      />

      <div className="mt-4">
        <div className="grid grid-cols-1 gap-3">
          <section className="rounded-xl border border-[#31416F] bg-[#0B1220] p-4">
            <h3 className="text-center text-lg font-semibold text-[#5981F3]">Active Sponsor Coin Signer Account</h3>
            <div className="mt-4 grid grid-cols-1 gap-3">
              <div
                className={`grid grid-cols-1 gap-3${
                  details.showSignerAccountDetails ? ' rounded-xl border border-[#31416F] bg-[#0B1220] p-3' : ''
                }`}
              >
                <label className="grid items-center gap-3 md:grid-cols-[auto_minmax(0,1fr)]">
                  <button
                    type="button"
                    onClick={() => details.setShowSignerAccountDetails((prev) => !prev)}
                    className="w-fit text-left text-sm font-semibold text-[#8FA8FF] transition-colors hover:text-white"
                    title="Toggle signer account details"
                  >
                    spCoin Owner
                  </button>
                  <input
                    className={inputStyle}
                    readOnly
                    value={details.displayedSignerAccountAddress}
                    placeholder="Selected account address"
                  />
                </label>
                {details.showSignerAccountDetails ? (
                  <>
                    <div className="grid items-center gap-3 md:grid-cols-[auto_minmax(0,1fr)]">
                      <span className="text-sm font-semibold text-[#8FA8FF]">Metadata</span>
                      <div className="flex items-center gap-3 rounded-lg border border-[#334155] bg-[#0E111B] px-3 py-2 text-sm text-white">
                        <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg bg-[#11162A]">
                          {details.displayedSignerAccountMetadata?.logoURL ? (
                            <Image
                              src={details.displayedSignerAccountMetadata.logoURL}
                              alt={details.displayedSignerAccountMetadata?.name || 'Selected signer account'}
                              width={40}
                              height={40}
                              className="h-full w-full object-contain"
                              unoptimized
                            />
                          ) : (
                            <span className="text-[10px] text-slate-400">No logo</span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="truncate font-medium text-white">
                            {details.displayedSignerAccountMetadata?.name || 'Unnamed account'}
                          </div>
                          <div className="truncate text-xs text-slate-400">
                            {details.displayedSignerAccountMetadata?.symbol || 'No symbol'}
                          </div>
                        </div>
                      </div>
                    </div>
                    {details.mode === 'hardhat' ? (
                      <label className="grid items-center gap-3 md:grid-cols-[auto_minmax(0,1fr)]">
                        <span className="text-sm font-semibold text-[#8FA8FF]">Private Key</span>
                        <input
                          className={inputStyle}
                          readOnly
                          value={details.selectedVersionSignerKey}
                          placeholder="Signer key for selected deployed version"
                        />
                      </label>
                    ) : null}
                  </>
                ) : null}
              </div>
              <div
                className={`grid grid-cols-1 gap-3${
                  showWriteSenderDetails ? ' rounded-xl border border-[#31416F] bg-[#0B1220] p-3' : ''
                }`}
              >
                <label className="grid items-center gap-3 md:grid-cols-[auto_minmax(0,1fr)]">
                  <button
                    type="button"
                    onClick={() => setShowWriteSenderDetails((prev) => !prev)}
                    className="w-fit text-left text-sm font-semibold text-[#8FA8FF] transition-colors hover:text-white"
                    title="Toggle msg.sender details"
                  >
                    msg.sender
                  </button>
                  {details.mode === 'hardhat' ? (
                    <AccountDropdownInput
                      className={inputStyle}
                      value={details.selectedWriteSenderAddress}
                      onChange={(value) => details.setSelectedWriteSenderAddress(normalizeAccountValue(value))}
                      placeholder="Select account"
                      dataFieldId="network-signer-msg-sender"
                      options={accountOptions}
                    />
                  ) : (
                    <input
                      className={inputStyle}
                      readOnly
                      value={details.writeSenderDisplayValue}
                      placeholder="Connect MetaMask"
                    />
                  )}
                </label>
                {showWriteSenderDetails ? renderAccountMetadata(details.selectedWriteSenderAddress) : null}
              </div>
            </div>
          </section>
          <section className="rounded-xl border border-[#31416F] bg-[#0B1220] p-4">
            <h3 className="text-center text-lg font-semibold text-[#5981F3]">SponsorCoin Account Management</h3>
            <div className="mt-4 grid grid-cols-1 gap-3">
            <div className="flex flex-wrap items-center justify-end gap-6">
              <label className="flex items-center gap-2 text-sm font-semibold text-[#8FA8FF]">
                <input
                  type="radio"
                  name="sponsorcoin-account-action"
                  checked={isAddAction}
                  onChange={() => setSelectedAccountAction('add')}
                  className="h-3.5 w-3.5 appearance-none rounded-full border border-red-600 bg-red-600 checked:border-green-500 checked:bg-green-500"
                />
                <span>Add Account</span>
              </label>
              <label className="flex items-center gap-2 text-sm font-semibold text-[#8FA8FF]">
                <input
                  type="radio"
                  name="sponsorcoin-account-action"
                  checked={!isAddAction}
                  onChange={() => setSelectedAccountAction('delete')}
                  className="h-3.5 w-3.5 appearance-none rounded-full border border-red-600 bg-red-600 checked:border-green-500 checked:bg-green-500"
                />
                <span>Delete Account</span>
              </label>
            </div>
            <div className="grid items-center gap-3 md:grid-cols-[auto_minmax(0,1fr)_auto]">
              <span className="text-sm font-semibold text-[#8FA8FF]">Account Type</span>
              <select
                value={accountManagement.selectedSponsorCoinAccountRole}
                onChange={(event) =>
                  accountManagement.setSelectedSponsorCoinAccountRole(
                    event.target.value as 'sponsor' | 'recipient' | 'agent',
                  )
                }
                className={inputStyle}
                aria-label="SponsorCoin account type"
              >
                <option value="sponsor">Sponsor</option>
                <option value="recipient">Recipient</option>
                <option value="agent">Agent</option>
              </select>
              <button
                type="button"
                onClick={() => void accountManagement.onExecuteAccountAction(isAddAction ? 'add' : 'delete')}
                className={actionButtonClassName}
                title={activeValidation.message}
              >
                {activeButtonLabel}
              </button>
            </div>
            <div
              className={`grid grid-cols-1 gap-3${
                showManagedRoleMetadata ? ' rounded-xl border border-[#31416F] bg-[#0B1220] p-3' : ''
              }`}
            >
              <div className="grid items-center gap-3 md:grid-cols-[auto_minmax(0,1fr)]">
                <button
                  type="button"
                  onClick={() => setShowManagedRoleMetadata((prev) => !prev)}
                  className="w-fit text-left text-sm font-semibold text-[#8FA8FF] transition-colors hover:text-white"
                  title={`Toggle ${roleLabel} metadata`}
                >
                  {roleLabel}
                </button>
                {details.mode === 'hardhat' ? (
                  <AccountDropdownInput
                    className={inputStyle}
                    value={accountManagement.managedRoleAccountAddress}
                    onChange={(value) => accountManagement.setManagedRoleAccountAddress(normalizeAccountValue(value))}
                    placeholder={isAddAction ? 'Add Account' : 'Delete Account'}
                    dataFieldId={`network-signer-${selectedAccountAction}-account`}
                    options={accountOptions}
                  />
                ) : (
                  <input
                    className={inputStyle}
                    value={accountManagement.managedRoleAccountAddress}
                    onChange={(e) => accountManagement.setManagedRoleAccountAddress(e.target.value)}
                    placeholder={isAddAction ? 'Add Account' : 'Delete Account'}
                  />
                )}
              </div>
              {showManagedRoleMetadata ? renderAccountMetadata(accountManagement.managedRoleAccountAddress) : null}
            </div>
            {accountManagement.selectedSponsorCoinAccountRole === 'agent' ? (
              <>
                <div
                  className={`grid grid-cols-1 gap-3${
                    showManagedRecipientMetadata ? ' rounded-xl border border-[#31416F] bg-[#0B1220] p-3' : ''
                  }`}
                >
                  <div className="grid items-center gap-3 md:grid-cols-[auto_minmax(0,1fr)]">
                    <button
                      type="button"
                      onClick={() => setShowManagedRecipientMetadata((prev) => !prev)}
                      className="w-fit text-left text-sm font-semibold text-[#8FA8FF] transition-colors hover:text-white"
                      title="Toggle Recipient metadata"
                    >
                      Recipient
                    </button>
                    {details.mode === 'hardhat' ? (
                      <AccountDropdownInput
                        className={inputStyle}
                        value={accountManagement.managedRecipientKey}
                        onChange={(value) => accountManagement.setManagedRecipientKey(normalizeAccountValue(value))}
                        placeholder="Recipient Account"
                        dataFieldId="network-signer-agent-recipient"
                        options={accountOptions}
                      />
                    ) : (
                      <input
                        className={inputStyle}
                        value={accountManagement.managedRecipientKey}
                        onChange={(e) => accountManagement.setManagedRecipientKey(e.target.value)}
                        placeholder="Recipient Account"
                      />
                    )}
                  </div>
                  {showManagedRecipientMetadata ? renderAccountMetadata(accountManagement.managedRecipientKey) : null}
                </div>
                <div className="grid items-center gap-3 md:grid-cols-[auto_minmax(0,1fr)]">
                  <span className="text-sm font-semibold text-[#8FA8FF]">Recipient Rate Key</span>
                  <div className="grid gap-2">
                    <AccountDropdownInput
                      className={inputStyle}
                      value={accountManagement.managedRecipientRateKey}
                      onChange={(value) => accountManagement.setManagedRecipientRateKey(value)}
                      placeholder="Select or type Recipient Rate Key"
                      dataFieldId="network-signer-agent-recipient-rate-key"
                      options={accountManagement.managedRecipientRateKeyOptions.map((value) => ({
                        value,
                        label: value,
                      }))}
                    />
                    {accountManagement.managedRecipientRateKeyHelpText ? (
                      <span className="text-xs text-slate-300">{accountManagement.managedRecipientRateKeyHelpText}</span>
                    ) : null}
                  </div>
                </div>
              </>
            ) : null}
            {activeValidation.message ? (
              <div
                className={`text-xs ${
                  activeValidation.tone === 'valid'
                    ? 'text-green-300'
                    : activeValidation.tone === 'invalid'
                      ? 'text-red-300'
                      : 'text-slate-400'
                }`}
              >
                {activeValidation.message}
              </div>
            ) : null}
            {accountManagement.sponsorCoinAccountManagementStatus ? (
              <div>
                <span className="mb-2 block text-sm font-semibold text-[#8FA8FF]">Status:</span>
                <div className="break-all rounded-lg border border-[#31416F] bg-[#0B1220] px-3 py-2 text-sm text-slate-300">
                  {accountManagement.sponsorCoinAccountManagementStatus}
                </div>
              </div>
            ) : null}
            </div>
          </section>
        </div>
      </div>
    </article>
  );
}
