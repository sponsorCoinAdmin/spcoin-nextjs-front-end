// ToDo Write this
import { ethers } from "ethers";



const chainId = 1;
const network = ethers.getNetwork(chainId)
const provider = ethers.getDefaultProvider();
const balance = await provider.getBalance("address"); // ethers v6

// function balanceOf(address _owner) public view returns (uint256 balance)
