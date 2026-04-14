const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const REPO_ROOT = process.cwd();
const CONTRACT_ROOT = path.join(REPO_ROOT, 'spCoinAccess', 'contracts', 'spCoin');
const ABI_PATH = path.join(REPO_ROOT, 'resources', 'data', 'ABIs', 'spcoinABI.json');
const SOLC_VERSION = '0.8.18';

function toPosix(value) {
  return value.replace(/\\/g, '/');
}

function collectSoliditySourcesFromEntry(entryPath, sourceRoot, sources, visited = new Set()) {
  const resolvedEntryPath = path.resolve(entryPath);
  if (visited.has(resolvedEntryPath)) return;
  visited.add(resolvedEntryPath);

  const content = fs.readFileSync(resolvedEntryPath, 'utf8');
  sources[toPosix(path.relative(sourceRoot, resolvedEntryPath))] = { content };

  const importPattern = /import\s+(?:(?:[^'"]+from\s+)?["']([^"']+)["']);/g;
  let match;
  while ((match = importPattern.exec(content)) !== null) {
    const importPath = String(match[1] || '').trim();
    if (!importPath || !importPath.endsWith('.sol') || importPath === 'hardhat/console.sol') continue;
    collectSoliditySourcesFromEntry(path.resolve(path.dirname(resolvedEntryPath), importPath), sourceRoot, sources, visited);
  }
}

const sources = {};
collectSoliditySourcesFromEntry(path.join(CONTRACT_ROOT, 'SPCoin.sol'), CONTRACT_ROOT, sources);
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
    viaIR: true,
    outputSelection: { '*': { '*': ['abi'] } },
  },
};

const result =
  process.platform === 'win32'
    ? spawnSync('cmd.exe', ['/d', '/s', '/c', `npx.cmd --yes solc@${SOLC_VERSION} --standard-json`], {
        cwd: REPO_ROOT,
        input: JSON.stringify(standardInput),
        encoding: 'utf8',
        maxBuffer: 50 * 1024 * 1024,
      })
    : spawnSync('npx', ['--yes', `solc@${SOLC_VERSION}`, '--standard-json'], {
        cwd: REPO_ROOT,
        input: JSON.stringify(standardInput),
        encoding: 'utf8',
        maxBuffer: 50 * 1024 * 1024,
      });

if (result.error) throw result.error;
const stdout = String(result.stdout || '');
const payload = JSON.parse(stdout.slice(stdout.indexOf('{'), stdout.lastIndexOf('}') + 1));
const errors = Array.isArray(payload.errors) ? payload.errors.filter((item) => item?.severity === 'error') : [];
if (errors.length) {
  throw new Error(errors.map((error) => error.formattedMessage || error.message || 'Unknown compiler error').join('\n'));
}

const abi = payload.contracts?.['SPCoin.sol']?.SPCoin?.abi;
if (!Array.isArray(abi)) throw new Error('Compiled artifact missing SPCoin ABI.');
fs.mkdirSync(path.dirname(ABI_PATH), { recursive: true });
fs.writeFileSync(ABI_PATH, `${JSON.stringify(abi, null, 2)}\n`);
console.log(`Wrote ${ABI_PATH} (${abi.length} entries).`);
