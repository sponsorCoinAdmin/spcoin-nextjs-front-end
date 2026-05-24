'use client';

import { useCallback } from 'react';
import { AbiCoder, getAddress, id, keccak256, ZeroAddress } from 'ethers';
import type { ControllerParamDef } from '../types';
import { normalizeAddressValue, normalizeParamLabel } from '../utils';

const abiCoder = AbiCoder.defaultAbiCoder();
const RECIPIENT_RATE_TRANSACTION_SET_DOMAIN = id('RECIPIENT_RATE');
const AGENT_RATE_TRANSACTION_SET_DOMAIN = id('AGENT_RATE');

function isZeroOrBlankAddress(value: string) {
  const trimmed = String(value || '').trim();
  return !trimmed || normalizeAddressValue(trimmed) === ZeroAddress;
}

function buildRateTransactionSetKey({
  sponsorKey,
  recipientKey,
  recipientRateKey,
  agentKey,
  agentRateKey,
}: {
  sponsorKey: string;
  recipientKey: string;
  recipientRateKey: string;
  agentKey: string;
  agentRateKey: string;
}) {
  if (!sponsorKey || !recipientKey || !recipientRateKey) return '';
  try {
    const normalizedSponsorKey = getAddress(sponsorKey);
    const normalizedRecipientKey = getAddress(recipientKey);
    if (isZeroOrBlankAddress(agentKey) || !String(agentRateKey || '').trim()) {
      return keccak256(abiCoder.encode(
        ['bytes32', 'address', 'address', 'uint256'],
        [
          RECIPIENT_RATE_TRANSACTION_SET_DOMAIN,
          normalizedSponsorKey,
          normalizedRecipientKey,
          BigInt(recipientRateKey),
        ],
      ));
    }
    return keccak256(abiCoder.encode(
      ['bytes32', 'address', 'address', 'uint256', 'address', 'uint256'],
      [
        AGENT_RATE_TRANSACTION_SET_DOMAIN,
        normalizedSponsorKey,
        normalizedRecipientKey,
        BigInt(recipientRateKey),
        getAddress(agentKey),
        BigInt(agentRateKey),
      ],
    ));
  } catch {
    return '';
  }
}

type Params = {
  selectedWriteSenderAddress: string;
  sponsorAccountAddress: string;
  recipientAccountAddress: string;
  agentAccountAddress: string;
  defaultRecipientRateKey: string;
  defaultAgentRateKey: string;
  effectiveRecipientRateRange: [number, number];
  effectiveAgentRateRange: [number, number];
  setSelectedWriteSenderAddress: (value: string) => void;
  setDefaultSponsorKey: (value: string) => void;
  setDefaultRecipientKey: (value: string) => void;
  setDefaultAgentKey: (value: string) => void;
  setDefaultRecipientRateKey: (value: string) => void;
  setDefaultAgentRateKey: (value: string) => void;
};

export function useControllerMethodAccountSync({
  selectedWriteSenderAddress,
  sponsorAccountAddress,
  recipientAccountAddress,
  agentAccountAddress,
  defaultRecipientRateKey,
  defaultAgentRateKey,
  effectiveRecipientRateRange,
  effectiveAgentRateRange,
  setSelectedWriteSenderAddress,
  setDefaultSponsorKey,
  setDefaultRecipientKey,
  setDefaultAgentKey,
  setDefaultRecipientRateKey,
  setDefaultAgentRateKey,
}: Params) {
  const populateMethodParamsFromActiveAccounts = useCallback(
    (params: ControllerParamDef[]) => {
      const sponsorKey = sponsorAccountAddress;
      const recipientKey = recipientAccountAddress;
      const recipientRateKey = String(defaultRecipientRateKey || effectiveRecipientRateRange[0] || '');
      const agentKey = agentAccountAddress;
      const agentRateKey = String(defaultAgentRateKey || effectiveAgentRateRange[0] || '');
      const setBucketRateKey = buildRateTransactionSetKey({
        sponsorKey,
        recipientKey,
        recipientRateKey,
        agentKey,
        agentRateKey,
      });
      return params.map((param) => {
        const label = normalizeParamLabel(param.label);
        if (label === 'msg.sender') return selectedWriteSenderAddress;
        if (label === 'sponsor key' || label === 'sponsor account') return sponsorKey;
        if (label === 'recipient key' || label === 'recipient account') return recipientKey;
        if (label === 'agent key' || label === 'agent account' || label === 'account agent key') {
          return agentKey;
        }
        if (label === 'recipient rate key' || label === 'recipient rate') {
          return recipientRateKey;
        }
        if (label === 'agent rate key' || label === 'agent rate') {
          return agentRateKey;
        }
        if (label === 'set bucket rate key') {
          return setBucketRateKey;
        }
        return '';
      });
    },
    [
      agentAccountAddress,
      defaultAgentRateKey,
      defaultRecipientRateKey,
      effectiveAgentRateRange,
      effectiveRecipientRateRange,
      recipientAccountAddress,
      selectedWriteSenderAddress,
      sponsorAccountAddress,
    ],
  );

  const populateActiveAccountsFromMethodParams = useCallback(
    (params: ControllerParamDef[], values: string[]) => {
      const findValue = (...labels: string[]) => {
        const labelSet = new Set(labels.map((label) => normalizeParamLabel(label)));
        const index = params.findIndex((param) => labelSet.has(normalizeParamLabel(param.label)));
        return index >= 0 ? String(values[index] || '').trim() : '';
      };

      const sender = normalizeAddressValue(findValue('msg.sender'));
      const sponsorKey = normalizeAddressValue(findValue('Sponsor Key', 'Sponsor Account'));
      const recipientKey = normalizeAddressValue(findValue('Recipient Key', 'Recipient Account'));
      const agentKey = normalizeAddressValue(findValue('Agent Key', 'Agent Account', 'Account Agent Key'));
      const recipientRateKey = String(findValue('Recipient Rate Key', 'Recipient Rate')).trim();
      const agentRateKey = String(findValue('Agent Rate Key', 'Agent Rate')).trim();

      if (sender) setSelectedWriteSenderAddress(sender);
      if (sponsorKey) setDefaultSponsorKey(sponsorKey);
      if (recipientKey) setDefaultRecipientKey(recipientKey);
      if (agentKey) setDefaultAgentKey(agentKey);
      if (recipientRateKey) setDefaultRecipientRateKey(recipientRateKey);
      if (agentRateKey) setDefaultAgentRateKey(agentRateKey);
    },
    [
      setDefaultAgentKey,
      setDefaultAgentRateKey,
      setDefaultRecipientKey,
      setDefaultRecipientRateKey,
      setDefaultSponsorKey,
      setSelectedWriteSenderAddress,
    ],
  );

  return {
    populateMethodParamsFromActiveAccounts,
    populateActiveAccountsFromMethodParams,
  };
}
