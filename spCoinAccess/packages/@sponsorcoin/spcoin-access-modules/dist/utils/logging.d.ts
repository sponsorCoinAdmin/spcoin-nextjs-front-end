export type LogModeKey = keyof typeof LOG_MODE;
export type LoggableValue = unknown;
export declare const LOG_MODE: {
    LOG: string;
    LOG_DETAIL: string;
    LOG_TEST_HEADER: string;
    LOG_FUNCTION_HEADER: string;
    LOG_SETUP: string;
    LOG_TREE: string;
};
export declare class SpCoinLogger {
    spCoinContractDeployed: any;
    setLogMode: (_log_mode: string, _state: boolean) => void;
    logSetup: (_text: string) => void;
    logTestHeader: (_testHeader: string) => void;
    logFunctionHeader: (_functionHeader: string) => void;
    logExitFunction: () => void;
    logDetail: (_details: string) => void;
    log: (_text: string) => void;
    logPrefix: (_prefix: string, _text: string) => void;
    setIndentPrefixLevel: (_indentPrefix: string, _level: number) => string;
    logJSONAccount: (accountKey: string, headerStr?: string, trailerStr?: string) => Promise<any>;
    logJSONTree: (_obj: LoggableValue, headerStr?: string, trailerStr?: string) => Promise<void>;
    logJSONStr: (str: string, _obj: LoggableValue, headerStr?: string, trailerStr?: string) => void;
    logJSON: (_obj: LoggableValue, headerStr?: string, trailerStr?: string) => void;
    getJSON: (_obj: LoggableValue) => string;
    constructor(_spCoinContractDeployed: any);
}
