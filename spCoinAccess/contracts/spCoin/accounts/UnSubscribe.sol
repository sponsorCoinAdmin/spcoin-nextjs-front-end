// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;
/// @title ERC20 Contract
import "./Transactions.sol";

contract UnSubscribe is Transactions {
    constructor() { }

    function deleteSponsor(address _sponsorKey)
        external
        onlyOwnerOrRootAdmin(_sponsorKey)
        accountExists(_sponsorKey)
    {
        deleteSponsorRecipients(_sponsorKey);
        deleteAccountFromMaster(_sponsorKey);
    }

    function deleteSponsorRecipients(address _sponsorKey)
        internal
    {
        address[] memory recipientList = accountMap[_sponsorKey].recipientKeys;
        while (recipientList.length > 0) {
            deleteRecipientTree(_sponsorKey, recipientList[recipientList.length - 1]);
            recipientList = accountMap[_sponsorKey].recipientKeys;
        }
    }

    function deleteRecipient(address _sponsorKey, address _recipientKey)
        external
        onlyOwnerOrRootAdmin(_sponsorKey)
        accountExists(_sponsorKey)
        accountExists(_recipientKey)
        nonRedundantRecipient(_sponsorKey, _recipientKey)
    {
        deleteRecipientTree(_sponsorKey, _recipientKey);
    }

    function deleteRecipientTree(address _sponsorKey, address _recipientKey)
        internal
    {
        RecipientStruct storage recipientRecord = accountMap[_sponsorKey].recipientMap[_recipientKey];
        require(recipientRecord.inserted, "RECIP_NOT_FOUND");

        deleteRecipientRates(_sponsorKey, _recipientKey);

        if (accountMap[_sponsorKey].recipientMap[_recipientKey].inserted) {
            _deleteRecipient(_sponsorKey, _recipientKey);
        }
    }

    function deleteRecipientRates(address _sponsorKey, address _recipientKey)
        internal
    {
        uint256[] memory recipientRateList = accountMap[_sponsorKey].recipientMap[_recipientKey].recipientRateKeys;
        while (recipientRateList.length > 0) {
            deleteRecipientRate(_sponsorKey, _recipientKey, recipientRateList[recipientRateList.length - 1]);
            recipientRateList = accountMap[_sponsorKey].recipientMap[_recipientKey].recipientRateKeys;
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
        RecipientRateStruct storage recipientTransaction = recipientRecord.recipientRateMap[_recipientRateKey];
        if (!recipientTransaction.inserted) revert SpCoinError(RECIP_RATE_NOT_FOUND);

        address[] memory agentList = recipientTransaction.agentKeys;
        while (agentList.length > 0) {
            deleteAgent(_sponsorKey, _recipientKey, _recipientRateKey, agentList[agentList.length - 1]);
            agentList = recipientRecord.recipientRateMap[_recipientRateKey].agentKeys;
        }

        if (recipientRecord.recipientRateMap[_recipientRateKey].inserted) {
            _deleteRecipientTransaction(_sponsorKey, _recipientKey, _recipientRateKey);
        }
    }

    function _deleteRecipientTransaction(address _sponsorKey, address _recipientKey, uint256 _recipientRateKey) internal {
        AccountStruct storage sponsorAccount = accountMap[_sponsorKey];
        RecipientStruct storage recipientRecord = sponsorAccount.recipientMap[_recipientKey];
        require(recipientRecord.inserted, "RECIP_NOT_FOUND");

        RecipientRateStruct storage recipientTransaction = recipientRecord.recipientRateMap[_recipientRateKey];
        if (!recipientTransaction.inserted) revert SpCoinError(RECIP_RATE_NOT_FOUND);
        if (recipientTransaction.agentKeys.length != 0) revert SpCoinError(RECIP_RATE_HAS_AGENT);

        uint256 totalSponsored = recipientTransaction.stakedSPCoins;

        totalStakedSPCoins -= totalSponsored;
        totalUnstakedSpCoins += totalSponsored;
        balanceOf[_sponsorKey] += totalSponsored;
        sponsorAccount.stakedSPCoins -= totalSponsored;
        recipientRecord.stakedSPCoins -= totalSponsored;

        deleteRecipientTransactions(recipientTransaction);
        deleteTransactionRecords(recipientTransaction.transactionList);
        deleteUintRecordFromSearchKeys(_recipientRateKey, recipientRecord.recipientRateKeys);
        delete recipientRecord.recipientRateMap[_recipientRateKey];

        if (recipientRecord.recipientRateKeys.length == 0 && recipientRecord.inserted) {
            _deleteRecipient(_sponsorKey, _recipientKey);
        }
    }

    function deleteAgent(address _sponsorKey, address _recipientKey, uint256 _recipientRateKey, address _agentKey)
        public
        onlyOwnerOrRootAdmin(_sponsorKey)
        accountExists(_sponsorKey)
        accountExists(_recipientKey)
        accountExists(_agentKey)
    {
        RecipientRateStruct storage recipientTransaction = getRecipientTransactionByKeys(_sponsorKey, _recipientKey, _recipientRateKey);
        AgentStruct storage agentRecord = recipientTransaction.agentMap[_agentKey];
        if (!agentRecord.inserted) revert SpCoinError(AGENT_NOT_FOUND);

        if (agentRecord.agentRateKeys.length == 0) {
            AccountStruct storage agentAccount = accountMap[_agentKey];
            AccountStruct storage recipientAccount = accountMap[_recipientKey];
            deleteAccountRecordFromSearchKeys(_agentKey, recipientTransaction.agentKeys);
            deleteAccountRecordFromSearchKeys(_agentKey, recipientAccount.agentKeys);
            deleteAccountRecordFromSearchKeys(_recipientKey, agentAccount.parentRecipientKeys);
            delete recipientTransaction.agentMap[_agentKey];
            deleteAccountFromMaster(_agentKey);
            return;
        }
        deleteAgentRates(_sponsorKey, _recipientKey, _recipientRateKey, _agentKey);
    }

    function deleteAgentRates(
        address _sponsorKey,
        address _recipientKey,
        uint256 _recipientRateKey,
        address _agentKey
    )
        internal
    {
        RecipientRateStruct storage recipientTransaction = getRecipientTransactionByKeys(_sponsorKey, _recipientKey, _recipientRateKey);
        uint256[] memory agentRateKeys = recipientTransaction.agentMap[_agentKey].agentRateKeys;
        while (agentRateKeys.length > 0) {
            deleteAgentRate(_sponsorKey, _recipientKey, _recipientRateKey, _agentKey, agentRateKeys[agentRateKeys.length - 1]);
            agentRateKeys = recipientTransaction.agentMap[_agentKey].agentRateKeys;
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

        RecipientRateStruct storage recipientTransaction = recipientRecord.recipientRateMap[_recipientRateKey];
        if (!recipientTransaction.inserted) revert SpCoinError(RECIP_RATE_NOT_FOUND);

        AgentStruct storage agentRecord = recipientTransaction.agentMap[_agentKey];
        if (!agentRecord.inserted) revert SpCoinError(AGENT_NOT_FOUND);

        AgentRateStruct storage agentTransaction = agentRecord.agentRateMap[_agentRateKey];
        if (!agentTransaction.inserted) revert SpCoinError(AGENT_RATE_NOT_FOUND);

        uint256 totalSponsored = agentTransaction.stakedSPCoins;

        totalStakedSPCoins -= totalSponsored;
        totalUnstakedSpCoins += totalSponsored;
        balanceOf[_sponsorKey] += totalSponsored;
        sponsorAccount.stakedSPCoins -= totalSponsored;
        recipientRecord.stakedSPCoins -= totalSponsored;
        recipientTransaction.stakedSPCoins -= totalSponsored;
        agentRecord.stakedSPCoins -= totalSponsored;

        deleteAgentTransactions(agentTransaction);
        deleteTransactionRecords(agentTransaction.transactionList);
        deleteUintRecordFromSearchKeys(_agentRateKey, agentRecord.agentRateKeys);
        delete agentRecord.agentRateMap[_agentRateKey];

        if (agentRecord.agentRateKeys.length == 0) {
            AccountStruct storage agentAccount = accountMap[_agentKey];
            AccountStruct storage recipientAccount = accountMap[_recipientKey];

            deleteAccountRecordFromSearchKeys(_agentKey, recipientTransaction.agentKeys);
            deleteAccountRecordFromSearchKeys(_agentKey, recipientAccount.agentKeys);
            deleteAccountRecordFromSearchKeys(_recipientKey, agentAccount.parentRecipientKeys);
            delete recipientTransaction.agentMap[_agentKey];
            deleteAccountFromMaster(_agentKey);
        }

        if (recipientTransaction.agentKeys.length == 0 && recipientTransaction.transactionList.length == 0) {
            deleteUintRecordFromSearchKeys(_recipientRateKey, recipientRecord.recipientRateKeys);
            delete recipientRecord.recipientRateMap[_recipientRateKey];
        }

        if (recipientRecord.recipientRateKeys.length == 0) {
            AccountStruct storage recipientAccount = accountMap[_recipientKey];
            deleteAccountRecordFromSearchKeys(_recipientKey, sponsorAccount.recipientKeys);
            deleteAccountRecordFromSearchKeys(_sponsorKey, recipientAccount.sponsorKeys);
            delete sponsorAccount.recipientMap[_recipientKey];
            deleteAccountFromMaster(_recipientKey);
        }
    }

    function _deleteRecipient(address _sponsorKey, address _recipientKey)
        internal
    {
        AccountStruct storage sponsorAccount = accountMap[_sponsorKey];
        if (deleteAccountRecordFromSearchKeys(_recipientKey, sponsorAccount.recipientKeys)) {
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
        deleteAccountRecordFromSearchKeys(recipientRecord.sponsorKey, recipientAccount.sponsorKeys);
        deleteRecipientRateRecords(recipientRecord);

     }

    // For each Recipient Rate Transaction,
    //   Remove Agent Account Reference from Rate Transaction
    function deleteRecipientRateRecords(RecipientStruct storage _recipientRecord) internal {
        // Delete Agent Rate Keys
        uint256[] storage recipientRateKeys = _recipientRecord.recipientRateKeys;
        if (recipientRateKeys.length == 0) {
            return;
        }
        uint i = recipientRateKeys.length - 1;
        // Traverse Recipient Rate Transactions for removal of Recipiant Rate Transactions
        for (i; i >= 0; i--) {
            // console.log("====deleteRecipientTransactions: recipientRateKeys[", i, "] ", recipientRateKeys[i]);
            uint256 recipientRateKey = recipientRateKeys[i];
            deleteRecipientRateRecord(_recipientRecord.recipientRateMap[recipientRateKey]);
            delete recipientRateKeys[i];
            recipientRateKeys.pop();
            if (i == 0)
              break;
        }
    }

    function deleteRecipientRateRecord(RecipientRateStruct storage recipientTransaction)
    internal {
        address[] storage agentKeys = recipientTransaction.agentKeys;

        // console.log(agentKeys);

        if ( agentKeys.length > 0 ) {
            uint i = agentKeys.length - 1;
            // Traverse Recipient Rate Transactions for removal of Recipiant Rate Transactions
            for (i; i >= 0; i--) {
                address agentKey = recipientTransaction.agentKeys[i];
                AgentStruct storage agentRecord = recipientTransaction.agentMap[agentKey];
                deleteAgentRecord(agentRecord);
                delete recipientTransaction.agentMap[agentKey];
                agentKeys.pop();
                if (i == 0)
                    break;
            }
        }
        deleteRecipientTransactions(recipientTransaction);
        deleteTransactionRecords(recipientTransaction.transactionList);
    }

    function deleteAgentRecord(AgentStruct storage _agentRecord) internal {
        address agentKey = _agentRecord.agentKey;
        address recipientKey = _agentRecord.recipientKey;
        AccountStruct storage agentAccount = accountMap[agentKey];
        AccountStruct storage recipientAccount = accountMap[recipientKey];
        
        // ToDo Delete Sponsor Account List
        deleteAgentRateRecords(_agentRecord);

        // console.log("ZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZ");
        // console.log("DELETING from agentAccount.agentParentRecipientAccountList recipientKey", _agentRecord.recipientKey);
        // console.log("SPONSOR   =" , _agentRecord.sponsorKey);
        // console.log("RECIPIENT =" , _agentRecord.recipientKey);
        // console.log("AGENT     =" , agentKey);
        // console.log("-------------------------------------------------------------------------------------------------------------------");
        // for (uint j = 0; j < agentAccount.agentParentRecipientAccountList.length ; j++)
        // console.log("*** BEFORE DELETE agentAccount.agentParentRecipientAccountList[", j, "] = ",agentAccount.agentParentRecipientAccountList[j]); 
        // console.log("deleteAccountRecordFromSearchKeys(",_agentRecord.recipientKey, agentAccount.accountKey,")");
        deleteAccountRecordFromSearchKeys(_agentRecord.recipientKey, agentAccount.parentRecipientKeys);

        // Delete Reference Agent Key From Recipient.agentAccountList
        deleteAccountRecordFromSearchKeys(agentKey, recipientAccount.agentKeys );
        deleteAccountFromMaster(recipientKey);

        // console.log("ZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZ");

        // for (uint j = 0; j < agentAccount.agentParentRecipientAccountList.length ; j++)
        // console.log("*** AFTER DELETE agentAccount.agentParentRecipientAccountList[", j, "] = ",agentAccount.agentParentRecipientAccountList[j]);
         deleteAccountFromMaster(agentKey);
    }

    function deleteAgentRateRecords(AgentStruct storage agentRecord) internal {
        uint256[] storage agentRateKeys = agentRecord.agentRateKeys;
        if (agentRateKeys.length == 0) {
            return;
        }
        while (agentRateKeys.length > 0) {
            uint256 agentRateKey = agentRateKeys[agentRateKeys.length - 1];
            AgentRateStruct storage agentTransaction = agentRecord.agentRateMap[agentRateKey];
            deleteAgentTransactions(agentTransaction);
            deleteTransactionRecords(agentTransaction.transactionList);
            delete agentRecord.agentRateMap[agentRateKey];
            agentRateKeys.pop();
        }
    }

    function deleteAgentTransactions(AgentRateStruct storage agentTransaction) internal {
        uint256[] storage transactionIds = agentTransaction.agentTransactionIdKeys;
        while (transactionIds.length > 0) {
            transactionIds.pop();
        }
        delete agentTransaction.agentTransactionSet;
    }

    function deleteRecipientTransactions(RecipientRateStruct storage recipientTransaction) internal {
        deleteTransactionIds(recipientTransaction.recipientTransactionIdKeys);
        delete recipientTransaction.recipientTransactionSet;
    }

    function deleteTransactionIds(uint256[] storage transactionIds) internal {
        while (transactionIds.length > 0) {
            uint256 transactionId = transactionIds[transactionIds.length - 1];
            if (transactionId != 0) {
                delete masterTransactionIdMap[transactionId];
            }
            transactionIds.pop();
        }
    }

    // Delete ageny rate list.
    function deleteTransactionRecords(StakingTransactionStruct[] storage transactionList) internal {
        while (transactionList.length > 0) {
            transactionList.pop();
        }
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

        if(accountMap[_accountKey].sponsorKeys.length == 0 &&
            accountMap[_accountKey].recipientKeys.length == 0 &&
            accountMap[_accountKey].agentKeys.length == 0 &&
            accountMap[_accountKey].parentRecipientKeys.length == 0 &&
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


    function deleteAccountRecord(address _accountKey) external
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
        require (accountMap[_accountKey].sponsorKeys.length == 0 &&
            accountMap[_accountKey].agentKeys.length == 0, "RECIP_HAS_SPONSOR");
            _;
    }
    
    modifier parentRecipientDoesNotExist(address _accountKey) {
        require (accountMap[_accountKey].parentRecipientKeys.length == 0, "AGENT_HAS_PARENT");
        _;
    }

    modifier recipientDoesNotExist(address _sponsorKey) {
        require (accountMap[_sponsorKey].recipientKeys.length == 0, "SPONSOR_HAS_RECIP");
        _;
    }
/*   
    modifier AgentDoesNotExist(address _accountKey) {
        require (accountMap[_accountKey](_accountKey).length == 0, "Recipient Account has an Agent, (Sponsor must Un-recipient Recipiented Account)");
        _;
    }
*/
}
