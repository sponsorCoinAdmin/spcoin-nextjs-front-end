// @ts-nocheck
export const BURN_ADDRESS = "0x0000000000000000000000000000000000000000";

async function resolveContractDecimals(context) {
  try {
    const decimals =
      typeof context?.spCoinContractDeployed?.decimals === "function"
        ? await context.spCoinContractDeployed.decimals()
        : 18;
    const numericDecimals = Number(decimals);
    return Number.isInteger(numericDecimals) && numericDecimals >= 0 ? numericDecimals : 18;
  } catch {
    return 18;
  }
}

export async function splitRawQuantityParts(context, value) {
  const raw = BigInt(String(value ?? "0").replace(/,/g, "").trim() || "0");
  const decimals = await resolveContractDecimals(context);
  const scale = 10n ** BigInt(decimals);
  const wholePart = raw / scale;
  const fractionalPart = raw % scale;
  return {
    wholePart: wholePart.toString(),
    fractionalPart: fractionalPart === 0n ? "0" : fractionalPart.toString().padStart(decimals, "0"),
  };
}


