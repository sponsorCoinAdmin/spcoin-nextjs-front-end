// File: app/(menu)/Test/Tabs/ExchangeContext/components/SettingsSection.tsx
'use client';

import React from 'react';
import Row from './Tree/Row';
import MainPanelsList from './MainPanelsList';
import { SP_COIN_DISPLAY } from '@/lib/structure';
import { quoteIfString } from '../utils/object';

type UIState = { ctx: boolean; settings: boolean; main: boolean; exp: Record<string, boolean> };

type Props = {
  ui: UIState;
  setHeader: (key: 'ctx' | 'settings' | 'main') => void;
  apiTradingProvider: any;
  mainPanels: any[];
  isVisible: (id: SP_COIN_DISPLAY) => boolean;
  onTogglePanel: (id: SP_COIN_DISPLAY) => void;
};

const SettingsSection: React.FC<Props> = ({
  ui,
  setHeader,
  apiTradingProvider,
  mainPanels,
  isVisible,
  onTogglePanel,
}) => {
  return (
    // Remove bottom padding so it doesn't add to the outer space-y gap before "network"
    <div className="px-4 pt-4 pb-0">
      {/* Headers clickable to expand/collapse */}
      <Row text="Exchange Context" depth={0} open={ui.ctx} clickable onClick={() => setHeader('ctx')} />
      {ui.ctx && (
        <>
          <Row text="settings" depth={1} open={ui.settings} clickable onClick={() => setHeader('settings')} />
          {ui.settings && (
            <>
              {/* apiTradingProvider line — leaf with blue value */}
              <div className="font-mono whitespace-pre leading-6">
                {'  '.repeat(2)}apiTradingProvider:{' '}
                <span className="text-[#5981F3]">{quoteIfString(apiTradingProvider ?? '')}</span>
              </div>

              <Row
                text="mainPanelNode"
                depth={2}
                open={ui.main}
                clickable
                onClick={() => setHeader('main')}
              />
              {ui.main && (
                <MainPanelsList
                  mainPanels={mainPanels}
                  isVisible={isVisible}
                  onTogglePanel={onTogglePanel}
                />
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};

export default SettingsSection;
