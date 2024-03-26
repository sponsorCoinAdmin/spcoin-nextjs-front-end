import { Consumer, Provider, createContext } from 'react';
interface Context<T> {
    Provider: Provider<T>;
    Consumer: Consumer<T>;
    displayName?: string | undefined;
}

let InitialExchangeState;
let ExchangeProvider: Provider<any>;
let ExchangeConsumer: Consumer<any>;

const initializeContext = (value:any) => {
    InitialExchangeState = createContext(value);
    ExchangeProvider = InitialExchangeState.Provider
    ExchangeConsumer = InitialExchangeState.Consumer
    return InitialExchangeState
}

export { initializeContext, ExchangeProvider, ExchangeConsumer };

////////////////////////////////////////// REMOVE LATER ////////////////////

// import { useContext } from 'react';

// type HelloType = {
//     hello: string;
//   }

// let helloWorld= {hello : 'world'}
// const ExchangeContext = createContext<HelloType>(helloWorld);
// type Props = {
//     children: React.ReactNode,
//     value:any
// }

// export function ExchangeWrapper3({children} : Props) {
//     // let [state, setState] = useState(helloWorld);

//     return (
//         <ExchangeContext.Provider value = {helloWorld} >
//             {children}
//         </ExchangeContext.Provider>
//     )
// }

// export function useExchangeFunction() {
//     return useContext(ExchangeContext)
// }
