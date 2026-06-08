As of 6/8/26, this is hosted with firebase (at both slithertcs.web.app and slithertcs.com). The domain is registered through namecheap.com.

The deploying process should look like:
git pull
firebase emulators:start --only hosting (to test locally)
firebase deploy (to actually deploy, both websites should update fairly quickly)
