// Dir: @/components/views/RadioOverlayPanels/AccountListRewardsPanel
'use client';

import React, { useCallback } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

import { AccountType } from '@/lib/structure';
import type { AccountType as AccountTypeT } from '@/lib/structure';
import { msTableTw } from '../msTableTw';

import ExpandWrap from './ExpandWrap';
import {
  BTN_XPAD_HALF_TW,
  CHEVRON_FG_TW,
  CHEVRON_ICON_TW,
  COIN_ROW_BTN_TW,
  COIN_ROW_MIN_H_TW,
  COIN_ROW_PY_TW,
  COIN_ROW_TEXT_TW,
  COIN_ROW_VALUE_TW,
  COL_0_ACCOUNT_TYPE,
  ROW_CHEVRON_BG_DOWN,
  ROW_CHEVRON_BG_UP,
} from './constants';
import { getActionButtonAriaLabel, getRowLabelTitle } from './utils';

export default function RewardsSubTable({
  zebra,
  walletKey,
  walletIndex,
  tokenRowVisible,
  showRow3,
  showRow4,
  showRow5,
  rewardsOpen,
  showRewardsRow,
  showUnSponsorRow,
  isSponsorMode,
  onSetWalletRows3to5Open,
  onClaim,
  getClaimRowFgTw,
}: {
  zebra: string;
  walletKey: string;
  walletIndex: number;
  tokenRowVisible: boolean;
  showRow3: boolean;
  showRow4: boolean;
  showRow5: boolean;
  rewardsOpen: boolean;

  showRewardsRow: boolean;
  showUnSponsorRow: boolean;
  isSponsorMode: boolean;

  onSetWalletRows3to5Open: (walletKey: string, open: boolean) => void;
  onClaim: (type: AccountTypeT, accountId: number, label?: string) => void;
  getClaimRowFgTw: (label: string) => string;
}) {
  const nestedCellTw = '';
  const nestedOuterTw = '';
  const rewardsDetailsTitle = tokenRowVisible
    ? 'Hide Rewards Contract Details'
    : 'Show Rewards Contract Details';
  const stakedDetailsTitle = tokenRowVisible
    ? 'Hide Staked Contract Details'
    : 'Show Staked Contract Details';
  const toggleRows3to5 = useCallback(() => {
    onSetWalletRows3to5Open(walletKey, !rewardsOpen);
  }, [onSetWalletRows3to5Open, walletKey, rewardsOpen]);

  const renderChevronBtn = useCallback(
    (isOpen: boolean) => (
      <button
        type="button"
        className={`m-0 p-0 rounded-md ${isOpen ? ROW_CHEVRON_BG_UP : ROW_CHEVRON_BG_DOWN} flex items-center justify-center shrink-0`}
        aria-label={isOpen ? 'Close all SpCoin Account Rows' : 'Open all SpCoin Account Rows'}
        title={isOpen ? 'Close all SpCoin Account Rows' : 'Open all SpCoin Account Rows'}
        onClick={() => onSetWalletRows3to5Open(walletKey, !isOpen)}
      >
        {isOpen ? (
          <ChevronUp className={`${CHEVRON_ICON_TW} ${CHEVRON_FG_TW}`} />
        ) : (
          <ChevronDown className={`${CHEVRON_ICON_TW} ${CHEVRON_FG_TW}`} />
        )}
      </button>
    ),
    [onSetWalletRows3to5Open, walletKey],
  );

  const renderNestedRewardsRow = () => {
    if (!showRewardsRow) return null;

    const claimBtnTw = msTableTw.btnGreen;
    const actionText = 'Claim SpCoin Rewards';
    const labelTitle = 'Pending SpCoin Rewards';

    return (
      <tr aria-hidden={false}>
        <td colSpan={2} className={`${msTableTw.td} !p-0 ${nestedCellTw}`} title={labelTitle}>
          <ExpandWrap open={true}>
            <div className={`${COIN_ROW_MIN_H_TW} ${COIN_ROW_PY_TW} flex items-center justify-between gap-2`}>
              <div className="min-w-0 flex items-center gap-2">
                {renderChevronBtn(rewardsOpen)}
                <button
                  type="button"
                  onClick={toggleRows3to5}
                  className={`${COIN_ROW_TEXT_TW} whitespace-nowrap overflow-hidden text-ellipsis shrink-0 text-left cursor-pointer hover:text-[#ec8840ff] transition-colors`}
                  style={{ width: COL_0_ACCOUNT_TYPE }}
                  aria-label={rewardsDetailsTitle}
                  title={rewardsDetailsTitle}
                >
                  Rewards
                </button>
                <div className={`${COIN_ROW_VALUE_TW} min-w-0 truncate`}>0.0</div>
              </div>

              <button
                type="button"
                className={`${claimBtnTw} ${COIN_ROW_BTN_TW} !min-w-0 !w-auto ${BTN_XPAD_HALF_TW} inline-flex shrink-0`}
                aria-label={actionText}
                title={actionText}
                onClick={() => onClaim(AccountType.ALL, walletIndex, 'Rewards')}
              >
                Claim
              </button>
            </div>
          </ExpandWrap>
        </td>
      </tr>
    );
  };

  const renderNestedTokenContractRow = (open: boolean) => (
    <tr aria-hidden={!open}>
      <td colSpan={2} className={`${msTableTw.td} !p-0 ${nestedCellTw}`}>
        <ExpandWrap open={open}>
          <div className={`${COIN_ROW_MIN_H_TW} flex items-center justify-center`}>
            <div className="w-full text-center truncate text-[14.3px] leading-[1.15] !text-[#5981F3]">
              Sponsor Coin Contract Rewards Details
            </div>
          </div>
        </ExpandWrap>
      </td>
    </tr>
  );

  const renderNestedClaimRow = (open: boolean, label: string, valueText: string, type: AccountTypeT, withChevron?: boolean) => {
    const btnTw = msTableTw.btnGreen;

    const isUnstakeRow = label === 'Staked';
    const buttonText = 'Unstake';

    const showButton = isUnstakeRow ? isSponsorMode : false;
    const actionText = getActionButtonAriaLabel(buttonText, label);
    const labelTitle = getRowLabelTitle(label);
    const fgTw = getClaimRowFgTw(label);

    if (!isUnstakeRow) {
      const isIndentedLabel = label === 'Sponsor' || label === 'Recipient' || label === 'Agent';

      return (
        <tr aria-hidden={!open}>
          <td colSpan={2} className={`${msTableTw.td} !p-0 ${nestedCellTw} ${fgTw} align-middle !text-left`} title={labelTitle}>
            <ExpandWrap open={open}>
              <div className={`${COIN_ROW_MIN_H_TW} ${COIN_ROW_PY_TW} flex items-center justify-between gap-2`}>
                <div className="min-w-0 flex items-center gap-2 relative">
                  {withChevron ? (
                    renderChevronBtn(rewardsOpen)
                  ) : (
                    <button
                      type="button"
                      className={`m-0 p-0 rounded-md ${ROW_CHEVRON_BG_DOWN} flex items-center justify-center shrink-0 invisible`}
                      aria-hidden="true"
                      tabIndex={-1}
                    >
                      <ChevronDown className={`${CHEVRON_ICON_TW} ${CHEVRON_FG_TW}`} />
                    </button>
                  )}

                  <div className="shrink-0" style={{ width: COL_0_ACCOUNT_TYPE }} aria-hidden="true" />
                  <div className={`${COIN_ROW_VALUE_TW} min-w-0 truncate`}>{valueText}</div>

                  {isIndentedLabel ? (
                    <div className="absolute left-[10px] top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true">
                      <div
                        className={`${COIN_ROW_TEXT_TW} whitespace-nowrap overflow-hidden text-ellipsis`}
                        style={{ width: COL_0_ACCOUNT_TYPE }}
                      >
                        {label}
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="shrink-0" />
              </div>
            </ExpandWrap>
          </td>
        </tr>
      );
    }

    return (
      <tr aria-hidden={!open}>
        <td colSpan={2} className={`${msTableTw.td} !p-0 ${nestedCellTw}`} title={labelTitle}>
          <ExpandWrap open={open}>
            <div className={`${COIN_ROW_MIN_H_TW} ${COIN_ROW_PY_TW} flex items-center justify-between gap-2`}>
                <div className={`min-w-0 flex items-center gap-2 ${fgTw}`}>
                  {withChevron ? renderChevronBtn(rewardsOpen) : null}
                <button
                  type="button"
                  onClick={toggleRows3to5}
                  className={`${COIN_ROW_TEXT_TW} whitespace-nowrap overflow-hidden text-ellipsis shrink-0 text-left cursor-pointer hover:text-[#ec8840ff] transition-colors`}
                  style={{ width: COL_0_ACCOUNT_TYPE }}
                  aria-label={label === 'Staked' ? stakedDetailsTitle : rewardsDetailsTitle}
                  title={label === 'Staked' ? stakedDetailsTitle : rewardsDetailsTitle}
                >
                  {label}
                </button>
                <div className={`${COIN_ROW_VALUE_TW} min-w-0 truncate`}>{valueText}</div>
              </div>

              <button
                type="button"
                className={`${btnTw} ${COIN_ROW_BTN_TW} ${showButton ? 'visible' : 'invisible'} !min-w-0 !w-auto ${BTN_XPAD_HALF_TW} inline-flex shrink-0`}
                aria-label={actionText}
                title={actionText}
                onClick={() => {
                  if (!showButton) return;
                  onClaim(type, walletIndex, label);
                }}
              >
                {buttonText}
              </button>
            </div>
          </ExpandWrap>
        </td>
      </tr>
    );
  };

  const stakedOpen = showUnSponsorRow;

  return (
    <tr>
      <td colSpan={2} className={`${zebra} ${msTableTw.td} !p-0 align-top`}>
        <table className={`w-full table-fixed border-collapse ${nestedOuterTw}`}>
          <colgroup>
            <col style={{ width: COL_0_ACCOUNT_TYPE }} />
            <col />
          </colgroup>

          <tbody>
            {renderNestedRewardsRow()}
            {renderNestedClaimRow(stakedOpen, 'Staked', '0.0', AccountType.SPONSOR, true)}
            {renderNestedTokenContractRow(tokenRowVisible)}
            {renderNestedClaimRow(showRow3, 'Sponsor', '0.0', AccountType.SPONSOR)}
            {renderNestedClaimRow(showRow4, 'Recipient', '0.0', AccountType.RECIPIENT)}
            {renderNestedClaimRow(showRow5, 'Agent', '0.0', AccountType.AGENT)}
          </tbody>
        </table>
      </td>
    </tr>
  );
}
