import * as addMethods from "./methods";
export function bindAddMethods(context) {
    const boundMethods = context;
    const methodEntries = Object.entries(addMethods);
    for (const [name, method] of methodEntries) {
        boundMethods[name] = (...args) => method(context, ...args);
    }
}
