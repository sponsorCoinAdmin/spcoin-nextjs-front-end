// File: components/AssetSelectScroll/AssetSelectScrollContainer.tsx

'use client';

import { useEffect } from 'react';

import BaseModalDialog from './BaseModalDialog';
import AddressSelect from '@/components/shared/AddressSelect';

import { createDebugLogger } from '@/lib/utils/debugLogger';
import { usePanelFeedContext } from '@/lib/context/ScrollSelectPanels';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_SCROLL_PANEL_CONTEXT === 'true';
const debugLog = createDebugLogger('AssetSelectScrollContainer', DEBUG_ENABLED, LOG_TIME);

interface Props {
  title: string;
}

export default function AssetSelectScrollContainer({ title }: Props) {
  const { containerType } = usePanelFeedContext();

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
