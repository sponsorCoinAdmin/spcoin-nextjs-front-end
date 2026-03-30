import * as readMethods from "./methods";
export function bindReadMethods(context) {
    const methodEntries = Object.entries(readMethods);
    for (const [name, method] of methodEntries) {
        context[name] = ((...args) => method(context, ...args));
    }
}
