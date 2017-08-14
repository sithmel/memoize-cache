var BaseCache = require('./base-cache');
var LRU = require('little-ds-toolkit/lib/lru-cache');
var Tags = require('./tags');

function CacheRam(opts) {
  BaseCache.call(this, opts);
  this._maxLen = this.opts.maxLen;
  this._maxSize = this.opts.maxSize;
  this._reset();
}

CacheRam.prototype = Object.create(BaseCache.prototype);
CacheRam.prototype.constructor = CacheRam;

CacheRam.prototype._reset = function cache__reset() {
  var tags = this.tags = new Tags();
  var onDelete = function (item) {
    var key = item.key;
    tags.removeKey(key);
  };
  this.cache = new LRU({ maxSize: this._maxSize, maxLen: this._maxLen, onDelete: onDelete });
};

CacheRam.prototype._set = function cache__set(keys, payload, maxAge, next) {
  var k = keys.key;
  var tags = keys.tags;

  try {
    this.cache.set(k, payload, maxAge * 1000);
    this.tags.add(k, tags);
    next();
  } catch (e) {
    next(e);
  }
};

CacheRam.prototype._get = function cache__get(key, next) {
  var hit;
  try {
    next(null, this.cache.get(key));
  } catch (e) {
    next(e);
  }
};

CacheRam.prototype.purgeAll = function cache__purgeAll(next) {
  this._reset();
};

CacheRam.prototype.purgeKeys = function cache__purgeKeys(keys, next) {
  keys = Array.isArray(keys) ? keys : [keys];
  try {
    for (var i = 0; i < keys.length; i++) {
      this.cache.del(k);
      this.tags.removeKey(k);
    }
    next();
  } catch (e) {
    next(e);
  }
};

CacheRam.prototype.purgeTags = function cache__purgeTags(tags, next) {
  tags = Array.isArray(tags) ? tags : [tags];
  var keys;
  try {
    for (var i = 0; i < tags.length; i++) {
      keys = this.tags.getKeys(tags[i]);
      this.purgeKeys(keys);
      // this.tags.removeTag(tags[i]);
    }
    next();
  } catch (e) {
    next(e);
  }
};

module.exports = CacheRam;
