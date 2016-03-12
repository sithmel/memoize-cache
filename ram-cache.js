var sizeof = require('sizeof');
var Heap = require('./heap');
var md5omatic = require('md5-o-matic');
/*

Cache object

*/
function find(arr, predicate) {
  var i,
    len = arr.length;
  for (i = 0; i < len; i++) {
    if (predicate(arr[i])) {
      return i;
    }
  }
}

function sortByLessPopular(a, b) {
  return a.times < b.times;
}

function byKey(key) {
  return function (item) {
    return item.key === key;
  };
}

function Cache(opts) {
  opts = opts || {};

  this.reset();

  this._getCacheKey = opts.key || function () { return '_default'; };
  this._maxAge = opts.maxAge || Infinity;
  this._maxLen = opts.maxLen || Infinity;
}

Cache.prototype.getCacheKey = function cache_getCacheKey(args) {
  var k = this._getCacheKey.apply(undefined, args);
  if (typeof k !== 'string') {
    k = md5omatic(JSON.stringify(k));
  }
  return k;
};

Cache.prototype.push = function cache_push(args, output) {
  var lru, oldestIndex,
    k = this.getCacheKey(args);

  if (k in this._cache) return;

  if(this._LRU.size() === this._maxLen) {
    // remove from LRU heap
    lru = this._LRU.pop();
    // remove from cache
    delete this._cache[lru.key];
    // remove from stale objects cache
    oldestIndex = find(this._oldest, byKey(lru.key));
    if (oldestIndex) {
      this._oldest.splice(oldestIndex, 1);
    }
  }
  // add to cache
  this._cache[k] = output;

  if (this._maxLen !== Infinity) {
    // add to LRU heap
    this._LRU.push({key: k, times: 0});
  }
  if (this._maxAge !== Infinity) {
    // add to stale objects cache
    this._oldest.push({
      key: k,
      ts: Date.now()
    });
  }
};

Cache.prototype._purgeByAge = function cache__purgeByAge() {
  // remove old entries
  var key, i, oldestIndex,
    maxAge = this._maxAge,
    now = Date.now();

  if (this._maxAge === Infinity) return;

  var oldestIndex = find(this._oldest, function (oldest) {
    return oldest.ts + maxAge >= now;
  });

  if (oldestIndex) {
    for(i = 0; i < oldestIndex; i++){
      key = this._oldest[i].key;
      delete this._cache[key];
      this._LRU.remove(byKey(key));
    }
    this._oldest.splice(0, i);
  }
};

Cache.prototype.reset = function cache_reset() {
  this._cache = {}; // key, value
  this._LRU = new Heap(sortByLessPopular);
  this._oldest = [];
};

Cache.prototype.query = function cache_query(args, next) {
  var hit,
    cached = false,
    lru,
    key;
  try {
    this._purgeByAge(); // purge stale cache entries

    key = this.getCacheKey(args);

    if (key in this._cache) {
      cached = true;
      hit = this._cache[key]; // cache hit!

      if (this._maxLen !== Infinity) {
        lru = this._LRU.remove(byKey(key));
        lru.times++;
        this._LRU.push(lru);
      }
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

Cache.prototype.size = function cache_size(pretty) {
  return sizeof.sizeof(this._cache, pretty);
};

Cache.prototype.len = function cache_len() {
  return Object.keys(this._cache).length;
};

module.exports = Cache;
