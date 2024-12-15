# unit_JS_MODULES

### To Run this test copy the file index.js.ON_HOLD to index.js in the same directory.
    If you have the alias setup you car run the test from the package root level by typing, "hhtest",
    which will run the test and put the output in directory {./rootHome}/test.out/hhtest.out.
    If you do not have the alias's menu installed, run the command "npx hardhat test". 

### To develop for package management be sure the two lines in the index.js ar as follows.
    Note: the "Node Deployed" version is commented out and the "Development" version is not.
        const { SpCoinAccessModules } = require("../../spcoin-access-modules/index"); 
        // const { SpCoinAccessModules } = require("@sponsorcoin/spcoin-access-modules/index"); 

### When development is complete, you can publish the package to the Node repository as follows:
    1. Change directory to git sub-module spcoin-access-modules.
    2. Update the "version": "X.X.X" in the package.json since the package cannot overwrite a previously published version.
    3. Push your changes to "GITHUB".
    4. Run the command "npm publish" providing you have authorization to publish to node as "@sponsorcoin".
    5. Change directory up on level, "cd ..", to main git package "spcoin-hardhat-contract-access-tests"
    6. Finally, add, commit and push your main package changes to "GITHUB".

### Running the hardhat Node deployed tests
    1. Install the the recently deployed js modules into your hardhat project with the command 
       "npm install @sponsorcoin/spcoin-access-modules"
    2. Change the directory to run the Node deployed version instead of the development version as follows:
        Note: the "Development" version is commented out and the "Node Deployed" version is not.
            // const { SpCoinAccessModules } = require("../../spcoin-access-modules/index"); 
            const { SpCoinAccessModules } = require("@sponsorcoin/spcoin-access-modules/index"); 
    3.  If you have the alias setup you can run the test from the package root level by typing, "hhtest",
        which will run the test and put the output in directory {./rootHome}/test.out/hhtest.out.
        If you do not have the alias's menu installed, run the command "npx hardhat test". 
        