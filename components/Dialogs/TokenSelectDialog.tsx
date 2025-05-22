'use client';

import { useMemo } from "react";
import { useContainerType } from '@/lib/context/contextHooks';
import { CONTAINER_TYPE, TokenContract, InputState } from '@/lib/structure/types';
import TokenSelect from "@/components/Dialogs/TokenSelect";
import BaseModalDialog from "@/components/Dialogs/BaseModelDialog";

type Props = {
  showDialog: boolean;
  setShowDialog: (bool: boolean) => void;
  onSelect: (contract: TokenContract | undefined, inputState: InputState) => void;
};

export default function TokenSelectDialog({ showDialog, setShowDialog, onSelect }: Props) {
  const [containerType] = useContainerType();

  const title = useMemo(() =>
    containerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER
      ? "Select a Token to Sell"
      : "Select a Token to Buy"
  , [containerType]);

  return (
    <BaseModalDialog
      id="TokenSelectDialog"
      showDialog={showDialog}
      setShowDialog={setShowDialog}
      title={title}
    >
      <TokenSelect closeDialog={() => setShowDialog(false)} onSelect={onSelect} />
    </BaseModalDialog>
  );
}
