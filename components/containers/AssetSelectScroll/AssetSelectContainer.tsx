// File: components/AssetSelectScroll/AssetSelectContainer.tsx

'use client';

import { useEffect } from 'react';
import { getInputStateString } from '@/lib/structure';

import BaseModalContainer from './BaseModalContainer';
import AddressSelect from '@/components/shared/AddressSelect';

import { createDebugLogger } from '@/lib/utils/debugLogger';
import { usePanelFeedContext } from '@/lib/context/ScrollSelectPanels';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_SCROLL_PANEL_CONTEXT === 'true';
const debugLog = createDebugLogger('AssetSelectContainer', DEBUG_ENABLED, LOG_TIME);

interface Props {
  title: string;
}

export default function AssetSelectContainer({ title }: Props) {
  const { containerType } = usePanelFeedContext();

  useEffect(() => {
    debugLog.log(`📥 AssetSelectContainer mounted`);
    debugLog.log(`📦 containerType = ${containerType}`);
  }, [containerType]);

  return (
    <BaseModalContainer id="AssetSelectContainer" title={title}>
      <AddressSelect />
    </BaseModalContainer>
  );
}
