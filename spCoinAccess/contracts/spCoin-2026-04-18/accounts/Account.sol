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
        address[] storage sponsorAccountList = recipientAccount.sponsorAccountList;
        return accountInList( _sponsorAccount, sponsorAccountList );
    }

    function recipientHasSponsor(address _sponsorAccount, address _recipientAccount )
        internal view returns ( bool ) {
        AccountStruct storage recipientAccount = accountMap[_recipientAccount];
        address[] storage sponsorAccountList = recipientAccount.sponsorAccountList;
        return accountInList( _sponsorAccount, sponsorAccountList );
    }

    function agentHasRecipient(address _recipientAccount, address _agentAccount )
        internal view returns ( bool ) {
        AccountStruct storage recipientAccount = accountMap[_recipientAccount];
        address[] storage agentAccountList = recipientAccount.agentAccountList;
        return accountInList( _agentAccount, agentAccountList );
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

    /// @notice retreives array list masterAccountList.
    function getMasterAccountList() public view returns (address[] memory) {
        return masterAccountList;
    }

    function getMasterAccountElement(uint256 index) public view returns (address) {
        return masterAccountList[index];
    }

    function getAccountCore(address _accountKey)
        public
        view
        accountExists(_accountKey)
        returns (
            address accountKey,
            uint256 creationTime,
            uint256 accountBalance,
            uint256 stakedAccountSPCoins,
            uint256 accountStakingRewards
        )
    {
        AccountStruct storage accountRec = accountMap[_accountKey];
        accountKey = accountRec.accountKey;
        creationTime = accountRec.creationTime;
        accountBalance = balanceOf[_accountKey];
        stakedAccountSPCoins = accountRec.stakedSPCoins;
        accountStakingRewards = accountRec.stakingRewards;
    }

    function getAccountLinks(address _accountKey)
        public
        view
        accountExists(_accountKey)
        returns (
            address[] memory sponsorAccountList,
            address[] memory recipientAccountList,
            address[] memory agentAccountList,
            address[] memory agentParentRecipientAccountList
        )
    {
        AccountStruct storage accountRec = accountMap[_accountKey];
        sponsorAccountList = accountRec.sponsorAccountList;
        recipientAccountList = accountRec.recipientAccountList;
        agentAccountList = accountRec.agentAccountList;
        agentParentRecipientAccountList = accountRec.agentParentRecipientAccountList;
    }

    /////////////////////////// AGENT REQUESTS //////////////////////////////
 
    /// @notice retreives the recipients of a specific address.
    /// @param _sponsorKey public account key to set new balance
    function getAccountRecipientList(address _sponsorKey) 
    public view returns (address[] memory) {
        return accountMap[_sponsorKey].recipientAccountList;
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
