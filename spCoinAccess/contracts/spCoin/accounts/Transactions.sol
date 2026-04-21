// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;
/// @title ERC20 Contract
import "../rewardsManagement/RewardsManager.sol";

contract Transactions is RewardsManager {
    constructor() { }

    function addSponsorship(address _recipientKey,
                                 uint _recipientRateKey,
                                 address _agentKey,
                                 uint _agentRateKey,
                                 string calldata _strWholeAmount,
                                 string calldata _strDecimalAmount) external
    {
        uint256 transactionTimeStamp = block.timestamp;
        _addSponsorshipForSponsor(
            msg.sender,
            _recipientKey,
            _recipientRateKey,
            _agentKey,
            _agentRateKey,
            _strWholeAmount,
            _strDecimalAmount,
            transactionTimeStamp
        );
    }

    function addRecipientTransaction(
        address _sponsorKey,
        address _recipientKey,
        uint _recipientRateKey,
        string calldata _strWholeAmount,
        string calldata _strDecimalAmount
    )
        external
        onlyOwnerOrRootAdmin(_sponsorKey)
        returns (uint256 transactionIndex)
    {
        return _addSponsorshipForSponsor(
            _sponsorKey,
            _recipientKey,
            _recipientRateKey,
            burnAddress,
            0,
            _strWholeAmount,
            _strDecimalAmount,
            block.timestamp
        );
    }

    function addAgentTransaction(
        address _sponsorKey,
        address _recipientKey,
        uint _recipientRateKey,
        address _agentKey,
        uint _agentRateKey,
        string calldata _strWholeAmount,
        string calldata _strDecimalAmount
    )
        external
        onlyOwnerOrRootAdmin(_sponsorKey)
        returns (uint256 transactionIndex)
    {
        return _addSponsorshipForSponsor(
            _sponsorKey,
            _recipientKey,
            _recipientRateKey,
            _agentKey,
            _agentRateKey,
            _strWholeAmount,
            _strDecimalAmount,
            block.timestamp
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
    internal returns (uint256 transactionIndex) {
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
            RecipientRateStruct storage recipientTransaction = getRecipientTransaction(_sponsorKey, _recipientKey, _recipientRateKey, _transactionTimeStamp);
            updateRecipientRateRewards( recipientTransaction, _recipientKey, _transactionTimeStamp);
            updateRecipientRateSponsorship(_sponsorKey, recipientTransaction, _recipientKey, sponsorAmount, _transactionTimeStamp);
            transactionIndex = recipientTransaction.transactionList.length;
            recipientTransaction.transactionList.push(transRec);
        }
        else {
            AgentRateStruct storage agentTransaction = getAgentTransaction(_sponsorKey, _recipientKey, _recipientRateKey, _agentKey, _agentRateKey, _transactionTimeStamp);
            updateAgentRateRewards(agentTransaction, _agentKey, _recipientKey,  _recipientRateKey, _transactionTimeStamp);

            updateAgentRateSponsorship(_sponsorKey, agentTransaction, _recipientKey, _recipientRateKey, _agentKey, sponsorAmount, _transactionTimeStamp);
            transactionIndex = agentTransaction.transactionList.length;
            agentTransaction.transactionList.push(transRec);
        }

        // console.log("BEFORE balanceOf     =", balanceOf[msg.sender]);
        // console.log("BEFORE _sponsorCoinQty ", sponsorAmount);
        balanceOf[_sponsorKey] -= sponsorAmount;
        totalUnstakedSpCoins -= sponsorAmount;
        // console.log("AFTER balanceOf     =", balanceOf[msg.sender]);
        // console.log("AFTER _sponsorCoinQty ", sponsorAmount);
    }

    function updateRecipientRateSponsorship(address _sponsorKey, RecipientRateStruct storage recipientTransaction, address _recipientKey, 
    uint256 _sponsorCoinQty , uint _transactionTimeStamp)
        internal returns (RecipientRateStruct storage) {
        // console.log("updateRecipientRateSponsorship:_sponsorCoinQty = ", _sponsorCoinQty, _transactionTimeStamp);
        updateRecipientSponsorship(_sponsorKey, _recipientKey, _sponsorCoinQty);
        uint lastUpdateTime = recipientTransaction.lastUpdateTime;
        if ( lastUpdateTime != _transactionTimeStamp) {
            recipientTransaction.lastUpdateTime = _transactionTimeStamp;
            // uint agentRewards = calculateStakingRewards( _sponsorCoinQty, lastUpdateTime, _transactionTimeStamp, _recipientRateKey );
            // console.log("RRRRRRRRRRRRRRRRRRRRRRRRRRR _sponsorCoinQty                = ", _sponsorCoinQty);
            // console.log("RRRRRRRRRRRRRRRRRRRRRRRRRRR agentTransaction.lastUpdateTime = ", lastUpdateTime);
            // console.log("RRRRRRRRRRRRRRRRRRRRRRRRRRR _transactionTimeStamp          = ", _transactionTimeStamp);
            // console.log("RRRRRRRRRRRRRRRRRRRRRRRRRRR _recipientRateKey              = ", _recipientRateKey);
            // console.log("RRRRRRRRRRRRRRRRRRRRRRRRRRR Agent Calculated Rewards       = ", agentRewards);
        }
        recipientTransaction.stakedSPCoins += _sponsorCoinQty;
        return recipientTransaction;
    }

    function updateAgentRateSponsorship(address _sponsorKey, AgentRateStruct storage agentTransaction, address _recipientKey,
    uint _recipientRateKey, address _agentKey, uint256 _sponsorCoinQty, uint _transactionTimeStamp)
       internal returns (AgentRateStruct storage) {
       updateAgentSponsorship(_sponsorKey, _recipientKey, _recipientRateKey, _agentKey, _sponsorCoinQty, _transactionTimeStamp);
        uint lastUpdateTime = agentTransaction.lastUpdateTime;
        if ( lastUpdateTime != _transactionTimeStamp) {
            agentTransaction.lastUpdateTime = _transactionTimeStamp;
            // uint agentRewards = calculateStakingRewards( _sponsorCoinQty, lastUpdateTime, _transactionTimeStamp, _recipientRateKey );
            // console.log("AAAAAAAAAAAAAAAAAAAAAAAAAAA _sponsorCoinQty                = ", _sponsorCoinQty);
            // console.log("AAAAAAAAAAAAAAAAAAAAAAAAAAA agentTransaction.lastUpdateTime = ", lastUpdateTime);
            // console.log("AAAAAAAAAAAAAAAAAAAAAAAAAAA _transactionTimeStamp          = ", _transactionTimeStamp);
            // console.log("AAAAAAAAAAAAAAAAAAAAAAAAAAA _recipientRateKey              = ", _recipientRateKey);
            // console.log("AAAAAAAAAAAAAAAAAAAAAAAAAAA Agent Calculated Rewards       = ", agentRewards);
        }
        agentTransaction.stakedSPCoins += _sponsorCoinQty;
        return agentTransaction;
    }

    function updateAgentSponsorship(address _sponsorKey, address _recipientKey, uint _recipientRateKey, address _agentKey, uint256 _sponsorCoinQty, uint _transactionTimeStamp)
       internal returns (AgentStruct storage) {
        RecipientRateStruct storage recipientTransaction = getRecipientTransaction(_sponsorKey, _recipientKey, _recipientRateKey, block.timestamp);
        updateRecipientRateSponsorship(_sponsorKey, recipientTransaction, _recipientKey, _sponsorCoinQty, _transactionTimeStamp);
        AgentStruct storage agentRecord = recipientTransaction.agentMap[_agentKey];
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

    function backDateTransactionDate(
        address _sponsorKey,
        address _recipientKey,
        uint256 _recipientRateKey,
        address _agentKey,
        uint256 _agentRateKey,
        uint256 _transactionIndex,
        uint256 _transactionTimeStamp
    )
        external
        onlyRootAdmin
    {
        if (_agentKey == burnAddress) {
            RecipientRateStruct storage recipientTransaction =
                getRecipientTransactionByKeys(_sponsorKey, _recipientKey, _recipientRateKey);
            require(_transactionIndex < recipientTransaction.transactionList.length, "RECIP_TX_OOB");
            recipientTransaction.transactionList[_transactionIndex].insertionTime = _transactionTimeStamp;
        } else {
            AgentStruct storage agentRec = getAgentRecordByKeys(_sponsorKey, _recipientKey, _recipientRateKey, _agentKey);
            AgentRateStruct storage agentTransaction = agentRec.agentRateMap[_agentRateKey];
            require(_transactionIndex < agentTransaction.transactionList.length, "AGENT_TX_OOB");
            agentTransaction.transactionList[_transactionIndex].insertionTime = _transactionTimeStamp;
        }
    }

    function getAgentTransactionCount(
        address _sponsorKey,
        address _recipientKey,
        uint256 _recipientRateKey,
        address _agentKey,
        uint256 _agentRateKey
    )
        external
        view
        returns (uint256)
    {
        AgentStruct storage agentRec = getAgentRecordByKeys(_sponsorKey, _recipientKey, _recipientRateKey, _agentKey);
        AgentRateStruct storage agentTransaction = agentRec.agentRateMap[_agentRateKey];
        return agentTransaction.transactionList.length;
    }

    function getRecipientTransactionCount(
        address _sponsorKey,
        address _recipientKey,
        uint256 _recipientRateKey
    )
        external
        view
        returns (uint256)
    {
        RecipientRateStruct storage recipientTransaction =
            getRecipientTransactionByKeys(_sponsorKey, _recipientKey, _recipientRateKey);
        return recipientTransaction.transactionList.length;
    }

    function getAgentTransactionAt(
        address _sponsorKey,
        address _recipientKey,
        uint256 _recipientRateKey,
        address _agentKey,
        uint256 _agentRateKey,
        uint256 _transactionIndex
    )
        external
        view
        returns (
            uint256 insertionTime,
            uint256 stakingRewards
        )
    {
        AgentStruct storage agentRec = getAgentRecordByKeys(_sponsorKey, _recipientKey, _recipientRateKey, _agentKey);
        AgentRateStruct storage agentTransaction = agentRec.agentRateMap[_agentRateKey];
        require(_transactionIndex < agentTransaction.transactionList.length, "AGENT_TX_OOB");
        StakingTransactionStruct storage transactionRecord = agentTransaction.transactionList[_transactionIndex];
        insertionTime = transactionRecord.insertionTime;
        stakingRewards = transactionRecord.stakingRewards;
    }

    function getRecipientTransactionAt(
        address _sponsorKey,
        address _recipientKey,
        uint256 _recipientRateKey,
        uint256 _transactionIndex
    )
        external
        view
        returns (
            uint256 insertionTime,
            uint256 stakingRewards
        )
    {
        RecipientRateStruct storage recipientTransaction =
            getRecipientTransactionByKeys(_sponsorKey, _recipientKey, _recipientRateKey);
        require(_transactionIndex < recipientTransaction.transactionList.length, "RECIP_TX_OOB");
        StakingTransactionStruct storage transactionRecord = recipientTransaction.transactionList[_transactionIndex];
        insertionTime = transactionRecord.insertionTime;
        stakingRewards = transactionRecord.stakingRewards;
    }

}
