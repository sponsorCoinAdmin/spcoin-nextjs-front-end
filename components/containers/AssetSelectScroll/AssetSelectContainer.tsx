// File: components/AssetSelectScroll/AssetSelectContainer.tsx

'use client';

import { useEffect } from 'react';

import BaseModalContainer from './BaseModalContainer';
import AddressSelect from '@/components/shared/AddressSelect';

import { createDebugLogger } from '@/lib/utils/debugLogger';
import { useSharedPanelContext } from '@/lib/context/ScrollSelectPanels/useSharedPanelContext';import { useDisplayControls } from '@/lib/context/hooks';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_SCROLL_PANEL_CONTEXT === 'true';
const debugLog = createDebugLogger('AssetSelectContainer', DEBUG_ENABLED, LOG_TIME);

interface Props {
  title: string;
}
console.log('⚡ AssetSelectContainer re-rendered');

export default function AssetSelectContainer({ title }: Props) {
  const { containerType } = useSharedPanelContext();

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
