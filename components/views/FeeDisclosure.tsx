// File: @/components/views/FeeDisclosure.tsx
'use client';

import React from 'react';
import Image from 'next/image';
import cog_png from '@/public/assets/miscellaneous/cog.png';
import { usePanelVisible } from '@/lib/context/exchangeContext/hooks/usePanelVisible';
import { SP_COIN_DISPLAY as SP } from '@/lib/structure';

const FeeDisclosure = () => {
  const show = usePanelVisible(SP.FEE_DISCLOSURE);
  if (!show) return null;

  return (
    <div className="relative top-[2px] left-[4px] text-[#94a3b8] text-[14px]">
      Fee Disclosures
      <Image
        src={cog_png}
        alt="Info"
        onClick={() => alert('Fees Explained')}
        className="absolute top-[0px] left-[115px] h-5 w-5 cursor-pointer transition duration-300 hover:rotate-180"
        priority
      />
    </div>
  );
};

export default FeeDisclosure;
