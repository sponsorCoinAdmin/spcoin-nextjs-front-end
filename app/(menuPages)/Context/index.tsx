'use client'
import { createContext, useState, useContext } from 'react';
const AppContext = createContext({
        Hello: 'world'
    });

export function AppWrapper({children} : {children: React.ReactNode}) {
    let [state, setState] = useState('Hello')

    return (
        // <AppContext.Provider value={state}>
            {children}
        // </AppContext.Provider>
    )
}

export function useAppContext() {
    return useContext(AppContext);
}