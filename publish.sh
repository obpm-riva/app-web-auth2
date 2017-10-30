#!/bin/sh

# (1) prompt user, and read command line argument
read -p "publish on production or staging ? " answer

# (2) handle the command line argument we were given

BRANCH="";
DOMAIN=""
case $answer in
 production )
         DOMAIN="sw.pryv.me";
         BRANCH="production";
         break;;

 staging )
         DOMAIN="sw.pryv.li";
         BRANCH="staging";
         break;;

 * )     echo "Enter 'production' or 'staging', please."; exit;
esac




TEMPDIR="/tmp/access-tmp"
CURRENTVERSION="v1"
#FULLPATH="https://"$DOMAIN"/access/"$CURRENTVERSION
FULLPATH="/access/"$CURRENTVERSION


rm -rf $TEMPDIR
mkdir $TEMPDIR
cp -rv SDK-VERSION-NUM $TEMPDIR/$CURRENTVERSION
cp bypassAuth.js referer.html register.html demo.html test.html signinhub.html reset-password.html $TEMPDIR/
pushd $TEMPDIR


#### merge everything into pryv-sdk.js
cd $CURRENTVERSION
cat pryv-util.js pryv-access.js > pryv-sdk.js
cat pryv-util.js > pryv-access.js
cd ..

sed -i '' -e 's|/access/SDK-VERSION-NUM|'$FULLPATH'|g' $CURRENTVERSION/*.*
sed -i '' -e "s/SDK-VERSION-NUM/$CURRENTVERSION/g" *.*
popd
git checkout $BRANCH
rsync -r $TEMPDIR/ .
git status
