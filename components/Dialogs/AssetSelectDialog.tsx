'use client';

import { useMemo, useRef, useCallback, useEffect } from 'react';
import AddressSelect from '@/components/Dialogs/AddressSelect';
import styles from '@/styles/Modal.module.css';
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

function BaseModalDialog({
  id,
  showDialog,
  setShowDialog,
  title,
  children,
}: {
  id: string;
  showDialog: boolean;
  setShowDialog: (show: boolean) => void;
  title: string;
  children: React.ReactNode;
}) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);

  const closeDialog = useCallback(() => {
    setShowDialog(false);
    dialogRef.current?.close();
  }, [setShowDialog]);

  useEffect(() => {
    if (dialogRef.current) {
      if (showDialog) {
        dialogRef.current.showModal();
      } else {
        dialogRef.current.close();
      }
    }
  }, [showDialog]);

  return (
    <dialog id={id} ref={dialogRef} className={styles.modalContainer}>
      <div className="relative h-8 px-3 mb-1 text-gray-600">
        <h1 className="absolute left-1/2 bottom-0 translate-x-[-50%] text-lg">{title}</h1>
        <div
          className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer rounded border-none w-5 text-xl text-white"
          onClick={closeDialog}
        >
          X
        </div>
      </div>
      <div className={`${styles.modalBox} flex flex-col h-full max-h-[80vh] min-h-0`}>
        {children}
      </div>
    </dialog>
  );
}

export default function AddressSelectDialog<T extends TokenContract | WalletAccount>({
  showDialog,
  setShowDialog,
  onSelect,
  title,
  feedType,
  inputPlaceholder,
  duplicateMessage,
  showDuplicateCheck = false,
}: BaseProps<T>) {
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
