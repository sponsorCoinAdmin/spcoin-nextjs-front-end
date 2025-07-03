'use client';

import { useEffect } from 'react';
import {
  getInputStateString,
} from '@/lib/structure';

import BaseModalDialog from './BaseModalDialog';
import AddressSelect from '@/components/shared/AddressSelect';
import { useSharedPanelContext } from '@/lib/context/ScrollSelectPanel/SharedPanelContext';
import { createDebugLogger } from '@/lib/utils/debugLogger';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_SCROLL_PANEL_CONTEXT === 'true';
const debugLog = createDebugLogger('AssetSelectScrollContainer', DEBUG_ENABLED, LOG_TIME);

interface Props {
  title: string;
}

export default function AssetSelectScrollContainer({ title }: Props) {
  const { onSelect, containerType } = useSharedPanelContext();

  useEffect(() => {
    debugLog.log(`📥 AssetSelectScrollContainer mounted`);
    debugLog.log(`📦 containerType = ${containerType}`);
  }, [containerType]);

  return (
    <BaseModalDialog id="AssetSelectScrollContainer" title={title}>
      <AddressSelect />
    </BaseModalDialog>
  );
}
