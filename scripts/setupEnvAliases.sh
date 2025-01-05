clear
echo ==== SETTING UP ENVIRONMENT VARIABLES ====
export ACTIVE_PROJECT_NAME=$(basename $PWD)
export ACTIVE_ROOT_DIR="$(dirname "$PWD")"
echo ROOT_DIR=$ROOT_DIR | tee ACTIVE_ROOT_DIR
. $ACTIVE_ROOT_DIR/.env/.e

export ACTIVE_PROJECT_PATH=$PWD

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
    export ACTIVE_ENV_PATH=$ACTIVE_PROJECT_PATH/.e
    mkdir $ACTIVE_ENV_PATH
    echo "ACTIVE_ROOT_DIR=$ACTIVE_ROOT_DIR"                                              | tee    $ACTIVE_ENV_PATH/.e
    echo ". $ACTIVE_ROOT_DIR/.env/.e"                                                    | tee    $ACTIVE_ENV_PATH/.e

    echo "SET UP SPCOIN_ROOT_ENV_DIR CONFIGURATION FILE: $ACTIVE_ENV_PATH/.e"
    echo "export ACTIVE_PROJECT_NAME=$ACTIVE_PROJECT_NAME"                               | tee    $ACTIVE_ENV_PATH/.e
    echo "export ACTIVE_PROJECT_PATH=$ACTIVE_PROJECT_PATH"                               | tee -a $ACTIVE_ENV_PATH/.e
    echo "export ACTIVE_ENV_PATH=$ACTIVE_ENV_PATH"                                       | tee -a $ACTIVE_ENV_PATH/.e
    echo "export ACTIVE_SCRIPTS_PATH=\$ACTIVE_PROJECT_PATH/scripts"                      | tee -a $ACTIVE_ENV_PATH/.e
    echo "export ACTIVE_LOGS_PATH=\$ACTIVE_PROJECT_PATH/logs"                            | tee -a $ACTIVE_ENV_PATH/.e

    echo "export SPCOIN_BE_PATH=\$SPCOIN_ROOT_PATH/spcoin-hardhat-contract-access-tests" | tee -a $ACTIVE_ENV_PATH/.e
    echo "export SPCOIN_FE_PATH=\$SPCOIN_ROOT_PATH/spcoin-nextjs-front-end"              | tee -a $ACTIVE_ENV_PATH/.e

    echo "export SPCOIN_BE_PATH=\$ACTIVE_PROJECT_PATH"                                   | tee -a $ACTIVE_ENV_PATH/.e
    echo ". \$ACTIVE_ENV_PATH/.a"                                                        | tee -a $ACTIVE_ENV_PATH/.e
    # echo "m"                                                                             | tee -a $ACTIVE_ENV_PATH/.e
}

#SET UP BASH ENVIRONMENT
createNewEnvironmentFile $ACTIVE_PROJECT_PATH $ACTIVE_PROJECT_NAME
echo "Adding sponsor coin startup configuration Files to bootstrap file ~/.bashrc"
insertOnce "set -o vi" ~/.bashrc;
sed -i '/ACTIVE_ENV_PATH/d' ~/.bashrc
sed -i '/ACTIVE_PROJECT_PATH/d' ~/.bashrc
echo "export ACTIVE_ENV_PATH=$ACTIVE_ENV_PATH/.e" | tee -a ~/.bashrc
echo ". \$ACTIVE_ENV_PATH"                        | tee -a ~/.bashrc
echo "cd \$ACTIVE_PROJECT_PATH"                   | tee -a ~/.bashrc


#RUN THE ENVIRONMENT SETUP
# . $ACTIVE_ENV_PATH/.e