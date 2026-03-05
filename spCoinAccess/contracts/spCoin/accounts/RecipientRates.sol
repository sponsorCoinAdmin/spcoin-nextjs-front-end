// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;
/// @title ERC20 Contract
import "./Recipient.sol";

contract RecipientRates is Recipient {

    constructor() { }

    /// @notice insert recipients Agent
    /// @param _recipientKey public account key to get recipient array
    /// @param _recipientRateKey public account key to get recipient Rate for a given recipient
    function getRecipientRateRecord(address _sponsorKey, address _recipientKey, uint _recipientRateKey, uint _creationDate) 
    internal returns (RecipientRateStruct storage) {
        RecipientStruct storage recipientRecord = getRecipientRecord(_sponsorKey, _recipientKey);
        RecipientRateStruct storage recipientRateRecord = getRecipientRateRecordByKeys(_sponsorKey, _recipientKey, _recipientRateKey);
        if (!recipientRateRecord.inserted) {
            recipientRateRecord.recipientRate = _recipientRateKey;
            recipientRateRecord.inserted = true;
            recipientRateRecord.creationTime = _creationDate;
            // recipientRateRecord.stakedSPCoins = 0;
            recipientRecord.recipientRateList.push(_recipientRateKey);
        }
        return recipientRateRecord; 
    }

/*
    /// @notice insert recipients Agent
    /// @param _recipientKey public account key to get recipient array
    /// @param _recipientRateKey public account key to get recipient Rate for a given recipient
    function getRecipientRateRecord(address _sponsorKey, address _recipientKey, uint _recipientRateKey) 
    internal returns (RecipientRateStruct storage) {
        RecipientStruct storage recipientRecord = getRecipientRecord(_sponsorKey, _recipientKey);
        RecipientRateStruct storage recipientRateRecord = getRecipientRateRecordByKeys(_sponsorKey, _recipientKey, _recipientRateKey);
        if (!recipientRateRecord.inserted) {
            recipientRateRecord.recipientRate = _recipientRateKey;
            recipientRateRecord.inserted = true;
            recipientRateRecord.creationTime = block.timestamp;
            recipientRateRecord.stakedSPCoins = 0;
            recipientRecord.recipientRateList.push(_recipientRateKey);
        }
        return recipientRateRecord; 
    }
*/

    function getRecipientRateRecordByKeys(address _sponsorKey, address _recipientKey, uint _recipientRateKey)
    internal view  returns (RecipientRateStruct storage) {
        RecipientStruct storage recipientRecord = getRecipientRecordByKeys(_sponsorKey, _recipientKey) ;
        return recipientRecord.recipientRateMap[_recipientRateKey];
    }

    function getSerializedRecipientRateList(address _sponsorKey, address _recipientKey, uint256 _recipientRateKey) public view returns (string memory) {
        // console.log("ZZZZ RecipientRates.sol:getSerializedRecipientRateList ", ",", _sponsorKey,", "); 
        // console.log("ZZZZ", _recipientKey, ", ",  _recipientRateKey);
        RecipientRateStruct storage recipientRateRecord =  getRecipientRateRecordByKeys(_sponsorKey, _recipientKey, _recipientRateKey);
        string memory recipientRateRecordStr = toString(recipientRateRecord.creationTime);
        string memory lastUpdateTimeStr = toString(recipientRateRecord.lastUpdateTime);
        string memory stakedSPCoinsStr = toString(recipientRateRecord.stakedSPCoins);
        recipientRateRecordStr = concat(recipientRateRecordStr, ",", lastUpdateTimeStr, ",", stakedSPCoinsStr);
        // console.log("ZZZZ getSerializedRecipientRateList recipientRateRecordStr ", recipientRateRecordStr);
        return recipientRateRecordStr;
    }
}
