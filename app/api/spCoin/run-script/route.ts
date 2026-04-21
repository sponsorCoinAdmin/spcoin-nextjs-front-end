import { promises as fs } from 'fs';
import path from 'path';
import { JsonRpcProvider, Wallet, Contract, Interface } from 'ethers';
import { NextRequest, NextResponse } from 'next/server';
import { createSpCoinModuleAccess, type SpCoinAccessSource } from '@/app/(menu)/(dynamic)/SponsorCoinLab/jsonMethods/shared/spCoinAccessIncludes';
import { getSpCoinLabAbi } from '@/app/(menu)/(dynamic)/SponsorCoinLab/jsonMethods/shared/spCoinAbi';
import { CHAIN_ID } from '@/lib/structure';
import { getDefaultNetworkSettings } from '@/lib/utils/network/defaultSettings';

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

const hardhatDefaultSettings = getDefaultNetworkSettings(CHAIN_ID.HARDHAT_BASE) as {
  networkHeader?: { rpcUrl?: string };
};
const DEFAULT_SERVER_HARDHAT_RPC_URL =
  String(hardhatDefaultSettings?.networkHeader?.rpcUrl || '').trim() ||
  'https://rpc.sponsorcoin.org/f5b4d4b4a2614a540189b979d068639c3fd44bbb1dfcdb5a';
const TEST_ACCOUNTS_PATH = path.join(
  process.cwd(),
  'public',
  'assets',
  'spCoinLab',
  'networks',
  '31337',
  'testAccounts.json',
);

const SP_COIN_ERROR_MESSAGES: Record<number, string> = {
  0: 'RECIP_RATE_NOT_FOUND',
  1: 'AGENT_RATE_NOT_FOUND',
  2: 'RECIP_RATE_HAS_AGENT',
  3: 'AGENT_NOT_FOUND',
  4: 'OWNER_OR_ROOT',
};
const SP_COIN_ERROR_INTERFACE = new Interface(['error SpCoinError(uint8 code)']);

function decodeSpCoinError(error: unknown): string | null {
  const revert = (error as any)?.revert;
  const revertCode = revert?.name === 'SpCoinError' ? Number(revert?.args?.[0]) : NaN;
  if (Number.isFinite(revertCode)) {
    return `${SP_COIN_ERROR_MESSAGES[revertCode] || 'UNKNOWN_SP_COIN_ERROR'} (${revertCode})`;
  }

  const candidates = [
    (error as any)?.data,
    (error as any)?.error?.data,
    (error as any)?.info?.error?.data,
  ].filter((value): value is string => typeof value === 'string' && value.startsWith('0x'));

  for (const data of candidates) {
    try {
      const parsed = SP_COIN_ERROR_INTERFACE.parseError(data);
      if (parsed?.name === 'SpCoinError') {
        const code = Number(parsed.args?.[0]);
        return `${SP_COIN_ERROR_MESSAGES[code] || 'UNKNOWN_SP_COIN_ERROR'} (${code})`;
      }
    } catch {
      // Keep looking through nested provider error payloads.
    }
  }
  return null;
}

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
            case 'getAccountKeys':
            case 'getMasterAccountKeys':
            case 'getMasterAccountList':
              result =
                typeof access.read.getMasterAccountKeys === 'function'
                  ? await access.read.getMasterAccountKeys()
                  : typeof access.read.getAccountKeys === 'function'
                    ? await access.read.getAccountKeys()
                  : [];
              break;
            case 'getAccountRecord':
              result = await access.read.getAccountRecord(findParam('Account Key'));
              break;
            case 'getMasterAccountCount':
            case 'getAccountKeyCount':
            case 'getAccountListSize':
            case 'getMasterAccountListSize':
              if (typeof (contract as Record<string, unknown>).getAccountKeyCount === 'function') {
                result = Number(await (contract as unknown as { getAccountKeyCount: () => Promise<unknown> }).getAccountKeyCount());
              } else if (typeof (access.read as Record<string, unknown>).getMasterAccountCount === 'function') {
                result = await (access.read as unknown as { getMasterAccountCount: () => Promise<unknown> }).getMasterAccountCount();
              } else if (typeof access.read.getAccountKeyCount === 'function') {
                result = await access.read.getAccountKeyCount();
              } else if (typeof (access.read as Record<string, unknown>).getAccountListSize === 'function') {
                result = await (access.read as unknown as { getAccountListSize: () => Promise<unknown> }).getAccountListSize();
              } else {
                const list =
                  typeof (contract as Record<string, unknown>).getMasterAccountKeys === 'function'
                    ? await (contract as unknown as { getMasterAccountKeys: () => Promise<unknown> }).getMasterAccountKeys()
                    : typeof access.read.getMasterAccountKeys === 'function'
                      ? await access.read.getMasterAccountKeys()
                    : typeof access.read.getAccountKeys === 'function'
                      ? await access.read.getAccountKeys()
                      : [];
                result = Array.isArray(list) ? list.length : 0;
              }
              break;
            default:
              throw new Error(`Server runner does not support read method ${String(step.method)} yet.`);
          }
        } else if (step.panel === 'spcoin_write') {
          switch (step.method) {
            case 'addRecipient':
            case 'addSponsorRecipient':
            case 'addAccountRecipient': {
              const sponsorKey = findParam('Sponsor Key') || senderAddress;
              const recipientKey = findParam('Recipient Key');
              const addSponsorRecipient = (contract as unknown as {
                addSponsorRecipient?: (sponsorKey: string, recipientKey: string) => Promise<{ wait: () => Promise<unknown>; hash?: string }>;
              }).addSponsorRecipient;
              const tx =
                typeof addSponsorRecipient === 'function'
                  ? await addSponsorRecipient(sponsorKey, recipientKey)
                  : await access.add.addRecipient(recipientKey);
              const receipt = await tx.wait();
              result = formatReceiptResult(
                'addSponsorRecipient',
                tx,
                receipt as { hash?: string; blockNumber?: bigint | number | null; status?: number | bigint | null },
              );
              break;
            }
            case 'addRecipientTransaction':
            case 'addRecipientTransaction':
            case 'addRecipientRateAmount':
            case 'addAccountRecipientRate':
            case 'addSponsorship': {
              const sponsorKey = findParam('Sponsor Key') || senderAddress;
              const recipientKey = findParam('Recipient Key');
              const recipientRateKey = findParam('Recipient Rate Key');
              const transactionQty = findParam('Transaction Quantity');
              const addRecipientTransaction = access.add.addRecipientTransaction ?? access.add.addRecipientTransaction;
              if (typeof addRecipientTransaction !== 'function') {
                throw new Error('addRecipientTransaction is not available on the current SpCoin access path.');
              }
              const tx = await addRecipientTransaction(
                sponsorKey,
                recipientKey,
                recipientRateKey,
                transactionQty,
              );
              const receipt = await tx.wait();
              result = formatReceiptResult('addRecipientTransaction', tx, receipt);
              break;
            }
            case 'addRecipientAgent':
            case 'addAgent': {
              const sponsorKey = findParam('Sponsor Key') || senderAddress;
              const recipientKey = findParam('Recipient Key');
              const recipientRateKey = findParam('Recipient Rate Key');
              const agentKey = findParam('Agent Key');
              const tx = await access.add.addRecipientAgent(sponsorKey, recipientKey, recipientRateKey, agentKey);
              const receipt = await tx.wait();
              result = formatReceiptResult('addRecipientAgent', tx, receipt);
              break;
            }
            case 'addAgentTransaction':
            case 'addAgentTransaction':
            case 'addAgentRateAmount':
            case 'addAccountAgentRate':
            case 'addAgentSponsorship': {
              const sponsorKey = findParam('Sponsor Key') || senderAddress;
              const recipientKey = findParam('Recipient Key');
              const recipientRateKey = findParam('Recipient Rate Key');
              const agentKey = findParam('Agent Key');
              const agentRateKey = findParam('Agent Rate Key');
              const transactionQty = findParam('Transaction Quantity');
              const addAgentTransaction = access.add.addAgentTransaction ?? access.add.addAgentTransaction;
              if (typeof addAgentTransaction !== 'function') {
                throw new Error('addAgentTransaction is not available on the current SpCoin access path.');
              }
              const tx = await addAgentTransaction(
                sponsorKey,
                recipientKey,
                recipientRateKey,
                agentKey,
                agentRateKey,
                transactionQty,
              );
              const receipt = await tx.wait();
              result = formatReceiptResult('addAgentTransaction', tx, receipt);
              break;
            }
            case 'addBackDatedSponsorship':
            case 'addBackDatedRecipientSponsorship':
            case 'addBackDatedRecipientTransaction':
            case 'addAccountRecipientRateBackdated': {
              const sponsorKey = findParam('Sponsor Key');
              const recipientKey = findParam('Recipient Key');
              const recipientRateKey = findParam('Recipient Rate Key');
              const wholeAmount = findParam('Whole Amount');
              const decimalAmount = findParam('Decimal Amount');
              const explicitQty = findParam('Transaction Quantity');
              const backDate = findParam('Transaction Back Date');
              const transactionQty = explicitQty || `${wholeAmount}.${decimalAmount}`;
              const tx = await access.add.addBackDatedRecipientTransaction(
                signer,
                sponsorKey,
                recipientKey,
                recipientRateKey,
                transactionQty,
                Math.floor(new Date(backDate).getTime() / 1000),
              );
              const receipt = await tx.wait();
              result = formatReceiptResult('addBackDatedRecipientTransaction', tx, receipt);
              break;
            }
            case 'addBackDatedAgentSponsorship':
            case 'addBackDatedAgentTransaction':
            case 'addAccountAgentRateBackdated': {
              const sponsorKey = findParam('Sponsor Key');
              const recipientKey = findParam('Recipient Key');
              const recipientRateKey = findParam('Recipient Rate Key');
              const agentKey = findParam('Agent Key');
              const agentRateKey = findParam('Agent Rate Key');
              const transactionQty = findParam('Transaction Quantity');
              const backDate = findParam('Transaction Back Date');
              const tx = await access.add.addBackDatedAgentTransaction(
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
              result = formatReceiptResult('addBackDatedAgentTransaction', tx, receipt);
              break;
            }
            case 'backDateRecipientTransaction': {
              const sponsorKey = findParam('Sponsor Key');
              const recipientKey = findParam('Recipient Key');
              const recipientRateKey = findParam('Recipient Rate Key');
              const transactionIndex = findParam('Transaction Row Id');
              const backDate = findParam('Transaction Back Date');
              const tx = await access.add.backDateRecipientTransaction(
                signer,
                sponsorKey,
                recipientKey,
                recipientRateKey,
                transactionIndex,
                Math.floor(new Date(backDate).getTime() / 1000),
              );
              const receipt = await tx.wait();
              result = formatReceiptResult('backDateRecipientTransaction', tx, receipt);
              break;
            }
            case 'backDateAgentTransaction': {
              const sponsorKey = findParam('Sponsor Key');
              const recipientKey = findParam('Recipient Key');
              const recipientRateKey = findParam('Recipient Rate Key');
              const agentKey = findParam('Agent Key');
              const agentRateKey = findParam('Agent Rate Key');
              const transactionIndex = findParam('Transaction Row Id');
              const backDate = findParam('Transaction Back Date');
              const tx = await access.add.backDateAgentTransaction(
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
              result = formatReceiptResult('backDateAgentTransaction', tx, receipt);
              break;
            }
            case 'deleteRecipient': {
              const sponsorKey = findParam('Sponsor Key');
              const recipientKey = findParam('Recipient Key');
              const deleteRecipient = (contract as unknown as { deleteRecipient?: (sponsor: string, recipient: string) => Promise<{ wait: () => Promise<unknown>; hash?: string }> }).deleteRecipient;
              if (typeof deleteRecipient !== 'function') {
                throw new Error('deleteRecipient is not available on the current SpCoin contract access path.');
              }
              const tx = await deleteRecipient(sponsorKey, recipientKey);
              const receipt = await tx.wait();
              result = formatReceiptResult(
                'deleteRecipient',
                tx,
                receipt as { hash?: string; blockNumber?: bigint | number | null; status?: number | bigint | null },
              );
              break;
            }
            case 'deleteAgentNode': {
              const sponsorKey = findParam('Sponsor Key') || senderAddress;
              const recipientKey = findParam('Recipient Key');
              const recipientRateKey = findParam('Recipient Rate Key');
              const agentKey = findParam('Agent Key');
              const deleteRecipientAgent = (
                contract as unknown as {
                  deleteRecipientAgent?: (
                    sponsorKey: string,
                    recipientKey: string,
                    recipientRateKey: string | number,
                    agentKey: string,
                  ) => Promise<{ wait: () => Promise<unknown>; hash?: string }>;
                }
              ).deleteRecipientAgent;
              if (typeof deleteRecipientAgent !== 'function') {
                throw new Error('deleteRecipientAgent is not available on the current SpCoin contract access path.');
              }
              const tx = await deleteRecipientAgent(sponsorKey, recipientKey, recipientRateKey, agentKey);
              const receipt = await tx.wait();
              result = formatReceiptResult(
                String(step.method),
                tx,
                receipt as { hash?: string; blockNumber?: bigint | number | null; status?: number | bigint | null },
              );
              break;
            }
            case 'delAccountAgentSponsorship':
            case 'deleteAgentRateNode':
            case 'deleteAgentRate': {
              const sponsorKey = findParam('Sponsor Key') || senderAddress;
              const recipientKey = findParam('Recipient Key');
              const recipientRateKey = findParam('Recipient Rate Key');
              const agentKey = findParam('Agent Key');
              const agentRateKey = findParam('Agent Rate Key');
              const deleteAgentRate = (
                contract as unknown as {
                  deleteAgentRate?: (
                    sponsorKey: string,
                    recipientKey: string,
                    recipientRateKey: string | number,
                    agentKey: string,
                    agentRateKey: string | number,
                  ) => Promise<{ wait: () => Promise<unknown>; hash?: string }>;
                }
              ).deleteAgentRate;
              if (typeof deleteAgentRate !== 'function') {
                throw new Error('deleteAgentRate is not available on the current SpCoin contract access path.');
              }
              const tx = await deleteAgentRate(sponsorKey, recipientKey, recipientRateKey, agentKey, agentRateKey);
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
        const spCoinError = decodeSpCoinError(error);
        results.push({
          step: step.step,
          success: false,
          payload: {
            call: buildCall(step, explicitSender, paramEntries),
            error: {
              message: spCoinError || (error instanceof Error ? error.message : String(error)),
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
