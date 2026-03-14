import React, { type Dispatch, type SetStateAction } from 'react';
import Image from 'next/image';
import type { ConnectionMode } from '../scriptBuilder/types';
import LabCardHeader from './LabCardHeader';

type Props = {
  className: string;
  isExpanded: boolean;
  onToggleExpand: () => void;
  inputStyle: string;
  details: {
    showSignerAccountDetails: boolean;
    setShowSignerAccountDetails: Dispatch<SetStateAction<boolean>>;
    displayedSignerAccountAddress: string;
    displayedSignerAccountMetadata?: {
      logoURL?: string;
      name?: string;
      symbol?: string;
    };
    mode: ConnectionMode;
    selectedVersionSignerKey: string;
  };
  accountManagement: {
    addSignerAccount: () => Promise<void>;
    deleteSignerAccount: () => Promise<void>;
    accountActionLabelClassName: (tone: 'neutral' | 'invalid' | 'valid') => string;
    addAccountValidation: { tone: 'neutral' | 'invalid' | 'valid'; message: string };
    addAccountInput: string;
    setAddAccountInput: (value: string) => void;
    deleteAccountValidation: { tone: 'neutral' | 'invalid' | 'valid'; message: string };
    deleteAccountInput: string;
    setDeleteAccountInput: (value: string) => void;
    signerAccountStatus: string;
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
  return (
    <article className={className}>
      <LabCardHeader
        title="Active Sponsor Coin Signer Account"
        isExpanded={isExpanded}
        onToggleExpand={onToggleExpand}
      />

      <div className="mt-4">
        <div className="grid grid-cols-1 gap-3">
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
                Public Account Key
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
          <div className="grid grid-cols-1 gap-3">
            <div className="border-t border-[#2B3A67] pt-3">
              <h3 className="text-center text-lg font-semibold text-[#5981F3]">Test Wallet Account Management</h3>
            </div>
            <div className="grid items-center gap-3 md:grid-cols-[auto_minmax(0,1fr)]">
              <button
                type="button"
                onClick={() => void accountManagement.addSignerAccount()}
                className={`w-fit text-left text-sm font-semibold transition-colors ${accountManagement.accountActionLabelClassName(accountManagement.addAccountValidation.tone)}`}
                title={accountManagement.addAccountValidation.message}
              >
                Add Account
              </button>
              <input
                className={inputStyle}
                value={accountManagement.addAccountInput}
                onChange={(e) => accountManagement.setAddAccountInput(e.target.value)}
                placeholder="Enter an account address to add"
              />
            </div>
            {accountManagement.addAccountValidation.message ? (
              <div
                className={`text-xs ${
                  accountManagement.addAccountValidation.tone === 'valid'
                    ? 'text-green-300'
                    : accountManagement.addAccountValidation.tone === 'invalid'
                      ? 'text-red-300'
                      : 'text-slate-400'
                }`}
              >
                {accountManagement.addAccountValidation.message}
              </div>
            ) : null}
            <div className="grid items-center gap-3 md:grid-cols-[auto_minmax(0,1fr)]">
              <button
                type="button"
                onClick={() => void accountManagement.deleteSignerAccount()}
                className={`w-fit text-left text-sm font-semibold transition-colors ${accountManagement.accountActionLabelClassName(accountManagement.deleteAccountValidation.tone)}`}
                title={accountManagement.deleteAccountValidation.message}
              >
                Delete Account
              </button>
              <input
                className={inputStyle}
                value={accountManagement.deleteAccountInput}
                onChange={(e) => accountManagement.setDeleteAccountInput(e.target.value)}
                placeholder="Enter an account address to delete"
              />
            </div>
            {accountManagement.deleteAccountValidation.message ? (
              <div
                className={`text-xs ${
                  accountManagement.deleteAccountValidation.tone === 'valid'
                    ? 'text-green-300'
                    : accountManagement.deleteAccountValidation.tone === 'invalid'
                      ? 'text-red-300'
                      : 'text-slate-400'
                }`}
              >
                {accountManagement.deleteAccountValidation.message}
              </div>
            ) : null}
            {accountManagement.signerAccountStatus ? (
              <div>
                <span className="mb-2 block text-sm font-semibold text-[#8FA8FF]">Status:</span>
                <div className="break-all rounded-lg border border-[#31416F] bg-[#0B1220] px-3 py-2 text-sm text-slate-300">
                  {accountManagement.signerAccountStatus}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}
