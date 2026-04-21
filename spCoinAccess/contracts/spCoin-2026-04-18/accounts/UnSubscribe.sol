// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;
/// @title ERC20 Contract
import "./Transactions.sol";

contract UnSubscribe is Transactions {
    constructor() { }
    uint8 internal constant DEBUG_BEFORE_DELETE = 2;
    uint8 internal constant DEBUG_AGENT_EMPTY_BEFORE_CLEANUP = 4;
    uint8 internal constant DEBUG_AGENT_EMPTY_AFTER_CLEANUP = 5;
    uint8 internal constant DEBUG_RECIPIENT_RATE_EMPTY = 6;
    uint8 internal constant DEBUG_RECIPIENT_EMPTY_BEFORE_CLEANUP = 7;
    uint8 internal constant DEBUG_RECIPIENT_EMPTY_AFTER_CLEANUP = 8;

    event DebugUnSponsorAgent(
        uint8 step,
        address sponsor,
        address recipient,
        address agent,
        uint256 recipientRateKey,
        uint256 agentRateKey,
        uint256 valueA,
        uint256 valueB
    );

    function deleteRecipient(address _sponsorKey, address _recipientKey)
        external
        onlyOwnerOrRootAdmin(_sponsorKey)
        accountExists(_sponsorKey)
        accountExists(_recipientKey)
        nonRedundantRecipient(_sponsorKey, _recipientKey)
    {
        RecipientStruct storage recipientRecord = accountMap[_sponsorKey].recipientMap[_recipientKey];
        require(recipientRecord.inserted, "RECIP_NOT_FOUND");

        uint256[] memory recipientRateList = getRecipientRateList(_sponsorKey, _recipientKey);
        while (recipientRateList.length > 0) {
            deleteRecipientRate(_sponsorKey, _recipientKey, recipientRateList[recipientRateList.length - 1]);
            recipientRateList = getRecipientRateList(_sponsorKey, _recipientKey);
        }

        if (accountMap[_sponsorKey].recipientMap[_recipientKey].inserted) {
            _deleteRecipient(_sponsorKey, _recipientKey);
        }
    }

    function deleteRecipientRate(address _sponsorKey, address _recipientKey, uint256 _recipientRateKey)
        public
        onlyOwnerOrRootAdmin(_sponsorKey)
        accountExists(_sponsorKey)
        accountExists(_recipientKey)
        nonRedundantRecipient(_sponsorKey, _recipientKey)
    {
        RecipientStruct storage recipientRecord = accountMap[_sponsorKey].recipientMap[_recipientKey];
        require(recipientRecord.inserted, "RECIP_NOT_FOUND");
        RecipientRateStruct storage recipientRateTransaction = recipientRecord.recipientRateMap[_recipientRateKey];
        if (!recipientRateTransaction.inserted) revert SpCoinError(RECIP_RATE_NOT_FOUND);

        address[] memory agentList = getRecipientRateAgentList(_sponsorKey, _recipientKey, _recipientRateKey);
        while (agentList.length > 0) {
            deleteRecipientAgent(_sponsorKey, _recipientKey, _recipientRateKey, agentList[agentList.length - 1]);
            agentList = getRecipientRateAgentList(_sponsorKey, _recipientKey, _recipientRateKey);
        }

        if (recipientRecord.recipientRateMap[_recipientRateKey].inserted) {
            _deleteRecipientTransaction(_sponsorKey, _recipientKey, _recipientRateKey);
        }
    }

    function _deleteRecipientTransaction(address _sponsorKey, address _recipientKey, uint256 _recipientRateKey) internal {
        AccountStruct storage sponsorAccount = accountMap[_sponsorKey];
        RecipientStruct storage recipientRecord = sponsorAccount.recipientMap[_recipientKey];
        require(recipientRecord.inserted, "RECIP_NOT_FOUND");

        RecipientRateStruct storage recipientRateTransaction = recipientRecord.recipientRateMap[_recipientRateKey];
        if (!recipientRateTransaction.inserted) revert SpCoinError(RECIP_RATE_NOT_FOUND);
        if (recipientRateTransaction.agentAccountList.length != 0) revert SpCoinError(RECIP_RATE_HAS_AGENT);

        uint256 totalSponsored = recipientRateTransaction.stakedSPCoins;

        totalStakedSPCoins -= totalSponsored;
        totalUnstakedSpCoins += totalSponsored;
        balanceOf[_sponsorKey] += totalSponsored;
        sponsorAccount.stakedSPCoins -= totalSponsored;
        recipientRecord.stakedSPCoins -= totalSponsored;

        deleteTransactionRecords(recipientRateTransaction.transactionList);
        deleteUintRecordFromSearchKeys(_recipientRateKey, recipientRecord.recipientRateList);
        delete recipientRecord.recipientRateMap[_recipientRateKey];

        if (recipientRecord.recipientRateList.length == 0 && recipientRecord.inserted) {
            _deleteRecipient(_sponsorKey, _recipientKey);
        }
    }

    function deleteRecipientAgent(address _sponsorKey, address _recipientKey, uint256 _recipientRateKey, address _agentKey)
        public
        onlyOwnerOrRootAdmin(_sponsorKey)
        accountExists(_sponsorKey)
        accountExists(_recipientKey)
        accountExists(_agentKey)
    {
        RecipientRateStruct storage recipientRateTransaction = getRecipientRateTransactionByKeys(_sponsorKey, _recipientKey, _recipientRateKey);
        AgentStruct storage agentRecord = recipientRateTransaction.agentMap[_agentKey];
        if (!agentRecord.inserted) revert SpCoinError(AGENT_NOT_FOUND);

        uint256[] memory agentRateList = getAgentRateList(_sponsorKey, _recipientKey, _recipientRateKey, _agentKey);
        if (agentRateList.length == 0) {
            AccountStruct storage agentAccount = accountMap[_agentKey];
            AccountStruct storage recipientAccount = accountMap[_recipientKey];
            deleteAccountRecordFromSearchKeys(_agentKey, recipientRateTransaction.agentAccountList);
            deleteAccountRecordFromSearchKeys(_agentKey, recipientAccount.agentAccountList);
            deleteAccountRecordFromSearchKeys(_recipientKey, agentAccount.agentParentRecipientAccountList);
            delete recipientRateTransaction.agentMap[_agentKey];
            deleteAccountFromMaster(_agentKey);
            return;
        }
        while (agentRateList.length > 0) {
            deleteAgentRate(_sponsorKey, _recipientKey, _recipientRateKey, _agentKey, agentRateList[agentRateList.length - 1]);
            agentRateList = getAgentRateList(_sponsorKey, _recipientKey, _recipientRateKey, _agentKey);
        }
    }

    function deleteAgentRate(
        address _sponsorKey,
        address _recipientKey,
        uint256 _recipientRateKey,
        address _agentKey,
        uint256 _agentRateKey
    )
        public
        onlyOwnerOrRootAdmin(_sponsorKey)
        accountExists(_sponsorKey)
        accountExists(_recipientKey)
        accountExists(_agentKey)
    {
        AccountStruct storage sponsorAccount = accountMap[_sponsorKey];
        RecipientStruct storage recipientRecord = sponsorAccount.recipientMap[_recipientKey];
        require(recipientRecord.inserted, "RECIP_NOT_FOUND");

        RecipientRateStruct storage recipientRateTransaction = recipientRecord.recipientRateMap[_recipientRateKey];
        if (!recipientRateTransaction.inserted) revert SpCoinError(RECIP_RATE_NOT_FOUND);

        AgentStruct storage agentRecord = recipientRateTransaction.agentMap[_agentKey];
        if (!agentRecord.inserted) revert SpCoinError(AGENT_NOT_FOUND);

        AgentRateStruct storage agentRateTransaction = agentRecord.agentRateMap[_agentRateKey];
        if (!agentRateTransaction.inserted) revert SpCoinError(AGENT_RATE_NOT_FOUND);
        emit DebugUnSponsorAgent(
            DEBUG_BEFORE_DELETE,
            _sponsorKey,
            _recipientKey,
            _agentKey,
            _recipientRateKey,
            _agentRateKey,
            agentRecord.agentRateList.length,
            recipientRateTransaction.agentAccountList.length
        );

        uint256 totalSponsored = agentRateTransaction.stakedSPCoins;

        totalStakedSPCoins -= totalSponsored;
        totalUnstakedSpCoins += totalSponsored;
        balanceOf[_sponsorKey] += totalSponsored;
        sponsorAccount.stakedSPCoins -= totalSponsored;
        recipientRecord.stakedSPCoins -= totalSponsored;
        recipientRateTransaction.stakedSPCoins -= totalSponsored;
        agentRecord.stakedSPCoins -= totalSponsored;

        deleteTransactionRecords(agentRateTransaction.transactionList);
        deleteUintRecordFromSearchKeys(_agentRateKey, agentRecord.agentRateList);
        delete agentRecord.agentRateMap[_agentRateKey];

        if (agentRecord.agentRateList.length == 0) {
            AccountStruct storage agentAccount = accountMap[_agentKey];
            AccountStruct storage recipientAccount = accountMap[_recipientKey];
            emit DebugUnSponsorAgent(
                DEBUG_AGENT_EMPTY_BEFORE_CLEANUP,
                _sponsorKey,
                _recipientKey,
                _agentKey,
                _recipientRateKey,
                _agentRateKey,
                agentAccount.agentParentRecipientAccountList.length,
                recipientAccount.agentAccountList.length
            );

            deleteAccountRecordFromSearchKeys(_agentKey, recipientRateTransaction.agentAccountList);
            deleteAccountRecordFromSearchKeys(_agentKey, recipientAccount.agentAccountList);
            deleteAccountRecordFromSearchKeys(_recipientKey, agentAccount.agentParentRecipientAccountList);
            delete recipientRateTransaction.agentMap[_agentKey];
            deleteAccountFromMaster(_agentKey);
            emit DebugUnSponsorAgent(
                DEBUG_AGENT_EMPTY_AFTER_CLEANUP,
                _sponsorKey,
                _recipientKey,
                _agentKey,
                _recipientRateKey,
                _agentRateKey,
                agentAccount.agentParentRecipientAccountList.length,
                recipientAccount.agentAccountList.length
            );
        }

        if (recipientRateTransaction.agentAccountList.length == 0 && recipientRateTransaction.transactionList.length == 0) {
            emit DebugUnSponsorAgent(
                DEBUG_RECIPIENT_RATE_EMPTY,
                _sponsorKey,
                _recipientKey,
                _agentKey,
                _recipientRateKey,
                _agentRateKey,
                recipientRateTransaction.agentAccountList.length,
                recipientRateTransaction.transactionList.length
            );
            deleteUintRecordFromSearchKeys(_recipientRateKey, recipientRecord.recipientRateList);
            delete recipientRecord.recipientRateMap[_recipientRateKey];
        }

        if (recipientRecord.recipientRateList.length == 0) {
            AccountStruct storage recipientAccount = accountMap[_recipientKey];
            emit DebugUnSponsorAgent(
                DEBUG_RECIPIENT_EMPTY_BEFORE_CLEANUP,
                _sponsorKey,
                _recipientKey,
                _agentKey,
                _recipientRateKey,
                _agentRateKey,
                sponsorAccount.recipientAccountList.length,
                recipientAccount.sponsorAccountList.length
            );
            deleteAccountRecordFromSearchKeys(_recipientKey, sponsorAccount.recipientAccountList);
            deleteAccountRecordFromSearchKeys(_sponsorKey, recipientAccount.sponsorAccountList);
            delete sponsorAccount.recipientMap[_recipientKey];
            deleteAccountFromMaster(_recipientKey);
            emit DebugUnSponsorAgent(
                DEBUG_RECIPIENT_EMPTY_AFTER_CLEANUP,
                _sponsorKey,
                _recipientKey,
                _agentKey,
                _recipientRateKey,
                _agentRateKey,
                sponsorAccount.recipientAccountList.length,
                recipientAccount.sponsorAccountList.length
            );
        }
    }

    function _deleteRecipient(address _sponsorKey, address _recipientKey)
        internal
    {
        AccountStruct storage sponsorAccount = accountMap[_sponsorKey];
        if (deleteAccountRecordFromSearchKeys(_recipientKey, sponsorAccount.recipientAccountList)) {
            RecipientStruct storage recipientRecord = sponsorAccount.recipientMap[_recipientKey];
            uint256 totalSponsored = recipientRecord.stakedSPCoins;
            totalStakedSPCoins -= totalSponsored;
            totalUnstakedSpCoins += totalSponsored;
            balanceOf[sponsorAccount.accountKey] += totalSponsored;
            sponsorAccount.stakedSPCoins -= totalSponsored;

            _unlinkRecipientSponsor(recipientRecord);
            delete sponsorAccount.recipientMap[_recipientKey];
            deleteAccountFromMaster(_recipientKey);
        }
    }

    function _unlinkRecipientSponsor(RecipientStruct storage recipientRecord)  
    internal {
        address recipientKey = recipientRecord.recipientKey;
        AccountStruct storage recipientAccount = accountMap[recipientKey];
        // console.log("DELETE SPONSOR KEY",recipientRecord.sponsorKey, "FROM RECIPIANT ACCOUNT LIST", recipientAccount.accountKey);
        deleteAccountRecordFromSearchKeys(recipientRecord.sponsorKey, recipientAccount.sponsorAccountList);
        deleteRecipientRateTransactions(recipientRecord);

     }

    // For each Recipient Rate Transaction,
    //   Remove Agent Account Reference from Rate Transaction
    function deleteRecipientRateTransactions(RecipientStruct storage _recipientRecord) internal {
        // Delete Agent Rate Keys
        uint256[] storage recipientRateList = _recipientRecord.recipientRateList;
        if (recipientRateList.length == 0) {
            return;
        }
        uint i = recipientRateList.length - 1;
        // Traverse Recipient Rate Transactions for removal of Recipiant Rate Transactions
        for (i; i >= 0; i--) {
            // console.log("====deleteRecipientRateTransactions: recipientRateList[", i, "] ", recipientRateList[i]);
            uint256 recipientRateKey = recipientRateList[i];
            deleteRecipientRateTransaction(_recipientRecord.recipientRateMap[recipientRateKey]);
            delete recipientRateList[i];
            recipientRateList.pop();
            if (i == 0)
              break;
        }
    }

    function deleteRecipientRateTransaction(RecipientRateStruct storage recipientRateTransaction)
    internal {
        address[] storage agentAccountList = recipientRateTransaction.agentAccountList;

        // console.log(agentAccountList);

        if ( agentAccountList.length > 0 ) {
            uint i = agentAccountList.length - 1;
            // Traverse Recipient Rate Transactions for removal of Recipiant Rate Transactions
            for (i; i >= 0; i--) {
                address agentKey = recipientRateTransaction.agentAccountList[i];
                AgentStruct storage agentRecord = recipientRateTransaction.agentMap[agentKey];
                deleteAgentRecord(agentRecord);
                deleteTransactionRecords(recipientRateTransaction.transactionList);
                agentAccountList.pop();
                if (i == 0)
                    break;
            }
        }
    }

    function deleteAgentRecord(AgentStruct storage _agentRecord) internal {
        address agentKey = _agentRecord.agentKey;
        address recipientKey = _agentRecord.recipientKey;
        AccountStruct storage agentAccount = accountMap[agentKey];
        AccountStruct storage recipientAccount = accountMap[recipientKey];
        
        // ToDo Delete Sponsor Account List
        deleteAgentRateTransaction (_agentRecord);

        // console.log("ZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZ");
        // console.log("DELETING from agentAccount.agentParentRecipientAccountList recipientKey", _agentRecord.recipientKey);
        // console.log("SPONSOR   =" , _agentRecord.sponsorKey);
        // console.log("RECIPIENT =" , _agentRecord.recipientKey);
        // console.log("AGENT     =" , agentKey);
        // console.log("-------------------------------------------------------------------------------------------------------------------");
        // for (uint j = 0; j < agentAccount.agentParentRecipientAccountList.length ; j++)
        // console.log("*** BEFORE DELETE agentAccount.agentParentRecipientAccountList[", j, "] = ",agentAccount.agentParentRecipientAccountList[j]); 
        // console.log("deleteAccountRecordFromSearchKeys(",_agentRecord.recipientKey, agentAccount.accountKey,")");
        deleteAccountRecordFromSearchKeys(_agentRecord.recipientKey, agentAccount.agentParentRecipientAccountList);

        // Delete Reference Agent Key From Recipient.agentAccountList
        deleteAccountRecordFromSearchKeys(agentKey, recipientAccount.agentAccountList );
        deleteAccountFromMaster(recipientKey);

        // console.log("ZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZ");

        // for (uint j = 0; j < agentAccount.agentParentRecipientAccountList.length ; j++)
        // console.log("*** AFTER DELETE agentAccount.agentParentRecipientAccountList[", j, "] = ",agentAccount.agentParentRecipientAccountList[j]);
         deleteAccountFromMaster(agentKey);
    }

    function deleteAgentRateTransaction (AgentStruct storage agentRecord) internal {
        uint256[] storage agentRateList = agentRecord.agentRateList;
        if (agentRateList.length == 0) {
            return;
        }
        // console.log("### BEFORE Delete agentRecord.agentRateList.length = ", agentRecord.agentRateList.length);
        uint i = agentRateList.length - 1;
        // Delete the agent Rate Structures one by one until empty.
        for (i; i >= 0; i--) {
            // console.log("====deleteAgentRateTransaction: Found agentRateList[", i, "] ", agentRateList[i]);
            uint256 agentRateKey = agentRateList[i];
            AgentRateStruct storage agentRateTransaction = agentRecord.agentRateMap[agentRateKey];
            deleteTransactionRecords(agentRateTransaction.transactionList);
            agentRateList.pop();
            if (i == 0)
              break;
        }
        // delete the Agent Account Record if no References
    }

    // Delete ageny rate list.
    function deleteTransactionRecords(StakingTransactionStruct[] storage transactionList) internal {
        for (uint i= 0; i< transactionList.length; i++) { 
            // console.log("====deleteTransactionRecords: Deleting transactionList[", i, "].quantity ", transactionList[i].quantity);
            delete transactionList[i];
            transactionList.pop();
        }
        // delete agentRateTransaction;
    }

 /////////////////// DELETE ACCOUNT METHODS ////////////////////////

    function deleteAccountRecordFromSearchKeys(address _accountKey, 
    address[] storage _accountKeyList) internal returns (bool) {
        // console.log("**** deleteAccountRecordFromSearchKeys ****************************");
        // dumpAccounts("BEFORE", _accountKey, _accountKeyList);
        bool deleted = false;
        uint i = getAccountListIndex (_accountKey, _accountKeyList);
        // delete Found Account Record From Search Keys by searching for the account
        // When Found Delete the account move the last record to the current index location
        // and delete the last element off the end of the accountKeyList with pop().

        // console.log("QQQQQQQ _accountKey", _accountKey);
        // console.log("QQQQQQQ BEFORE _accountKeyList.length", _accountKeyList.length);
        for (i; i<_accountKeyList.length; i++) { 
            if (_accountKeyList[i] == _accountKey) {
                // console.log("==== Found _accountKeyList[", i, "] ", _accountKeyList[i]);
                // console.log("==== Found accountMap[_accountKeyList[", i,  "]].accountKey ", accountMap[_accountKeyList[i]].accountKey);
                delete _accountKeyList[i];
                if (_accountKeyList.length > 0)
                    _accountKeyList[i] = _accountKeyList[_accountKeyList.length - 1];
                _accountKeyList.pop();
// console.log("QQQQQ Deleting",_accountKey, "From account List");
                deleted = true;
                break;
            }
            // console.log("QQQQQQQ AFTER _accountKeyList.length", _accountKeyList.length);
    }
        // dumpAccounts("AFTER", _accountKey, _accountKeyList);
        // console.log("************************************************************");
        return deleted;
    }

    function deleteUintRecordFromSearchKeys(uint256 _searchKey, uint256[] storage _searchList) internal returns (bool) {
        bool deleted = false;
        for (uint i = 0; i < _searchList.length; i++) {
            if (_searchList[i] == _searchKey) {
                delete _searchList[i];
                if (_searchList.length > 0) {
                    _searchList[i] = _searchList[_searchList.length - 1];
                }
                _searchList.pop();
                deleted = true;
                break;
            }
        }
        return deleted;
    }

    function deleteAccountFromMaster(address _accountKey) 
    internal returns (bool){
        // console.log("XXXXXXXXXXXXXXXXXXXX deleteAccountFromMaster(",_accountKey,") XXXXXXXXXXXXXXXXXXXX");
        // console.log("accountMap[",_accountKey,"].sponsorAccountList.length =", accountMap[_accountKey].sponsorAccountList.length);
        // console.log("accountMap[",_accountKey,"].recipientAccountList.length =", accountMap[_accountKey].recipientAccountList.length);
        // console.log("accountMap[",_accountKey,"].agentAccountList.length =", accountMap[_accountKey].agentAccountList.length);
        // console.log("accountMap[",_accountKey,"].agentParentRecipientAccountList.length =", accountMap[_accountKey].agentParentRecipientAccountList.length);
        // console.log("****balanceOf[",accountMap[_accountKey].accountKey,"] =", balanceOf[accountMap[_accountKey].accountKey]);

        if(accountMap[_accountKey].sponsorAccountList.length == 0 &&
            accountMap[_accountKey].recipientAccountList.length == 0 &&
            accountMap[_accountKey].agentAccountList.length == 0 &&
            accountMap[_accountKey].agentParentRecipientAccountList.length == 0 &&
            balanceOf[accountMap[_accountKey].accountKey] == 0) {
            // console.log("*** DELETING ACCOUNT ", _accountKey);
            if (deleteAccountRecordFromSearchKeys(_accountKey,  masterAccountList)) {
                delete accountMap[_accountKey];
                // console.log("TRUE XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX");
                return true;
            } 
        }
        // console.log("FALSE XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX");
        return false;
    }


    function deleteAccountRecord(address _accountKey) public
        accountExists(_accountKey) 
        // ToDo Replace this Removed for space
        onlyOwnerOrRootAdmin(_accountKey)
        sponsorDoesNotExist(_accountKey)
        parentRecipientDoesNotExist(_accountKey)
        recipientDoesNotExist(_accountKey) returns (bool) {
        if (deleteAccountRecordFromSearchKeys( _accountKey,  masterAccountList)) {
            delete accountMap[_accountKey];
            return true;
        }
        return false;
    }

    modifier sponsorDoesNotExist(address _accountKey) {
        require (accountMap[_accountKey].sponsorAccountList.length == 0 &&
            accountMap[_accountKey].agentAccountList.length == 0, "RECIP_HAS_SPONSOR");
            _;
    }
    
    modifier parentRecipientDoesNotExist(address _accountKey) {
        require (accountMap[_accountKey].agentParentRecipientAccountList.length == 0, "AGENT_HAS_PARENT");
        _;
    }

    modifier recipientDoesNotExist(address _sponsorKey) {
        require (getAccountRecipientList(_sponsorKey).length == 0, "SPONSOR_HAS_RECIP");
        _;
    }
/*   
    modifier AgentDoesNotExist(address _accountKey) {
        require (accountMap[_accountKey](_accountKey).length == 0, "Recipient Account has an Agent, (Sponsor must Un-recipient Recipiented Account)");
        _;
    }
*/
}
