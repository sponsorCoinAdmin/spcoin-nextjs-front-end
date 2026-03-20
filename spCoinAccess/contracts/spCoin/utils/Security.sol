// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;
import "../dataTypes/SpCoinDataTypes.sol";

import "hardhat/console.sol";

contract Security is SpCoinDataTypes {
    address private  rootAdmin;
 
    constructor()  {
        rootAdmin = msg.sender;
    }

    modifier onlyRootAdmin () {
        require (msg.sender == rootAdmin, "ROOT_ONLY");
        _;
    }

    // modifier onlyOwner (address _account) {
    //     require (msg.sender == _account, "Owner Security Access Violation");
    //     _;
    // }

    modifier onlyOwnerOrRootAdmin (string memory callingMethod, address _account) {
        // console.log(callingMethod, " => onlyOwnerOrRootAdmin (", _account, msg.sender);
        require (msg.sender == rootAdmin || msg.sender == _account, "OWNER_OR_ROOT");
        _;
    }

    modifier nonRedundantRecipient (address _sponsorKey, address _recipientKey) {
        require (_sponsorKey != _recipientKey , "RECIP_DUP");
        _;
    }

    modifier nonRedundantAgent (address _recipientKey, address _agentKey) {
        require (msg.sender != _recipientKey && 
                 _recipientKey != _agentKey && 
                 msg.sender != _agentKey , "AGENT_DUP");
        _;
    }

    /// @notice determines if address Record is inserted in accountKey array
    /// @param _accountKey public accountKey validate Insertion
    function isAccountInserted(address _accountKey)
        public view returns (bool) {
        if (accountMap[_accountKey].inserted) 
            return true;
        else
            return false;
    }

    function getInflationRate() public view returns (uint256) {
        return annualInflation;
    }

    function setInflationRate(uint256 newInflationRate) public onlyRootAdmin {
        annualInflation = newInflationRate;
    }

    function getLowerRecipientRate() public view returns (uint256) {
        return lowerRecipientRate;
    }

    function getUpperRecipientRate() public view returns (uint256) {
        return upperRecipientRate;
    }

    function getRecipientRateRange() public view returns (uint256 lowerRate, uint256 upperRate) {
        return (lowerRecipientRate, upperRecipientRate);
    }

    function setLowerRecipient(uint256 newLowerRecipientRate) public onlyRootAdmin {
        require(newLowerRecipientRate <= upperRecipientRate, "REC_LOW_GT_UP");
        lowerRecipientRate = newLowerRecipientRate;
    }

    function setUpperRecipient(uint256 newUpperRecipientRate) public onlyRootAdmin {
        require(newUpperRecipientRate >= lowerRecipientRate, "REC_UP_LT_LOW");
        upperRecipientRate = newUpperRecipientRate;
    }

    function setRecipientRateRange(uint256 newLowerRecipientRate, uint256 newUpperRecipientRate) public onlyRootAdmin {
        setLowerRecipient(newLowerRecipientRate);
        setUpperRecipient(newUpperRecipientRate);
    }

    function getLowerAgentRate() public view returns (uint256) {
        return lowerAgentRate;
    }

    function getUpperAgentRate() public view returns (uint256) {
        return upperAgentRate;
    }

    function getAgentRateRange() public view returns (uint256 lowerRate, uint256 upperRate) {
        return (lowerAgentRate, upperAgentRate);
    }

    function setLowerAgent(uint256 newLowerAgentRate) public onlyRootAdmin {
        require(newLowerAgentRate <= upperAgentRate, "AG_LOW_GT_UP");
        lowerAgentRate = newLowerAgentRate;
    }

    function setUpperAgent(uint256 newUpperAgentRate) public onlyRootAdmin {
        require(newUpperAgentRate >= lowerAgentRate, "AG_UP_LT_LOW");
        upperAgentRate = newUpperAgentRate;
    }

    function setAgentRateRange(uint256 newLowerAgentRate, uint256 newUpperAgentRate) public onlyRootAdmin {
        setLowerAgent(newLowerAgentRate);
        setUpperAgent(newUpperAgentRate);
    }

    function validateRecipientRateRange(uint256 _recipientRateKey) internal view {
        require(
            _recipientRateKey >= lowerRecipientRate && _recipientRateKey <= upperRecipientRate,
            "REC_RATE_OOR"
        );
    }

    function validateAgentRateRange(uint256 _agentRateKey) internal view {
        require(
            _agentRateKey >= lowerAgentRate && _agentRateKey <= upperAgentRate,
            "AG_RATE_OOR"
        );
    }


/*
    modifier validateSufficientAccountBalance (uint256 _amount) {
       require(balanceOf[msg.sender] >= _amount, "Insufficient Balance");
        _;
    }
*/
}
