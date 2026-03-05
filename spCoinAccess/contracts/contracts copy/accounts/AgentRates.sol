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

    function serializeAgentRateRecordStr(address _sponsorKey, address _recipientKey, uint _recipientRateKey, address _agentKey, uint256 _agentRateKey) 
    public view returns (string memory) {
        AgentRateStruct storage agentRateRecord =  getAgentRateRecordByKeys(_sponsorKey, _recipientKey, _recipientRateKey, _agentKey, _agentRateKey);
        string memory creationTimeStr = toString(agentRateRecord.creationTime);
        string memory lastUpdateTimeStr = toString(agentRateRecord.lastUpdateTime);
        string memory stakedSPCoinsStr = toString(agentRateRecord.stakedSPCoins);
        string memory strRateHeaderStr = concat(creationTimeStr, ",", lastUpdateTimeStr, ",", stakedSPCoinsStr);
        return strRateHeaderStr;
    }


}
