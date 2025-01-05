clear
echo ==== SETTING UP ENVIRONMENT VARIABLES ====
export ACTIVE_PROJECT_NAME=$(basename $PWD)
export ACTIVE_ROOT_DIR="$(dirname "$PWD")"
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
    export ACTIVE_ENV_FILE_PATH=$ACTIVE_ENV_PATH/.e
    echo "#SPCOIN PROJECT CONFIGURATION FILE: $ACTIVE_PROJECT_NAME"                      | tee    $ACTIVE_ENV_FILE_PATH
    echo "#SPCOIN ENVIRONMENT CONFIGURATION SETUP SCRIPT: $ACTIVE_ENV_FILE_PATH"         | tee -a $ACTIVE_ENV_FILE_PATH
    echo "export ACTIVE_PROJECT_NAME=$ACTIVE_PROJECT_NAME"                               | tee -a $ACTIVE_ENV_FILE_PATH
    echo "export ACTIVE_PROJECT_PATH=$ACTIVE_PROJECT_PATH"                               | tee -a $ACTIVE_ENV_FILE_PATH
    echo "export ACTIVE_ENV_PATH=$ACTIVE_ENV_PATH"                                       | tee -a $ACTIVE_ENV_FILE_PATH
    echo "export ACTIVE_SCRIPTS_PATH=\$ACTIVE_PROJECT_PATH/scripts"                      | tee -a $ACTIVE_ENV_FILE_PATH
    echo "export ACTIVE_LOGS_PATH=\$ACTIVE_PROJECT_PATH/logs"                            | tee -a $ACTIVE_ENV_FILE_PATH






    echo ". \$ACTIVE_ENV_PATH/.a"                                                        | tee -a $ACTIVE_ENV_FILE_PATH
}

#SET UP BASH ENVIRONMENT
createNewEnvironmentFile $ACTIVE_PROJECT_PATH $ACTIVE_PROJECT_NAME $ACTIVE_ENV_DIR
insertOnce "set -o vi" ~/.bashrc;

echo "Adding sponsor coin startup configuration Files to bootstrap file ~/.bashrc"
sed -i '/ACTIVE_ENV_FILE_PATH/d' ~/.bashrc
sed -i '/ACTIVE_PROJECT_PATH/d' ~/.bashrc
echo "export ACTIVE_ENV_FILE_PATH=$ACTIVE_ENV_FILE_PATH" | tee -a ~/.bashrc;
echo ". \$ACTIVE_ENV_FILE_PATH"                          | tee -a ~/.bashrc;
echo "cd \$ACTIVE_PROJECT_PATH"                          | tee -a ~/.bashrc;

#RUN THE ENVIRONMENT SETUP
# . $ACTIVE_ENV_FILE_PATH