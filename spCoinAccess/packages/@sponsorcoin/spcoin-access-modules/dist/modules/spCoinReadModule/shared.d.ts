export declare const SPONSOR = 0;
export declare const RECIPIENT = 1;
export declare const AGENT = 2;
export declare const getRewardType: (_accountType: number) => string;
export declare const getAccountTypeString: (_accountType: number) => string;
export declare const getSourceTypeDelimiter: (_accountType: number) => "RECIPIENT_ACCOUNT:" | "SPONSOR_ACCOUNT:";
