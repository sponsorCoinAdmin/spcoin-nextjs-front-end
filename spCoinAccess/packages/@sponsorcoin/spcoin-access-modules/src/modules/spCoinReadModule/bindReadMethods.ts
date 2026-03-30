import * as readMethods from "./methods";
import type {
  SpCoinReadBoundMethod,
  SpCoinReadMethod,
  SpCoinReadModuleContext,
} from "./types";

export function bindReadMethods(context: SpCoinReadModuleContext): void {
  const methodEntries = Object.entries(readMethods) as Array<[string, SpCoinReadMethod]>;

  for (const [name, method] of methodEntries) {
    context[name] = ((...args: unknown[]) => method(context, ...args)) as SpCoinReadBoundMethod;
  }
}

