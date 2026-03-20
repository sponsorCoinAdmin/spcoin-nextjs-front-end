const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const REPO_ROOT = process.cwd();
const CONTRACT_VARIANTS = [
  { label: 'current', root: path.join(REPO_ROOT, 'spCoinAccess', 'contracts', 'spCoin') },
  { label: 'backup', root: path.join(REPO_ROOT, 'spCoinAccess', 'contracts', 'spCoinOrig.BAK') },
];
const ENTRY_FILE = 'SPCoin.sol';
const ENTRY_CONTRACT = 'SPCoin';
const SOLC_VERSION = '0.8.18';
const EIP170_LIMIT_BYTES = 24576;

function toPosix(value) {
  return value.replace(/\\/g, '/');
}

function readUtf8(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function collectSoliditySourcesFromEntry(entryPath, sourceRoot, sources, visited = new Set()) {
  const resolvedEntryPath = path.resolve(entryPath);
  if (visited.has(resolvedEntryPath)) return;
  visited.add(resolvedEntryPath);

  const content = readUtf8(resolvedEntryPath);
  const relativeKey = toPosix(path.relative(sourceRoot, resolvedEntryPath));
  sources[relativeKey] = { content };

  const importPattern = /import\s+(?:(?:[^'"]+from\s+)?["']([^"']+)["']);/g;
  let match;
  while ((match = importPattern.exec(content)) !== null) {
    const rawImportPath = String(match[1] || '').trim();
    if (!rawImportPath || !rawImportPath.endsWith('.sol')) continue;
    if (rawImportPath === 'hardhat/console.sol') continue;

    const resolvedImportPath = path.resolve(path.dirname(resolvedEntryPath), rawImportPath);
    collectSoliditySourcesFromEntry(resolvedImportPath, sourceRoot, sources, visited);
  }
}

function compileVariant(variantRoot) {
  const sources = {};
  const entryPath = path.join(variantRoot, ENTRY_FILE);
  collectSoliditySourcesFromEntry(entryPath, variantRoot, sources);

  sources['hardhat/console.sol'] = {
    content: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;
library console {
  function log(string memory) internal pure {}
  function log(string memory, uint256) internal pure {}
  function log(string memory, address) internal pure {}
  function log(string memory, string memory) internal pure {}
}`,
  };

  const standardInput = {
    language: 'Solidity',
    sources,
    settings: {
      optimizer: { enabled: true, runs: 200 },
      outputSelection: {
        '*': {
          '*': ['abi', 'evm.bytecode.object', 'evm.deployedBytecode.object'],
        },
      },
    },
  };

  const result =
    process.platform === 'win32'
      ? spawnSync(
          'cmd.exe',
          ['/d', '/s', '/c', `npx.cmd --yes solc@${SOLC_VERSION} --standard-json`],
          {
            cwd: REPO_ROOT,
            input: JSON.stringify(standardInput),
            encoding: 'utf8',
            maxBuffer: 50 * 1024 * 1024,
          },
        )
      : spawnSync('npx', ['--yes', `solc@${SOLC_VERSION}`, '--standard-json'], {
          cwd: REPO_ROOT,
          input: JSON.stringify(standardInput),
          encoding: 'utf8',
          maxBuffer: 50 * 1024 * 1024,
        });

  if (result.error) {
    throw result.error;
  }

  const stdout = String(result.stdout || '');
  const stderr = String(result.stderr || '');
  const start = stdout.indexOf('{');
  const end = stdout.lastIndexOf('}');
  if (start < 0 || end < start) {
    throw new Error(`Unable to parse solc output.\nSTDERR:\n${stderr}\nSTDOUT:\n${stdout}`);
  }

  const payload = JSON.parse(stdout.slice(start, end + 1));
  const compileErrors = Array.isArray(payload.errors)
    ? payload.errors.filter((item) => item?.severity === 'error')
    : [];
  if (compileErrors.length > 0) {
    throw new Error(
      compileErrors.map((error) => error.formattedMessage || error.message || 'Unknown compiler error').join('\n'),
    );
  }

  const compiledContract = payload.contracts?.[ENTRY_FILE]?.[ENTRY_CONTRACT];
  const bytecodeObject = String(compiledContract?.evm?.bytecode?.object || '');
  const deployedBytecodeObject = String(compiledContract?.evm?.deployedBytecode?.object || '');
  if (!bytecodeObject || !deployedBytecodeObject) {
    throw new Error(`Compiled artifact missing bytecode for ${ENTRY_CONTRACT}.`);
  }

  return {
    abiLength: Array.isArray(compiledContract?.abi) ? compiledContract.abi.length : 0,
    creationBytes: Math.ceil(bytecodeObject.replace(/^0x/, '').length / 2),
    deployedBytes: Math.ceil(deployedBytecodeObject.replace(/^0x/, '').length / 2),
    sourceCount: Object.keys(sources).length,
  };
}

function formatSignedDelta(value) {
  return `${value > 0 ? '+' : ''}${value}`;
}

function formatMargin(bytes) {
  const delta = EIP170_LIMIT_BYTES - bytes;
  return `${formatSignedDelta(delta)} bytes vs EIP-170`;
}

function main() {
  const results = CONTRACT_VARIANTS.map((variant) => ({
    label: variant.label,
    root: variant.root,
    ...compileVariant(variant.root),
  }));

  const current = results.find((entry) => entry.label === 'current');
  const backup = results.find((entry) => entry.label === 'backup');

  console.log(`SPCoin contract size comparison`);
  console.log(`Compiler: solc ${SOLC_VERSION}`);
  console.log(`Entry: ${ENTRY_FILE}:${ENTRY_CONTRACT}`);
  console.log('');

  for (const result of results) {
    console.log(`[${result.label}] ${result.root}`);
    console.log(`  Sources: ${result.sourceCount}`);
    console.log(`  ABI entries: ${result.abiLength}`);
    console.log(`  Creation bytecode: ${result.creationBytes} bytes`);
    console.log(`  Deployed bytecode: ${result.deployedBytes} bytes (${formatMargin(result.deployedBytes)})`);
    console.log('');
  }

  if (current && backup) {
    console.log(`Delta current-vs-backup`);
    console.log(`  Creation bytecode: ${formatSignedDelta(current.creationBytes - backup.creationBytes)} bytes`);
    console.log(`  Deployed bytecode: ${formatSignedDelta(current.deployedBytes - backup.deployedBytes)} bytes`);
  }
}

try {
  main();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exit(1);
}
