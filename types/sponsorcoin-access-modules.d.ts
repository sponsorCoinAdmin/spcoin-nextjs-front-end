declare module '@sponsorcoin/spcoin-access-modules/modules/spCoinAddModule.js' {
  export class SpCoinAddModule {
    constructor(spCoinContractDeployed: any);
    addRecipient(_recipientKey: string): Promise<any>;
    addAgent(_recipientKey: string, _recipientRateKey: string | number, _accountAgentKey: string): Promise<any>;
    addAgentSponsorship(
      _sponsorSigner: any,
      _recipientKey: string,
      _recipientRateKey: string | number,
      _accountAgentKey: string,
      _agentRateKey: string | number,
      _transactionQty: string | number,
    ): Promise<any>;
    addBackDatedAgentSponsorship(
      _sponsorSigner: any,
      _recipientKey: string,
      _recipientRateKey: string | number,
      _accountAgentKey: string,
      _agentRateKey: string | number,
      _transactionQty: string | number,
      _transactionBackDate: number,
    ): Promise<any>;
  }
}

declare module '@sponsorcoin/spcoin-access-modules/modules/spCoinDeleteModule.js' {
  export class SpCoinDeleteModule {
    signer?: any;
    constructor(spCoinContractDeployed: any);
    deleteAccountRecord(_accountKey: string): Promise<void>;
  }
}

declare module '@sponsorcoin/spcoin-access-modules/modules/spCoinERC20Module.js' {
  export class SpCoinERC20Module {
    constructor(spCoinContractDeployed: any);
  }
}

declare module '@sponsorcoin/spcoin-access-modules/modules/spCoinReadModule.js' {
  export class SpCoinReadModule {
    constructor(spCoinContractDeployed: any);
  }
}

declare module '@sponsorcoin/spcoin-access-modules/modules/spCoinRewardsModule.js' {
  export class SpCoinRewardsModule {
    constructor(spCoinContractDeployed: any);
    updateAccountStakingRewards(accountKey: string): Promise<void>;
  }
}

declare module '@sponsorcoin/spcoin-access-modules/modules/spCoinStakingModule.js' {
  export class SpCoinStakingModule {
    constructor(spCoinContractDeployed: any);
    depositSponsorStakingRewards(
      _sponsorAccount: string,
      _recipientAccount: string,
      _recipientRate: string | number,
      _amount: string | number | bigint,
    ): Promise<void>;
    depositRecipientStakingRewards(
      _sponsorAccount: string,
      _recipientAccount: string,
      _recipientRate: string | number,
      _amount: string | number | bigint,
    ): Promise<void>;
    depositAgentStakingRewards(
      _sponsorAccount: string,
      _recipientAccount: string,
      _recipientRate: string | number,
      _agentAccount: string,
      _agentRate: string | number,
      _amount: string | number | bigint,
    ): Promise<void>;
  }
}
