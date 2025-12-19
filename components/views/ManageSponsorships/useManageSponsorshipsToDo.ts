// File: @/components/views/ManageSponsorships/useManageSponsorshipsToDo.ts
'use client';

import { useCallback, useRef, useState } from 'react';

import { AccountType, type ExchangeContextTypeMaybe } from '@/lib/structure';

type ToDoMode =
  | 'claimRewards'
  | 'claimAllSponsorshipRewards'
  | 'unstakeAllSponsorships';

/**
 * Centralizes the ToDo overlay + alert message generation so the panel stays smaller.
 */
export function useManageSponsorshipsToDo(ctx: ExchangeContextTypeMaybe) {
  const [showToDo, setShowToDo] = useState<boolean>(false);

  // Keep latest selected account type for the ToDo alert across renders
  const accountTypeRef = useRef<AccountType | 'ALL' | ''>('');

  // Track which ToDo scenario we are showing
  const todoModeRef = useRef<ToDoMode>('claimRewards');

  /** Per-type Claim buttons */
  const claimRewards = useCallback((actType: AccountType) => {
    todoModeRef.current = 'claimRewards';
    setShowToDo(true);
    accountTypeRef.current = actType;
  }, []);

  /** Claim All button (custom message) */
  const claimAllToDo = useCallback(() => {
    todoModeRef.current = 'claimAllSponsorshipRewards';
    setShowToDo(true);
    accountTypeRef.current = 'ALL';
  }, []);

  /** Unstake All Sponsorships button */
  const unstakeAllSponsorships = useCallback(() => {
    todoModeRef.current = 'unstakeAllSponsorships';
    setShowToDo(true);

    // Not strictly required, but keeps refs aligned.
    accountTypeRef.current = AccountType.SPONSOR;
  }, []);

  /** Called when user clicks the red ToDo overlay */
  const doToDo = useCallback(() => {
    setShowToDo(false);

    const connected = ctx?.exchangeContext?.accounts?.activeAccount;

    // eslint-disable-next-line no-alert
    if (todoModeRef.current === 'unstakeAllSponsorships') {
      let msg: string = 'ToDo: (Not Yet Implemented)\n';
      msg += 'Unstake All Sponsorships :\n';
      msg += `For account: ${connected ? connected.address : '(none connected)'}`;
      alert(msg);
      return;
    }

    // eslint-disable-next-line no-alert
    if (todoModeRef.current === 'claimAllSponsorshipRewards') {
      let msg: string = 'ToDo: (Not Yet Implemented)\n';
      msg += 'Claim all Sponsorship Rewards\n';
      msg += `For Account: ${connected ? connected.address : '(none connected)'}`;
      alert(msg);
      return;
    }

    // Default: Claim Rewards
    const sel = String(accountTypeRef.current);
    let msg: string = 'ToDo: (Not Yet Implemented)\n';
    msg += 'Claim: ';
    msg += sel === 'ALL' ? sel : `${sel}(s)`;
    msg += ' Rewards\n';
    msg += `For account: ${connected ? connected.address : '(none connected)'}`;
    // eslint-disable-next-line no-alert
    alert(msg);
  }, [ctx?.exchangeContext?.accounts?.activeAccount]);

  return {
    showToDo,
    claimRewards,
    claimAllToDo,
    unstakeAllSponsorships,
    doToDo,
  };
}


