// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;
/// @title ERC20 Contract
import "./Recipient.sol";

contract RecipientRates is Recipient {

    constructor() { }

    /// @notice insert recipients Agent
    /// @param _recipientKey public account key to get recipient array
    /// @param _recipientRateKey public account key to get recipient Rate for a given recipient
    function getRecipientRateTransaction(address _sponsorKey, address _recipientKey, uint _recipientRateKey, uint _creationDate) 
    internal returns (RecipientRateStruct storage) {
        RecipientStruct storage recipientRecord = getRecipientRecord(_sponsorKey, _recipientKey);
        RecipientRateStruct storage recipientRateTransaction = getRecipientRateTransactionByKeys(_sponsorKey, _recipientKey, _recipientRateKey);
        if (!recipientRateTransaction.inserted) {
            recipientRateTransaction.recipientRate = _recipientRateKey;
            recipientRateTransaction.inserted = true;
            recipientRateTransaction.creationTime = _creationDate;
            // recipientRateTransaction.stakedSPCoins = 0;
            recipientRecord.recipientRateList.push(_recipientRateKey);
        }
        return recipientRateTransaction; 
    }

/*
    /// @notice insert recipients Agent
    /// @param _recipientKey public account key to get recipient array
    /// @param _recipientRateKey public account key to get recipient Rate for a given recipient
    function getRecipientRateTransaction(address _sponsorKey, address _recipientKey, uint _recipientRateKey) 
    internal returns (RecipientRateStruct storage) {
        RecipientStruct storage recipientRecord = getRecipientRecord(_sponsorKey, _recipientKey);
        RecipientRateStruct storage recipientRateTransaction = getRecipientRateTransactionByKeys(_sponsorKey, _recipientKey, _recipientRateKey);
        if (!recipientRateTransaction.inserted) {
            recipientRateTransaction.recipientRate = _recipientRateKey;
            recipientRateTransaction.inserted = true;
            recipientRateTransaction.creationTime = block.timestamp;
            recipientRateTransaction.stakedSPCoins = 0;
            recipientRecord.recipientRateList.push(_recipientRateKey);
        }
        return recipientRateTransaction; 
    }
*/

    function getRecipientRateTransactionByKeys(address _sponsorKey, address _recipientKey, uint _recipientRateKey)
    internal view  returns (RecipientRateStruct storage) {
        RecipientStruct storage recipientRecord = getRecipientRecordByKeys(_sponsorKey, _recipientKey) ;
        return recipientRecord.recipientRateMap[_recipientRateKey];
    }

    function getSerializedRecipientRateList(address _sponsorKey, address _recipientKey, uint256 _recipientRateKey) public view returns (string memory) {
        // console.log("ZZZZ RecipientRates.sol:getSerializedRecipientRateList ", ",", _sponsorKey,", "); 
        // console.log("ZZZZ", _recipientKey, ", ",  _recipientRateKey);
        RecipientRateStruct storage recipientRateTransaction =  getRecipientRateTransactionByKeys(_sponsorKey, _recipientKey, _recipientRateKey);
        string memory recipientRateTransactionStr = toString(recipientRateTransaction.creationTime);
        string memory lastUpdateTimeStr = toString(recipientRateTransaction.lastUpdateTime);
        string memory stakedSPCoinsStr = toString(recipientRateTransaction.stakedSPCoins);
        recipientRateTransactionStr = concat(recipientRateTransactionStr, ",", lastUpdateTimeStr, ",", stakedSPCoinsStr);
        // console.log("ZZZZ getSerializedRecipientRateList recipientRateTransactionStr ", recipientRateTransactionStr);
        return recipientRateTransactionStr;
    }
}
