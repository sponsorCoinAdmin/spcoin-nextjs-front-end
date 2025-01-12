CURR_DIR=$(PWD)
echo START INSTALLING NPM Modules in $CURR_DIR/node_modules-dev/spcoin-back-end/spcoin-common/spcoin-lib
cd $CURR_DIR/node_modules-dev/spcoin-back-end/spcoin-common/spcoin-lib
npm i
echo START INSTALLING NPM Modules in $CURR_DIR/node_modules-dev/spcoin-back-end/spcoin-access-modules
cd $CURR_DIR/node_modules-dev/spcoin-back-end/spcoin-access-modules
npm i
echo START INSTALLING NPM Modules in $CURR_DIR/node_modules-dev/spcoin-back-end/spcoin-with-modules
cd $CURR_DIR/node_modules-dev/spcoin-back-end/spcoin-with-modules-cjs
npm i
cd $CURR_DIR