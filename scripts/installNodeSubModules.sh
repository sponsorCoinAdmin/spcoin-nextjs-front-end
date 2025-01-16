exeIfDirExists() {
    DIRECTORY=$1
    COMMAND=$2
    local CURR_DIR=$PWD
    echo "CURRENT DIRECTORY : $PWD"
    if [ -d "$DIRECTORY" ]; then
        echo INSTALLING in: SUB-DIRECTORY $DIRECTORY =====
        cd $DIRECTORY
        echo "EXECUTING: $COMMAND"
        eval $COMMAND
    else 
        echo "***ERROR: SUB-DIRECTORY $DIRECTORY NOT FOUND"
        echo "***ERROR: COMMAND $COMMAND NOT EXECUTED" 
    fi
    cd $CURR_DIR
}

clear
echo "======================= spcoin-nextjs-front-end ========================================="
echo START INSTALLING NPM Modules in $PWD/node_modules-dev/spcoin-back-end
exeIfDirExists ./node_modules-dev ". ./scripts/installNodeSubModules.sh"
