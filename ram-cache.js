var sizeof = require('sizeof');
var Heap = require('./heap');
var md5omatic = require('md5-o-matic');
/*

Cache object

*/

function sortByLessPopular(a, b) {
  return a.times < b.times;
}

function sortByOldest(a, b) {
  return a.ts < b.ts;
}

function removeByKey(key) {
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
  var lru;
  var k = this.getCacheKey(args);
  if (k in this._cache) return;

  if(this._LRU.size() === this._maxLen) {
    lru = this._LRU.pop();
    delete this._cache[lru.key];
    this._oldest.remove(removeByKey(lru.key));
  }

  this._cache[k] = output;

  this._LRU.push({key: k, times: 0});

  this._oldest.push({
    key: k,
    ts: Date.now()
  });
};

Cache.prototype._purgeByAge = function cache__purgeByAge() {
  // remove old entries
  var oldest;
  var now = Date.now();

  while (this._oldest.size()) {
    oldest = this._oldest.pop();
    if (oldest.ts + this._maxAge < now) {
      delete this._cache[oldest.key];
      this._LRU.remove(removeByKey(oldest.key));
    }
    else {
      this._oldest.push(oldest);
      break;
    }
  }
};

Cache.prototype.reset = function cache_reset() {
  this._cache = {}; // key, value
  this._LRU = new Heap(sortByLessPopular);
  this._oldest = new Heap(sortByOldest);
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
      lru = this._LRU.remove(removeByKey(key));
      lru.times++;
      this._LRU.push(lru);
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
  return this._LRU.size();
};

module.exports = Cache;
