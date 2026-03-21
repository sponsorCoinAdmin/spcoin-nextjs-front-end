// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "./Token.sol";

contract SPCoin is Token{

    constructor(string memory initialVersion)  {
//        logDetail("JS => MESSAGE.SENDER: ", msg.sender);
//        logDetail("JS => MESSAGE.SENDER: ", msg.sender);
// initToken(defaultName,  defaultSymbol, defaultDecimals, defaultTotalSupply);

        version = bytes(initialVersion).length == 0 ? defaultVersion : initialVersion;
        name = concat(defaultName, version);
        symbol = concat(defaultSymbol, version);
        decimals = defaultDecimals;
        balanceOf[msg.sender] = totalSupply = totalBalanceOf = defaultTotalSupply;
        stakedSPCoins = 0;
        // console.log("msg.sender = ", msg.sender);
        // console.log("balanceOf[msg.sender] = ", balanceOf[msg.sender]);
    }

    function getVersion() public view returns (string memory) {
        return version;
    }

    function getSpCoinMetaData()
        public
        view
        returns (
            string memory metaVersion,
            string memory metaName,
            string memory metaSymbol,
            uint256 metaDecimals,
            uint256 metaTotalSupply,
            uint256 metaInflationRate,
            uint256[2] memory metaRecipientRateRange,
            uint256[2] memory metaAgentRateRange
        )
    {
        (uint256 lowerRecipientRate, uint256 upperRecipientRate) = getRecipientRateRange();
        (uint256 lowerAgentRate, uint256 upperAgentRate) = getAgentRateRange();
        return (
            version,
            name,
            symbol,
            decimals,
            totalSupply,
            getInflationRate(),
            [lowerRecipientRate, upperRecipientRate],
            [lowerAgentRate, upperAgentRate]
        );
    }

    function setVersion(string memory newVersion) public onlyRootAdmin {
        version = bytes(newVersion).length == 0 ? defaultVersion : newVersion;
        name = concat(defaultName, version);
        symbol = concat(defaultSymbol, version);
    }

    /*
    function init() public {
        initToken(defaultName,  defaultSymbol, defaultDecimals, defaultTotalSupply);
    }

    function initToken(string memory _name, string memory _symbol, uint _decimals, uint _totalSupply) public onlyRootAdmin {
        name = _name;
        symbol = _symbol;
        decimals = _decimals;
        totalSupply = _totalSupply;
        balanceOf[msg.sender] = _totalSupply;
        stakedSPCoins = 0;
    }
*/

}
