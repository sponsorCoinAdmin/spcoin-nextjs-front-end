declare const SpCoinLogger: any;
declare let spCoinLogger: any;
declare class SpCoinERC20Module {
    constructor(_spCoinContractDeployed: any);
    signerTransfer: (_signer: any, _to: any, _value: any) => Promise<void>;
    transfer: (_to: any, _value: any) => Promise<void>;
}
