#!/bin/bash
set -ex

yarn test:crossbrowser-e2e
cd ./test-output/cross-browser/reports

for dir in */
do
  # Strip out the middle randomly-generated substring in the test folder name.
  # E.g. "firefox_26a4a94d563255eb2fe00167b9a5e9b8_3" will be renamed to "firefox_3"
  newDir=$(echo $dir | perl -pe "s/(.*)_.*_(\d*).*/\1_\2/g")
  mv $dir $newDir
  allure generate --clean -c $newDir -o $newDir/allure
done
