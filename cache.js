var Promise = require('bluebird');
var keyGetter = require('memoize-cache-utils/key-getter');
var callbackify = require('async-deco/utils/callbackify');
var waterfall = require('async-deco/callback/waterfall');
var snappy = require('./utils/snappy');
/*

Cache object

*/

function Cache(cacheManager, opts) {
  opts = opts || {};
  this.cacheManager = cacheManager;
  Promise.promisifyAll(this.cacheManager);
  this.getCacheKey = keyGetter(opts.key);
  this._getMaxAge = opts.maxAge;

  var serialize = opts.serializeAsync || (opts.serialize && callbackify(opts.serialize)) || function (v, cb) { cb(null, v); };
  var deserialize = opts.deserializeAsync || (opts.deserialize && callbackify(opts.deserialize)) || function (v, cb) { cb(null, v); };
  if (opts.compress) {
    this.serialize = waterfall([serialize, snappy.compress]);
    this.deserialize = waterfall([snappy.decompress, deserialize]);
  }
  else {
    this.serialize = serialize;
    this.deserialize = deserialize;
  }

  this._maxValidity = typeof opts.maxValidity === 'undefined' ?
    function () {return Infinity;} :
    (typeof opts.maxValidity === 'function' ? opts.maxValidity : function () {return opts.maxValidity;});

  this._tasksToComplete = [];
}

Cache.prototype.push = function cache_push(args, output) {
  var serialize = this.serialize;
  var cacheManager = this.cacheManager;
  var k = this.getCacheKey.apply(this, args);
  var maxAge = this._getMaxAge ? this._getMaxAge.call(this, args, output) : undefined;
  var maxValidity = (this._maxValidity.call(this, args, output) * 1000) + Date.now();

  if (k === null) return;

  if (maxAge === 0) {
    return;
  }

  var task = Promise.resolve(output)
  .then(function (o) {
    return new Promise(function (resolve, reject) {
      serialize(o, function (err, data) {
        if (err) {
          reject(err);
        }
        else {
          resolve(data);
        }
      });
    });
  })
  .then(function (o) {
    var data = { data: o, maxValidity: maxValidity };
    return cacheManager.setAsync(k, data, maxAge ? {ttl: maxAge} : undefined);
  });
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
    if (!res) {
      return {};
    }
    else {
      return new Promise(function (resolve, reject) {
        that.deserialize(res.data, function (err, data) {
          if (err) {
            reject(err);
          }
          else {
            resolve({ data: data, res: res });
          }
        });
      });
    }
  })
  .then(function (o) {
    var res = o.res;
    var data = o.data;
    if (res) {
      obj = {
        cached: true,
        key: key,
        hit: data,
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
