// File: components/shared/utils/sharedPreviews/BasePreviewWrapper.tsx
'use client';

import React from 'react';

interface BasePreviewWrapperProps {
  show: boolean;
  children: React.ReactNode;
}

export default function BasePreviewWrapper({ show, children }: BasePreviewWrapperProps) {
  if (!show) return null;

  return (
    <div id = "BasePreviewWrapper" className="flex items-center h-[50px] bg-[#243056] rounded-[22px] p-2">
      {children}
    </div>
  );
}
