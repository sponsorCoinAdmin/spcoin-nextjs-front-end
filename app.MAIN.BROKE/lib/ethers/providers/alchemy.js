import ethers from "ethers"
const ALCHEMY_ID = process.env.NEXT_PUBLIC_POLYGON_ALCHEMY_ID === undefined ? "0" : process.env.NEXT_PUBLIC_POLYGON_ALCHEMY_ID
const chainId = 1;
const network = "mainnet";

// const network = ethers.getNetwork(chainId)

const { provider, signer } = alchemy = async () => {
    let provider = new ethers.providers.AlchemyProvider(network, ALCHEMY_ID)
    let signer = await provider.getSigner();
    return ( provider, signer )
};

const getWallet = async () => {
  let wallet = ethers.Wallet("aaa")
}

const balanceOf = ( walletAddr, tokenAddr ) => {
  try {
    let balanceOf = provider.getBalanceOf(walletAddr);
    return balanceOf;
  } catch (e) {
    console.error(m.message);
    return "ERROR" + e.message;
  }
}

export { balanceOf }
