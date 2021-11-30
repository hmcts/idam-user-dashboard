#!/bin/bash
supportedBrowsers=`sed '/\/\//d' ./supportedBrowsers.js | sed '/\/\//d' | sed "s/[\'\:\{ ]//g"`
browsersArray=(${supportedBrowsers//$'\n'/ })

outputDirectory="${E2E_CROSSBROWSER_OUTPUT_DIR:-functional-output/crossbrowser/reports}"

echo
echo "*****************************************"
echo "* The following browsers will be tested *"
echo "*****************************************"
echo  "$supportedBrowsers"
echo "****************************************"
echo
echo

for i in "${browsersArray[@]}"
do
    echo "*** Testing $i ***"

    FOLDERNAME="$i-$(date +%s)"

    mkdir ../../../../output/$FOLDERNAME

    SAUCELABS_BROWSER=$i TUNNEL_IDENTIFIER=reformtunnel npm run test-crossbrowser-e2e

    for f in ../../../../output/*.*; do
        echo $f
        mv $f ../../../../output/$FOLDERNAME
    done
done
