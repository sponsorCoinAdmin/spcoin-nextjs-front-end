// File: spCoinAccess/packages/spcoin-common/spcoin-lib.js
function stringifyBigInt(value, headerStr, trailerStr) {
  const replacer = (_key, v) => (typeof v === 'bigint' ? v.toString() : v);
  const payload = JSON.stringify(value, replacer, 2);
  if (headerStr || trailerStr) {
    return `${headerStr || ''}${payload}${trailerStr || ''}`;
  }
  return payload;
}

module.exports = {
  stringifyBigInt,
};
