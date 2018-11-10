/*

Cache object

*/

function Cache (opts) {
  opts = opts || {}
  this.getCacheKey = opts.key || function () { return '_default' }
}

Cache.prototype.push = function cachePush (args, output) {}

Cache.prototype.query = function cacheQuery (args, next) {
  var key = this.getCacheKey.apply(this, args)
  if (key === '__error__') {
    return next(new Error('Error test'))
  }

  return next(null, {
    cached: false,
    key: key
  })
}

module.exports = Cache
