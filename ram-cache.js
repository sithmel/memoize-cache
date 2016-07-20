// var sizeof = require('sizeof');
// var Heap = require('./heap');
var keyGetter = require('memoize-cache-utils/key-getter');
var LRU = require('little-ds-toolkit/lib/lru-cache');
/*

Cache object

*/
function Cache(opts) {
  opts = opts || {};

  this.getCacheKey = keyGetter(opts.key);
  this._maxAge = typeof opts.maxAge === 'undefined' ?
    function () {return Infinity;} :
    (typeof opts.maxAge === 'function' ? (opts.maxAge) : function () {return opts.maxAge;});

  this._maxValidity = typeof opts.maxValidity === 'undefined' ?
    function () {return Infinity;} :
    (typeof opts.maxValidity === 'function' ? (opts.maxValidity) : function () {return opts.maxValidity;});

  this.serialize = opts.serialize || function (v) { return v; };
  this.deserialize = opts.deserialize || function (v) { return v; };

  this._maxLen = opts.maxLen;
  this._maxSize = opts.maxSize;

  this.reset();
}

Cache.prototype.push = function cache_push(args, output) {
  var k = this.getCacheKey.apply(this, args),
    maxAge = this._maxAge.call(this, args, output) * 1000,
    maxValidity = (this._maxValidity.call(this, args, output) * 1000) + Date.now();

  if (k === null) return; // if k is null I don't cache

  if (!maxAge) return;

  this._cache.set(k, { data: this.serialize(output), maxValidity: maxValidity }, maxAge);

  return true;
};

Cache.prototype.query = function cache_query(args, next) {
  var hit,
    cached = false,
    key,
    alreadyCalledCB = false;

  try {
    key = this.getCacheKey.apply(this, args);

    if (key === null) {
      // if k is null I don't cache
      alreadyCalledCB = true;
      return next(null, {
        cached: false,
        key: key
      });
    }

    var hit = this._cache.get(key);
    cached = typeof hit !== 'undefined';
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
  this._cache.del(k);
};

Cache.prototype.reset = function cache_reset() {
  this._cache = new LRU({ maxSize: this._maxSize, maxLen: this._maxLen });
};

Cache.prototype.size = function cache_size() {
  return this._cache.size;
};

Cache.prototype.len = function cache_len() {
  return this._cache.len;
};

module.exports = Cache;
