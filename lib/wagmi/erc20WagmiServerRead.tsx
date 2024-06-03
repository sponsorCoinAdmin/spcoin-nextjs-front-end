import { readContract } from '@wagmi/core'
import config from 'next/config';
import { erc20Abi, getAddress, Address } from 'viem';

//  *** IMPORTANT NOT WORKING MODULE ***
// ToDo: IMPORTANT readContract is currently not working, needs a fix
const getERC20WagmiServerBalanceOfRec = async (walletAddress: Address | string | undefined, contractAddress: Address | string | undefined) => {
  // console.debug(`getServerERC20WagmiBalanceOfRec:walletAddress = ${walletAddress}, contractAddress = ${contractAddress}`)
  let wagmiBalanceOfRec;

  if (contractAddress !== undefined && walletAddress !== undefined) {

    /*
    readContract<config extends Config,
                        const abi extends Abi | readonly unknown[],
                        functionName extends ContractFunctionName<abi, 'pure' | 'view'>,
                        args extends ContractFunctionArgs<abi, 'pure' | 'view',
                        functionName>>
                        (config: config, parameters: ReadContractParameters<abi, functionName, args, config>):
    */
    let  wagmiBalanceOfRec:any = "Please Fix";

    wagmiBalanceOfRec = readContract({
      abi: erc20Abi,
      address: getAddress(contractAddress.toString()),
      functionName: 'balanceOf',
      args: [getAddress(walletAddress.toString())],
      config, 
    })
  }
  console.debug(`balanceOfRec = ${JSON.stringify(wagmiBalanceOfRec, (_, v) => typeof v === 'bigint' ? v.toString() : v,2)}`)
  return "wagmiBalanceOfRec";
}

// let ACTIVE_WALLET_ACCOUNT:Address|undefined;
const ACTIVE_WALLET_ACCOUNT:Address  = '0x858BDEe77B06F29A3113755F14Be4B23EE6D6e59'
const USDT_POLYGON_CONTRACT:Address  = '0xc2132D05D31c914a87C6611C10748AEb04B58e8F'
const CHKN_ETHEREUM_CONTRACT:Address = '0xD55210Bb6898C021a19de1F58d27b71f095921Ee'
const NULL_CONTRACT:Address          = '0x0000000000000000000000000000000000000000';
const TOKEN_CONTRACT:Address         = USDT_POLYGON_CONTRACT


export const getTestName = async () => {
  console.log(`getTestName = ${getTestName}`)
  let balanceOf = await getERC20WagmiServerBalanceOfRec(ACTIVE_WALLET_ACCOUNT, TOKEN_CONTRACT || "")
  return `balanceOf = ${balanceOf}`
}
