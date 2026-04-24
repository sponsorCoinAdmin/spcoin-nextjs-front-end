import React, { type Dispatch, type SetStateAction } from 'react';
import type { ConnectionMode } from '../scriptBuilder/types';
import LabCardHeader from './LabCardHeader';
import AccountDropdownInput from './AccountDropdownInput';
import AccountSelection from './AccountSelection';
import RateSliderRow from './RateSliderRow';

const NETWORK_SIGNER_UI_STORAGE_KEY = 'spCoinLabNetworkSignerUiKey';

function readStoredNetworkSignerUiState() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(NETWORK_SIGNER_UI_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as {
      selectedAccountAction?: 'add' | 'delete';
      showManagedRoleMetadata?: boolean;
      showManagedRecipientMetadata?: boolean;
      showWriteSenderDetails?: boolean;
      showDefaultSponsorDetails?: boolean;
      showDefaultRecipientDetails?: boolean;
      showDefaultAgentDetails?: boolean;
    };
  } catch {
    return null;
  }
}

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
    defaultSponsorKey: string;
    setDefaultSponsorKey: (value: string) => void;
    defaultRecipientKey: string;
    setDefaultRecipientKey: (value: string) => void;
    defaultAgentKey: string;
    setDefaultAgentKey: (value: string) => void;
    defaultRecipientRateKey: string;
    setDefaultRecipientRateKey: (value: string) => void;
    defaultAgentRateKey: string;
    setDefaultAgentRateKey: (value: string) => void;
    effectiveRecipientRateRange: [number, number];
    effectiveAgentRateRange: [number, number];
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
  const storedUiState = React.useMemo(() => readStoredNetworkSignerUiState(), []);
  const [selectedAccountAction, setSelectedAccountAction] = React.useState<'add' | 'delete'>(
    storedUiState?.selectedAccountAction === 'delete' ? 'delete' : 'add',
  );
  const [showManagedRoleMetadata, setShowManagedRoleMetadata] = React.useState(Boolean(storedUiState?.showManagedRoleMetadata));
  const [showManagedRecipientMetadata, setShowManagedRecipientMetadata] = React.useState(Boolean(storedUiState?.showManagedRecipientMetadata));
  const [showWriteSenderDetails, setShowWriteSenderDetails] = React.useState(Boolean(storedUiState?.showWriteSenderDetails));
  const [showDefaultSponsorDetails, setShowDefaultSponsorDetails] = React.useState(Boolean(storedUiState?.showDefaultSponsorDetails));
  const [showDefaultRecipientDetails, setShowDefaultRecipientDetails] = React.useState(Boolean(storedUiState?.showDefaultRecipientDetails));
  const [showDefaultAgentDetails, setShowDefaultAgentDetails] = React.useState(Boolean(storedUiState?.showDefaultAgentDetails));
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

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(
      NETWORK_SIGNER_UI_STORAGE_KEY,
      JSON.stringify({
        selectedAccountAction,
        showManagedRoleMetadata,
        showManagedRecipientMetadata,
        showWriteSenderDetails,
        showDefaultSponsorDetails,
        showDefaultRecipientDetails,
        showDefaultAgentDetails,
      }),
    );
  }, [
    selectedAccountAction,
    showManagedRoleMetadata,
    showManagedRecipientMetadata,
    showWriteSenderDetails,
    showDefaultSponsorDetails,
    showDefaultRecipientDetails,
    showDefaultAgentDetails,
  ]);

  return (
    <article className={className}>
      <LabCardHeader
        title="Sponsor Coin Accounts"
        isExpanded={isExpanded}
        onToggleExpand={onToggleExpand}
      />

      <div>
        <div className="grid grid-cols-1 gap-3">
          <section className="rounded-xl border border-[#31416F] bg-[#0B1220] p-4">
            <h3 className="text-center text-lg font-semibold text-[#5981F3]">Active Sponsor Coin Accounts</h3>
            <div className="grid grid-cols-1 gap-3">
              <AccountSelection
                label="spCoin Owner"
                title="Toggle signer account details"
                isOpen={details.showSignerAccountDetails}
                onToggle={() => details.setShowSignerAccountDetails((prev) => !prev)}
                control={
                  <input
                    className={inputStyle}
                    readOnly
                    value={details.displayedSignerAccountAddress}
                    placeholder="Selected account address"
                  />
                }
                metadata={details.displayedSignerAccountMetadata}
                extraDetails={
                  details.mode === 'hardhat' ? (
                    <label className="grid items-center gap-3 md:grid-cols-[auto_minmax(0,1fr)]">
                      <span className="text-sm font-semibold text-[#8FA8FF]">Private Key</span>
                      <input
                        className={inputStyle}
                        readOnly
                        value={details.selectedVersionSignerKey}
                        placeholder="Signer key for selected deployed version"
                      />
                    </label>
                  ) : null
                }
              />
              <AccountSelection
                label="msg.sender"
                title="Toggle msg.sender details"
                isOpen={showWriteSenderDetails}
                onToggle={() => setShowWriteSenderDetails((prev) => !prev)}
                control={
                  details.mode === 'hardhat' ? (
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
                  )
                }
                metadata={getMetadataForAddress(details.selectedWriteSenderAddress)}
              />
              <AccountSelection
                label="Sponsor"
                title="Toggle Sponsor metadata"
                isOpen={showDefaultSponsorDetails}
                onToggle={() => setShowDefaultSponsorDetails((prev) => !prev)}
                control={
                  details.mode === 'hardhat' ? (
                    <AccountDropdownInput
                      className={inputStyle}
                      value={accountManagement.defaultSponsorKey}
                      onChange={(value) => accountManagement.setDefaultSponsorKey(normalizeAccountValue(value))}
                      placeholder="Default sponsor account"
                      dataFieldId="network-default-sponsor"
                      options={accountOptions}
                    />
                  ) : (
                    <input
                      className={inputStyle}
                      value={accountManagement.defaultSponsorKey}
                      onChange={(e) => accountManagement.setDefaultSponsorKey(normalizeAccountValue(e.target.value))}
                      placeholder="Default sponsor account"
                    />
                  )
                }
                metadata={getMetadataForAddress(accountManagement.defaultSponsorKey)}
              />
              <AccountSelection
                label="Recipient"
                title="Toggle Recipient metadata"
                isOpen={showDefaultRecipientDetails}
                onToggle={() => setShowDefaultRecipientDetails((prev) => !prev)}
                control={
                  details.mode === 'hardhat' ? (
                    <AccountDropdownInput
                      className={inputStyle}
                      value={accountManagement.defaultRecipientKey}
                      onChange={(value) => accountManagement.setDefaultRecipientKey(normalizeAccountValue(value))}
                      placeholder="Default recipient account"
                      dataFieldId="network-default-recipient"
                      options={accountOptions}
                    />
                  ) : (
                    <input
                      className={inputStyle}
                      value={accountManagement.defaultRecipientKey}
                      onChange={(e) => accountManagement.setDefaultRecipientKey(normalizeAccountValue(e.target.value))}
                      placeholder="Default recipient account"
                    />
                  )
                }
                metadata={getMetadataForAddress(accountManagement.defaultRecipientKey)}
              />
              <RateSliderRow
                label="Recipient Rate"
                value={accountManagement.defaultRecipientRateKey}
                range={accountManagement.effectiveRecipientRateRange}
                onChange={accountManagement.setDefaultRecipientRateKey}
              />
              <AccountSelection
                label="Agent"
                title="Toggle Agent metadata"
                isOpen={showDefaultAgentDetails}
                onToggle={() => setShowDefaultAgentDetails((prev) => !prev)}
                control={
                  details.mode === 'hardhat' ? (
                    <AccountDropdownInput
                      className={inputStyle}
                      value={accountManagement.defaultAgentKey}
                      onChange={(value) => accountManagement.setDefaultAgentKey(normalizeAccountValue(value))}
                      placeholder="Default agent account"
                      dataFieldId="network-default-agent"
                      options={accountOptions}
                    />
                  ) : (
                    <input
                      className={inputStyle}
                      value={accountManagement.defaultAgentKey}
                      onChange={(e) => accountManagement.setDefaultAgentKey(normalizeAccountValue(e.target.value))}
                      placeholder="Default agent account"
                    />
                  )
                }
                metadata={getMetadataForAddress(accountManagement.defaultAgentKey)}
              />
              <RateSliderRow
                label="Agent Rate"
                value={accountManagement.defaultAgentRateKey}
                range={accountManagement.effectiveAgentRateRange}
                onChange={accountManagement.setDefaultAgentRateKey}
              />
            </div>
          </section>
          <section className="rounded-xl border border-[#31416F] bg-[#0B1220] p-4">
            <h3 className="text-center text-lg font-semibold text-[#5981F3]">SponsorCoin Account Management</h3>
            <div className="grid grid-cols-1 gap-3">
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
            <AccountSelection
              label={roleLabel}
              title={`Toggle ${roleLabel} metadata`}
              isOpen={showManagedRoleMetadata}
              onToggle={() => setShowManagedRoleMetadata((prev) => !prev)}
              control={
                details.mode === 'hardhat' ? (
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
                )
              }
              metadata={getMetadataForAddress(accountManagement.managedRoleAccountAddress)}
            />
            {accountManagement.selectedSponsorCoinAccountRole === 'agent' ? (
              <>
                <AccountSelection
                  label="Recipient"
                  title="Toggle Recipient metadata"
                  isOpen={showManagedRecipientMetadata}
                  onToggle={() => setShowManagedRecipientMetadata((prev) => !prev)}
                  control={
                    details.mode === 'hardhat' ? (
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
                    )
                  }
                  metadata={getMetadataForAddress(accountManagement.managedRecipientKey)}
                />
                <RateSliderRow
                  label="Recipient Rate"
                  fieldId="network-signer-agent-recipient-rate-key"
                  range={accountManagement.effectiveRecipientRateRange}
                  value={accountManagement.managedRecipientRateKey || accountManagement.effectiveRecipientRateRange[0]}
                  onChange={(value) => accountManagement.setManagedRecipientRateKey(value)}
                  helpText={accountManagement.managedRecipientRateKeyHelpText}
                />
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
