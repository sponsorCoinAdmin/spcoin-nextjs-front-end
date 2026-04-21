'use client';

import { useCallback } from 'react';
import type { ControllerParamDef } from '../types';
import { normalizeAddressValue, normalizeParamLabel } from '../utils';

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
    (params: ControllerParamDef[]) =>
      params.map((param) => {
        const label = normalizeParamLabel(param.label);
        if (label === 'msg.sender') return selectedWriteSenderAddress;
        if (label === 'sponsor key' || label === 'sponsor account') return sponsorAccountAddress;
        if (label === 'recipient key' || label === 'recipient account') return recipientAccountAddress;
        if (label === 'agent key' || label === 'agent account' || label === 'account agent key') {
          return agentAccountAddress;
        }
        if (label === 'recipient rate key' || label === 'recipient rate') {
          return String(defaultRecipientRateKey || effectiveRecipientRateRange[0] || '');
        }
        if (label === 'agent rate key' || label === 'agent rate') {
          return String(defaultAgentRateKey || effectiveAgentRateRange[0] || '');
        }
        return '';
      }),
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
