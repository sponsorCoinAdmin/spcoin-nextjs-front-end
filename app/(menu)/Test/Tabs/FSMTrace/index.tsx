//File: app/(menu)/Test/Tabs/FSMTracePanel/index.tsx

'use client';

import FSMTracePanel from '@/components/debug/FSMTracePanel';

export default function FSMTraceTab() {
  // In this tab, we always show the trace panel body.
  // Visibility toggling is controlled by the parent page (which chooses to render this tab or not).
  return <FSMTracePanel visible />;
}
