'use client';

import { useMemo } from 'react';
import { useContainerType, useBuyTokenContract, useSellTokenContract } from '@/lib/context/contextHooks';
import { CONTAINER_TYPE, TokenContract, InputState, FEED_TYPE } from '@/lib/structure/types';
import AddressSelect from '@/components/Dialogs/AddressSelect';
import BaseModalDialog from '@/components/Dialogs/BaseModelDialog';

type Props = {
  showDialog: boolean;
  setShowDialog: (bool: boolean) => void;
  onSelect: (contract: TokenContract | undefined, inputState: InputState) => void;
};

export default function TokenSelectDialog({ showDialog, setShowDialog, onSelect }: Props) {
  const [containerType] = useContainerType();
  const [, setSellTokenContract] = useSellTokenContract();
  const [, setBuyTokenContract] = useBuyTokenContract();

  const title = useMemo(() =>
    containerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER
      ? 'Select a Token to Sell'
      : 'Select a Token to Buy'
  , [containerType]);

  const setTokenInContext = containerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER
    ? setSellTokenContract
    : setBuyTokenContract;

  return (
    <BaseModalDialog
      id="TokenSelectDialog"
      showDialog={showDialog}
      setShowDialog={setShowDialog}
      title={title}
    >
      <AddressSelect<TokenContract>
        feedType={FEED_TYPE.TOKEN_LIST}
        inputPlaceholder="Type or paste token address"
        closeDialog={() => setShowDialog(false)}
        onSelect={(token, state) => {
          if (state === InputState.CLOSE_INPUT) {
            setTokenInContext(token);
            onSelect(token, state);
          }
        }}
        duplicateMessage={
          containerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER
            ? 'Sell Address Cannot Be the Same as Buy Address'
            : 'Buy Address Cannot Be the Same as Sell Address'
        }
        showDuplicateCheck
      />
    </BaseModalDialog>
  );
}
