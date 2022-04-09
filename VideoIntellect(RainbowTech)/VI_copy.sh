#!/bin/bash
currdir=$(pwd)
if [ -d $currdir/node_modules ]
then 
echo "Dir node_modules found, copying"
else 
echo "Dir node_modules not found, exit"
exit
fi
if sudo cp -R $currdir/node_modules /opt/iss/securos/node.js
then
echo "Copying succesess"
else
echo "Copying error"
exit
fi
if sudo chmod -R 755 /opt/iss/securos/node.js/node_modules
then 
echo "Complete"
else
echo "Not enough privileges"
exit
fi
