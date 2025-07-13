// File: components/AssetSelectScroll/AssetSelectScrollPanel.tsx

'use client';

import { useEffect } from 'react';

import BaseModalScrollPanel from './BaseModalScrollPanel';
import AddressSelect from '@/components/shared/AddressSelect';

import { createDebugLogger } from '@/lib/utils/debugLogger';
import { useSharedPanelContext } from '@/lib/context/ScrollSelectPanels/useSharedPanelContext';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_SCROLL_PANEL_CONTEXT === 'true';
const debugLog = createDebugLogger('AssetSelectScrollPanel', DEBUG_ENABLED, LOG_TIME);

interface Props {
  title: string;
}

export default function AssetSelectScrollPanel({ title }: Props) {
  const { containerType } = useSharedPanelContext();

  useEffect(() => {
    debugLog.log(`📥 AssetSelectScrollPanel mounted`);
    debugLog.log(`📦 containerType = ${containerType}`);
  }, [containerType]);

  return (
    <BaseModalScrollPanel id="AssetSelectScrollPanel" title={title}>
      <AddressSelect />
    </BaseModalScrollPanel>
  );
}
