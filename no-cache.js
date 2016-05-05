/*

Cache object

*/
var keyGetter = require('./key-getter');

function Cache(opts) {
  opts = opts || {};
  this.getCacheKey = keyGetter(opts.key);
}

Cache.prototype.push = function cache_push(args, output) {};

Cache.prototype.query = function cache_query(args, next) {
  var key = this.getCacheKey.apply(this, args);

  return next(undefined, {
    cached: false,
    key: key
  });
};

module.exports = Cache;
