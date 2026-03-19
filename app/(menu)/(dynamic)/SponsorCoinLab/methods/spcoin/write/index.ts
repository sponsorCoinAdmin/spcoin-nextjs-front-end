// File: app/(menu)/(dynamic)/SponsorCoinLab/methods/spcoin/write/index.ts
import type { Contract } from 'ethers';
import { SPCOIN_WRITE_METHOD_DEFS } from './defs';
export { SPCOIN_WRITE_METHOD_DEFS };
import { createSpCoinModuleAccess, type SpCoinAccessSource } from '../../shared';

export type SpCoinWriteMethod =
  | 'addRecipient'
  | 'addRecipients'
  | 'addAgent'
  | 'addAgents'
  | 'addSponsor'
  | 'addSponsorship'
  | 'addAgentSponsorship'
  | 'addBackDatedSponsorship'
  | 'addBackDatedAgentSponsorship'
  | 'deleteAccountFromMaster'
  | 'unSponsorRecipient'
  | 'deleteAccountRecord'
  | 'deleteAccountRecords'
  | 'updateAccountStakingRewards'
  | 'updateAgentAccountRewards'
  | 'updateRecipietAccountRewards'
  | 'updateSponsorAccountRewards'
  | 'depositSponsorStakingRewards'
  | 'depositRecipientStakingRewards'
  | 'depositAgentStakingRewards'
  | 'depositStakingRewards';

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
  spCoinAccessSource?: SpCoinAccessSource;
  appendLog: (line: string) => void;
  appendWriteTrace?: (line: string) => void;
  setStatus: (value: string) => void;
};

export async function runSpCoinWriteMethod(args: RunArgs): Promise<
  Array<{
    label: string;
    txHash: string;
    receiptHash: string;
    blockNumber: string;
    status: string;
  }>
> {
  const {
    selectedMethod,
    spWriteParams,
    coerceParamValue,
    executeWriteConnected,
    selectedHardhatAddress,
    spCoinAccessSource = 'node_modules',
    appendLog,
    appendWriteTrace,
    setStatus,
  } = args;
  if (
    selectedMethod === ('addAccountRecord' as string) ||
    selectedMethod === ('addAccountRecords' as string) ||
    selectedMethod === ('deleteAgentRecord' as string)
  ) {
    throw new Error(
      `${selectedMethod} is not available because it is not exposed as a callable public contract method in the current SpCoin access path.`,
    );
  }
  const activeDef = SPCOIN_WRITE_METHOD_DEFS[selectedMethod];
  if (!activeDef) {
    throw new Error(`Unsupported SpCoin write method: ${String(selectedMethod)}`);
  }
  const methodArgs = activeDef.params.map((def, idx) => coerceParamValue(spWriteParams[idx], def));
  const receipts: Array<{
    label: string;
    txHash: string;
    receiptHash: string;
    blockNumber: string;
    status: string;
  }> = [];
  const submitWrite = async (
    label: string,
    writeCall: (access: ReturnType<typeof createSpCoinModuleAccess>, signer: any) => Promise<any>,
  ) => {
    setStatus(`Submitting ${label}...`);
    appendWriteTrace?.(`submitWrite(${label}) start`);
    const tx = await executeWriteConnected(
      label,
      (contract: Contract, signer: any) => {
        const access = createSpCoinModuleAccess(contract, signer, spCoinAccessSource);
        return writeCall(access, signer);
      },
      selectedHardhatAddress,
    );
    appendWriteTrace?.(`submitWrite(${label}) tx returned=${tx ? 'yes' : 'no'} hash=${String(tx?.hash || '')}`);
    appendLog(`${label} tx sent: ${String(tx?.hash || '(no hash)')}`);
    if (!tx || typeof tx.wait !== 'function') {
      throw new Error(`${label} did not return a transaction response.`);
    }
    const receipt = await tx.wait();
    appendWriteTrace?.(`submitWrite(${label}) receipt status=${String(receipt?.status ?? '')} hash=${String(receipt?.hash || tx?.hash || '')}`);
    appendLog(`${label} mined: ${String(receipt?.hash || tx?.hash || '(no hash)')}`);
    receipts.push({
      label,
      txHash: String(tx?.hash || ''),
      receiptHash: String(receipt?.hash || tx?.hash || ''),
      blockNumber: String(receipt?.blockNumber ?? ''),
      status: String(receipt?.status ?? ''),
    });
  };

  switch (selectedMethod) {
    case 'addRecipients': {
      const recipientList = methodArgs[1] as string[];
      for (const recipientKey of recipientList) {
        await submitWrite(`addRecipient(${recipientKey})`, (access) => access.add.addRecipient(recipientKey));
      }
      break;
    }
    case 'addAgents': {
      const agentList = methodArgs[2] as string[];
      for (const agentKey of agentList) {
        await submitWrite(`addAgent(${String(methodArgs[0])}, ${String(methodArgs[1])}, ${agentKey})`, (access) =>
          access.add.addAgent(methodArgs[0], methodArgs[1], agentKey),
        );
      }
      break;
    }
    case 'addSponsorship': {
      const qty = `${String(methodArgs[4])}.${String(methodArgs[5])}`;
      await submitWrite(activeDef.title, (access, signer) =>
        access.add.addAgentSponsorship(signer, methodArgs[0], methodArgs[1], methodArgs[2], methodArgs[3], qty),
      );
      break;
    }
    case 'addAgentSponsorship': {
      const qty = String(methodArgs[4]);
      await submitWrite(activeDef.title, (access, signer) =>
        access.add.addAgentSponsorship(signer, methodArgs[0], methodArgs[1], methodArgs[2], methodArgs[3], qty),
      );
      break;
    }
    case 'addBackDatedSponsorship': {
      const qty = `${String(methodArgs[4])}.${String(methodArgs[5])}`;
      await submitWrite(activeDef.title, (access, signer) =>
        access.add.addBackDatedAgentSponsorship(
          signer,
          methodArgs[0],
          methodArgs[1],
          methodArgs[2],
          methodArgs[3],
          qty,
          methodArgs[6],
        ),
      );
      break;
    }
    case 'addBackDatedAgentSponsorship': {
      const qty = String(methodArgs[4]);
      await submitWrite(activeDef.title, (access, signer) =>
        access.add.addBackDatedAgentSponsorship(
          signer,
          methodArgs[0],
          methodArgs[1],
          methodArgs[2],
          methodArgs[3],
          qty,
          methodArgs[5],
        ),
      );
      break;
    }
    case 'addRecipient': {
      await submitWrite(activeDef.title, (access) => access.add.addRecipient(methodArgs[0]));
      break;
    }
    case 'addAgent': {
      await submitWrite(activeDef.title, (access) => access.add.addAgent(methodArgs[0], methodArgs[1], methodArgs[2]));
      break;
    }
    case 'deleteAccountRecords': {
      const accountList = methodArgs[0] as string[];
      for (const accountKey of accountList) {
        await submitWrite(`deleteAccountRecord(${accountKey})`, (access) => access.del.deleteAccountRecord(accountKey));
      }
      break;
    }
    case 'unSponsorRecipient': {
      await submitWrite(activeDef.title, (access) => (access.contract as any).unSponsorRecipient(methodArgs[0]));
      break;
    }
    case 'deleteAccountRecord': {
      await submitWrite(activeDef.title, (access, signer) => {
        access.del.signer = signer;
        return access.del.deleteAccountRecord(methodArgs[0]);
      });
      break;
    }
    case 'updateAccountStakingRewards': {
      await submitWrite(activeDef.title, (access) => access.rewards.updateAccountStakingRewards(methodArgs[0]));
      break;
    }
    case 'depositSponsorStakingRewards': {
      await submitWrite(activeDef.title, (access) =>
        access.staking.depositSponsorStakingRewards(methodArgs[0], methodArgs[1], methodArgs[2], methodArgs[3]),
      );
      break;
    }
    case 'depositRecipientStakingRewards': {
      await submitWrite(activeDef.title, (access) =>
        access.staking.depositRecipientStakingRewards(methodArgs[0], methodArgs[1], methodArgs[2], methodArgs[3]),
      );
      break;
    }
    case 'depositAgentStakingRewards': {
      await submitWrite(activeDef.title, (access) =>
        access.staking.depositAgentStakingRewards(
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
      await submitWrite(`${activeDef.title}(${methodArgs.join(', ')})`, (access) => {
        const readFn = (access.read as any)[selectedMethod];
        const addFn = (access.add as any)[selectedMethod];
        const delFn = (access.del as any)[selectedMethod];
        const stakingFn = (access.staking as any)[selectedMethod];
        const rewardsFn = (access.rewards as any)[selectedMethod];
        if (typeof addFn === 'function') return addFn(...methodArgs);
        if (typeof delFn === 'function') return delFn(...methodArgs);
        if (typeof stakingFn === 'function') return stakingFn(...methodArgs);
        if (typeof rewardsFn === 'function') return rewardsFn(...methodArgs);
        if (typeof readFn === 'function') return readFn(...methodArgs);
        return (access.contract as any)[selectedMethod](...methodArgs);
      });
      break;
  }

  setStatus(`${activeDef.title} complete.`);
  return receipts;
}

