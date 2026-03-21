"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpCoinLogger = exports.LOG_MODE = void 0;
// @ts-nocheck
// File: /@sponsorcoin/spcoin-access-modules/utils/logging.js
// ************************* LOG SECTION ******************************/
const utils_1 = require("@sponsorcoin/spcoin-lib/utils");
let LOG = true;
let LOG_DETAIL = false;
let LOG_TEST_HEADER = false;
let LOG_FUNCTION_HEADER = false;
let LOG_SETUP = false;
let LOG_TREE = false;
let prefix = "";
let indent = "  ";
exports.LOG_MODE = {
    LOG: "LOG",
    LOG_DETAIL: "LOG_DETAIL",
    LOG_TEST_HEADER: "LOG_TEST_HEADER",
    LOG_FUNCTION_HEADER: "LOG_FUNCTION_HEADER",
    LOG_SETUP: "LOG_SETUP",
    LOG_TREE: "LOG_TREE"
};
const setLogDefaults = (_log_mode, _state) => {
    LOG = true;
    LOG_DETAIL = false;
    LOG_TEST_HEADER = false;
    LOG_FUNCTION_HEADER = false;
    LOG_SETUP = false;
    LOG_TREE = false;
};
// let spCoinReadMethods;
class SpCoinLogger {
    constructor(_spCoinContractDeployed) {
        this.setLogMode = (_log_mode, _state) => {
            console.log("EXECUTING setLogMode = (" + _log_mode + ", " + _state + ")");
            switch (_log_mode) {
                case exports.LOG_MODE.LOG:
                    console.log("Setting _log_mode LOG: " + _state);
                    LOG = _state;
                    break;
                case exports.LOG_MODE.LOG_DETAIL:
                    console.log("Setting _log_mode LOG_DETAIL: " + _state);
                    LOG_DETAIL = _state;
                    break;
                case exports.LOG_MODE.LOG_TEST_HEADER:
                    console.log("Setting _log_mode LOG_TEST_HEADER: " + _state);
                    LOG_TEST_HEADER = _state;
                    break;
                case exports.LOG_MODE.LOG_FUNCTION_HEADER:
                    console.log("Setting _log_mode LOG_FUNCTION_HEADER: " + _state);
                    LOG_FUNCTION_HEADER = _state;
                    break;
                case exports.LOG_MODE.LOG_SETUP:
                    console.log("Setting _log_mode LOG_SETUP: " + _state);
                    LOG_SETUP = _state;
                case exports.LOG_MODE.LOG_TREE:
                    console.log("Setting _log_mode LOG_SETUP: " + _state);
                    LOG_TREE = _state;
                    break;
                default:
                    _text = "Unknown _log_mode " + _log_mode;
            }
        };
        this.logSetup = (_text) => {
            if (LOG_SETUP) {
                log(_text);
            }
        };
        this.logTestHeader = (_testHeader) => {
            if (LOG_TEST_HEADER) {
                log(prefix + _testHeader);
            }
        };
        this.logFunctionHeader = (_functionHeader) => {
            if (LOG_FUNCTION_HEADER) {
                log(prefix + _functionHeader);
            }
            prefix += indent;
        };
        this.logExitFunction = () => {
            if (LOG_FUNCTION_HEADER) {
                prefix = prefix.slice(0, -indent);
                console.log("EXITING");
            }
        };
        this.logDetail = (_details) => {
            if (LOG_DETAIL) {
                log(_details);
            }
        };
        this.log = (_text) => {
            if (LOG) {
                console.log(_text);
            }
        };
        this.logPrefix = (_prefix, _text) => {
            log(_prefix + _text);
        };
        this.setIndentPrefixLevel = (_indentPrefix, _level) => {
            let indent = "";
            for (let i = 0; i < _level; i++)
                indent += _indentPrefix;
            return indent;
        };
        ////////////////////// STRUCTURE PRINT FUNCTIONS //////////////////////
        this.logJSONAccount = async (accountKey, headerStr, trailerStr) => {
            console.log("ACCOUNT RECORD DUMP");
            accountRec = await getAccountRecord(accountKey);
            this.logJSON(accountRec, headerStr, trailerStr);
            return accountRec;
        };
        this.logJSONTree = async (_obj, headerStr, trailerStr) => {
            console.log("START LOG JSON TREE");
            this.logJSON(_obj, headerStr, trailerStr);
            console.log("FINISH LOG JSON TREE");
        };
        this.logJSONStr = (str, _obj, headerStr, trailerStr) => {
            console.log(str, this.getJSON(_obj, headerStr, trailerStr));
        };
        this.logJSON = (_obj, headerStr, trailerStr) => {
            if (headerStr)
                console.log("\nheaderStr");
            console.log((0, utils_1.stringifyBigInt)(_obj, headerStr, trailerStr));
            if (trailerStr)
                console.log("\trailerStr");
        };
        this.getJSON = (_obj) => {
            return (0, utils_1.stringifyBigInt)(_obj);
        };
        // if (_spCoinContractDeployed !== undefined) {
        this.spCoinContractDeployed = _spCoinContractDeployed;
        // spCoinReadMethods = new SpCoinReadModule(_spCoinContractDeployed);
        // }
    }
}
exports.SpCoinLogger = SpCoinLogger;
