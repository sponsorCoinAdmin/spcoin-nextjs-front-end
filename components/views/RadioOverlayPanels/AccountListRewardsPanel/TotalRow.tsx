// Dir: @/components/views/RadioOverlayPanels/AccountListRewardsPanel
'use client';

import React from 'react';
import { ChevronDown } from 'lucide-react';

import type { AccountType } from '@/lib/structure';
import { msTableTw } from '../msTableTw';

import {
  BTN_XPAD_HALF_TW,
  CHEVRON_FG_TW,
  CHEVRON_ICON_TW,
  COIN_ROW_MIN_H_TW,
  COIN_ROW_PY_TW,
  COIN_ROW_TEXT_TW,
  COIN_ROW_VALUE_TW,
  COL_0_ACCOUNT_TYPE,
  ROW_CHEVRON_BG_DOWN,
  ROW_OUTLINE_TW,
} from './constants';

export default function TotalRow({
  zebra,
  actionButtonText,
  accountType,
  onClaim,
}: {
  zebra: string;
  actionButtonText: string;
  accountType: AccountType;
  onClaim: (type: AccountType, accountId: number, label?: string) => void;
}) {
  const actionTw = msTableTw.btnGreen;

  return (
    <tr id="REWARDS_TABLE_TOTAL" className={ROW_OUTLINE_TW}>
      <td colSpan={2} className={`${zebra} ${msTableTw.td} !p-0`}>
        <div className={`${COIN_ROW_MIN_H_TW} ${COIN_ROW_PY_TW} flex items-center justify-between gap-2`}>
          <div className="min-w-0 flex items-center gap-2 relative">
            <button
              type="button"
              className={`m-0 p-0 rounded-md ${ROW_CHEVRON_BG_DOWN} flex items-center justify-center shrink-0 invisible`}
              aria-hidden="true"
              tabIndex={-1}
            >
              <ChevronDown className={`${CHEVRON_ICON_TW} ${CHEVRON_FG_TW}`} />
            </button>

            <div className="shrink-0" style={{ width: COL_0_ACCOUNT_TYPE }} aria-hidden="true" />
            <div className={`${COIN_ROW_VALUE_TW} min-w-0 truncate`}>0.0</div>

            <div className="absolute left-[10px] top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true">
              <div
                className={`${COIN_ROW_TEXT_TW} text-[19.5px] leading-[1.15] whitespace-nowrap`}
                style={{ width: COL_0_ACCOUNT_TYPE }}
              >
                Total
              </div>
            </div>
          </div>

          <button
            type="button"
            className={`${actionTw} ${BTN_XPAD_HALF_TW} !min-w-0 !w-auto inline-flex shrink-0`}
            aria-label={`${actionButtonText} total`}
            onClick={() => onClaim(accountType, -1, `${actionButtonText} (TOTAL)`)}
          >
            {actionButtonText}
          </button>
        </div>
      </td>
    </tr>
  );
}
