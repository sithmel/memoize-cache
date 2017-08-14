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
  next = next || function () {};
  try {
    this._reset();
  } catch (e) {
    return next(e);
  }
  next();
};

CacheRam.prototype.purgeByKeys = function cache__purgeKeys(keys, next) {
  next = next || function () {};
  keys = Array.isArray(keys) ? keys : [keys];
  try {
    for (var i = 0; i < keys.length; i++) {
      this.cache.del(keys[i]);
      this.tags.removeKey(keys[i]);
    }
    next();
  } catch (e) {
    next(e);
  }
};

CacheRam.prototype.purgeByTags = function cache__purgeTags(tags, next) {
  next = next || function () {};
  tags = Array.isArray(tags) ? tags : [tags];
  var keys;
  try {
    for (var i = 0; i < tags.length; i++) {
      keys = this.tags.getKeys(tags[i]);
      this.purgeByKeys(keys);
      // not calling this.tags.removeTag(tags[i]); as this.tags.removeKey(keys[i]) should suffice
    }
    next();
  } catch (e) {
    next(e);
  }
};

module.exports = CacheRam;
