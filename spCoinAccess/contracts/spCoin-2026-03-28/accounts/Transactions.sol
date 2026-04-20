// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;
/// @title ERC20 Contract
import "../rewardsManagement/RewardsManager.sol";

contract Transactions is RewardsManager {
    constructor() { }

    function addBackDatedSponsorship(address _sponsorKey,
                                 address _recipientKey, 
                                 uint _recipientRateKey,
                                 address _agentKey,
                                 uint _agentRateKey,
                                 string memory _strWholeAmount,
                                 string memory _strDecimalAmount,
                                  uint _transactionTimeStamp) 
    onlyRootAdmin
    public {
        _addSponsorshipForSponsor(
            _sponsorKey,
            _recipientKey,
            _recipientRateKey,
            _agentKey,
            _agentRateKey,
            _strWholeAmount,
            _strDecimalAmount,
            _transactionTimeStamp
        );
    }

    function _addSponsorshipForSponsor(address _sponsorKey,
                                 address _recipientKey, 
                                 uint _recipientRateKey,
                                 address _agentKey,
                                 uint _agentRateKey,
                                 string memory _strWholeAmount,
                                 string memory _strDecimalAmount,
                                 uint _transactionTimeStamp)
    internal {
        // console.log("balanceOf[", msg.sender, "] = ",balanceOf[msg.sender]);
        uint256 sponsorAmount;
        bool result;
        (sponsorAmount, result) = decimalStringToUint(_strWholeAmount, _strDecimalAmount, decimals);

        require(result, "AMOUNT_PARSE");
        // string memory errString =
        require(balanceOf[_sponsorKey] >= sponsorAmount, 
            "INSUFFICIENT_BAL");


        // validateSufficientAccountBalance(_sponsorCoinQty)
    
        // console.log("msg.sender     ", msg.sender);
        // console.log("addBackDatedSponsorship(");
        // console.log("_recipientKey         = ", _recipientKey, ",");
        // console.log("_recipientRateKey     = ", _recipientRateKey, ",");
        // console.log("_agentKey             = ", _agentKey, ",");
        // console.log("_agentRateKey         = ", _agentRateKey, ",");
        // console.log("strWholeAmount        = ", _strWholeAmount, ",");
        // console.log("_strDecimalAmount     = ", _strDecimalAmount, ",");
        // console.log("_transactionTimeStamp = ", _transactionTimeStamp, ")");

        // AccountStruct storage sponsorRec = accountMap[msg.sender];
        StakingTransactionStruct memory transRec;
        transRec.insertionTime = _transactionTimeStamp;
        transRec.stakingRewards = sponsorAmount;
        totalStakedSPCoins += sponsorAmount;

        // console.log( "**** Transaction.sol:ADDING RATE REC = ", _agentRateKey, "ADDING TRANSACTION = ", sponsorAmount);
        if(_agentKey == burnAddress) {
            RecipientRateStruct storage recipientRateTransaction = getRecipientRateTransaction(_sponsorKey, _recipientKey, _recipientRateKey, _transactionTimeStamp);
            updateRecipientRateRewards( recipientRateTransaction, _recipientKey, _transactionTimeStamp);
            updateRecipientRateSponsorship(_sponsorKey, recipientRateTransaction, _recipientKey, sponsorAmount, _transactionTimeStamp);
            recipientRateTransaction.transactionList.push(transRec);
        }
        else {
            AgentRateStruct storage agentRateTransaction = getAgentRateTransaction(_sponsorKey, _recipientKey, _recipientRateKey, _agentKey, _agentRateKey, _transactionTimeStamp);
            updateAgentRateRewards(agentRateTransaction, _agentKey, _recipientKey,  _recipientRateKey, _transactionTimeStamp);

            updateAgentRateSponsorship(_sponsorKey, agentRateTransaction, _recipientKey, _recipientRateKey, _agentKey, sponsorAmount, _transactionTimeStamp);
            agentRateTransaction.transactionList.push(transRec);
        }

        // console.log("BEFORE balanceOf     =", balanceOf[msg.sender]);
        // console.log("BEFORE _sponsorCoinQty ", sponsorAmount);
        balanceOf[_sponsorKey] -= sponsorAmount;
        totalBalanceOf -= sponsorAmount;
        // console.log("AFTER balanceOf     =", balanceOf[msg.sender]);
        // console.log("AFTER _sponsorCoinQty ", sponsorAmount);
    }

    function updateRecipientRateSponsorship(address _sponsorKey, RecipientRateStruct storage recipientRateTransaction, address _recipientKey, 
    uint256 _sponsorCoinQty , uint _transactionTimeStamp)
        internal returns (RecipientRateStruct storage) {
        // console.log("updateRecipientRateSponsorship:_sponsorCoinQty = ", _sponsorCoinQty, _transactionTimeStamp);
        updateRecipientSponsorship(_sponsorKey, _recipientKey, _sponsorCoinQty);
        uint lastUpdateTime = recipientRateTransaction.lastUpdateTime;
        if ( lastUpdateTime != _transactionTimeStamp) {
            recipientRateTransaction.lastUpdateTime = _transactionTimeStamp;
            // uint agentRewards = calculateStakingRewards( _sponsorCoinQty, lastUpdateTime, _transactionTimeStamp, _recipientRateKey );
            // console.log("RRRRRRRRRRRRRRRRRRRRRRRRRRR _sponsorCoinQty                = ", _sponsorCoinQty);
            // console.log("RRRRRRRRRRRRRRRRRRRRRRRRRRR agentRateTransaction.lastUpdateTime = ", lastUpdateTime);
            // console.log("RRRRRRRRRRRRRRRRRRRRRRRRRRR _transactionTimeStamp          = ", _transactionTimeStamp);
            // console.log("RRRRRRRRRRRRRRRRRRRRRRRRRRR _recipientRateKey              = ", _recipientRateKey);
            // console.log("RRRRRRRRRRRRRRRRRRRRRRRRRRR Agent Calculated Rewards       = ", agentRewards);
        }
        recipientRateTransaction.stakedSPCoins += _sponsorCoinQty;
        return recipientRateTransaction;
    }

    function updateAgentRateSponsorship(address _sponsorKey, AgentRateStruct storage agentRateTransaction, address _recipientKey,
    uint _recipientRateKey, address _agentKey, uint256 _sponsorCoinQty, uint _transactionTimeStamp)
       internal returns (AgentRateStruct storage) {
       updateAgentSponsorship(_sponsorKey, _recipientKey, _recipientRateKey, _agentKey, _sponsorCoinQty, _transactionTimeStamp);
        uint lastUpdateTime = agentRateTransaction.lastUpdateTime;
        if ( lastUpdateTime != _transactionTimeStamp) {
            agentRateTransaction.lastUpdateTime = _transactionTimeStamp;
            // uint agentRewards = calculateStakingRewards( _sponsorCoinQty, lastUpdateTime, _transactionTimeStamp, _recipientRateKey );
            // console.log("AAAAAAAAAAAAAAAAAAAAAAAAAAA _sponsorCoinQty                = ", _sponsorCoinQty);
            // console.log("AAAAAAAAAAAAAAAAAAAAAAAAAAA agentRateTransaction.lastUpdateTime = ", lastUpdateTime);
            // console.log("AAAAAAAAAAAAAAAAAAAAAAAAAAA _transactionTimeStamp          = ", _transactionTimeStamp);
            // console.log("AAAAAAAAAAAAAAAAAAAAAAAAAAA _recipientRateKey              = ", _recipientRateKey);
            // console.log("AAAAAAAAAAAAAAAAAAAAAAAAAAA Agent Calculated Rewards       = ", agentRewards);
        }
        agentRateTransaction.stakedSPCoins += _sponsorCoinQty;
        return agentRateTransaction;
    }

    function updateAgentSponsorship(address _sponsorKey, address _recipientKey, uint _recipientRateKey, address _agentKey, uint256 _sponsorCoinQty, uint _transactionTimeStamp)
       internal returns (AgentStruct storage) {
        RecipientRateStruct storage recipientRateTransaction = getRecipientRateTransaction(_sponsorKey, _recipientKey, _recipientRateKey, block.timestamp);
        updateRecipientRateSponsorship(_sponsorKey, recipientRateTransaction, _recipientKey, _sponsorCoinQty, _transactionTimeStamp);
        AgentStruct storage agentRecord = recipientRateTransaction.agentMap[_agentKey];
        agentRecord.stakedSPCoins += _sponsorCoinQty;
        return agentRecord;
    }

    function updateRecipientSponsorship(address _sponsorKey, address _recipientKey, uint256 _sponsorCoinQty)
        internal returns (RecipientStruct storage) {
        // console.log("updateRecipientSponsorship(", _sponsorCoinQty, ")");

        AccountStruct storage sponsorRec = updateSponsorTransaction(_sponsorKey, _sponsorCoinQty);
        RecipientStruct storage recipientRecord = sponsorRec.recipientMap[_recipientKey];
        // RecipientStruct storage recipientRecord = getRecipientRecord(msg.sender, _recipientKey);
        // console.log("BEFORE updateRecipientSponsorship:recipientRecord.stakedSPCoins", recipientRecord.stakedSPCoins );
        recipientRecord.stakedSPCoins += _sponsorCoinQty;
        // console.log("AFTER updateRecipientSponsorship:recipientRecord.stakedSPCoins", recipientRecord.stakedSPCoins );
        return recipientRecord;
    }

    function updateSponsorTransaction(address _sponsorKey, uint256 _sponsorCoinQty)
       internal returns (AccountStruct storage) {
        AccountStruct storage sponsorRec = accountMap[_sponsorKey];
        sponsorRec.stakedSPCoins += _sponsorCoinQty;
        return sponsorRec;
    }

    function getAgentRateTransactionCount(
        address _sponsorKey,
        address _recipientKey,
        uint256 _recipientRateKey,
        address _agentKey,
        uint256 _agentRateKey
    )
        public
        view
        returns (uint256)
    {
        AgentStruct storage agentRec = getAgentRecordByKeys(_sponsorKey, _recipientKey, _recipientRateKey, _agentKey);
        AgentRateStruct storage agentRateTransaction = agentRec.agentRateMap[_agentRateKey];
        return agentRateTransaction.transactionList.length;
    }

    function getAgentRateTransactionAt(
        address _sponsorKey,
        address _recipientKey,
        uint256 _recipientRateKey,
        address _agentKey,
        uint256 _agentRateKey,
        uint256 _transactionIndex
    )
        public
        view
        returns (
            uint256 insertionTime,
            uint256 stakingRewards
        )
    {
        AgentStruct storage agentRec = getAgentRecordByKeys(_sponsorKey, _recipientKey, _recipientRateKey, _agentKey);
        AgentRateStruct storage agentRateTransaction = agentRec.agentRateMap[_agentRateKey];
        require(_transactionIndex < agentRateTransaction.transactionList.length, "AGENT_TX_OOB");
        StakingTransactionStruct storage transactionRecord = agentRateTransaction.transactionList[_transactionIndex];
        insertionTime = transactionRecord.insertionTime;
        stakingRewards = transactionRecord.stakingRewards;
    }

}
