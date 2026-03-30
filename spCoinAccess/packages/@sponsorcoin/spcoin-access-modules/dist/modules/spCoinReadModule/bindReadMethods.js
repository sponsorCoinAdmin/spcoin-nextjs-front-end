import * as readMethods from "./methods";
export function bindReadMethods(context) {
    const boundMethods = context;
    const methodEntries = Object.entries(readMethods);
    for (const [name, method] of methodEntries) {
        boundMethods[name] = (...args) => method(context, ...args);
    }
}
