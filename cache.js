var Promise = require('bluebird');
var keyGetter = require('./key-getter');

/*

Cache object

*/

function Cache(cacheManager, opts) {
  opts = opts || {};
  this.cacheManager = cacheManager;
  Promise.promisifyAll(this.cacheManager);
  this.getCacheKey = keyGetter(opts.key);
  this._getMaxAge = opts.maxAge;
  this.serialize = opts.serialize || function (v) { return v; };
  this.deserialize = opts.deserialize || function (v) { return v; };

  this._maxValidity = typeof opts.maxValidity === 'undefined' ?
    function () {return Infinity;} :
    (typeof opts.maxValidity === 'function' ? opts.maxValidity : function () {return opts.maxValidity;});

  this._tasksToComplete = [];
}

Cache.prototype.push = function cache_push(args, output) {
  var k = this.getCacheKey.apply(this, args);
  var maxAge = this._getMaxAge ? this._getMaxAge.call(this, args, output) : undefined;
  var maxValidity = (this._maxValidity.call(this, args, output) * 1000) + Date.now();

  if (k === null) return;

  if (maxAge === 0) {
    return;
  }

  var data = { data: this.serialize(output), maxValidity: maxValidity };
  var task = this.cacheManager.setAsync(k, data, maxAge ? {ttl: maxAge} : undefined);
  this._tasksToComplete.push(task);
  return true;
};

Cache.prototype.query = function cache_query(args, next) {
  var key = this.getCacheKey.apply(this, args);
  var that = this;
  var alreadyCalledCB = false;
  var obj;

  if (key === null) {
    // if k is null I don't cache
    return next(null, {
      cached: false,
      key: key
    });
  }

  var tasksToComplete = this._tasksToComplete;
  this._tasksToComplete = [];

  Promise.all(tasksToComplete)
  .then(function () {
    return that.cacheManager.getAsync(key);
  })
  .then(function (res) {
    if (res) {
      obj = {
        cached: true,
        key: key,
        hit: that.deserialize(res.data),
        stale: Boolean(res.maxValidity && res.maxValidity < Date.now())
      };
      alreadyCalledCB = true;
      next(null, obj);
    }
    else {
      alreadyCalledCB = true;
      next(null, {
        cached: false,
        key: key
      });
    }
  })
  .catch(function (err) {
    if (!alreadyCalledCB) {
      next(err);
    }
    else {
      setTimeout(function () {
        throw(err);
      }, 0);
    }
  });
};

module.exports = Cache;
