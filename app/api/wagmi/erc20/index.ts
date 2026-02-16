// File: app/api/wagmi/erc20/index.ts
export { GET as getErc20BalanceOf } from './balanceOf/route';
export { GET as getErc20Name } from './name/route';
export { GET as getErc20Symbol } from './symbol/route';
export { GET as getErc20Decimals } from './decimals/route';
export { GET as getErc20TotalSupply } from './totalSupply/route';
export { GET as getErc20Allowance } from './allowance/route';

export * from './_shared';
