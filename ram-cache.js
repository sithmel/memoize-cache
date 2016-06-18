var sizeof = require('sizeof');
var Heap = require('./heap');
var keyGetter = require('./key-getter');

/*

Cache object

*/
function sortByLessPopular(a, b) {
  return a.times < b.times;
}

function sortByOldest(a, b) {
  return a.expireTs < b.expireTs;
}

function byKey(key) {
  return function (item) {
    return item.key === key;
  };
}

function Cache(opts) {
  opts = opts || {};

  this.reset();

  this.getCacheKey = keyGetter(opts.key);
  this._maxAge = typeof opts.maxAge === 'undefined' ?
    function () {return Infinity;} :
    (typeof opts.maxAge === 'function' ? (opts.maxAge) : function () {return opts.maxAge;});

  this._maxValidity = typeof opts.maxValidity === 'undefined' ?
    function () {return Infinity;} :
    (typeof opts.maxValidity === 'function' ? (opts.maxValidity) : function () {return opts.maxValidity;});

  this.serialize = opts.serialize || function (v) { return v; };
  this.deserialize = opts.deserialize || function (v) { return v; };

  this._maxLen = opts.maxLen || Infinity;
}

Cache.prototype.push = function cache_push(args, output) {
  var lru,
    k = this.getCacheKey.apply(this, args),
    maxAge = this._maxAge.call(this, args, output) * 1000,
    maxValidity = (this._maxValidity.call(this, args, output) * 1000) + Date.now();

  if (k === null) return; // if k is null I don't cache

  if (!maxAge) return;

  if (!(k in this._cache)) { //  not cached yet
    if (this._LRU.size() === this._maxLen) { // prepare a place fr LRU
      // remove from LRU heap
      lru = this._LRU.pop();
      // remove from cache
      delete this._cache[lru.key];
      // remove from stale objects cache
      this._oldest.remove(byKey(lru.key));
    }
    if (this._maxLen !== Infinity) { // add to LRU
      // add to LRU heap
      this._LRU.push({key: k, times: 0});
    }
  }
  else { // already in cache
    this._oldest.remove(byKey(k)); // remove from
  }

  if (maxAge !== Infinity) {
    // add to stale objects cache
    this._oldest.push({
      key: k,
      expireTs: Date.now() + maxAge
    });
  }

  // add to cache
  this._cache[k] = { data: this.serialize(output), maxValidity: maxValidity };

  return true;
};

Cache.prototype._purgeByAge = function cache__purgeByAge() {
  // remove old entries
  var oldest, now = Date.now();

  while (this._oldest.size()) {
    oldest = this._oldest.pop();
    if (oldest.expireTs < now) {
      delete this._cache[oldest.key];
      this._LRU.remove(byKey(oldest.key));
    }
    else {
      this._oldest.push(oldest);
      break;
    }
  }
};

Cache.prototype.query = function cache_query(args, next) {
  var hit,
    cached = false,
    lru,
    key,
    alreadyCalledCB = false;

  try {
    this._purgeByAge(); // purge stale cache entries

    key = this.getCacheKey.apply(this, args);

    if (key === null) {
      // if k is null I don't cache
      alreadyCalledCB = true;
      return next(null, {
        cached: false,
        key: key
      });
    }

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
    if (!alreadyCalledCB) {
      return next(e);
    }
    else {
      throw(e);
    }
  }

  next(null, {
    cached: cached,
    key: key,
    hit: hit && this.deserialize(hit.data),
    stale: hit && Boolean(hit.maxValidity && hit.maxValidity < Date.now())
  });
};

Cache.prototype.del = function cache_del(k) {
  delete this._cache[k];
  this._oldest.remove(byKey(k));
  this._LRU.remove(byKey(k));
};

Cache.prototype.reset = function cache_reset() {
  this._cache = {}; // key, value
  this._LRU = new Heap(sortByLessPopular);
  this._oldest = new Heap(sortByOldest);
};

Cache.prototype.size = function cache_size(pretty) {
  return sizeof.sizeof(this._cache, pretty);
};

Cache.prototype.len = function cache_len() {
  return Object.keys(this._cache).length;
};

module.exports = Cache;
