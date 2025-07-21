// File components/containers/FeeDisclosure.tsx
 
import React from 'react';
import Image from 'next/image';
import cog_png from '@/public/assets/miscellaneous/cog.png';

const FeeDisclosure = () => {
    return (
        <div className="relative top-[2px] left-[4px] text-[#94a3b8] text-[14px]"> 
            Fee Disclosures
            <Image
                src={cog_png}
                alt="Info Image"
                onClick={() => alert("Fees Explained")}
                className="absolute top-[0px] left-[115px] h-5 w-5 cursor-pointer transition duration-300 hover:rotate-180"
                priority
            />
        </div>
    );
};

export default FeeDisclosure;
