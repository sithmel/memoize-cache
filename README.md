memoize-cache
=============
[![Build Status](https://travis-ci.org/sithmel/memoize-cache.svg?branch=master)](https://travis-ci.org/sithmel/memoize-cache)

A configurable cache support for functions (https://www.npmjs.com/package/async-deco). It contains:

* base-cache: a prototype implementing all the logic common between different implementations
* cache-ram: is a lightweight yet complete implementation of an in-ram cache. Suitable for using it in the browser
* no-cache: a mock object useful for testing caching errors.

Other implementations
=====================
* [memoize-cache-manager](https://github.com/sithmel/memoize-cache-manager) a [cache-manager](https://github.com/BryanDonovan/node-cache-manager) adapter
* [memoize-cache-redis](https://github.com/sithmel/memoize-cache-manager) using redis as backend

base-cache
==========
Extend this object to implement the cache with different storage/databases. The extension should include at least "_set" and "_get" Use cache-ram source as reference implementation.

cache-ram
=========
The constructor takes an option object with 3 optional attributes:
* getKey: a function used to extract the cache key (used in the push and query method for storing, retrieving the cached value). The key returned can be any value (when using cache-ram and ES2015 maps and sets are supported). Default: a function returning a fixed key. The value won't be cached if the function returns null.
* getTags: a function that returns an array of tags (strings). You can use that for purging a set of items from the cache.
* maxLen: the maximum number of items stored in the cache. Default: Infinity. Cache items will be purged using an LRU algorithm
* maxAge: the maximum age of the item stored in the cache (in seconds). Default: Infinity. You can also pass a function that will calculate the ttl of a specific item (0 will mean no cache). The function will take the same arguments as the "push" method (an array of inputs and the output).
* maxValidity: the maximum age of the item stored in the cache (in seconds) to be considered "not stale". Default: Infinity. You can also pass a function that will calculate the validity of a specific item. The function will take the same arguments as the "push" method (an array of inputs and the output).
* serialize: it is an optional function that serialize the value stored (takes a value, returns a value). It can be used for pruning part of the object we don't want to save or even using a compression algorithm
* deserialize: it is an optional function that deserialize the value stored (takes a value, returns a value).

Example:
```js
var Cache = require('memoize-cache/cache-ram'); // or require('memoize-cache').CacheRAM;

// no values, uses always the same key for store any value
var cache = new Cache();

// using the id property of the first argument
// this cache will store maximum 100 items
// every item will be considered stale and purged after 20 seconds.
var cache = new Cache({ getKey: function (config){
  return config.id;
} }, maxLen: 100, maxAge: 20000);
```

Methods
=======

Pushing a new cached value
--------------------------
```js
cache.push(args, output);
```
This function signature is designed to simplify caching of a function call. So it takes the arguments used for the call and the output.
"args" is an array containing the arguments passed to the function that generated the output.
This function is a "fire and forget" caching request. So there is no need of waiting for an answer, but if you want you can use a callback as third argument.
It returns an object or undefined if the value won't be cached (because the TTL is 0 for example, or the resulting cachekey is null).
This object contains:
* key: the "cache key" if the value is scheduled to be cached
* tags: an array with tags. They can be used to track and delete other keys

Pushing a new cached value (2)
------------------------------
This function caches a value. It is as back door to push data in the cache.
```js
cache.set(keys, maxValidity, maxAge, data, next);
```

* keys is an object: { key: 'thisisthekey', tags: ['tag1', 'tag2'] }
* maxValidity is a timestamp for considering the data stale. For example: 10000 + Date.now(). Ten second from now.
* maxAge: after this number of milliseconds the data will be removed from the cache
* data: the data to cache. Not serialised
* next: optional callback

Querying for cache hit
----------------------
```js
cache.query(args, function (err, result){
  // result.cached is true when you find a cached value
  // result.hit is the value cached
  // result.timing is the time spent in ms to retrieve the value (also used for cache miss)
  // cached.key is the key used to store the value (might be useful for debugging)
  // cache.stale (true/false) depending on the maxValidity function (if defined)
});
```
"args" is an array containing the arguments passed to the function that generated the output.

Getting the cache key
---------------------
```js
var key = cache.getCacheKey(...);
```
It takes as arguments the same arguments of the function. It returns the cache key.
It uses the function passed in the factory function.

The cache object
----------------
The cache object is in the "cache" property and it support the API specified here: https://github.com/sithmel/little-ds-toolkit#lru-cache

Purging cache items
-------------------
There are 3 methods available:
```js
cache.purgeAll(); // it removes the whole cache (you can pass an optional callback)
```
```js
cache.purgeByKeys(keys);
// it removes the cache item with a specific key (string) or keys (array of strings).
// You can pass an optional callback.
```
```js
cache.purgeByTags(tags);
// it removes the cache item marked with a tag (string) or tags (array of strings).
// You can pass an optional callback.
```
