// File: components/containers/AssetSelectScrollContainer.tsx

'use client';

import { useCallback } from 'react';
import AddressSelect from '@/components/shared/AddressSelect';
import styles from '@/styles/Modal.module.css';
import {
  CONTAINER_TYPE,
  InputState,
  FEED_TYPE,
  TokenContract,
  WalletAccount,
} from '@/lib/structure';

// ---------------------------------------------
// Base Modal Structure
// ---------------------------------------------

interface BaseProps<T> {
  setShowDialog: (show: boolean) => void;
  onSelect: (item: T, state: InputState) => void;
  title: string;
  feedType: FEED_TYPE;
  inputPlaceholder: string;
  duplicateMessage?: string;
  showDuplicateCheck?: boolean;
  containerType?: CONTAINER_TYPE;
}

function BaseModalDialog({
  id,
  setShowDialog,
  title,
  children,
}: {
  id: string;
  setShowDialog: (show: boolean) => void;
  title: string;
  children: React.ReactNode;
}) {
  const closeDialog = useCallback(() => {
    setShowDialog(false);
  }, [setShowDialog]);

  return (
    <div
      id={id}
      className={styles.modalContainer}
      role="dialog"
      aria-modal="true"
      aria-labelledby={`${id}-title`}
    >
      <div className="relative h-8 px-3 mb-1 text-gray-600">
        <h1
          id={`${id}-title`}
          className="absolute left-1/2 bottom-0 translate-x-[-50%] text-lg"
        >
          {title}
        </h1>
        <button
          aria-label="Close dialog"
          onClick={closeDialog}
          className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer rounded border-none w-5 text-xl text-white hover:text-gray-400"
        >
          ×
        </button>
      </div>
      <div className={`${styles.modalBox} flex flex-col h-full max-h-[80vh] min-h-0`}>
        {children}
      </div>
    </div>
  );
}

// ---------------------------------------------
// Generic Address Selection Dialog
// ---------------------------------------------

export default function AssetSelectScrollContainer<T extends TokenContract | WalletAccount>({
  setShowDialog,
  onSelect,
  title,
  feedType,
  inputPlaceholder,
  duplicateMessage,
  showDuplicateCheck = false,
  containerType,
}: BaseProps<T>) {
  const handleSelect = useCallback(
    (item: T, state: InputState) => {
      console.debug('🎯 [AssetSelectScrollContainer] onSelect triggered', { item, state });
      if (state === InputState.CLOSE_INPUT) {
        onSelect(item, state);
      }
    },
    [onSelect]
  );

  return (
    <BaseModalDialog
      id="AssetSelectScrollContainer"
      setShowDialog={setShowDialog}
      title={title}
    >
      <AddressSelect<T>
        feedType={feedType}
        inputPlaceholder={inputPlaceholder}
        closeDialog={() => setShowDialog(false)}
        onSelect={handleSelect}
        duplicateMessage={duplicateMessage}
        showDuplicateCheck={showDuplicateCheck}
        containerType={containerType}
      />
    </BaseModalDialog>
  );
}

// ---------------------------------------------
// Token Dialog Wrapper
// ---------------------------------------------

export function TokenSelectScrollPanel({
  setShowDialog,
  containerType,
  onSelect,
}: {
  setShowDialog: (show: boolean) => void;
  containerType: CONTAINER_TYPE;
  onSelect: (token: TokenContract, state: InputState) => void;
}) {
  const {
    useSellTokenContract,
    useBuyTokenContract,
  } = require('@/lib/context/hooks');

  const [, setSellTokenContract] = useSellTokenContract();
  const [, setBuyTokenContract] = useBuyTokenContract();

  const contractSetters = {
    [CONTAINER_TYPE.SELL_SELECT_CONTAINER]: setSellTokenContract,
    [CONTAINER_TYPE.BUY_SELECT_CONTAINER]: setBuyTokenContract,
  };

  const setTokenInContext = contractSetters[containerType];

  const title =
    containerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER
      ? 'Select a Token to Sell'
      : 'Select a Token to Buy';

  const duplicateMessage =
    containerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER
      ? 'Sell Address Cannot Be the Same as Buy Address'
      : 'Buy Address Cannot Be the Same as Sell Address';

  const handleSelect = useCallback(
    (token: TokenContract, state: InputState) => {
      console.debug('✅ [TokenSelectScrollPanel] selected token', token);
      if (state === InputState.CLOSE_INPUT) {
        setTokenInContext(token);
        onSelect(token, state);
      }
    },
    [setTokenInContext, onSelect]
  );

  return (
    <AssetSelectScrollContainer<TokenContract>
      setShowDialog={setShowDialog}
      onSelect={handleSelect}
      title={title}
      feedType={FEED_TYPE.TOKEN_LIST}
      inputPlaceholder="Type or paste token address"
      duplicateMessage={duplicateMessage}
      showDuplicateCheck
      containerType={containerType}
    />
  );
}

// ---------------------------------------------
// Recipient Dialog Wrapper
// ---------------------------------------------

export function RecipientSelectScrollPanel({
  setShowDialog,
  onSelect,
}: {
  setShowDialog: (show: boolean) => void;
  onSelect: (wallet: WalletAccount, state: InputState) => void;
}) {
  const handleSelect = useCallback(
    (wallet: WalletAccount, state: InputState) => {
      console.debug('✅ [RecipientSelectScrollPanel] selected wallet', wallet);
      if (state === InputState.CLOSE_INPUT) {
        onSelect(wallet, state);
      }
    },
    [onSelect]
  );

  return (
    <AssetSelectScrollContainer<WalletAccount>
      setShowDialog={setShowDialog}
      onSelect={handleSelect}
      title="Select a Recipient"
      feedType={FEED_TYPE.RECIPIENT_ACCOUNTS}
      inputPlaceholder="Paste recipient wallet address"
    />
  );
}
