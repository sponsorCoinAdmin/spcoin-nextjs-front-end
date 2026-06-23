'use client';

import { useState } from 'react';
import PanelGate from '@/components/utility/PanelGate';
import { SP_COIN_DISPLAY } from '@/lib/structure';
import AccountListView from './AccountListView';
import AccountFormView from './AccountFormView';

type View = 'list' | 'create' | { type: 'edit'; address: string };

export default function ManageAccountsPanel() {
  const [view, setView] = useState<View>('list');

  return (
    <PanelGate panel={SP_COIN_DISPLAY.MANAGE_ACCOUNTS_PANEL} className="min-h-0 flex-1">
      <div className="flex min-h-0 flex-1 flex-col">
        {view === 'list' && (
          <AccountListView
            onCreate={() => setView('create')}
            onEdit={(address) => setView({ type: 'edit', address })}
          />
        )}
        {(view === 'create' || (typeof view === 'object' && view.type === 'edit')) && (
          <AccountFormView
            targetAddress={typeof view === 'object' ? view.address : undefined}
            onBack={() => setView('list')}
          />
        )}
      </div>
    </PanelGate>
  );
}
