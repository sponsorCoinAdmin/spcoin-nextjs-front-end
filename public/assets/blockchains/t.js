const fs = require('fs');
const path = require('path');

const TARGET_ADDRESS = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';

fs.readdirSync('.').forEach((dir) => {
  const base = path.join(__dirname, dir);
  if (!fs.statSync(base).isDirectory() || isNaN(Number(dir))) return;

  const nativePath = path.join(base, 'contracts', TARGET_ADDRESS, 'info.json');
  const contractsDir = path.join(base, 'contracts');

  // Find first non-native info.json
  const candidates = fs.readdirSync(contractsDir).filter(
    (subdir) =>
      subdir.toLowerCase() !== TARGET_ADDRESS.toLowerCase() &&
      fs.existsSync(path.join(contractsDir, subdir, 'info.json'))
  );

  if (!fs.existsSync(nativePath) || candidates.length === 0) {
    console.warn(`⚠️ Skipping chain ${dir} — files missing`);
    return;
  }

  const wrappedPath = path.join(contractsDir, candidates[0], 'info.json');
  const nativeData = JSON.parse(fs.readFileSync(nativePath, 'utf8'));
  const wrappedData = JSON.parse(fs.readFileSync(wrappedPath, 'utf8'));

  const merged = {
    ...nativeData,
    name: wrappedData.name,
    symbol: wrappedData.symbol,
    website: wrappedData.website,
    description: wrappedData.description,
    explorer: wrappedData.explorer,
    status: wrappedData.status,
    id: wrappedData.id,
    tags: wrappedData.tags,
    links: wrappedData.links,
  };

  fs.writeFileSync(nativePath, JSON.stringify(merged, null, 2), 'utf8');
  console.log(`✅ Merged: ${nativePath}`);
});
