var keyGetter = require('memoize-cache-utils/key-getter');
var callbackify = require('async-deco/utils/callbackify');
var waterfall = require('async-deco/callback/waterfall');
var snappy = require('./utils/snappy');
var redis = require('redis');
/*

Cache object

*/

function Cache(opts) {
  opts = opts || {};
  this.redisClient = redis.createClient(opts.db || {});
  this.getCacheKey = keyGetter(opts.key);
  this._getMaxAge = typeof opts.maxAge !== 'function' ? function () { return opts.maxAge; } : opts.maxAge;

  var serialize = opts.serializeAsync || (opts.serialize && callbackify(opts.serialize)) || function (v, cb) { cb(null, v); };
  var deserialize = opts.deserializeAsync || (opts.deserialize && callbackify(opts.deserialize)) || function (v, cb) { cb(null, v); };
  if (opts.compress) {
    if (!snappy.isSnappyInstalled) {
      throw new Error('The "compress" option requires the "snappy" library. Its installation failed (hint missing libraries or compiler)');
    }
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
  var redisClient = this.redisClient;
  var k = this.getCacheKey.apply(this, args);
  var maxAge = this._getMaxAge.call(this, args, output); // undefined === forever
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
    var data = JSON.stringify({ data: o, maxValidity: maxValidity });
    return new Promise(function (resolve, reject) {
      var callback = function (err, res) {
        if (err) return reject(err);
        resolve();
      };
      if (typeof maxAge !== 'undefined' && maxAge !== Infinity) {
        redisClient.set(k, data, 'PX', maxAge * 1000, callback);
      } else {
        redisClient.set(k, data, callback);
      }
    });
  })
  .catch(function (err) {
    console.log(err);
  });
  this._tasksToComplete.push(task);
  return k;
};

Cache.prototype.query = function cache_query(args, next) {
  var t0 = Date.now();
  var key = this.getCacheKey.apply(this, args);
  var that = this;
  var alreadyCalledCB = false;
  var obj;

  if (key === null) {
    // if k is null I don't cache
    return next(null, {
      timing: Date.now() - t0,
      cached: false,
      key: key
    });
  }

  var tasksToComplete = this._tasksToComplete;
  this._tasksToComplete = [];
  Promise.all(tasksToComplete)
  .then(function () {
    return new Promise(function (resolve, reject) {
      that.redisClient.get(key, function (err, res) {
        if (err) return reject(err);
        resolve(res);
      });
    });
  })
  .then(function (res) {
    if (!res) {
      return {};
    }
    else {
      res = JSON.parse(res);
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
        timing: Date.now() - t0,
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
        timing: Date.now() - t0,
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
