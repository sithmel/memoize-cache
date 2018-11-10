/*

Cache object

*/

function BaseCache (opts) {
  this.opts = opts = opts || {}
  this.getCacheKey = opts.getKey || function () { return '_default' }
  this.getTags = opts.getTags || function () { return [] }
  this.getMaxAge = typeof opts.maxAge !== 'function' ? function () { return opts.maxAge } : opts.maxAge

  this.serialize = opts.serialize || function (v) { return v }
  this.deserialize = opts.deserialize || function (v) { return v }

  this.maxValidity = typeof opts.maxValidity === 'undefined'
    ? function () { return Infinity }
    : (typeof opts.maxValidity === 'function' ? opts.maxValidity : function () { return opts.maxValidity })
}

BaseCache.prototype.push = function cachePush (args, output, next) {
  next = next || function () {} // next is optional

  var k = this.getCacheKey.apply(this, args)
  var tags = this.getTags.apply(this, args)
  var maxAge = this.getMaxAge(args, output) // undefined === forever
  var maxValidity = (this.maxValidity(args, output) * 1000) + Date.now()

  if (k === null || maxAge === 0) {
    next()
    return
  }

  var keys = { key: k, tags: tags }

  this.set(keys, maxValidity, maxAge, output, next)
  return keys
}

BaseCache.prototype.set = function cacheSet (keys, maxValidity, maxAge, output, next) {
  next = next || function () {} // next is optional
  var payload

  var set = this._set.bind(this)
  payload = { data: this.serialize(output), maxValidity: maxValidity }
  set(keys, payload, maxAge, next)
}

BaseCache.prototype.query = function cacheQuery (args, next) {
  var t0 = Date.now()
  var key = this.getCacheKey.apply(this, args)
  var deserialize = this.deserialize
  var get = this._get.bind(this)

  if (key === null) {
    // if k is null I don't cache
    return next(null, {
      timing: Date.now() - t0,
      cached: false,
      key: key
    })
  }

  get(key, function (err, payload) {
    var data, maxValidity
    if (err) {
      return next(err)
    }
    if (!payload) {
      return next(null, {
        timing: Date.now() - t0,
        cached: false,
        key: key
      })
    }
    maxValidity = payload.maxValidity
    data = payload.data
    next(null, {
      timing: Date.now() - t0,
      cached: true,
      key: key,
      hit: deserialize(data),
      stale: Boolean(maxValidity && maxValidity < Date.now())
    })
  })
}

BaseCache.prototype.purgeByKeys = function cachePurgeByKeys (keys, next) {
  throw new Error('Not implemented')
}

BaseCache.prototype.purgeByTags = function cachePurgeByTags (keys, next) {
  throw new Error('Not implemented')
}

BaseCache.prototype.purgeAll = function cachePurgeAll (keys, next) {
  throw new Error('Not implemented')
}

module.exports = BaseCache
