#!/bin/sh

# working dir fix
scriptsFolder=$(cd $(dirname "$0"); pwd)
cd $scriptsFolder/..


echo "
Installing Node modules from 'package.json' if necessary...
"
yarn install

if [ ! -d dist ]
then
  echo "
Setting up 'build' folder for publishing to GitHub pages...
"
  git clone git@github.com:obpm-riva/app-web-iam.git dist && cd dist && git checkout gh-pages
fi

echo "
If no errors were listed above, the setup is complete.
See the README for more info on writing and publishing.
"
