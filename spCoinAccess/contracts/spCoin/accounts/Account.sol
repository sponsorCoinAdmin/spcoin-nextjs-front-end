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
        if (accountType != UNDEFINED) {
            setAccountActive(_accountKey);
        }
    }

    function setAccountActive(address _accountKey) internal {
        isActiveAccount[_accountKey] = true;
    }

    function hasActiveLinks(address _accountKey) internal view returns (bool) {
        AccountStruct storage accountRec = accountMap[_accountKey];
        return accountRec.activeParentLinkCount > 0 || accountRec.activeChildLinkCount > 0;
    }

    function deactivateAccountIfUnlinked(address _accountKey) internal returns (bool) {
        if (!accountMap[_accountKey].inserted || hasActiveLinks(_accountKey)) {
            return false;
        }
        isActiveAccount[_accountKey] = false;
        return true;
    }

    function incrementActiveParentLink(address _accountKey) internal {
        accountMap[_accountKey].activeParentLinkCount += 1;
        setAccountActive(_accountKey);
    }

    function incrementActiveChildLink(address _accountKey) internal {
        accountMap[_accountKey].activeChildLinkCount += 1;
        setAccountActive(_accountKey);
    }

    function decrementActiveParentLink(address _accountKey) internal {
        AccountStruct storage accountRec = accountMap[_accountKey];
        if (accountRec.activeParentLinkCount > 0) {
            accountRec.activeParentLinkCount -= 1;
        }
        deactivateAccountIfUnlinked(_accountKey);
    }

    function decrementActiveChildLink(address _accountKey) internal {
        AccountStruct storage accountRec = accountMap[_accountKey];
        if (accountRec.activeChildLinkCount > 0) {
            accountRec.activeChildLinkCount -= 1;
        }
        deactivateAccountIfUnlinked(_accountKey);
    }

    function clearActiveChildLinks(address _accountKey) internal {
        accountMap[_accountKey].activeChildLinkCount = 0;
        deactivateAccountIfUnlinked(_accountKey);
    }

    function getAccountRecord(uint accountType, address account)
        internal returns (AccountStruct storage accountRecord) {
            addAccountRecord(accountType, account);
            return accountMap[account];
    }

    function getInternalAccount(address _accountKey)
        internal
        view
        returns (bool inserted, AccountStruct storage accountRecord)
    {
        accountRecord = accountMap[_accountKey];
        inserted = accountRecord.inserted;
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
    function getMasterAccountKeys() external view returns (address[] memory) {
        return masterAccountList;
    }

    function getMasterAccountKeyAt(uint256 index) external view returns (address) {
        return masterAccountList[index];
    }

    function getAccountKeyCount() external view returns (uint256) {
        return masterAccountList.length;
    }

    function isAccountActive(address _accountKey) external view returns (bool) {
        return isActiveAccount[_accountKey];
    }

    function accountHasActiveLinks(address _accountKey) external view returns (bool) {
        return hasActiveLinks(_accountKey);
    }

    function getAccountCore(address _accountKey)
        external
        view
        returns (
            address accountKey,
            uint256 creationTime,
            bool verified,
            uint256 accountBalance,
            uint256 stakedAccountSPCoins,
            uint256 accountStakingRewards,
            uint256 activeParentLinkCount,
            uint256 activeChildLinkCount
        )
    {
        (bool inserted, AccountStruct storage accountRec) = getInternalAccount(_accountKey);
        accountKey = _accountKey;
        if (!inserted) {
            return (
                accountKey,
                creationTime,
                verified,
                accountBalance,
                stakedAccountSPCoins,
                accountStakingRewards,
                activeParentLinkCount,
                activeChildLinkCount
            );
        }
        accountKey = accountRec.accountKey;
        creationTime = accountRec.creationTime;
        verified = accountRec.verified;
        accountBalance = balanceOf[_accountKey];
        stakedAccountSPCoins = accountRec.stakedSPCoins;
        accountStakingRewards = accountRec.stakingRewards;
        activeParentLinkCount = accountRec.activeParentLinkCount;
        activeChildLinkCount = accountRec.activeChildLinkCount;
    }

    function getAccountRecord(address _accountKey)
        external
        view
        returns (
            address accountKey,
            uint256 creationTime,
            bool verified,
            uint256 accountBalance,
            uint256 stakedAccountSPCoins,
            uint256 accountStakingRewards,
            address[] memory sponsorKeys,
            address[] memory recipientKeys,
            address[] memory agentKeys,
            address[] memory parentRecipientKeys
        )
    {
        (bool inserted, AccountStruct storage accountRec) = getInternalAccount(_accountKey);
        accountKey = _accountKey;
        if (!inserted) {
            sponsorKeys = new address[](0);
            recipientKeys = new address[](0);
            agentKeys = new address[](0);
            parentRecipientKeys = new address[](0);
            return (
                accountKey,
                creationTime,
                verified,
                accountBalance,
                stakedAccountSPCoins,
                accountStakingRewards,
                sponsorKeys,
                recipientKeys,
                agentKeys,
                parentRecipientKeys
            );
        }
        accountKey = accountRec.accountKey;
        creationTime = accountRec.creationTime;
        verified = accountRec.verified;
        accountBalance = balanceOf[_accountKey];
        stakedAccountSPCoins = accountRec.stakedSPCoins;
        accountStakingRewards = accountRec.stakingRewards;
        sponsorKeys = accountRec.sponsorKeys;
        recipientKeys = accountRec.recipientKeys;
        agentKeys = accountRec.agentKeys;
        parentRecipientKeys = accountRec.parentRecipientKeys;
    }

    function getAccountLinks(address _accountKey)
        external
        view
        returns (
            address[] memory sponsorKeys,
            address[] memory recipientKeys,
            address[] memory agentKeys,
            address[] memory parentRecipientKeys
        )
    {
        (bool inserted, AccountStruct storage accountRec) = getInternalAccount(_accountKey);
        if (!inserted) {
            sponsorKeys = new address[](0);
            recipientKeys = new address[](0);
            agentKeys = new address[](0);
            parentRecipientKeys = new address[](0);
            return (sponsorKeys, recipientKeys, agentKeys, parentRecipientKeys);
        }
        sponsorKeys = accountRec.sponsorKeys;
        recipientKeys = accountRec.recipientKeys;
        agentKeys = accountRec.agentKeys;
        parentRecipientKeys = accountRec.parentRecipientKeys;
    }

    /////////////////////////// AGENT REQUESTS //////////////////////////////
 
    /// @notice retrieves the recipient keys linked to an account.
    /// @param _sponsorKey public account key to set new balance
    function getRecipientKeys(address _sponsorKey) 
    external view returns (address[] memory) {
        return accountMap[_sponsorKey].recipientKeys;
    }

    /// @notice retrieves the agent keys linked to an account.
    /// @param _accountKey public account key to query
    function getAgentKeys(address _accountKey)
    external view returns (address[] memory) {
        return accountMap[_accountKey].agentKeys;
    }

    function getRecipientKeyCount(address _accountKey) external view returns (uint256) {
        return accountMap[_accountKey].recipientKeys.length;
    }

    function getAgentKeyCount(address _accountKey) external view returns (uint256) {
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
        require (accountMap[_accountKey].inserted , "ACCOUNT_NOT_FOUND");
        _;
    }
}
