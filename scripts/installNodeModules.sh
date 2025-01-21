repeat(){
    char=$1
    length=$2
    # echo length = $length
    str=""
    i=1
    while [ $i -le $2 ]
    do
        # echo $i: $1
        let "i++" 
        str="$str$1"
    done
    echo $str
}

doubleLine() { 
    $(repeat "=" $1) 
}
singleLine() {
    $(repeat "-" $1)
}
underLine() {
    $(repeat "_" $1)
}

doubleLine
echo PDW=$PWD
INSTALL_SCRIPT="/scripts/installNodeModules.sh"
echo
echo masterScript=$PWD/$INSTALL_SCRIPT
masterScript=/c/Users/Robin/spCoin/JUNK2/SPCOIN-PROJECT-MODULES/scripts/installNodeModules.sh
singleLine


installChildrenModules() {
    repeat "=" 80
    pwd
    indentSZ=$1
    indentChar="."
    indentSTR=$(repeat $indentChar $indentSZ)
    echo "Indent = <$indentSTR>"
    repeat "-" 80

    ExclusionList=(
    	"artifacts"
    	"node_modules"
    	"scripts"
    	"\.env"
    	"\.e"
    	"cache")
    ExclusionStr="${ExclusionList[@]}"
    
    # Print the Exclusion List String
    echo "The list of Exclusion Directories: ${ExclusionStr}"
    
    clearDir() {
        local dir=$1
        dir1=${dir%*/}                 # remove the trailing "/"
        echo $dir1 | sed "s|^\./||"    # remove the leading "./"
    }
    
    indentEcho() {
        echo $indentSTR$1
    }
    
    processDir() {
        local dir=$1
	    INSTALL_SCRIPT="/scripts/installNodeModules.sh"
        if [ -f  $dir/$INSTALL_SCRIPT ]; then
            indentEcho "Installing SCRIPT MODULE $dir$INSTALL_SCRIPT"
	    cd $dir
        let indentSZ=$indentSZ+2
	    . ./$INSTALL_SCRIPT $indentSZ
        let indentSZ=$indentSZ-2
	    cd ..
        else
            indentEcho "No Installation Script $dir$INSTALL_SCRIPT"
        fi
        #indentEcho "dir = ${dir}"  # print everything after the final "/"
    }
    
    for dir in ./*/          # list directory names
    do
        dir=$(clearDir $dir)
    
    foundDir=$(echo $ExclusionStr | grep $dir)
    
    if [ "$foundDir" != "" ]; then
        indentEcho "\*\*\*Excluding Directory: $dir"
    else
        #echo EXECUTING: processDir $dir
        processDir $dir
    fi
    done
}


installLocalNodeCode() {
    if [ -f "package.json" ]; then
    echo 
        indentEcho "Installing NPM Modules: $(pwd)"
    else
        indentEcho "Not an Node package directory"
    fi
}

doubleLine
installChildrenModules $1
singleLine
installLocalNodeCode
underLine