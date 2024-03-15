import { Consumer, Provider, createContext } from 'react';
interface Context<T> {
    Provider: Provider<T>;
    Consumer: Consumer<T>;
    displayName?: string | undefined;
}

let ExchangeContext;
let ExchangeProvider: Provider<any>;
let ExchangeConsumer: Consumer<any>;

const initialContext = (value:any) => {
    ExchangeContext = createContext(value);
    ExchangeProvider = ExchangeContext.Provider
    ExchangeConsumer = ExchangeContext.Consumer
    return ExchangeContext
}

export { initialContext, ExchangeProvider, ExchangeConsumer };