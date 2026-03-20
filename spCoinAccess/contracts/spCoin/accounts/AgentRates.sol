// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;
/// @title ERC20 Contract
import "./Agent.sol";

contract AgentRates is Agent {

    constructor() { }

    /// @notice insert recipients Agent
    /// @param _recipientKey public account key to get recipient array
    /// @param _recipientRateKey public account key to get recipient Rate for a given recipient
    /// @param _agentKey new recipient to add to account list 
    function getAgentRateRecord(address _sponsor, address _recipientKey, uint _recipientRateKey, address _agentKey, uint _agentRateKey, uint _creationDate)
     internal returns (AgentRateStruct storage) 
    {
        AgentStruct storage agentRecord = getAgentRecord(_sponsor, _recipientKey, _recipientRateKey, _agentKey);
        AgentRateStruct storage agentRateRecord= getAgentRateRecordByKeys(_sponsor, _recipientKey, _recipientRateKey, _agentKey, _agentRateKey);
        if (!agentRateRecord.inserted) {
            validateAgentRateRange(_agentRateKey);
            agentRateRecord.agentRate = _agentRateKey;
            agentRateRecord.inserted = true;
            agentRateRecord.creationTime = _creationDate;
            // agentRateRecord.stakedSPCoins = 0;
            agentRecord.agentRateList.push(_agentRateKey);
        }
        return agentRateRecord;
    }

    function getAgentRateRecordByKeys(address _sponsorKey, address _recipientKey, uint _recipientRateKey, address _agentKey, uint _agentRateKey)
    internal view returns (AgentRateStruct storage) {
        AgentStruct storage agentRec = getAgentRecordByKeys(_sponsorKey, _recipientKey, _recipientRateKey, _agentKey) ;
        return agentRec.agentRateMap[_agentRateKey];
    }

    function getAgentRateRecordCore(
        address _sponsorKey,
        address _recipientKey,
        uint256 _recipientRateKey,
        address _agentKey,
        uint256 _agentRateKey
    )
        public
        view
        returns (
            uint256 agentRate,
            uint256 creationTime,
            uint256 lastUpdateTime,
            uint256 stakedSPCoins,
            bool inserted
        )
    {
        AgentRateStruct storage agentRateRecord =
            getAgentRateRecordByKeys(_sponsorKey, _recipientKey, _recipientRateKey, _agentKey, _agentRateKey);
        agentRate = agentRateRecord.agentRate;
        creationTime = agentRateRecord.creationTime;
        lastUpdateTime = agentRateRecord.lastUpdateTime;
        stakedSPCoins = agentRateRecord.stakedSPCoins;
        inserted = agentRateRecord.inserted;
    }


}
