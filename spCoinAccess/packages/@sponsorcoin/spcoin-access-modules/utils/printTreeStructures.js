const { } = require("../../prod//spcoinModules/modules/utils/logging");

const printTestHHAccounts = () => {
    return JSON.stringify(TEST_HH_ACCOUNT_LIST, null, 2);
}

///////////////////////////////// Structure Data //////////////////////////////

const printStructureTree = (_structure) => {
    spCoinLogger.logFunctionHeader("printStructureTree (" + _structure + ")");
    let structure = getJSONStructureTree(_structure);
    console.log(structure);
    spCoinLogger.logExitFunction();
}

const printStructureRecipients = async(_accountStruct) => {
    spCoinLogger.logFunctionHeader("printStructureRecipients (" + _accountStruct + ")");
    let accountRecipients = getJSONStructureRecipients(_accountKey);
    console.log(accountRecipients);
    spCoinLogger.logExitFunction();
}

const printStructureAccountKYC = async(_accountStruct) => {
    spCoinLogger.logFunctionHeader("printStructureAccountKYC (" + _accountStruct + ")");
    let accountKYC = getJSONStructureAccountKYC(_accountKey);
    console.log(accountKYC);
    spCoinLogger.logExitFunction();
}

const printStructureRecipientAgents = async(_recipientStruct) => {
    spCoinLogger.logFunctionHeader("printStructureRecipientAgents (" + _recipientStruct + ")");
    let recipientAgents = getJSONStructureRecipientAgents(_accountKey, _recipientKey);
    console.log(recipientAgents);
    spCoinLogger.logExitFunction();
}

///////////////////////////////// Structure Data //////////////////////////////

const getJSONStructureTree = (_structure) => {
    spCoinLogger.logFunctionHeader("getJSONStructureTree (" + _structure + ")");
    spCoinLogger.logExitFunction();
    return JSON.stringify(_structure, null, 2);
}

const getJSONStructureRecipients = async(_accountStruct) => {
    spCoinLogger.logFunctionHeader("getJSONStructureRecipients (" + _accountStruct + ")");
    spCoinLogger.logExitFunction();
    return JSON.stringify(_accountRecipients, null, 2);
}

const getJSONStructureAccountKYC = async(_accountStruct) => {
    spCoinLogger.logFunctionHeader("getJSONStructureAccountKYC (" + _accountStruct + ")");
    spCoinLogger.logExitFunction();
    return JSON.stringify(_accountStruct.KYC, null, 2);
}

const getJSONStructureRecipientAgents = async(_recipientStruct) => {
    spCoinLogger.logFunctionHeader("getJSONStructureRecipientAgents (" + _recipientStruct + ")");
    spCoinLogger.logExitFunction();
    return JSON.stringify(_recipientStruct, null, 2);
}

///////////////////////////////// NetWork Stuff //////////////////////////////

const printNetworkRecipients = async(_accountKey) => {
    spCoinLogger.logFunctionHeader("printNetworkRecipients (" + _accountKey + ")");
    let accountRecipients = getJSONNetworkRecipients(_accountKey);
    console.log(accountRecipients);
    spCoinLogger.logExitFunction();
}

const printNetworkAccountKYC = async(_accountKey) => {
    spCoinLogger.logFunctionHeader("printNetworkAccountKYC (" + _accountKey + ")");
    let accountKYC = getJSONNetworkAccountKYC(_accountKey);
    console.log(accountKYC);
    spCoinLogger.logExitFunction();
}

const printNetworkRecipientAgents = async(_accountKey, _recipientKey) => {
    spCoinLogger.logFunctionHeader("printNetworkRecipientAgents (" + _accountKey + ", " + _recipientKey + ")");
    let recipientAgents = getJSONNetworkRecipientAgents(_accountKey, _recipientKey);
    console.log(recipientAgents);
    spCoinLogger.logExitFunction();
}

///////////////////////////////// NetWork Stuff //////////////////////////////

const getJSONNetworkRecipients = async(_accountKey) => {
    spCoinLogger.logFunctionHeader("getJSONNetworkRecipients (" + _accountKey + ")");
    let accountRecipients = getNetworkRecipients(_accountKey);
    spCoinLogger.logExitFunction();
    return JSON.stringify(accountRecipients, null, 2);
}

const getJSONNetworkAccountKYC = async(_accountKey) => {
    spCoinLogger.logFunctionHeader("getJSONNetworkAccountKYC (" + _accountKey + ")");
    let accountKYC = getNetworkAccountKYC(_accountKey);
    spCoinLogger.logExitFunction();
    return JSON.stringify(accountKYC, null, 2);
}

const getJSONNetworkRecipientAgents = async(_accountKey, _recipientKey) => {
    spCoinLogger.logFunctionHeader("getJSONNetworkRecipientAgents (" + _accountKey + ", " + _recipientKey + ")");
    let recipientAgents = getNetworkRecipientAgents(_accountKey, _recipientKey);
    spCoinLogger.logExitFunction();
    return JSON.stringify(recipientAgents, null, 2);
}

////////////////////////// To Do Get From Network ////////////////////////////

const getNetworkRecipients = async(_accountKey) => {
    spCoinLogger.logFunctionHeader("getNetworkRecipients (" + _accountKey + ")");
    let accountRecipients = await getNetworkRecipients(_accountKey);
    spCoinLogger.logExitFunction();
    return JSON.stringify(accountRecipients, null, 2);
}

const getNetworkAccountKYC = async(_accountKey) => {
    spCoinLogger.logFunctionHeader("getNetworkAccountKYC (" + _accountKey + ")");
    let accountKYC = await getNetworkAccountKYC(_accountKey);
    spCoinLogger.logExitFunction();
    return JSON.stringify(accountKYC, null, 2);
}

const getNetworkRecipientAgents = async(_accountKey, _recipientKey) => {
    spCoinLogger.logFunctionHeader("getNetworkRecipientAgents (" + _accountKey + ", " + _recipientKey + ")");
    let recipientAgents = await getNetworkRecipientAgents(_accountKey, _recipientKey);
    spCoinLogger.logExitFunction();
    return JSON.stringify(recipientAgents, null, 2);
}

module.exports = {
// Local Calls
    printTestHHAccounts,
    printStructureTree,
    printStructureRecipients,
    printStructureAccountKYC,
    printStructureRecipientAgents,
    getJSONStructureRecipients,
    getJSONStructureAccountKYC,
    getJSONStructureRecipientAgents,
    // NetWork Calls
    printNetworkRecipients,
    printNetworkAccountKYC,
    printNetworkRecipientAgents,
    getJSONNetworkRecipients,
    getJSONNetworkAccountKYC,
    getJSONNetworkRecipientAgents,
    getNetworkRecipients,
    getNetworkAccountKYC,
    getNetworkRecipientAgents
}