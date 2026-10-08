As of 7/2/26, this is hosted with firebase (at both slithertcs-b7d93.web.app and slithertcs.com).
The custom domain (slithertcs.com) is registered through namecheap.com.

The deploying process should look like:
git pull
firebase emulators:start --only hosting (to test locally)
firebase deploy --only hosting (to actually deploy, both websites should update fairly quickly)

Separately, there's a function as a proxy for MachineLearningForKids to avoid CORS errors.
If that is changed, you should also do:
firebase deploy --only functions
Or all together:
firebase deploy --only functions,hosting
