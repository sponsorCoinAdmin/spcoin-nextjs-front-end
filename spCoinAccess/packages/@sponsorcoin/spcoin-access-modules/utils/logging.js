// ************************* LOG SECTION ******************************/
const { stringifyBigInt } = require("../../../spcoin-common/spcoin-lib");
let LOG = true;
let LOG_DETAIL = false;
let LOG_TEST_HEADER = false;
let LOG_FUNCTION_HEADER = false;
let LOG_SETUP = false;
let LOG_TREE = false;
let prefix = "";
let indent = "  ";

const LOG_MODE = {
    LOG : "LOG",
    LOG_DETAIL : "LOG_DETAIL",
    LOG_TEST_HEADER : "LOG_TEST_HEADER",
    LOG_FUNCTION_HEADER : "LOG_FUNCTION_HEADER",
    LOG_SETUP : "LOG_SETUP",
    LOG_TREE : "LOG_TREE"
  }

const setLogDefaults = (_log_mode, _state) => {
    LOG = true;
    LOG_DETAIL = false;
    LOG_TEST_HEADER = false;
    LOG_FUNCTION_HEADER = false;
    LOG_SETUP = false;
    LOG_TREE = false;
  }

// let spCoinReadMethods;

class SpCoinLogger {
     constructor(_spCoinContractDeployed) {
        // if (_spCoinContractDeployed !== undefined) {
            this.spCoinContractDeployed = _spCoinContractDeployed;
            // spCoinReadMethods = new SpCoinReadModule(_spCoinContractDeployed);
        // }
      }
      
    setLogMode = (_log_mode, _state) => {
        console.log("EXECUTING setLogMode = (" + _log_mode + ", " + _state + ")");

        switch(_log_mode) {
            case LOG_MODE.LOG:
                console.log("Setting _log_mode LOG: " + _state)
                LOG = _state;
            break;
            case LOG_MODE.LOG_DETAIL:
                console.log("Setting _log_mode LOG_DETAIL: " + _state)
                LOG_DETAIL = _state;
            break;
            case LOG_MODE.LOG_TEST_HEADER:
                console.log("Setting _log_mode LOG_TEST_HEADER: " + _state)
                LOG_TEST_HEADER = _state;
            break;
            case LOG_MODE.LOG_FUNCTION_HEADER:
                console.log("Setting _log_mode LOG_FUNCTION_HEADER: " + _state)
                LOG_FUNCTION_HEADER = _state;
            break;
            case LOG_MODE.LOG_SETUP:
                console.log("Setting _log_mode LOG_SETUP: " + _state)
                LOG_SETUP = _state;
            case LOG_MODE.LOG_TREE:
                console.log("Setting _log_mode LOG_SETUP: " + _state)
                LOG_TREE = _state;
                break;
            default:
            _text = "Unknown _log_mode " + _log_mode;
        }
    }

    logSetup = (_text) => {
        if (LOG_SETUP) {
           log(_text);
        }
    }

    logTestHeader = (_testHeader) => {
        if (LOG_TEST_HEADER) {
           log(prefix + _testHeader);
        }
    }

    logFunctionHeader = (_functionHeader) => {
        if (LOG_FUNCTION_HEADER) {
           log(prefix + _functionHeader);
        }
        prefix += indent;
    }

    logExitFunction = () => {
        if (LOG_FUNCTION_HEADER) {
            prefix = prefix.slice(0, -indent)
            console.log("EXITING");
        }
    }

    logDetail = (_details) => {
        if (LOG_DETAIL) {
           log(_details);
        }
    }

    log = (_text) => {
        if (LOG) {
            console.log(_text);
        }
    }

    logPrefix = (_prefix, _text) => {
       log(_prefix + _text);
    }

    setIndentPrefixLevel = (_indentPrefix, _level) => {
        let indent = "";
        for (let i = 0; i < _level; i++)
            indent += _indentPrefix;
        return indent;
    }

    ////////////////////// STRUCTURE PRINT FUNCTIONS //////////////////////

    logJSONAccount = async(accountKey, headerStr, trailerStr) => {
        console.log("ACCOUNT RECORD DUMP");
        accountRec = await getAccountRecord(accountKey);
        this.logJSON(accountRec, headerStr, trailerStr);
        return accountRec;
    }

    logJSONTree = async(_obj, headerStr, trailerStr) => {
        console.log("START LOG JSON TREE");
        this.logJSON(_obj, headerStr, trailerStr);
        console.log("FINISH LOG JSON TREE");
    }

    logJSONStr = (str, _obj, headerStr, trailerStr) => {
        console.log(str, this.getJSON(_obj, headerStr, trailerStr));
    }

    logJSON = (_obj, headerStr, trailerStr) => {
        if(headerStr) console.log("\nheaderStr");
        console.log(stringifyBigInt(_obj, headerStr, trailerStr));
        if(trailerStr) console.log("\trailerStr");
    }
    
    getJSON = (_obj) => {
        return stringifyBigInt(_obj);
    }
}

module.exports = {
    SpCoinLogger,
    LOG_MODE
}
