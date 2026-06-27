import { useCallback, useEffect, useMemo, useState } from 'react';

type SponsorCoinVersionChoice = {
  id: string;
  version: string;
  chainId: number;
  address: string;
  privateKey?: string;
  signerKey?: string;
  deployer?: string;
  name?: string;
  symbol?: string;
};

type Params = {
  contractAddress: string;
  setContractAddress: (value: string) => void;
  sponsorCoinVersionChoices: SponsorCoinVersionChoice[];
};

function normalizeAddress(value: string) {
  return String(value || '').trim().toLowerCase();
}

export function useSponsorCoinLabActiveContract({
  contractAddress,
  setContractAddress,
  sponsorCoinVersionChoices,
}: Params) {
  const [selectedSponsorCoinVersion, setSelectedSponsorCoinVersion] = useState('');

  const selectedSponsorCoinVersionEntry = useMemo(() => {
    if (sponsorCoinVersionChoices.length === 0) return undefined;
    const byId = sponsorCoinVersionChoices.find((entry) => entry.id === selectedSponsorCoinVersion);
    if (byId) return byId;
    const byAddress = sponsorCoinVersionChoices.find(
      (entry) => normalizeAddress(entry.address) === normalizeAddress(contractAddress),
    );
    if (byAddress) return byAddress;
    // Only default to first version when no explicit address is set.
    // If contractAddress is non-empty and matches no known version, it's a custom contract — leave it alone.
    if (!contractAddress.trim()) return sponsorCoinVersionChoices[0];
    return undefined;
  }, [contractAddress, selectedSponsorCoinVersion, sponsorCoinVersionChoices]);

  useEffect(() => {
    if (!selectedSponsorCoinVersionEntry) return;
    if (selectedSponsorCoinVersionEntry.id !== selectedSponsorCoinVersion) {
      setSelectedSponsorCoinVersion(selectedSponsorCoinVersionEntry.id);
    }
    if (normalizeAddress(contractAddress) !== normalizeAddress(selectedSponsorCoinVersionEntry.address)) {
      setContractAddress(selectedSponsorCoinVersionEntry.address);
    }
  }, [contractAddress, selectedSponsorCoinVersion, selectedSponsorCoinVersionEntry, setContractAddress]);

  const selectedSponsorCoinVersionIndex = useMemo(() => {
    if (sponsorCoinVersionChoices.length === 0) return -1;
    const idx = sponsorCoinVersionChoices.findIndex((entry) => entry.id === selectedSponsorCoinVersionEntry?.id);
    return idx >= 0 ? idx : 0;
  }, [selectedSponsorCoinVersionEntry?.id, sponsorCoinVersionChoices]);

  const adjustSponsorCoinVersion = useCallback(
    (direction: 1 | -1) => {
      if (sponsorCoinVersionChoices.length === 0) return;
      const baseIdx = selectedSponsorCoinVersionIndex >= 0 ? selectedSponsorCoinVersionIndex : 0;
      const nextIdx = Math.max(0, Math.min(sponsorCoinVersionChoices.length - 1, baseIdx + direction));
      const next = sponsorCoinVersionChoices[nextIdx];
      if (next) setSelectedSponsorCoinVersion(next.id);
    },
    [selectedSponsorCoinVersionIndex, sponsorCoinVersionChoices],
  );

  const requireContractAddress = useCallback(() => {
    const target = contractAddress.trim();
    if (!target) {
      throw new Error('Contract address is required.');
    }
    return target;
  }, [contractAddress]);

  const selectedVersionSignerKey = useMemo(
    () => String(selectedSponsorCoinVersionEntry?.privateKey || '').trim(),
    [selectedSponsorCoinVersionEntry],
  );
  const selectedVersionSymbol = String(selectedSponsorCoinVersionEntry?.symbol || '');
  const selectedVersionSymbolWidthCh = Math.max(6, selectedVersionSymbol.length + 2);

  return {
    selectedSponsorCoinVersion,
    setSelectedSponsorCoinVersion,
    selectedSponsorCoinVersionEntry,
    selectedSponsorCoinVersionIndex,
    adjustSponsorCoinVersion,
    canIncrementSponsorCoinVersion:
      selectedSponsorCoinVersionIndex >= 0 && selectedSponsorCoinVersionIndex < sponsorCoinVersionChoices.length - 1,
    canDecrementSponsorCoinVersion: selectedSponsorCoinVersionIndex > 0,
    requireContractAddress,
    selectedVersionSignerKey,
    selectedVersionSymbol,
    selectedVersionSymbolWidthCh,
  };
}
