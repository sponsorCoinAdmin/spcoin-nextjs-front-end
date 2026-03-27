'use client';

import React from 'react';

export type WalletAccountSelectionValue = {
  source: 'ec2-base' | 'metamask';
  accountNumber: number;
};

type WalletAccountSelectionProps = {
  className?: string;
  showHardhatAccountSelector: boolean;
  hardhatSignerAvailable: boolean;
  hardhatDeploymentAccountCount: number;
  disabled?: boolean;
  value: WalletAccountSelectionValue;
  onChange: (next: WalletAccountSelectionValue) => void | Promise<void>;
};

export default function WalletAccountSelection({
  className = '',
  showHardhatAccountSelector,
  hardhatSignerAvailable,
  hardhatDeploymentAccountCount,
  disabled = false,
  value,
  onChange,
}: WalletAccountSelectionProps) {
  return (
    <div className={`flex w-full items-center justify-between gap-4 py-0 text-sm ${className}`.trim()}>
      <div className="flex min-w-0 flex-1 items-center justify-start">
        {showHardhatAccountSelector ? (
          <label className="flex min-w-[12rem] justify-start text-[#8FA8FF]">
            <div className="flex items-center justify-start gap-2">
              <span className="text-sm font-semibold text-[#8FA8FF]">Account #</span>
              <select
                aria-label="Account #"
                title="Hardhat Deployment Account Number"
                value={value.accountNumber}
                disabled={disabled}
                onChange={(event) => {
                  void onChange({
                    ...value,
                    accountNumber: Number(event.target.value),
                  });
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
        ) : (
          <div className="min-h-[1.55rem] min-w-[12rem]" aria-hidden="true" />
        )}
      </div>
      <div className="flex min-w-0 flex-1 items-center justify-end gap-8">
        {hardhatSignerAvailable ? (
          <label className="flex items-center gap-2 whitespace-nowrap text-[#8FA8FF]">
            <input
              type="radio"
              name="edit-account-signer-source"
              value="ec2-base"
              checked={value.source === 'ec2-base'}
              disabled={disabled}
              onChange={() => {
                void onChange({
                  ...value,
                  source: 'ec2-base',
                });
              }}
              className="h-3.5 w-3.5 shrink-0 appearance-none rounded-full border border-red-600 bg-red-600 checked:border-green-500 checked:bg-green-500"
            />
            <span>Hardhat "Ec2-BASE"</span>
          </label>
        ) : null}
        <label className="flex items-center gap-2 whitespace-nowrap text-[#8FA8FF]">
          <input
            type="radio"
            name="edit-account-signer-source"
            value="metamask"
            checked={value.source === 'metamask'}
            disabled={disabled}
            onChange={() => {
              void onChange({
                ...value,
                source: 'metamask',
              });
            }}
            className="h-3.5 w-3.5 shrink-0 appearance-none rounded-full border border-red-600 bg-red-600 checked:border-green-500 checked:bg-green-500"
          />
          <span>MetaMask</span>
        </label>
      </div>
    </div>
  );
}
