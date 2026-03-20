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
            validateRecipientRateRange(_recipientRateKey);
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

    function getRecipientRateRecordCore(address _sponsorKey, address _recipientKey, uint256 _recipientRateKey)
        public
        view
        returns (
            uint256 recipientRate,
            uint256 creationTime,
            uint256 lastUpdateTime,
            uint256 stakedSPCoins,
            bool inserted
        )
    {
        RecipientRateStruct storage recipientRateRecord = getRecipientRateRecordByKeys(_sponsorKey, _recipientKey, _recipientRateKey);
        recipientRate = recipientRateRecord.recipientRate;
        creationTime = recipientRateRecord.creationTime;
        lastUpdateTime = recipientRateRecord.lastUpdateTime;
        stakedSPCoins = recipientRateRecord.stakedSPCoins;
        inserted = recipientRateRecord.inserted;
    }
}
