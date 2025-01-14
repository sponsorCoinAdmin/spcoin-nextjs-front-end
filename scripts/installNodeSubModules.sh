exeIfDirExists() {
    local CURR_DIR=$PWD
    DIRECTORY=$1
    COMMAND=$2
    echo "FROM ROOT DIR        : $PWD"
    if [ -d "$DIRECTORY" ]; then
        echo "INSTALLING MODULES IN: $DIRECTORY"
        echo "EXECUTING            : $COMMAND"
        #  $COMMAND
    else 
        echo "***ERROR: DIRECTORY $DIRECTORY not found"
        echo "***ERROR: COMMAND $COMMAND NOT EXECUTED" 
    fi
    cd $CURR_DIR
}

clear
echo "=======================spcoin-nextjs-front-end========================================="
echo START INSTALLING NPM Modules in $PWD/node_modules-dev/spcoin-back-end
exeIfDirExists ./node_modules-dev ". ./scripts/installNodeSubModules.sh"
cd ..





# echo START INSTALLING NPM Modules in $CURR_DIR/node_modules-dev/spcoin-back-end/spcoin-common/spcoin-lib
# cd $CURR_DIR/node_modules-dev/spcoin-back-end/spcoin-common/spcoin-lib
# npm i
# cd ..
# echo START INSTALLING NPM Modules in $CURR_DIR/node_modules-dev/spcoin-back-end/spcoin-access-modules
# cd $CURR_DIR/node_modules-dev/spcoin-back-end/spcoin-access-modules
# npm i
# cd ..
# echo START INSTALLING NPM Modules in $CURR_DIR/node_modules-dev/spcoin-back-end/spcoin-with-modules
# cd $CURR_DIR/node_modules-dev/spcoin-back-end/spcoin-with-modules-cjs
# npm i
# cd ..
