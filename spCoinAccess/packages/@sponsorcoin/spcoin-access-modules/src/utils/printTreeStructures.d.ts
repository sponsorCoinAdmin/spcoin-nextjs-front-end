// @ts-nocheck
declare const printTestHHAccounts: () => string;
declare const printStructureTree: (_structure: any) => void;
declare const printStructureRecipients: (_accountStruct: any) => Promise<void>;
declare const printStructureAccountKYC: (_accountStruct: any) => Promise<void>;
declare const printStructureRecipientAgents: (_recipientStruct: any) => Promise<void>;
declare const getJSONStructureTree: (_structure: any) => string;
declare const getJSONStructureRecipients: (_accountStruct: any) => Promise<string>;
declare const getJSONStructureAccountKYC: (_accountStruct: any) => Promise<string>;
declare const getJSONStructureRecipientAgents: (_recipientStruct: any) => Promise<string>;
declare const printNetworkRecipients: (_accountKey: any) => Promise<void>;
declare const printNetworkAccountKYC: (_accountKey: any) => Promise<void>;
declare const printNetworkRecipientAgents: (_accountKey: any, _recipientKey: any) => Promise<void>;
declare const getJSONNetworkRecipients: (_accountKey: any) => Promise<string>;
declare const getJSONNetworkAccountKYC: (_accountKey: any) => Promise<string>;
declare const getJSONNetworkRecipientAgents: (_accountKey: any, _recipientKey: any) => Promise<string>;
declare const getNetworkRecipients: (_accountKey: any) => any;
declare const getNetworkAccountKYC: (_accountKey: any) => any;
declare const getNetworkRecipientAgents: (_accountKey: any, _recipientKey: any) => any;

