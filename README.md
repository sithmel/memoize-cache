memoize-cache
=============
[![Build Status](https://travis-ci.org/sithmel/memoize-cache.svg?branch=master)](https://travis-ci.org/sithmel/memoize-cache)

A configurable cache support for functions (https://www.npmjs.com/package/async-deco). It contains 2 different implementations.

* ram-cache: is a lightweight yet complete implementation of an in-ram cache. Suitable for using it in the browser
* cache: it uses a cache manager object to store data in memory/redis/mongodb/file system (https://www.npmjs.com/package/cache-manager)


ram-cache
=========
The constructor takes an option object with 3 optional attributes:
* key: a function used to extract the cache key (used in the push and query method for storing, retrieving the cached value). The key returned should be a string or it will be converted to JSON and then md5. Default: a function returning a fixed key.
* maxLen: the maximum number of items stored in the cache. Default: Infinity. Cache items will be purged using an LRU algorithm
* maxAge: the maximum age of the item stored in the cache (in ms). Default: Infinity. You can also pass a function that will calculate the ttl of a specific item (0 will mean no cache).

Example:
```js
var Cache = require('memoize-cache/ram-cache'); // or require('memoize-cache').ramCache;

// no values, uses always the same key for store any value
var cache = new Cache();

// using the id property of the first argument
// this cache will store maximum 100 items
// every item will be considered stale and purged after 20 seconds.
var cache = new Cache({key: function (config){
  return config.id;
}}, maxLen: 100, maxAge: 20000);
```

cache
=====
The constructor takes an cache-manager object and an optional "key" function. The function will be used to extract the cache key (used in the push and query method for storing, retrieving the cached value). The key returned should be a string or it will be converted to JSON and then md5. Default: a function returning a fixed key.

Example:
```js
var Cache = require('memoize-cache/cache'); // or require('memoize-cache').cache;
var cacheManager = require('cache-manager'); // npm install cache-manager

// using the id property of the first argument
// this cache will store maximum 100 items
// every item will be considered stale and purged after 20 seconds.
var memoryCache = cacheManager.caching({store: 'memory', max: 100, ttl: 20});

var cache = new Cache(memoryCache, function (config){
  return config.id;
});
```
The "Cache" constructor takes optionally a second argument "getMaxAge". It allows to use a different TTL for a specific item. It can be a function taking the same arguments of the "getKey" and returning the TTL in seconds (YES, THESE ARE SECONDS INSTEAD OF MILLISECONDS!!!). Infinity means: forever, 0 means: don't cache.


Methods
=======

Pushing a new cached value
--------------------------
```js
cache.push(args, output);
```
"args" is an array containing the arguments passed to the function that generated the output.

Querying for cache hit
----------------------
```js
cache.query(args, function (err, result){
  // result.cached is true when you find a cached value
  // result.hit is the value cached
  // cached.key is the key used to store the value (might be useful for debugging)
});
```
"args" is an array containing the arguments passed to the function that generated the output.

Getting the cache key
---------------------
```js
var key = cache.getCacheKey(...);
```
It takes as arguments the same arguments of the function. It returns the cache key.
It uses the function passed in the factory function. If it returns a string it uses it as key. In case it is not a string it tries to serialize it to JSON and then to an hash (using md5).

resetting the cache
-------------------
This is implemented only on ram-cache.
```js
cache.reset();
```

getting the number of item cached
---------------------------------
This is implemented only on ram-cache.
```js
cache.len();
```

getting the size of the cache
-----------------------------
This is implemented only on ram-cache.
```js
cache.size(true);  // size is an human readable size

cache.size(false); // size is expressed in byte
```
If the first argument is true the output will be pretty printed.

key-getter
==========
This is a utility function used to generate a function that returns a key.
```js
var keyGetter = require('memoize-cache/key-getter')
var getKey = keyGetter(func);
```
It takes a function as argument (returning a key). But it takes care of checking if it is a valid key and to hash it.
