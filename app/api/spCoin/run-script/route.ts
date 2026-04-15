import { promises as fs } from 'fs';
import path from 'path';
import { JsonRpcProvider, Wallet, Contract } from 'ethers';
import { NextRequest, NextResponse } from 'next/server';
import { createSpCoinModuleAccess, type SpCoinAccessSource } from '@/app/(menu)/(dynamic)/SponsorCoinLab/jsonMethods/shared/spCoinAccessIncludes';
import { getSpCoinLabAbi } from '@/app/(menu)/(dynamic)/SponsorCoinLab/jsonMethods/shared/spCoinAbi';

type LabScriptParam = {
  key: string;
  value: string;
};

type LabScriptStep = {
  step: number;
  name: string;
  panel: string;
  method: string;
  params?: LabScriptParam[] | Record<string, unknown>;
  breakpoint?: boolean;
  hasMissingRequiredParams?: boolean;
  network?: string;
  mode?: 'metamask' | 'hardhat';
  'msg.sender'?: string;
};

type LabScript = {
  id: string;
  name: string;
  network?: string;
  steps: LabScriptStep[];
};

type RunScriptRequest = {
  script?: LabScript;
  contractAddress?: string;
  rpcUrl?: string;
  startIndex?: number;
  stopAfterCurrentStep?: boolean;
  spCoinAccessSource?: SpCoinAccessSource;
};

type StepPayload =
  | {
      call: {
        method: string;
        parameters: Record<string, string> | [];
      };
      result: unknown;
    }
  | {
      call: {
        method: string;
        parameters: Record<string, string> | [];
      };
      error: {
        message: string;
        name: string;
        classification?: 'token_state' | 'token_revert' | 'transport' | 'server';
        stack?: { message?: string };
        debug: {
          panel: string;
          source: string;
          method: string;
          trace: string[];
        };
      };
    };

type StepResult = {
  step: number;
  success: boolean;
  payload: StepPayload;
};

const DEFAULT_SERVER_HARDHAT_RPC_URL = 'http://127.0.0.1:8545';
const TEST_ACCOUNTS_PATH = path.join(
  process.cwd(),
  'public',
  'assets',
  'spCoinLab',
  'networks',
  '31337',
  'testAccounts.json',
);

function classifyScriptError(error: unknown, trace: string[]): 'token_state' | 'token_revert' | 'transport' | 'server' {
  const message = String((error as { message?: unknown } | null)?.message || error || '').toLowerCase();
  const stack = String((error as { stack?: unknown } | null)?.stack || '').toLowerCase();
  const combined = `${message}\n${stack}\n${trace.join('\n').toLowerCase()}`;

  if (
    combined.includes('receipt was mined but neither isaccountinserted') ||
    combined.includes('recipient inserted visibility fallback') ||
    combined.includes('sponsor recipient visibility fallback')
  ) {
    return 'token_state';
  }

  if (
    combined.includes('execution reverted') ||
    combined.includes('reverted on-chain') ||
    combined.includes('recip_') ||
    combined.includes('agent_') ||
    combined.includes('account_not_found') ||
    combined.includes('owner_or_root') ||
    combined.includes('root_only')
  ) {
    return 'token_revert';
  }

  if (
    combined.includes('econnrefused') ||
    combined.includes('failed to fetch') ||
    combined.includes('network error') ||
    combined.includes('socket hang up') ||
    combined.includes('timeout') ||
    combined.includes('missing response') ||
    combined.includes('could not coalesce error')
  ) {
    return 'transport';
  }

  return 'server';
}

function normalizeAddress(value: string) {
  return String(value || '').trim().toLowerCase();
}

function normalizeParams(params: LabScriptStep['params']): Array<{ key: string; value: string }> {
  if (Array.isArray(params)) {
    return params.map((entry) => ({
      key: String(entry?.key || '').trim(),
      value: String(entry?.value || '').trim(),
    }));
  }

  if (params && typeof params === 'object') {
    return Object.entries(params).map(([key, value]) => ({
      key: String(key || '').trim(),
      value: String(value ?? '').trim(),
    }));
  }

  return [];
}

function buildCall(step: LabScriptStep, sender: string, paramEntries: Array<{ key: string; value: string }>) {
  const parameters: Record<string, string> = {};
  if (sender) {
    parameters['msg.sender'] = sender;
  }
  paramEntries.forEach((entry) => {
    if (entry.key) parameters[entry.key] = entry.value;
  });
  return {
    method: String(step.method || '').trim(),
    parameters,
  };
}

async function readHardhatAccounts() {
  const raw = await fs.readFile(TEST_ACCOUNTS_PATH, 'utf8');
  const parsed = JSON.parse(raw) as Array<{ address?: string; privateKey?: string }>;
  if (!Array.isArray(parsed)) {
    throw new Error('Hardhat testAccounts.json must contain an array.');
  }
  return parsed
    .map((entry) => ({
      address: String(entry?.address || '').trim(),
      privateKey: String(entry?.privateKey || '').trim(),
    }))
    .filter((entry) => entry.address && entry.privateKey);
}

function formatReceiptResult(
  label: string,
  tx: { hash?: string },
  receipt: { hash?: string; blockNumber?: bigint | number | null; status?: number | bigint | null } | null | undefined,
) {
  return [
    {
      label,
      txHash: String(tx?.hash || ''),
      receiptHash: String(receipt?.hash || tx?.hash || ''),
      blockNumber: String(receipt?.blockNumber ?? ''),
      status: String(receipt?.status ?? ''),
    },
  ];
}

function resolveStepMode(step: LabScriptStep, script: LabScript) {
  if (step.mode === 'hardhat') return 'hardhat';
  const stepNetwork = String(step.network || '').trim();
  const scriptNetwork = String(script.network || '').trim();
  if (/hardhat/i.test(stepNetwork) || /hardhat/i.test(scriptNetwork)) return 'hardhat';
  return 'metamask';
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as RunScriptRequest;
    const script = body?.script;
    const contractAddress = String(body?.contractAddress || '').trim();
    const rpcUrl = String(body?.rpcUrl || DEFAULT_SERVER_HARDHAT_RPC_URL).trim() || DEFAULT_SERVER_HARDHAT_RPC_URL;
    const startIndex = Math.max(0, Number(body?.startIndex ?? 0) || 0);
    const stopAfterCurrentStep = body?.stopAfterCurrentStep === true;
    const source: SpCoinAccessSource = body?.spCoinAccessSource === 'local' ? 'local' : 'node_modules';

    if (!script || !Array.isArray(script.steps)) {
      return NextResponse.json({ ok: false, message: 'A script with steps is required.' }, { status: 400 });
    }
    if (!/^0[xX][a-fA-F0-9]{40}$/.test(contractAddress)) {
      return NextResponse.json({ ok: false, message: 'A valid contract address is required.' }, { status: 400 });
    }

    const provider = new JsonRpcProvider(rpcUrl);

    const hardhatAccounts = await readHardhatAccounts();
    const traceBase = [`server run-script start; rpc=${rpcUrl}; contract=${contractAddress}; script=${script.name || script.id}`];
    const abi = getSpCoinLabAbi();
    const results: StepResult[] = [];

    let haltedReason: 'completed' | 'breakpoint' | 'step' | 'error' = 'completed';
    let nextStepNumber: number | null = null;

    for (let idx = startIndex; idx < script.steps.length; idx += 1) {
      const step = script.steps[idx];
      const paramEntries = normalizeParams(step.params);
      const explicitSender = String(step['msg.sender'] || '').trim();
      const stepMode = resolveStepMode(step, script);
      const stepTrace: string[] = [...traceBase, `step=${String(step.step)}`, `panel=${String(step.panel || '')}`, `method=${String(step.method || '')}`];

      try {
        if (stepMode !== 'hardhat') {
          throw new Error(`Server runner only supports hardhat steps right now. Step ${String(step.step)} is ${stepMode}.`);
        }

        const senderEntry =
          hardhatAccounts.find((entry) => normalizeAddress(entry.address) === normalizeAddress(explicitSender)) || hardhatAccounts[0];
        if (!senderEntry?.privateKey) {
          throw new Error(`Unable to resolve a hardhat signer for ${explicitSender || 'the requested step'}.`);
        }

        const signer = new Wallet(senderEntry.privateKey, provider);
        const senderAddress = explicitSender || signer.address;
        const contract = new Contract(contractAddress, abi, signer);
        const appendTrace = (line: string) => {
          const text = String(line || '').trim();
          if (text) stepTrace.push(text);
        };
        const access = createSpCoinModuleAccess(contract, signer, source, appendTrace);
        const findParam = (label: string) =>
          String(paramEntries.find((entry) => entry.key === label)?.value || '').trim();
        const call = buildCall(step, senderAddress, paramEntries);

        let result: unknown;
        if (step.panel === 'spcoin_rread') {
          switch (step.method) {
            case 'getMasterAccountList':
              result = await access.read.getMasterAccountList();
              break;
            case 'getAccountRecord':
              result = await access.read.getAccountRecord(findParam('Account Key'));
              break;
            case 'getAccountListSize':
              if (typeof (access.read as Record<string, unknown>).getAccountListSize === 'function') {
                result = await (access.read as unknown as { getAccountListSize: () => Promise<unknown> }).getAccountListSize();
              } else {
                const list = await access.read.getMasterAccountList();
                result = Array.isArray(list) ? list.length : 0;
              }
              break;
            default:
              throw new Error(`Server runner does not support read method ${String(step.method)} yet.`);
          }
        } else if (step.panel === 'spcoin_write') {
          switch (step.method) {
            case 'addRecipient':
            case 'addSponsorRecipientBranch':
            case 'addAccountRecipient': {
              const sponsorKey = findParam('Sponsor Key') || senderAddress;
              const recipientKey = findParam('Recipient Key');
              const addSponsorRecipientBranch = (contract as unknown as {
                addSponsorRecipientBranch?: (sponsorKey: string, recipientKey: string) => Promise<{ wait: () => Promise<unknown>; hash?: string }>;
              }).addSponsorRecipientBranch;
              const tx =
                typeof addSponsorRecipientBranch === 'function'
                  ? await addSponsorRecipientBranch(sponsorKey, recipientKey)
                  : await access.add.addRecipient(recipientKey);
              const receipt = await tx.wait();
              result = formatReceiptResult(
                'addSponsorRecipientBranch',
                tx,
                receipt as { hash?: string; blockNumber?: bigint | number | null; status?: number | bigint | null },
              );
              break;
            }
            case 'addRecipientRateTransaction':
            case 'addRecipientSponsoredTransaction':
            case 'addRecipientRateBranchAmount':
            case 'addRecipientRateAmount':
            case 'addAccountRecipientRate':
            case 'addSponsorship': {
              const sponsorKey = findParam('Sponsor Key') || senderAddress;
              const recipientKey = findParam('Recipient Key');
              const recipientRateKey = findParam('Recipient Rate Key');
              const transactionQty = findParam('Transaction Quantity');
              const tx = await (access.add.addRecipientRateTransaction ?? access.add.addRecipientRateBranchAmount)(
                sponsorKey,
                recipientKey,
                recipientRateKey,
                transactionQty,
              );
              const receipt = await tx.wait();
              result = formatReceiptResult('addRecipientRateTransaction', tx, receipt);
              break;
            }
            case 'addRecipientAgentBranch':
            case 'addAgent': {
              const sponsorKey = findParam('Sponsor Key') || senderAddress;
              const recipientKey = findParam('Recipient Key');
              const recipientRateKey = findParam('Recipient Rate Key');
              const agentKey = findParam('Agent Key');
              const tx = await access.add.addRecipientAgentBranch(sponsorKey, recipientKey, recipientRateKey, agentKey);
              const receipt = await tx.wait();
              result = formatReceiptResult('addRecipientAgentBranch', tx, receipt);
              break;
            }
            case 'addAgentSponsoredTransaction':
            case 'addAgentRateTransaction':
            case 'addAgentRateBranchAmount':
            case 'addAgentRateAmount':
            case 'addAccountAgentRate':
            case 'addAgentSponsorship': {
              const sponsorKey = findParam('Sponsor Key') || senderAddress;
              const recipientKey = findParam('Recipient Key');
              const recipientRateKey = findParam('Recipient Rate Key');
              const agentKey = findParam('Agent Key');
              const agentRateKey = findParam('Agent Rate Key');
              const transactionQty = findParam('Transaction Quantity');
              const tx = await (access.add.addAgentSponsoredTransaction ??
                access.add.addAgentRateTransaction ??
                access.add.addAgentRateBranchAmount)(
                sponsorKey,
                recipientKey,
                recipientRateKey,
                agentKey,
                agentRateKey,
                transactionQty,
              );
              const receipt = await tx.wait();
              result = formatReceiptResult('addAgentSponsoredTransaction', tx, receipt);
              break;
            }
            case 'addBackDatedSponsorship':
            case 'addBackDatedRecipientSponsorship':
            case 'addBackDatedRecipientRateAmount':
            case 'addAccountRecipientRateBackdated': {
              const sponsorKey = findParam('Sponsor Key');
              const recipientKey = findParam('Recipient Key');
              const recipientRateKey = findParam('Recipient Rate Key');
              const wholeAmount = findParam('Whole Amount');
              const decimalAmount = findParam('Decimal Amount');
              const explicitQty = findParam('Transaction Quantity');
              const backDate = findParam('Transaction Back Date');
              const transactionQty = explicitQty || `${wholeAmount}.${decimalAmount}`;
              const tx = await access.add.addBackDatedRecipientRateAmount(
                signer,
                sponsorKey,
                recipientKey,
                recipientRateKey,
                transactionQty,
                Math.floor(new Date(backDate).getTime() / 1000),
              );
              const receipt = await tx.wait();
              result = formatReceiptResult('addBackDatedRecipientRateAmount', tx, receipt);
              break;
            }
            case 'addBackDatedAgentSponsorship':
            case 'addBackDatedRecipientAgentRateAmount':
            case 'addAccountAgentRateBackdated': {
              const sponsorKey = findParam('Sponsor Key');
              const recipientKey = findParam('Recipient Key');
              const recipientRateKey = findParam('Recipient Rate Key');
              const agentKey = findParam('Agent Key');
              const agentRateKey = findParam('Agent Rate Key');
              const transactionQty = findParam('Transaction Quantity');
              const backDate = findParam('Transaction Back Date');
              const tx = await access.add.addBackDatedRecipientAgentRateAmount(
                signer,
                sponsorKey,
                recipientKey,
                recipientRateKey,
                agentKey,
                agentRateKey,
                transactionQty,
                Math.floor(new Date(backDate).getTime() / 1000),
              );
              const receipt = await tx.wait();
              result = formatReceiptResult('addBackDatedRecipientAgentRateAmount', tx, receipt);
              break;
            }
            case 'backDateRecipientTransactionDate': {
              const sponsorKey = findParam('Sponsor Key');
              const recipientKey = findParam('Recipient Key');
              const recipientRateKey = findParam('Recipient Rate Key');
              const transactionIndex = findParam('Transaction Row Id');
              const backDate = findParam('Transaction Back Date');
              const tx = await access.add.backDateRecipientTransactionDate(
                signer,
                sponsorKey,
                recipientKey,
                recipientRateKey,
                transactionIndex,
                Math.floor(new Date(backDate).getTime() / 1000),
              );
              const receipt = await tx.wait();
              result = formatReceiptResult('backDateRecipientTransactionDate', tx, receipt);
              break;
            }
            case 'backDateAgentTransactionDate': {
              const sponsorKey = findParam('Sponsor Key');
              const recipientKey = findParam('Recipient Key');
              const recipientRateKey = findParam('Recipient Rate Key');
              const agentKey = findParam('Agent Key');
              const agentRateKey = findParam('Agent Rate Key');
              const transactionIndex = findParam('Transaction Row Id');
              const backDate = findParam('Transaction Back Date');
              const tx = await access.add.backDateAgentTransactionDate(
                signer,
                sponsorKey,
                recipientKey,
                recipientRateKey,
                agentKey,
                agentRateKey,
                transactionIndex,
                Math.floor(new Date(backDate).getTime() / 1000),
              );
              const receipt = await tx.wait();
              result = formatReceiptResult('backDateAgentTransactionDate', tx, receipt);
              break;
            }
            case 'delRecipient': {
              const sponsorKey = findParam('Sponsor Key');
              const recipientKey = findParam('Recipient Key');
              const delRecipient = (contract as unknown as { delRecipient?: (sponsor: string, recipient: string) => Promise<{ wait: () => Promise<unknown>; hash?: string }> }).delRecipient;
              if (typeof delRecipient !== 'function') {
                throw new Error('delRecipient is not available on the current SpCoin contract access path.');
              }
              const tx = await delRecipient(sponsorKey, recipientKey);
              const receipt = await tx.wait();
              result = formatReceiptResult(
                'delRecipient',
                tx,
                receipt as { hash?: string; blockNumber?: bigint | number | null; status?: number | bigint | null },
              );
              break;
            }
            case 'deleteSponsor': {
              const sponsorKey = findParam('Sponsor Key') || findParam('Account Key') || senderAddress;
              const deleteSponsor = (contract as unknown as { deleteSponsor?: (sponsorKey: string) => Promise<{ wait: () => Promise<unknown>; hash?: string }> }).deleteSponsor;
              if (typeof deleteSponsor !== 'function') {
                throw new Error('deleteSponsor is not available on the current SpCoin contract access path.');
              }
              const tx = await deleteSponsor(sponsorKey);
              const receipt = await tx.wait();
              result = formatReceiptResult(
                'deleteSponsor',
                tx,
                receipt as { hash?: string; blockNumber?: bigint | number | null; status?: number | bigint | null },
              );
              break;
            }
            case 'delAccountAgentSponsorship':
            case 'deleteAgentRateBranch': {
              const sponsorKey = findParam('Sponsor Key') || senderAddress;
              const recipientKey = findParam('Recipient Key');
              const recipientRateKey = findParam('Recipient Rate Key');
              const agentKey = findParam('Agent Key');
              const agentRateKey = findParam('Agent Rate Key');
              const deleteAgentRateBranch = (
                contract as unknown as {
                  deleteAgentRateBranch?: (
                    sponsorKey: string,
                    recipientKey: string,
                    recipientRateKey: string | number,
                    agentKey: string,
                    agentRateKey: string | number,
                  ) => Promise<{ wait: () => Promise<unknown>; hash?: string }>;
                }
              ).deleteAgentRateBranch;
              if (typeof deleteAgentRateBranch !== 'function') {
                throw new Error('deleteAgentRateBranch is not available on the current SpCoin contract access path.');
              }
              const tx = await deleteAgentRateBranch(sponsorKey, recipientKey, recipientRateKey, agentKey, agentRateKey);
              const receipt = await tx.wait();
              result = formatReceiptResult(
                String(step.method),
                tx,
                receipt as { hash?: string; blockNumber?: bigint | number | null; status?: number | bigint | null },
              );
              break;
            }
            default:
              throw new Error(`Server runner does not support write method ${String(step.method)} yet.`);
          }
        } else {
          throw new Error(`Server runner does not support panel ${String(step.panel)} yet.`);
        }

        results.push({
          step: step.step,
          success: true,
          payload: {
            call,
            result,
          },
        });

        const nextStep = script.steps[idx + 1];
        if (stopAfterCurrentStep) {
          haltedReason = 'step';
          nextStepNumber = nextStep?.step ?? null;
          break;
        }
        if (nextStep?.breakpoint) {
          haltedReason = 'breakpoint';
          nextStepNumber = nextStep.step;
          break;
        }
      } catch (error) {
        const classification = classifyScriptError(error, stepTrace);
        results.push({
          step: step.step,
          success: false,
          payload: {
            call: buildCall(step, explicitSender, paramEntries),
            error: {
              message: error instanceof Error ? error.message : String(error),
              name: error instanceof Error ? error.name : typeof error,
              classification,
              ...(error instanceof Error && error.stack ? { stack: { message: error.stack } } : {}),
              debug: {
                panel: String(step.panel || ''),
                source,
                method: String(step.method || ''),
                trace: stepTrace,
              },
            },
          },
        });
        haltedReason = 'error';
        nextStepNumber = step.step;
        break;
      }
    }

    return NextResponse.json({
      ok: true,
      haltedReason,
      nextStepNumber,
      results,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown server script execution error.';
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
