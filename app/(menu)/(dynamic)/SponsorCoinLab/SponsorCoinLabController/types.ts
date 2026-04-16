import type { ExchangeContext, Settings } from '@/lib/structure';
import type { SpCoinContractAccess } from '../jsonMethods/shared';
import type { MethodDef } from '../jsonMethods/shared/types';

export type LabCardId = 'network' | 'contract' | 'methods' | 'log' | 'output';
export type OutputPanelMode = 'execution' | 'formatted' | 'tree' | 'raw_status';
export type FormattedPanelView = 'script' | 'output';
export type MethodSelectionSource = 'dropdown' | 'script';
export type SponsorCoinAccountRole = 'sponsor' | 'recipient' | 'agent';

export type SponsorCoinManageContract = SpCoinContractAccess & {
  addSponsorRecipient?: (sponsorKey: string, recipientKey: string) => Promise<unknown>;
  addRecipientAgent?: (sponsorKey: string, recipientKey: string, recipientRateKey: string, accountAddress: string) => Promise<unknown>;
  deleteAccountRecord?: (accountAddress: string) => Promise<unknown>;
};

export type MethodDefMap = Record<string, MethodDef>;
export type MissingFieldEntry = { id: string };
export type AddressFieldLabels = { addressALabel: string; addressBLabel: string };
export type ControllerParamDef = { label: string };
export type ControllerContractMetadata = Partial<{
  version: string;
  inflationRate: number;
  recipientRateRange: [number, number];
  agentRateRange: [number, number];
}>;
export type ControllerExchangeContext = ExchangeContext;
export type ControllerSetExchangeContext = (
  updater: (prev: ControllerExchangeContext) => ControllerExchangeContext,
  reason?: string,
) => void;
export type ControllerSetSettings = (
  updater: (prev: Settings) => Settings,
) => void;
export type TransactionReceiptLike = {
  hash?: string;
};
export type TransactionLike = {
  hash?: string;
  wait?: () => Promise<TransactionReceiptLike>;
};
export type ExecuteWriteConnected = <T = TransactionLike>(
  label: string,
  runner: (contract: unknown, signer: unknown) => Promise<T>,
  hardhatSenderAddress?: string,
) => Promise<T>;
