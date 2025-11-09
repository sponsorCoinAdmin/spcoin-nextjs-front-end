// File: app/(menu)/Exchange/DebugPanelProbes.tsx
'use client';
import { useEffect } from 'react';
import { installDocClickProbe } from '@/lib/debug/panels/installDocClickProbe';

export default function DebugPanelProbes() {
  useEffect(() => {
    installDocClickProbe();
  }, []);
  return null;
}
