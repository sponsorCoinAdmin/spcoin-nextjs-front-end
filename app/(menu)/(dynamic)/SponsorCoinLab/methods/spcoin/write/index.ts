// File: app/(menu)/(dynamic)/SponsorCoinLab/methods/spcoin/write/index.ts
import type { Contract } from 'ethers';
import { SPCOIN_WRITE_METHOD_DEFS } from './defs';
export { SPCOIN_WRITE_METHOD_DEFS };

export type SpCoinWriteMethod =
  | 'addRecipient'
  | 'addRecipients'
  | 'addAgent'
  | 'addAgents'
  | 'addAccountRecord'
  | 'addAccountRecords'
  | 'addSponsorship'
  | 'addAgentSponsorship'
  | 'addBackDatedSponsorship'
  | 'addBackDatedAgentSponsorship'
  | 'unSponsorRecipient'
  | 'deleteAccountRecord'
  | 'deleteAccountRecords'
  | 'deleteAgentRecord'
  | 'updateAccountStakingRewards'
  | 'depositSponsorStakingRewards'
  | 'depositRecipientStakingRewards'
  | 'depositAgentStakingRewards'
  | 'depositStakingRewards';

const BURN_ADDRESS = '0x0000000000000000000000000000000000000000';
const SPONSOR_ACCOUNT_TYPE = '0';
const RECIPIENT_ACCOUNT_TYPE = '1';
const AGENT_ACCOUNT_TYPE = '2';

function splitDecimalAmount(raw: string): { whole: string; fractional: string } {
  const [wholeRaw = '0', fractionalRaw = '0'] = String(raw || '').trim().split('.');
  const whole = wholeRaw.length > 0 ? wholeRaw : '0';
  const fractional = fractionalRaw.length > 0 ? fractionalRaw : '0';
  return { whole, fractional };
}

export function getSpCoinWriteOptions(hideUnexecutables: boolean): SpCoinWriteMethod[] {
  const all = (Object.keys(SPCOIN_WRITE_METHOD_DEFS) as SpCoinWriteMethod[]).sort((a, b) => a.localeCompare(b));
  if (!hideUnexecutables) return all;
  return all.filter((name) => SPCOIN_WRITE_METHOD_DEFS[name].executable !== false);
}

type RunArgs = {
  selectedMethod: SpCoinWriteMethod;
  spWriteParams: string[];
  coerceParamValue: (raw: string, def: any) => any;
  executeWriteConnected: (
    label: string,
    writeCall: (contract: Contract, signer: any) => Promise<any>,
    accountKey?: string,
  ) => Promise<any>;
  selectedHardhatAddress?: string;
  appendLog: (line: string) => void;
  setStatus: (value: string) => void;
};

export async function runSpCoinWriteMethod(args: RunArgs): Promise<void> {
  const {
    selectedMethod,
    spWriteParams,
    coerceParamValue,
    executeWriteConnected,
    selectedHardhatAddress,
    appendLog,
    setStatus,
  } = args;
  const activeDef = SPCOIN_WRITE_METHOD_DEFS[selectedMethod];
  const methodArgs = activeDef.params.map((def, idx) => coerceParamValue(spWriteParams[idx], def));
  const submitWrite = async (label: string, writeCall: (contract: Contract) => Promise<any>) => {
    setStatus(`Submitting ${label}...`);
    const tx = await executeWriteConnected(label, writeCall, selectedHardhatAddress);
    appendLog(`${label} tx sent: ${String(tx?.hash || '(no hash)')}`);
    const receipt = await tx.wait();
    appendLog(`${label} mined: ${String(receipt?.hash || tx?.hash || '(no hash)')}`);
  };

  switch (selectedMethod) {
    case 'addRecipients': {
      const recipientList = methodArgs[1] as string[];
      for (const recipientKey of recipientList) {
        await submitWrite(`addRecipient(${recipientKey})`, (contract) => (contract as any).addRecipient(recipientKey));
      }
      break;
    }
    case 'addAgents': {
      const agentList = methodArgs[2] as string[];
      for (const agentKey of agentList) {
        await submitWrite(`addAgent(${String(methodArgs[0])}, ${String(methodArgs[1])}, ${agentKey})`, (contract) =>
          (contract as any).addAgent(methodArgs[0], methodArgs[1], agentKey),
        );
      }
      break;
    }
    case 'addAccountRecords': {
      const accountList = methodArgs[0] as string[];
      for (const accountKey of accountList) {
        await submitWrite(`addAccountRecord(${accountKey})`, (contract) => (contract as any).addAccountRecord(accountKey));
      }
      break;
    }
    case 'addAgentSponsorship': {
      const amount = splitDecimalAmount(String(methodArgs[4]));
      await submitWrite(activeDef.title, (contract) =>
        (contract as any).addSponsorship(methodArgs[0], methodArgs[1], methodArgs[2], methodArgs[3], amount.whole, amount.fractional),
      );
      break;
    }
    case 'addBackDatedAgentSponsorship': {
      const amount = splitDecimalAmount(String(methodArgs[4]));
      await submitWrite(activeDef.title, (contract) =>
        (contract as any).addBackDatedSponsorship(
          methodArgs[0],
          methodArgs[1],
          methodArgs[2],
          methodArgs[3],
          amount.whole,
          amount.fractional,
          methodArgs[5],
        ),
      );
      break;
    }
    case 'deleteAccountRecords': {
      const accountList = methodArgs[0] as string[];
      for (const accountKey of accountList) {
        await submitWrite(`deleteAccountRecord(${accountKey})`, (contract) => (contract as any).deleteAccountRecord(accountKey));
      }
      break;
    }
    case 'deleteAgentRecord': {
      throw new Error('deleteAgentRecord is not exposed as a callable public contract method in current ABI.');
    }
    case 'depositSponsorStakingRewards': {
      await submitWrite(activeDef.title, (contract) =>
        (contract as any).depositStakingRewards(
          SPONSOR_ACCOUNT_TYPE,
          methodArgs[0],
          methodArgs[1],
          methodArgs[2],
          methodArgs[0],
          '0',
          methodArgs[3],
        ),
      );
      break;
    }
    case 'depositRecipientStakingRewards': {
      await submitWrite(activeDef.title, (contract) =>
        (contract as any).depositStakingRewards(
          RECIPIENT_ACCOUNT_TYPE,
          methodArgs[0],
          methodArgs[1],
          methodArgs[2],
          BURN_ADDRESS,
          '0',
          methodArgs[3],
        ),
      );
      break;
    }
    case 'depositAgentStakingRewards': {
      await submitWrite(activeDef.title, (contract) =>
        (contract as any).depositStakingRewards(
          AGENT_ACCOUNT_TYPE,
          methodArgs[0],
          methodArgs[1],
          methodArgs[2],
          methodArgs[3],
          methodArgs[4],
          methodArgs[5],
        ),
      );
      break;
    }
    default:
      await submitWrite(`${activeDef.title}(${methodArgs.join(', ')})`, (contract) => (contract as any)[selectedMethod](...methodArgs));
      break;
  }

  setStatus(`${activeDef.title} complete.`);
}

