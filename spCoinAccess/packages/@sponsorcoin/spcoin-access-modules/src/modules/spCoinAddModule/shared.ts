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

export async function normalizeRawQuantityUnits(_context, value) {
  const input = String(value ?? "0").replace(/,/g, "").trim() || "0";
  if (input.startsWith("-")) {
    throw new Error("SpCoin quantity cannot be negative.");
  }

  const decimals = await resolveContractDecimals(_context);
  const scale = 10n ** BigInt(decimals);
  const isDecimalTokenAmount = input.includes(".");
  const isLikelyRawInteger = !isDecimalTokenAmount && input.replace(/^0+/, "").length > decimals;

  if (isLikelyRawInteger) {
    return BigInt(input).toString();
  }

  const match = input.match(/^(\d*)(?:\.(\d*))?$/);
  if (!match || (!match[1] && !match[2])) {
    throw new Error("SpCoin quantity must be a valid token amount.");
  }

  const wholePart = BigInt(match[1] || "0");
  const fractionalInput = match[2] || "";
  if (fractionalInput.length > decimals) {
    throw new Error(`SpCoin quantity cannot have more than ${decimals} decimal places.`);
  }
  const fractionalPart = BigInt(fractionalInput.padEnd(decimals, "0") || "0");
  return (wholePart * scale + fractionalPart).toString();
}

export async function splitRawQuantityParts(context, value) {
  const amount = await normalizeRawQuantityUnits(context, value);
  const raw = BigInt(amount);
  const decimals = await resolveContractDecimals(context);
  const scale = 10n ** BigInt(decimals);
  const wholePart = raw / scale;
  const fractionalPart = raw % scale;
  return {
    wholePart: wholePart.toString(),
    fractionalPart: fractionalPart === 0n ? "0" : fractionalPart.toString().padStart(decimals, "0"),
  };
}


