SaltedGPGPub
============

A simple CloudFlare Worker site for easy publishing of GPG/OpenPGP public keys.

Deployment
----------

Create a GitHub Gist with your GPG/OpenPGP public keys. In that gist, each public key must be in separate files and the name should follow the format of "<full fingerpring>\[.pub/gpg/asc\]".

Edit [`index.js`](index.js) and update the gist ID in `GIST_URL`, publish it to CloudFlare Workers.

The key will be accessible from "http[s]://your.site/<long-id/short-id/full-fingerprint>".

Demo
----

Gist: [https://gist.github.com/RedL0tus/3ae55eb09f311c346b1540db94344c17](https://gist.github.com/RedL0tus/3ae55eb09f311c346b1540db94344c17)

Site: [https://gpg.salted.fish](https://gpg.salted.fish)

My main key (792E 2F22 4CAD AB1B) will be accessible from [https://gpg.salted.fish/4CADAB1B](https://gpg.salted.fish/4CADAB1B) or [https://gpg.salted.fish/792E2F224CADAB1B](https://gpg.salted.fish/792E2F224CADAB1B) or [https://gpg.salted.fish/2E1CC9FA346DEA09A6EB0B73792E2F224CADAB1B](https://gpg.salted.fish/2E1CC9FA346DEA09A6EB0B73792E2F224CADAB1B).
