'use client';

// File: app/(menu)/(dynamic)/SponsorCoinLab/page.tsx
import dynamic from 'next/dynamic';

const SponsorCoinLabController = dynamic(() => import('./SponsorCoinLabController/index'), {
  ssr: false,
});

export default function SponsorCoinLabPage() {
  return <SponsorCoinLabController />;
}
