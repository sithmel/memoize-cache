memoize-cache
=============
A configurable cache support for memoized functions.

A note about the API
====================
This is an in-memory cache implementation. I have chosen a callback based asynchronous API. This is because ideally you can use the same API for implementing a in-file, network or DB based version of the same cache.

Creating an instance
--------------------
The constructor takes an option object with 3 optional attributes:
* key: a function used to extract the cache key (used in the push and query method for storing, retrieving the cached value). The key returned should be a string or it will be converted to JSON. Default: a function returning a fixed key.
* maxAge: the maximum age of the item stored in the cache (in ms). Default: Infinity
* maxLen: the maximum number of items stored in the cache. Default: Infinity

Example:
```js
// no values, uses always the same key for store any value
var cache = new Cache();

// using the id property of the first argument
// this cache will store maximum 100 items
// every item will be considered stale and purged after 20 seconds.
var cache = new Cache({key: function (config){
  return config.id;
}}, maxLen: 100, maxAge: 20000);
```

Pushing a new cached value
--------------------------
```js
cache.push(args, output, function (){
  // cache updated
});
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

resetting the cache
-------------------
```js
cache.reset(function (err){
  // the cache is empty now
});
```

getting the number of item cached
---------------------------------
```js
cache.len(function (err, n){
  // n is the number of item cached
});
```

getting the size of the cache
-----------------------------
```js
cache.size(true, function (err, size){
  // size is an human readable size
});

cache.size(false, function (err, size){
  // size is expressed in byte
});
```
If the first argument is true the output will be pretty printed.
