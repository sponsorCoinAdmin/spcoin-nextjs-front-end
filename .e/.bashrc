set -o vi
. ~/.a
m
cdcurr
if [ "$PS1" ]; then
   eval $("ssh-agent")
#   ssh-add /c/Users/robin/.ssh/gitHub.pvt
   ssh-add /c/Users/robin/.ssh/sponsorCoin.pvt
fi
