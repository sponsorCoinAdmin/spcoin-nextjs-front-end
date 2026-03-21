export declare class SpCoinERC20Module {
    spCoinContractDeployed: any;
    signerTransfer: (_signer: any, _to: string, _value: string | number | bigint) => Promise<void>;
    transfer: (_to: string, _value: string | number | bigint) => Promise<void>;
    constructor(_spCoinContractDeployed: any);
}
