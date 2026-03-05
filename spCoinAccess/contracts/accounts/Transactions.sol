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
                                 string memory _strWholeAmount,
                                 string memory _strDecimalAmount ) public 
    {
        uint256 transactionTimeStamp = block.timestamp;
        addBackDatedSponsorship( _recipientKey, 
                                    _recipientRateKey,
                                    _agentKey,
                                    _agentRateKey,
                                    _strWholeAmount,
                                    _strDecimalAmount,
                                    transactionTimeStamp );
    }

    function addBackDatedSponsorship(address _recipientKey, 
                                 uint _recipientRateKey,
                                 address _agentKey,
                                 uint _agentRateKey,
                                 string memory _strWholeAmount,
                                 string memory _strDecimalAmount,
                                 uint _transactionTimeStamp) 
    // ToDo Replace this Removed to Save Memory
    onlyOwnerOrRootAdmin("addBackDatedSponsorship", msg.sender)
    public {
        // console.log("balanceOf[", msg.sender, "] = ",balanceOf[msg.sender]);
        uint256 sponsorAmount;
        bool result;
        (sponsorAmount, result) = decimalStringToUint(_strWholeAmount, _strDecimalAmount, decimals);

        require(result, concat("Unparsable Sponsor Amount ", _strWholeAmount));
        // string memory errString =
        require(balanceOf[msg.sender] >= sponsorAmount, 
            concat("Insufficient Balance balanceOf[",toString(msg.sender),"] >= ", 
            toString(sponsorAmount)));


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
            RecipientRateStruct storage recipientRateRecord = getRecipientRateRecord(msg.sender, _recipientKey, _recipientRateKey, _transactionTimeStamp);
            updateRecipientRateRewards( recipientRateRecord, _recipientKey, _transactionTimeStamp);
            updateRecipientRateSponsorship(recipientRateRecord, _recipientKey, sponsorAmount, _transactionTimeStamp);
            recipientRateRecord.transactionList.push(transRec);
        }
        else {
            AgentRateStruct storage agentRateRecord = getAgentRateRecord(msg.sender, _recipientKey, _recipientRateKey, _agentKey, _agentRateKey, _transactionTimeStamp);
            updateAgentRateRewards(agentRateRecord, _agentKey, _recipientKey,  _recipientRateKey, _transactionTimeStamp);

            updateAgentRateSponsorship(agentRateRecord, _recipientKey, _recipientRateKey, _agentKey, sponsorAmount, _transactionTimeStamp);
            agentRateRecord.transactionList.push(transRec);
        }

        // console.log("BEFORE balanceOf     =", balanceOf[msg.sender]);
        // console.log("BEFORE _sponsorCoinQty ", sponsorAmount);
        balanceOf[msg.sender] -= sponsorAmount;
        totalBalanceOf -= sponsorAmount;
        // console.log("AFTER balanceOf     =", balanceOf[msg.sender]);
        // console.log("AFTER _sponsorCoinQty ", sponsorAmount);
    }

    function updateRecipientRateSponsorship(RecipientRateStruct storage recipientRateRecord, address _recipientKey, 
    uint256 _sponsorCoinQty , uint _transactionTimeStamp)
        internal returns (RecipientRateStruct storage) {
        // console.log("updateRecipientRateSponsorship:_sponsorCoinQty = ", _sponsorCoinQty, _transactionTimeStamp);
        updateRecipientSponsorship(_recipientKey, _sponsorCoinQty);
        uint lastUpdateTime = recipientRateRecord.lastUpdateTime;
        if ( lastUpdateTime != _transactionTimeStamp) {
            recipientRateRecord.lastUpdateTime = _transactionTimeStamp;
            // uint agentRewards = calculateStakingRewards( _sponsorCoinQty, lastUpdateTime, _transactionTimeStamp, _recipientRateKey );
            // console.log("RRRRRRRRRRRRRRRRRRRRRRRRRRR _sponsorCoinQty                = ", _sponsorCoinQty);
            // console.log("RRRRRRRRRRRRRRRRRRRRRRRRRRR agentRateRecord.lastUpdateTime = ", lastUpdateTime);
            // console.log("RRRRRRRRRRRRRRRRRRRRRRRRRRR _transactionTimeStamp          = ", _transactionTimeStamp);
            // console.log("RRRRRRRRRRRRRRRRRRRRRRRRRRR _recipientRateKey              = ", _recipientRateKey);
            // console.log("RRRRRRRRRRRRRRRRRRRRRRRRRRR Agent Calculated Rewards       = ", agentRewards);
        }
        recipientRateRecord.stakedSPCoins += _sponsorCoinQty;
        return recipientRateRecord;
    }

    function updateAgentRateSponsorship(AgentRateStruct storage agentRateRecord, address _recipientKey,
    uint _recipientRateKey, address _agentKey, uint256 _sponsorCoinQty, uint _transactionTimeStamp)
       internal returns (AgentRateStruct storage) {
       updateAgentSponsorship(_recipientKey, _recipientRateKey, _agentKey, _sponsorCoinQty, _transactionTimeStamp);
        uint lastUpdateTime = agentRateRecord.lastUpdateTime;
        if ( lastUpdateTime != _transactionTimeStamp) {
            agentRateRecord.lastUpdateTime = _transactionTimeStamp;
            // uint agentRewards = calculateStakingRewards( _sponsorCoinQty, lastUpdateTime, _transactionTimeStamp, _recipientRateKey );
            // console.log("AAAAAAAAAAAAAAAAAAAAAAAAAAA _sponsorCoinQty                = ", _sponsorCoinQty);
            // console.log("AAAAAAAAAAAAAAAAAAAAAAAAAAA agentRateRecord.lastUpdateTime = ", lastUpdateTime);
            // console.log("AAAAAAAAAAAAAAAAAAAAAAAAAAA _transactionTimeStamp          = ", _transactionTimeStamp);
            // console.log("AAAAAAAAAAAAAAAAAAAAAAAAAAA _recipientRateKey              = ", _recipientRateKey);
            // console.log("AAAAAAAAAAAAAAAAAAAAAAAAAAA Agent Calculated Rewards       = ", agentRewards);
        }
        agentRateRecord.stakedSPCoins += _sponsorCoinQty;
        return agentRateRecord;
    }

    function updateAgentSponsorship(address _recipientKey, uint _recipientRateKey, address _agentKey, uint256 _sponsorCoinQty, uint _transactionTimeStamp)
       internal returns (AgentStruct storage) {
        RecipientRateStruct storage recipientRateRecord = getRecipientRateRecord(msg.sender, _recipientKey, _recipientRateKey, block.timestamp);
        updateRecipientRateSponsorship(recipientRateRecord, _recipientKey, _sponsorCoinQty, _transactionTimeStamp);
        AgentStruct storage agentRecord = recipientRateRecord.agentMap[_agentKey];
        agentRecord.stakedSPCoins += _sponsorCoinQty;
        return agentRecord;
    }

    function updateRecipientSponsorship(address _recipientKey, uint256 _sponsorCoinQty)
        internal returns (RecipientStruct storage) {
        // console.log("updateRecipientSponsorship(", _sponsorCoinQty, ")");

        AccountStruct storage sponsorRec = updateSponsorTransaction(_sponsorCoinQty);
        RecipientStruct storage recipientRecord = sponsorRec.recipientMap[_recipientKey];
        // RecipientStruct storage recipientRecord = getRecipientRecord(msg.sender, _recipientKey);
        // console.log("BEFORE updateRecipientSponsorship:recipientRecord.stakedSPCoins", recipientRecord.stakedSPCoins );
        recipientRecord.stakedSPCoins += _sponsorCoinQty;
        // console.log("AFTER updateRecipientSponsorship:recipientRecord.stakedSPCoins", recipientRecord.stakedSPCoins );
        return recipientRecord;
    }

    function updateSponsorTransaction(uint256 _sponsorCoinQty)
       internal returns (AccountStruct storage) {
        AccountStruct storage sponsorRec = accountMap[msg.sender];
        sponsorRec.stakedSPCoins += _sponsorCoinQty;
        return sponsorRec;
    }

    function getRecipientRateTransactionList(address _sponsorKey, address _recipientKey, uint _recipientRateKey)
    public view returns (string memory) {
        RecipientStruct storage recipientRec = getRecipientRecordByKeys(_sponsorKey, _recipientKey);
        string memory strTransactionList = "";
        RecipientRateStruct storage recipientRateRecord = recipientRec.recipientRateMap[_recipientRateKey];
        // console.log ("recipientRateRecord.transactionList[0].quantity = ", recipientRateRecord.transactionList[0].quantity);
        StakingTransactionStruct[] memory transactionList = recipientRateRecord.transactionList;
        strTransactionList = concat(strTransactionList, getRateTransactionStr(transactionList)); 
        // console.log("RRRR strTransactionList = ", strTransactionList); 
        return strTransactionList;
    }

    function getSerializedRateTransactionList(address _sponsorKey, address _recipientKey, uint _recipientRateKey, address _agentKey, uint256 _agentRateKey)
    public view returns (string memory) {
        AgentStruct storage agentRec = getAgentRecordByKeys(_sponsorKey, _recipientKey, _recipientRateKey, _agentKey);
        string memory strTransactionList = "";
        AgentRateStruct storage agentRateRecord= agentRec.agentRateMap[_agentRateKey];
        // console.log ("agentRateRecord.transactionList[0].quantity = ", agentRateRecord.transactionList[0].quantity);
        StakingTransactionStruct[] memory transactionList = agentRateRecord.transactionList;
        strTransactionList = concat(strTransactionList, getRateTransactionStr(transactionList)); 
        // console.log("RRRR strTransactionList = ", strTransactionList); 
        return strTransactionList;
    }

    function getRateTransactionStr(StakingTransactionStruct[] memory transactionList)
    public pure returns (string memory) {
        string memory strTransactionList = "";
        for (uint idx; idx < transactionList.length; idx++) {

            strTransactionList = concat(strTransactionList,
            toString(transactionList[idx].insertionTime), ",",
            toString(transactionList[idx].stakingRewards));
            if (idx < transactionList.length - 1) {
                strTransactionList = concat(strTransactionList, "\n");
            }
        }
        return strTransactionList;
    }
}
