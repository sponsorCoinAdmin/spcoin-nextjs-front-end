// File: @/components/views/ManageSponsorships/ManageSponsorshipsPanel.tsx

'use client';

import React, { useCallback, useContext, useEffect } from 'react';

import { AccountType, SP_COIN_DISPLAY } from '@/lib/structure';
import { usePanelVisible } from '@/lib/context/exchangeContext/hooks/usePanelVisible';
import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';
import AddressSelect from '@/components/views/AssetSelectPanels/AddressSelect';
import { AssetSelectDisplayProvider } from '@/lib/context/providers/AssetSelect/AssetSelectDisplayProvider';
import { AssetSelectProvider } from '@/lib/context/AssetSelectPanels/AssetSelectProvider';

import ToDo from '@/lib/utils/components/ToDo';
import { ExchangeContextState } from '@/lib/context/ExchangeProvider';
import { createDebugLogger } from '@/lib/utils/debugLogger';

import { useManageSponsorshipsToDo } from '../RadioOverlayPanels_ToDo_FIX/useManageSponsorshipsToDo';
import { msTableTw } from '../RadioOverlayPanels_ToDo_FIX/msTableTw';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_MANAGE_SPONSORSHIPS === 'true';
const debugLog = createDebugLogger('ManageSponsorshipsPanel', DEBUG_ENABLED, LOG_TIME);

type Props = { onClose?: () => void };

export default function ManageSponsorshipsPanel({ onClose }: Props) {
  const isActive = usePanelVisible(SP_COIN_DISPLAY.MANAGE_SPONSORSHIPS_PANEL);

  const pendingVisible = usePanelVisible(SP_COIN_DISPLAY.MANAGE_PENDING_REWARDS);

  const { openPanel, closePanel } = usePanelTree();

  const ctx = useContext(ExchangeContextState);
  const activeAccount = ctx?.exchangeContext?.accounts?.activeAccount;

  const defaultAddr = String(activeAccount?.address ?? '');

  useEffect(() => {
    debugLog.log?.('[render]', {
      isActive,
      hasActive: !!activeAccount,
      activeAddress: activeAccount?.address,
      defaultAddr,
      pendingVisible,
    });
  }, [isActive, activeAccount, defaultAddr, pendingVisible]);

  const {
    showToDo,
    claimRewards,
    claimAllToDo,
    unstakeAllSponsorships,
    doToDo,
  } = useManageSponsorshipsToDo(ctx);

  /**
   * Use the source-of-truth `openPanel()` only.
   * Let the panel system enforce exclusivity (radio behavior).
   */
  const openOverlay = useCallback(
    (id: SP_COIN_DISPLAY) => {
      debugLog.log?.('openOverlay', { target: SP_COIN_DISPLAY[id] });
      openPanel(
        id,
        `ManageSponsorshipsPanel:openOverlay(target=${SP_COIN_DISPLAY[id]}#${String(id)})`,
      );
    },
    [openPanel],
  );

  const togglePendingRewards = useCallback(() => {
    if (pendingVisible) {
      closePanel(
        SP_COIN_DISPLAY.MANAGE_PENDING_REWARDS,
        'ManageSponsorshipsPanel:togglePendingRewards(close)',
      );
    } else {
      openPanel(
        SP_COIN_DISPLAY.MANAGE_PENDING_REWARDS,
        'ManageSponsorshipsPanel:togglePendingRewards(open)',
      );
    }
  }, [pendingVisible, openPanel, closePanel]);

  if (!isActive) return null;

  const showSummaryTable = true;
  const col1NoWrap = 'whitespace-nowrap';

  return (
    <div id="MANAGE_SPONSORSHIPS_PANEL">
      <div className="mb-[1.375rem]">
        <AssetSelectDisplayProvider>
          <AssetSelectProvider
            containerType={SP_COIN_DISPLAY.MANAGE_SPONSORSHIPS_PANEL}
            closePanelCallback={() => onClose?.()}
            setSelectedAssetCallback={() => {}}
          >
            <AddressSelect
              callingParent="ManageSponsorshipsPanel"
              defaultAddress={defaultAddr}
              bypassDefaultFsm
              useActiveAddr
              shortAddr
              preText="Deposit Account:"
            />
          </AssetSelectProvider>
        </AssetSelectDisplayProvider>
      </div>

      <>
        {showSummaryTable && (
          <div id="MANAGE_SPONSORSHIPS_TABLE" className={`${msTableTw.wrapper} mb-1`}>
            <table className={`${msTableTw.table} min-w-full`}>
              <thead>
                <tr className={msTableTw.theadRow}>
                  <th
                    scope="col"
                    className={`${msTableTw.th5} ${msTableTw.th5Pad3} ${msTableTw.colFit}`}
                  >
                    SpCoins
                  </th>
                  <th
                    scope="col"
                    className={`${msTableTw.th} ${msTableTw.thPad3} text-center`}
                  >
                    Amount
                  </th>
                  <th
                    scope="col"
                    className={`${msTableTw.th5} ${msTableTw.th5Pad3} text-center ${msTableTw.colFit}`}
                  >
                    Options
                  </th>
                </tr>
              </thead>

              <tbody>
                <tr className={msTableTw.rowBorder}>
                  <td className={`${msTableTw.rowA} ${msTableTw.td5}`}>
                    <div className={`${msTableTw.tdInner5} ${col1NoWrap}`}>Trading</div>
                  </td>

                  <td className={`${msTableTw.rowA} ${msTableTw.td}`}>
                    <div className={msTableTw.tdInnerCenter}>0</div>
                  </td>

                  <td className={`${msTableTw.rowA} ${msTableTw.td5}`}>
                    <div className={msTableTw.tdInnerCenter5}>
                      <button
                        type="button"
                        className={msTableTw.btnOrange}
                        onClick={() => openOverlay(SP_COIN_DISPLAY.STAKING_SPCOINS_PANEL)}
                        aria-label="Open Trading Coins config"
                        title="Configure Trading Coins"
                      >
                        Stake
                      </button>
                    </div>
                  </td>
                </tr>

                <tr className={msTableTw.rowBorder}>
                  <td className={`${msTableTw.rowB} ${msTableTw.td5}`}>
                    <button
                      type="button"
                      className={`${msTableTw.tdInner5} ${msTableTw.linkCell5} ${col1NoWrap}`}
                      onClick={() => openOverlay(SP_COIN_DISPLAY.UNSTAKING_SPCOINS_PANEL)}
                      aria-label="Open Un-Staking SpCoins panel"
                      title="Open Un-Staking"
                    >
                      Staked
                    </button>
                  </td>

                  <td className={`${msTableTw.rowB} ${msTableTw.td}`}>
                    <div className={msTableTw.tdInnerCenter}>0</div>
                  </td>

                  <td className={`${msTableTw.rowB} ${msTableTw.td5}`}>
                    <div className={msTableTw.tdInnerCenter5}>
                      <button
                        type="button"
                        className={msTableTw.btnGreen}
                        onClick={unstakeAllSponsorships}
                        aria-label="Unstake All Sponsorships (ToDo)"
                        title="Unstake All Sponsorships (ToDo)"
                      >
                        Unstake
                      </button>
                    </div>
                  </td>
                </tr>

                <tr className={msTableTw.rowBorder}>
                  <td className={`${msTableTw.rowA} ${msTableTw.td5}`}>
                    <button
                      type="button"
                      className={`${msTableTw.tdInner5} ${msTableTw.linkCell5} ${col1NoWrap}`}
                      onClick={togglePendingRewards}
                      aria-label="Toggle Pending Rewards rows"
                    >
                      Pending
                    </button>
                  </td>

                  <td className={`${msTableTw.rowA} ${msTableTw.td}`}>
                    <div className={msTableTw.tdInnerCenter}>{pendingVisible ? '' : 0}</div>
                  </td>

                  <td className={`${msTableTw.rowA} ${msTableTw.td5}`}>
                    <div className={msTableTw.tdInnerCenter5}>
                      {!pendingVisible && (
                        <button
                          type="button"
                          className={msTableTw.btnGreen}
                          aria-label="Claim all Sponsorship rewards (ToDo)"
                          onClick={claimAllToDo}
                        >
                          Claim All
                        </button>
                      )}
                    </div>
                  </td>
                </tr>

                {pendingVisible && (
                  <>
                    <tr className={msTableTw.rowBorder}>
                      <td className={`${msTableTw.rowB} ${msTableTw.td5}`}>
                        <button
                          type="button"
                          className={`${msTableTw.tdInner5} ${msTableTw.linkCell5} ${col1NoWrap}`}
                          onClick={() => openOverlay(SP_COIN_DISPLAY.ACCOUNT_LIST_REWARDS_PANEL)}
                          aria-label="Open Claim Sponsors Rewards panel"
                        >
                          <span className="mr-1">&nbsp;&nbsp;&nbsp;•&nbsp;&nbsp;</span>
                          Sponsors
                        </button>
                      </td>

                      <td className={`${msTableTw.rowB} ${msTableTw.td}`}>
                        <div className={msTableTw.tdInnerCenter}>0</div>
                      </td>

                      <td className={`${msTableTw.rowB} ${msTableTw.td5}`}>
                        <div className={msTableTw.tdInnerCenter5}>
                          <button
                            type="button"
                            className={msTableTw.btnOrange}
                            aria-label="Claim Sponsors rewards"
                            onClick={() => claimRewards(AccountType.SPONSOR)}
                          >
                            Claim All
                          </button>
                        </div>
                      </td>
                    </tr>

                    <tr className={msTableTw.rowBorder}>
                      <td className={`${msTableTw.rowA} ${msTableTw.td5}`}>
                        <button
                          type="button"
                          className={`${msTableTw.tdInner5} ${msTableTw.linkCell5} ${col1NoWrap}`}
                          onClick={() => openOverlay(SP_COIN_DISPLAY.RECIPIENTS)}
                          aria-label="Open Claim Recipients Rewards panel"
                        >
                          <span className="mr-1">&nbsp;&nbsp;&nbsp;•&nbsp;&nbsp;</span>
                          Recipients
                        </button>
                      </td>

                      <td className={`${msTableTw.rowA} ${msTableTw.td}`}>
                        <div className={msTableTw.tdInnerCenter}>0</div>
                      </td>

                      <td className={`${msTableTw.rowA} ${msTableTw.td5}`}>
                        <div className={msTableTw.tdInnerCenter5}>
                          <button
                            type="button"
                            className={msTableTw.btnGreen}
                            aria-label="Claim Recipients rewards"
                            onClick={() => claimRewards(AccountType.RECIPIENT)}
                          >
                            Claim All
                          </button>
                        </div>
                      </td>
                    </tr>

                    <tr className={msTableTw.rowBorder}>
                      <td className={`${msTableTw.rowB} ${msTableTw.td5}`}>
                        <button
                          type="button"
                          className={`${msTableTw.tdInner5} ${msTableTw.linkCell5} ${col1NoWrap}`}
                          onClick={() => openOverlay(SP_COIN_DISPLAY.AGENTS)}
                          aria-label="Open Claim Agents Rewards panel"
                        >
                          <span className="mr-1">&nbsp;&nbsp;&nbsp;•&nbsp;&nbsp;</span>
                          Agents
                        </button>
                      </td>

                      <td className={`${msTableTw.rowB} ${msTableTw.td}`}>
                        <div className={msTableTw.tdInnerCenter}>0</div>
                      </td>

                      <td className={`${msTableTw.rowB} ${msTableTw.td5}`}>
                        <div className={msTableTw.tdInnerCenter5}>
                          <button
                            type="button"
                            className={msTableTw.btnOrange}
                            aria-label="Claim Agents rewards"
                            onClick={() => claimRewards(AccountType.AGENT)}
                          >
                            Claim All
                          </button>
                        </div>
                      </td>
                    </tr>
                  </>
                )}

                {(() => {
                  const zebra = pendingVisible ? msTableTw.rowA : msTableTw.rowB;

                  return (
                    <tr className={msTableTw.rowBorder}>
                      <td className={`${zebra} ${msTableTw.td5}`}>
                        <div className={`${msTableTw.tdInner5} ${col1NoWrap}`}>Total Coins</div>
                      </td>

                      <td className={`${zebra} ${msTableTw.td}`}>
                        <div className={msTableTw.tdInnerCenter}>0</div>
                      </td>

                      <td className={`${zebra} ${msTableTw.td5}`}>
                        <div className={msTableTw.tdInnerCenter5}>
                          <button
                            type="button"
                            className={msTableTw.btnGreen}
                            aria-label="Claim all Sponsorship rewards (Total Coins)"
                            onClick={claimAllToDo}
                          >
                            Claim All
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })()}
              </tbody>
            </table>
          </div>
        )}
      </>

      {showToDo && (
        <ToDo
          show
          message="ToDo"
          opacity={0.5}
          color="#ff1a1a"
          zIndex={2000}
          onDismiss={() => doToDo()}
        />
      )}
    </div>
  );
}
