'use client';

import React from 'react';
import Row from './Row';
import { SP_COIN_DISPLAY } from '@/lib/structure';

type Props = {
  mainPanels: any[];
  isVisible: (id: SP_COIN_DISPLAY) => boolean;
  onTogglePanel: (id: SP_COIN_DISPLAY) => void;
};

const MainPanelsList: React.FC<Props> = ({ mainPanels, isVisible, onTogglePanel }) => {
  return (
    <>
      {mainPanels.map((node, idx) => {
        if (!node) return null;

        const panelId: SP_COIN_DISPLAY =
          typeof node.panel === 'number' ? node.panel : (idx as SP_COIN_DISPLAY);
        const panelVisible = isVisible(panelId);
        const panelLabel = SP_COIN_DISPLAY[panelId] ?? `PANEL_${panelId}`;

        return (
          <React.Fragment key={idx}>
            <Row
              text={`${idx} → ${panelLabel}`}
              depth={3}
              open={panelVisible}
              clickable
              onClick={() => onTogglePanel(panelId)}
            />

            {/* Always list children (use child's own `visible` if present; fall back to isVisible) */}
            {Array.isArray(node.children) && node.children.length > 0 ? (
              node.children.map((child: any, cIdx: number) => {
                const childId: SP_COIN_DISPLAY = child?.panel;
                const childVisible = typeof child?.visible === 'boolean' ? child.visible : isVisible(childId);
                const childLabel = SP_COIN_DISPLAY[childId] ?? `PANEL_${childId}`;

                return (
                  <React.Fragment key={`${idx}.${cIdx}`}>
                    <Row
                      text={`children[${cIdx}] → ${childLabel}`}
                      depth={4}
                      open={childVisible}
                      clickable
                      onClick={() => onTogglePanel(childId)}
                    />
                    {Array.isArray(child.children) && child.children.length > 0 ? (
                      <div className="font-mono whitespace-pre leading-6 text-slate-400">
                        {'  '.repeat(5)}children: ({child.children.length})
                      </div>
                    ) : (
                      <div className="font-mono whitespace-pre leading-6 text-slate-400">
                        {'  '.repeat(5)}children: (empty)
                      </div>
                    )}
                  </React.Fragment>
                );
              })
            ) : (
              <div className="font-mono whitespace-pre leading-6 text-slate-400">
                {'  '.repeat(4)}children: (empty)
              </div>
            )}
          </React.Fragment>
        );
      })}
    </>
  );
};

export default MainPanelsList;
