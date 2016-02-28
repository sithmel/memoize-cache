var sizeof = require('sizeof');

/*

Cache object

*/

function Cache(opts) {
  opts = opts || {};

  this._cache = {}; // key, value
  this._cacheKeys = []; // sorted by time {ts: xxx, key: xxx} new ones first

  this._getCacheKey = opts.key || function () { return '_default'; };
  this._maxAge = opts.maxAge || Infinity;
  this._maxLen = opts.maxLen || Infinity;
}

Cache.prototype.push = function cache_push(args, output, next) {
  var k = this._getCacheKey.apply(undefined, args);
  if (typeof k !== 'string') {
    k = JSON.stringify(k);
  }
  if (k in this._cache) return next(undefined, k);
  this._cache[k] = output;
  this._cacheKeys.unshift({
    key: k,
    ts: Date.now()
  });
  this._purge();
  next(undefined, k);
};

Cache.prototype._purge = function cache__purge() {
  // remove old entries
  var maxAge = this._maxAge;
  var maxLen = this._maxLen;
  var cache = this._cache;

  var now = Date.now();
  this._cacheKeys = this._cacheKeys.filter(function (item) {
    if (item.ts + maxAge < now ) {
      delete cache[item.key];
      return false;
    }
    return true;
  });

  // trim cache
  var keysToRemove = this._cacheKeys.slice(maxLen, Infinity);
  keysToRemove.forEach(function (item) {
    var k = item.key;
    delete cache[k];
  });
  this._cacheKeys = this._cacheKeys.slice(0, maxLen);
};

Cache.prototype.reset = function cache_reset(next) {
  this._cache = {}; // key, value
  this._cacheKeys = []; // sorted by time {ts: xxx, key: xxx}
  next();
};

Cache.prototype.query = function cache_query(args, next) {
  var hit,
    cached = false,
    key;
  try {
    key = this._getCacheKey.apply(undefined, args);
    if (typeof key !== 'string') {
      key = JSON.stringify(key);
    }
    this._purge(); // purge stale cache entries

    if (key in this._cache) {
      cached = true;
      hit = this._cache[key]; // cache hit!
    }
  }
  catch (e) {
    return next(e);
  }

  next(undefined, {
    cached: cached,
    key: key,
    hit: hit
  });
};

Cache.prototype.size = function cache_size(pretty, next) {
  var size = sizeof.sizeof(this._cache, pretty);
  next(undefined, size);
};

Cache.prototype.len = function cache_len(next) {
  var len = this._cacheKeys.length;
  next(undefined, len);
};

module.exports = Cache;
