var md5omatic = require('md5-o-matic');
var Promise = require('bluebird');

/*

Cache object

*/

function Cache(cacheManager, key) {
  this.cacheManager = cacheManager;
  Promise.promisifyAll(this.cacheManager);
  this._getCacheKey = key || function () { return '_default'; };
  this._taskToComplete = [];
}

Cache.prototype.getCacheKey = function cache_getCacheKey(args) {
  var k = this._getCacheKey.apply(undefined, args);
  if (typeof k !== 'string') {
    k = md5omatic(JSON.stringify(k));
  }
  return k;
};

Cache.prototype.push = function cache_push(args, output) {
  var k = this.getCacheKey(args);
  var task = this.cacheManager.setAsync(k, output);
  this._taskToComplete.push(task);
};

Cache.prototype.query = function cache_query(args, next) {
  var key = this.getCacheKey(args);
  var that = this;

  Promise.all(this._taskToComplete)
  .then(function () {
    that._taskToComplete = [];
    return that.cacheManager.getAsync(key);
  })
  .then(function (res) {
    if (res) {
      next(null, {
        cached: true,
        key: key,
        hit: res
      });
    }
    else {
      next(null, {
        cached: false,
        key: key
      });
    }
  })
  .catch(function (err) {
    next(err);
  });
};

module.exports = Cache;
