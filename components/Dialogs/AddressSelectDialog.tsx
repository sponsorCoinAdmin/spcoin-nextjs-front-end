// File: components/Dialogs/AddressSelectDialog.tsx

'use client';

import { useMemo } from 'react';
import AddressSelect from '@/components/Dialogs/AddressSelect';
import BaseModalDialog from '@/components/Dialogs/BaseModelDialog';
import {
  CONTAINER_TYPE,
  InputState,
  FEED_TYPE,
  TokenContract,
  WalletAccount,
} from '@/lib/structure/types';
import {
  useBuyTokenContract,
  useSellTokenContract,
  useContainerType,
} from '@/lib/context/contextHooks';

// Generic Address Select Dialog
interface BaseProps<T> {
  showDialog: boolean;
  setShowDialog: (show: boolean) => void;
  onSelect: (item: T, state: InputState) => void;
  title: string;
  feedType: FEED_TYPE;
  inputPlaceholder: string;
  duplicateMessage?: string;
  showDuplicateCheck?: boolean;
}

export default function AddressSelectDialog<T extends { address: string; name?: string; symbol?: string }>(
  {
    showDialog,
    setShowDialog,
    onSelect,
    title,
    feedType,
    inputPlaceholder,
    duplicateMessage,
    showDuplicateCheck = false,
  }: BaseProps<T>
) {
  return (
    <BaseModalDialog
      id="AddressSelectDialog"
      showDialog={showDialog}
      setShowDialog={setShowDialog}
      title={title}
    >
      <AddressSelect<T>
        feedType={feedType}
        inputPlaceholder={inputPlaceholder}
        closeDialog={() => setShowDialog(false)}
        onSelect={(item, state) => {
          console.debug('🎯 [AddressSelectDialog] onSelect triggered', { item, state });
          if (state === InputState.CLOSE_INPUT) {
            onSelect(item, state);
          }
        }}
        duplicateMessage={duplicateMessage}
        showDuplicateCheck={showDuplicateCheck}
      />
    </BaseModalDialog>
  );
}

// Token Dialog Wrapper
export function TokenDialogWrapper(props: {
  showDialog: boolean;
  setShowDialog: (show: boolean) => void;
  onSelect: (token: TokenContract, state: InputState) => void;
}) {
  const [containerType] = useContainerType();
  const [, setSellTokenContract] = useSellTokenContract();
  const [, setBuyTokenContract] = useBuyTokenContract();

  const title = useMemo(
    () =>
      containerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER
        ? 'Select a Token to Sell'
        : 'Select a Token to Buy',
    [containerType]
  );

  const setTokenInContext =
    containerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER
      ? setSellTokenContract
      : setBuyTokenContract;

  return (
    <AddressSelectDialog<TokenContract>
      {...props}
      title={title}
      feedType={FEED_TYPE.TOKEN_LIST}
      inputPlaceholder="Type or paste token address"
      duplicateMessage={
        containerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER
          ? 'Sell Address Cannot Be the Same as Buy Address'
          : 'Buy Address Cannot Be the Same as Sell Address'
      }
      showDuplicateCheck
      onSelect={(token, state) => {
        console.debug('✅ [TokenDialogWrapper] selected token', token);
        if (state === InputState.CLOSE_INPUT) {
          setTokenInContext(token);
          props.onSelect(token, state);
        }
      }}
    />
  );
}

// Recipient Dialog Wrapper
export function RecipientDialogWrapper(props: {
  showDialog: boolean;
  setShowDialog: (show: boolean) => void;
  onSelect: (wallet: WalletAccount, state: InputState) => void;
}) {
  return (
    <AddressSelectDialog<WalletAccount>
      {...props}
      title="Select a Recipient"
      feedType={FEED_TYPE.RECIPIENT_ACCOUNTS}
      inputPlaceholder="Paste recipient wallet address"
      onSelect={(wallet, state) => {
        console.debug('✅ [RecipientDialogWrapper] selected wallet', wallet);
        if (state === InputState.CLOSE_INPUT) {
          props.onSelect(wallet, state);
        }
      }}
    />
  );
}
