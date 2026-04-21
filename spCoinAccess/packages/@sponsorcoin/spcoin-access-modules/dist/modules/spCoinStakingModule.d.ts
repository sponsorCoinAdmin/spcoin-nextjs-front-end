import type { Signer } from "ethers";
declare const bigIntToDecString: any, second: any, minute: any, hour: any, day: any, week: any, year: any, month: any, millennium: any;
export declare class SpCoinStakingModule {
    spCoinContractDeployed: any;
    signer?: Signer;
    testStakingRewards: (lastUpdateTime: string | number | bigint, testUpdateTime: string | number | bigint, interestRate: string | number | bigint, quantity: string | number | bigint) => Promise<bigint>;
    getStakingRewards: (lastUpdateTime: string | number | bigint, interestRate: string | number | bigint, quantity: string | number | bigint) => Promise<bigint>;
    getAccountTimeInSecondeSinceUpdate: (_tokenLastUpdate: string | number | bigint) => Promise<bigint>;
    constructor(_spCoinContractDeployed: any);
}
export { bigIntToDecString, second, minute, hour, day, week, year, month, millennium };
