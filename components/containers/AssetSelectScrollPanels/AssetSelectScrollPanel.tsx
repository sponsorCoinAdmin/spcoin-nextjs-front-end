// File: components/AssetSelectScroll/AssetSelectScrollPanel.tsx

'use client';

import { useEffect } from 'react';
import BaseScrollPanel from './BaseScrollPanel';
import AddressSelect from '@/components/shared/AddressSelect';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import { useSharedPanelContext } from '@/lib/context/ScrollSelectPanels/useSharedPanelContext';
import { useValidateFSMInput } from '@/lib/hooks/inputValidations/validations/useValidateFSMInput';

const LOG_TIME = false;
const DEBUG_ENABLED =
  process.env.NEXT_PUBLIC_DEBUG_LOG_SCROLL_PANEL_CONTEXT === 'true';
const debugLog = createDebugLogger('AssetSelectScrollPanel', DEBUG_ENABLED, LOG_TIME);

interface Props {
  title: string;
}

export default function AssetSelectScrollPanel({ title }: Props) {
  const { containerType, validHexInput, instanceId } = useSharedPanelContext();

  const safeInput = validHexInput.trim() !== '' ? validHexInput : undefined;

  // ✅ Log instanceId for tracking
  debugLog.log(`🆔 AssetSelectScrollPanel using instanceId: ${instanceId}`);

  // ✅ Call hooks at top-level
  useValidateFSMInput(safeInput);

  useEffect(() => {
    debugLog.log(`📥 AssetSelectScrollPanel mounted (containerType=${containerType})`);
  }, [containerType]);

  return (
    <BaseScrollPanel id="BaseScrollPanel">
      <AddressSelect />
      
    </BaseScrollPanel>
  );
}
