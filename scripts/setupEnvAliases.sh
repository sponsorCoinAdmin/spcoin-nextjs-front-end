clear
export ACTIVE_PROJECT_NAME=$(basename $PWD)
export ACTIVE_PROJECT_PATH=$PWD
export ACTIVE_ENV_DIR=/.e

# INITIALIZATION FUNCTION FOR BASHRC SETUP
insertOnce() { 
    if  grep -q "$1" "$2" ; then
        echo 'ERROR: LINE:"'$1'" EXISTS IN FILE:"'$2'"' ; 
    else
        echo 'INSERTING: LINE:"'$1'" IN FILE:"'$2'"' ; 
        echo $1 | tee -a $2
    fi
}

createNewEnvironmentFile() {
    export ACTIVE_PROJECT_PATH=$1
    export ACTIVE_PROJECT_NAME=$2
    export ACTIVE_ENV_DIR=$3
    export ACTIVE_ENV_PATH=$ACTIVE_PROJECT_PATH$ACTIVE_ENV_DIR
    echo "SET UP SPCOIN_ROOT_ENV_DIR CONFIGURATION FILE: $$ACTIVE_ENV_PATH/.e"
    echo "export ACTIVE_PROJECT_NAME=$ACTIVE_PROJECT_NAME"                               | tee    $ACTIVE_ENV_PATH/.e
    echo "export ACTIVE_PROJECT_PATH=$ACTIVE_PROJECT_PATH"                               | tee -a $ACTIVE_ENV_PATH/.e
    echo "export ACTIVE_ENV_PATH=$ACTIVE_ENV_PATH"                                       | tee -a $ACTIVE_ENV_PATH/.e
    echo "export ACTIVE_SCRIPTS_PATH=\$ACTIVE_PROJECT_PATH/scripts"                      | tee -a $ACTIVE_ENV_PATH/.e
    echo "export ACTIVE_LOGS_PATH=\$ACTIVE_PROJECT_PATH/logs"                            | tee -a $ACTIVE_ENV_PATH/.e

    echo "export SPCOIN_ROOT_NAME=\$ACTIVE_PROJECT_NAME"                                 | tee -a $ACTIVE_ENV_PATH/.e
    echo "export SPCOIN_ROOT_PATH=\$ACTIVE_PROJECT_PATH"                                 | tee -a $ACTIVE_ENV_PATH/.e

    echo "export SPCOIN_BE_PATH=\$SPCOIN_ROOT_PATH/spcoin-hardhat-contract-access-tests" | tee -a $ACTIVE_ENV_PATH/.e
    echo "export SPCOIN_FE_PATH=\$SPCOIN_ROOT_PATH/spcoin-nextjs-front-end"              | tee -a $ACTIVE_ENV_PATH/.e

    echo "export SPCOIN_BE_PATH=\$ACTIVE_PROJECT_PATH"                                   | tee -a $ACTIVE_ENV_PATH/.e
    echo ". \$ACTIVE_ENV_PATH/.a"                                                        | tee -a $ACTIVE_ENV_PATH/.e
}

#SET UP BASH ENVIRONMENT
createNewEnvironmentFile $ACTIVE_PROJECT_PATH $ACTIVE_PROJECT_NAME $ACTIVE_ENV_DIR
insertOnce "set -o vi" ~/.bashrc;
insertOnce ". $ACTIVE_ENV_PATH/." ~/.bashrc;

#RUN THE ENVIRONMENT SETUP
. $ACTIVE_ENV_PATH/.e