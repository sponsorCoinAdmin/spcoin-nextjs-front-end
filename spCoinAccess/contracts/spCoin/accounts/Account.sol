// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;
/// @title ERC20 Contract
import "../utils///StructSerialization.sol";

contract Account is StructSerialization {
    constructor() {}

    /// @notice insert block chain network address for spCoin Management
    /// @param _accountKey public accountKey to set new balance
    function addAccountRecord(uint accountType, address _accountKey)
        internal {
        AccountStruct storage accountRec = accountMap[_accountKey];
        if (!accountRec.inserted) {
            // console.log("addAccountRecord(", accountType, _accountKey, ")");
            accountRec.accountKey = _accountKey;
            accountRec.creationTime = block.timestamp;
            // accountRec.decimals = decimals;
            accountRec.stakedSPCoins = 0;
            accountRec.inserted = true;
            masterAccountList.push(_accountKey);
        }
        accountRec.accountTypes |= accountType;
    }

    function getAccountRecord(uint accountType, address account)
        internal returns (AccountStruct storage accountRecord) {
            addAccountRecord(accountType, account);
            return accountMap[account];
    }

    function sponsorHasRecipient(address _recipientAccount, address _sponsorAccount )
        internal view returns ( bool ) {
        AccountStruct storage recipientAccount = accountMap[_recipientAccount];
        address[] storage sponsorKeys = recipientAccount.sponsorKeys;
        return accountInList( _sponsorAccount, sponsorKeys );
    }

    function recipientHasSponsor(address _sponsorAccount, address _recipientAccount )
        internal view returns ( bool ) {
        AccountStruct storage recipientAccount = accountMap[_recipientAccount];
        address[] storage sponsorKeys = recipientAccount.sponsorKeys;
        return accountInList( _sponsorAccount, sponsorKeys );
    }

    function agentHasRecipient(address _recipientAccount, address _agentAccount )
        internal view returns ( bool ) {
        AccountStruct storage recipientAccount = accountMap[_recipientAccount];
        address[] storage agentKeys = recipientAccount.agentKeys;
        return accountInList( _agentAccount, agentKeys );
    }

    function accountInList(address _sourceAccount, address[] storage searchList )
        internal view returns ( bool ) {
        bool sponsorFound = false;

        for (uint idx = 0; idx < searchList.length; idx++) {
        if ( _sourceAccount == searchList[idx] )
            sponsorFound = true;
        }
        return sponsorFound;
    }
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    /// @notice retrieves the inserted account keys.
    function getMasterAccountKeys() public view returns (address[] memory) {
        return masterAccountList;
    }

    function getMasterAccountKeyAt(uint256 index) public view returns (address) {
        return masterAccountList[index];
    }

    function getAccountKeyCount() public view returns (uint256) {
        return masterAccountList.length;
    }

    function getAccountCore(address _accountKey)
        public
        view
        accountExists(_accountKey)
        returns (
            address accountKey,
            uint256 creationTime,
            bool verified,
            uint256 accountBalance,
            uint256 stakedAccountSPCoins,
            uint256 accountStakingRewards
        )
    {
        AccountStruct storage accountRec = accountMap[_accountKey];
        accountKey = accountRec.accountKey;
        creationTime = accountRec.creationTime;
        verified = accountRec.verified;
        accountBalance = balanceOf[_accountKey];
        stakedAccountSPCoins = accountRec.stakedSPCoins;
        accountStakingRewards = accountRec.stakingRewards;
    }

    function getAccountLinks(address _accountKey)
        public
        view
        accountExists(_accountKey)
        returns (
            address[] memory sponsorKeys,
            address[] memory recipientKeys,
            address[] memory agentKeys,
            address[] memory parentRecipientKeys
        )
    {
        AccountStruct storage accountRec = accountMap[_accountKey];
        sponsorKeys = accountRec.sponsorKeys;
        recipientKeys = accountRec.recipientKeys;
        agentKeys = accountRec.agentKeys;
        parentRecipientKeys = accountRec.parentRecipientKeys;
    }

    /////////////////////////// AGENT REQUESTS //////////////////////////////
 
    /// @notice retrieves the recipient keys linked to an account.
    /// @param _sponsorKey public account key to set new balance
    function getRecipientKeys(address _sponsorKey) 
    public view returns (address[] memory) {
        return accountMap[_sponsorKey].recipientKeys;
    }

    /// @notice retrieves the agent keys linked to an account.
    /// @param _accountKey public account key to query
    function getAgentKeys(address _accountKey)
    public view returns (address[] memory) {
        return accountMap[_accountKey].agentKeys;
    }

    function getRecipientKeyCount(address _accountKey) public view returns (uint256) {
        return accountMap[_accountKey].recipientKeys.length;
    }

    function getAgentKeyCount(address _accountKey) public view returns (uint256) {
        return accountMap[_accountKey].agentKeys.length;
    }

    function getAccountListIndex (address _accountKey, 
        address[] storage _accountKeyList) internal view returns (uint) {
        uint i = 0;
        for (i; i < _accountKeyList.length; i++) {
            if (_accountKeyList[i] == _accountKey) {
                break;
            }
        }
        return i; 
    }

    modifier accountExists (address _accountKey) {
        require (isAccountInserted(_accountKey) , "ACCOUNT_NOT_FOUND");
        _;
    }
}
