// @ts-nocheck
import { Interface } from "ethers";

const legacyAccountListInterface = new Interface([
    "function getAccountList() view returns (address[])",
]);

async function callLegacyGetAccountList(contract) {
    const target = String(contract?.target || (typeof contract?.getAddress === "function" ? await contract.getAddress() : ""));
    const runner = contract?.runner;
    if (!target || !runner || typeof runner.call !== "function") {
        throw new Error("SpCoin contract does not expose getMasterAccountList().");
    }
    const data = legacyAccountListInterface.encodeFunctionData("getAccountList", []);
    const raw = await runner.call({ to: target, data });
    const decoded = legacyAccountListInterface.decodeFunctionResult("getAccountList", raw);
    return decoded[0];
}

export async function getMasterAccountList(context) {
    context.spCoinLogger.logFunctionHeader("getMasterAccountList = async()");
    if (typeof context.spCoinContractDeployed.getMasterAccountList === "function") {
        try {
            const insertedAccountList = await context.spCoinContractDeployed.getMasterAccountList();
            context.spCoinLogger.logExitFunction();
            return insertedAccountList;
        } catch (error) {
            const code = String(error?.code || "");
            const data = String(error?.data || "");
            const message = String(error?.message || "");
            if (code !== "CALL_EXCEPTION" && data !== "0x" && !/execution reverted|require\(false\)/i.test(message)) {
                throw error;
            }
        }
    }
    if (typeof context.spCoinContractDeployed.getAccountList === "function") {
        const insertedAccountList = await context.spCoinContractDeployed.getAccountList();
        context.spCoinLogger.logExitFunction();
        return insertedAccountList;
    }
    const insertedAccountList = await callLegacyGetAccountList(context.spCoinContractDeployed);
    context.spCoinLogger.logExitFunction();
    return insertedAccountList;
}
