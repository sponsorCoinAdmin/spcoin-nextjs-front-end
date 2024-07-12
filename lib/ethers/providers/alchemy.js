import ethers from "ethers"
const ALCHEMY_ID = process.env.NEXT_PUBLIC_ALCHEMY_POLYGON_KEY === undefined ? "0" : process.env.NEXT_PUBLIC_ALCHEMY_POLYGON_KEY
const chainId = 1;
const network = "mainnet";

// const network = ethers.getNetwork(chainId)

const { provider, signer } = alchemy = async () => {
    let provider = new ethers.providers.AlchemyProvider(network, ALCHEMY_ID)
    let signer = await provider.getSigner();
    return ( provider, signer )
};

const balanceOf = ( walletAddr, tokenAddr ) => {
  try {
    let balanceOf = provider.getBalanceOf(tokenAddr);
    return balanceOf;
  } catch (e) {
    console.error(m.message);
    return "ERROR: " + e.message;
  }
}

export { balanceOf }
