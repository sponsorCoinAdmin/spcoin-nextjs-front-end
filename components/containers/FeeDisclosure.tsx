import React from 'react';
import Image from 'next/image';
import cog_png from '@/public/assets/miscellaneous/cog.png';
import styles from '@/styles/Exchange.module.css';

const FeeDisclosure = () => {
    return (
        <div id="agentRateFee" className={styles.agentRateFee}>
            Fee Disclosures
            <Image
                src={cog_png}
                alt="Info Image"
                onClick={() => alert("Fees Explained")}
                className={styles.feeInfoCog}
                priority
            />
        </div>
    );
};

export default FeeDisclosure;
