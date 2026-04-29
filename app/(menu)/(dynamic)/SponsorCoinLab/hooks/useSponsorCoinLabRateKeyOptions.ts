import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import type { MethodDef } from '../jsonMethods/shared/types';
import { createSpCoinLibraryAccess, type SpCoinContractAccess } from '../jsonMethods/shared';
import type { MethodPanelMode } from '../scriptBuilder/types';

interface Params {
  activeContractAddress: string;
  methodPanelMode: MethodPanelMode;
  activeSpCoinWriteDef: MethodDef;
  selectedWriteSenderAddress: string;
  spWriteParams: string[];
  setSpWriteParams: Dispatch<SetStateAction<string[]>>;
  requireContractAddress: () => string;
  ensureReadRunner: () => Promise<any>;
  useLocalSpCoinAccessPackage: boolean;
}

function isAddress(value: string) {
  return /^0[xX][0-9a-fA-F]{40}$/.test(value);
}

export function useSponsorCoinLabRateKeyOptions({
  activeContractAddress,
  methodPanelMode,
  activeSpCoinWriteDef,
  selectedWriteSenderAddress,
  spWriteParams,
  setSpWriteParams,
  requireContractAddress,
  ensureReadRunner,
  useLocalSpCoinAccessPackage,
}: Params) {
  const [recipientRateKeyOptions, setRecipientRateKeyOptions] = useState<string[]>([]);
  const [agentRateKeyOptions, setAgentRateKeyOptions] = useState<string[]>([]);
  const [recipientRateKeyHelpText, setRecipientRateKeyHelpText] = useState('');
  const [agentRateKeyHelpText, setAgentRateKeyHelpText] = useState('');

  useEffect(() => {
    setRecipientRateKeyOptions([]);
    setAgentRateKeyOptions([]);
    setRecipientRateKeyHelpText('');
    setAgentRateKeyHelpText('');
  }, [activeContractAddress]);

  useEffect(() => {
    let cancelled = false;

    const loadRateKeyOptions = async () => {
      if (methodPanelMode !== 'spcoin_write') {
        if (!cancelled) {
          setRecipientRateKeyOptions([]);
          setAgentRateKeyOptions([]);
          setRecipientRateKeyHelpText('');
          setAgentRateKeyHelpText('');
        }
        return;
      }

      const findValue = (labels: string[]) => {
        const idx = activeSpCoinWriteDef.params.findIndex((param) => labels.includes(param.label));
        return idx >= 0 ? String(spWriteParams[idx] || '').trim() : '';
      };
      const findParamIndex = (labels: string[]) =>
        activeSpCoinWriteDef.params.findIndex((param) => labels.includes(param.label));
      const hasRecipientRateField = activeSpCoinWriteDef.params.some((param) =>
        ['Recipient Rate Key', 'Recipient Rate'].includes(param.label),
      );
      const hasAgentRateField = activeSpCoinWriteDef.params.some((param) =>
        ['Agent Rate Key', 'Agent Rate'].includes(param.label),
      );
      const sponsorKey =
        findValue(['Sponsor Key', 'Sponsor Account']) || String(selectedWriteSenderAddress || '').trim();
      const recipientKey = findValue(['Recipient Key', 'Recipient Account']);
      const recipientRateKey = findValue(['Recipient Rate Key', 'Recipient Rate']);
      const agentKey = findValue(['Agent Key', 'Agent Account']);

      if (!hasRecipientRateField || !isAddress(sponsorKey) || !isAddress(recipientKey)) {
        if (!cancelled) {
          setRecipientRateKeyOptions([]);
          setRecipientRateKeyHelpText(
            hasRecipientRateField
              ? 'Select msg.sender/Sponsor and Recipient first to load Recipient Rate Keys.'
              : '',
          );
        }
      } else {
        try {
          const target = requireContractAddress();
          const runner = await ensureReadRunner();
          const access = createSpCoinLibraryAccess(
            target,
            runner,
            undefined,
            useLocalSpCoinAccessPackage ? 'local' : 'node_modules',
          );
          const rates =
            (await (access.contract as SpCoinContractAccess).getRecipientRateList?.(sponsorKey, recipientKey)) ?? [];
          if (!cancelled) {
            const normalizedRates = rates.map((value) => String(value));
            setRecipientRateKeyOptions(normalizedRates);
            setRecipientRateKeyHelpText(
              rates.length > 0
                ? 'Select a Recipient Rate Key from the contract list.'
                : 'No Recipient Rate Keys found for this sponsor/recipient pair.',
            );
            const recipientRateIdx = findParamIndex(['Recipient Rate Key', 'Recipient Rate']);
            if (
              recipientRateIdx >= 0 &&
              !String(spWriteParams[recipientRateIdx] || '').trim() &&
              normalizedRates.length > 0
            ) {
              setSpWriteParams((prev) => {
                if (String(prev[recipientRateIdx] || '').trim()) return prev;
                const next = [...prev];
                next[recipientRateIdx] = normalizedRates[0];
                return next;
              });
            }
          }
        } catch {
          if (!cancelled) {
            setRecipientRateKeyOptions([]);
            setRecipientRateKeyHelpText('Unable to load Recipient Rate Keys from the active contract.');
          }
        }
      }

      if (!hasAgentRateField || !isAddress(sponsorKey) || !isAddress(recipientKey) || !recipientRateKey || !isAddress(agentKey)) {
        if (!cancelled) {
          setAgentRateKeyOptions([]);
          setAgentRateKeyHelpText(
            hasAgentRateField
              ? 'Select Sponsor, Recipient, Recipient Rate, and Agent first to load Agent Rate Keys.'
              : '',
          );
        }
        return;
      }

      try {
        const target = requireContractAddress();
        const runner = await ensureReadRunner();
        const access = createSpCoinLibraryAccess(
          target,
          runner,
          undefined,
          useLocalSpCoinAccessPackage ? 'local' : 'node_modules',
        );
        const rates = (await (access.contract as SpCoinContractAccess).getAgentRateList?.(
          sponsorKey,
          recipientKey,
          recipientRateKey,
          agentKey,
        )) as (string | bigint)[] | undefined;
        if (!cancelled) {
          const normalizedRates = (rates ?? []).map((value) => String(value));
          setAgentRateKeyOptions(normalizedRates);
          setAgentRateKeyHelpText(
            (rates ?? []).length > 0
              ? 'Select an Agent Rate Key from the contract list.'
              : 'No Agent Rate Keys found for this sponsor/recipient/agent combination.',
          );
          const agentRateIdx = findParamIndex(['Agent Rate Key', 'Agent Rate']);
          if (
            agentRateIdx >= 0 &&
            !String(spWriteParams[agentRateIdx] || '').trim() &&
            normalizedRates.length > 0
          ) {
            setSpWriteParams((prev) => {
              if (String(prev[agentRateIdx] || '').trim()) return prev;
              const next = [...prev];
              next[agentRateIdx] = normalizedRates[0];
              return next;
            });
          }
        }
      } catch {
        if (!cancelled) {
          setAgentRateKeyOptions([]);
          setAgentRateKeyHelpText('Unable to load Agent Rate Keys from the active contract.');
        }
      }
    };

    void loadRateKeyOptions();
    return () => {
      cancelled = true;
    };
  }, [
    activeSpCoinWriteDef.params,
    ensureReadRunner,
    methodPanelMode,
    requireContractAddress,
    selectedWriteSenderAddress,
    spWriteParams,
    setSpWriteParams,
    useLocalSpCoinAccessPackage,
  ]);

  return {
    recipientRateKeyOptions,
    agentRateKeyOptions,
    recipientRateKeyHelpText,
    agentRateKeyHelpText,
  };
}
