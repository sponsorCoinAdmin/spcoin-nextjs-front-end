import { createContext } from 'react';

const ExchangeContext = createContext(undefined);
const ExchangeProvider = ExchangeContext.Provider
const ExchangeConsumer = ExchangeContext.Consumer

export {ExchangeContext, ExchangeProvider, ExchangeConsumer}