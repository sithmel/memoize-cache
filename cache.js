var Promise = require('bluebird');
var keyGetter = require('./key-getter');

/*

Cache object

*/

function Cache(cacheManager, key) {
  this.cacheManager = cacheManager;
  Promise.promisifyAll(this.cacheManager);
  this.getCacheKey = keyGetter(key);
  this._tasksToComplete = [];
}

Cache.prototype.push = function cache_push(args, output) {
  var k = this.getCacheKey.apply(this, args);
  var task = this.cacheManager.setAsync(k, output);
  this._tasksToComplete.push(task);
};

Cache.prototype.query = function cache_query(args, next) {
  var key = this.getCacheKey.apply(this, args);
  var that = this;

  var tasksToComplete = this._tasksToComplete;
  this._tasksToComplete = [];

  Promise.all(tasksToComplete)
  .then(function () {
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
