// @ts-nocheck
declare const stringifyBigInt: any;
declare let LOG: boolean;
declare let LOG_DETAIL: boolean;
declare let LOG_TEST_HEADER: boolean;
declare let LOG_FUNCTION_HEADER: boolean;
declare let LOG_SETUP: boolean;
declare let LOG_TREE: boolean;
declare let prefix: string;
declare let indent: string;
declare const LOG_MODE: {
    LOG: string;
    LOG_DETAIL: string;
    LOG_TEST_HEADER: string;
    LOG_FUNCTION_HEADER: string;
    LOG_SETUP: string;
    LOG_TREE: string;
};
declare const setLogDefaults: (_log_mode: any, _state: any) => void;
declare class SpCoinLogger {
    constructor(_spCoinContractDeployed: any);
    setLogMode: (_log_mode: any, _state: any) => void;
    logSetup: (_text: any) => void;
    logTestHeader: (_testHeader: any) => void;
    logFunctionHeader: (_functionHeader: any) => void;
    logExitFunction: () => void;
    logDetail: (_details: any) => void;
    log: (_text: any) => void;
    logPrefix: (_prefix: any, _text: any) => void;
    setIndentPrefixLevel: (_indentPrefix: any, _level: any) => string;
    logJSONAccount: (accountKey: any, headerStr: any, trailerStr: any) => Promise<any>;
    logJSONTree: (_obj: any, headerStr: any, trailerStr: any) => Promise<void>;
    logJSONStr: (str: any, _obj: any, headerStr: any, trailerStr: any) => void;
    logJSON: (_obj: any, headerStr: any, trailerStr: any) => void;
    getJSON: (_obj: any) => any;
}

