As of 7/2/26, this is hosted with firebase (at both slithertcs-b7d93.web.app and slithertcs.com).
The custom domain (slithertcs.com) is registered through namecheap.com.

The deploying process should look like:
git pull
firebase emulators:start --only hosting (to test locally)
firebase deploy (to actually deploy, both websites should update fairly quickly)
