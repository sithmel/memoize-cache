var CacheRAM = require('./cache-ram')
var NoCache = require('./no-cache')
var BaseCache = require('./base-cache')
var keyGetter = require('memoize-cache-utils/key-getter')
var keysGetter = require('memoize-cache-utils/keys-getter')

module.exports = {
  CacheRAM: CacheRAM,
  NoCache: NoCache,
  BaseCache: BaseCache,
  keyGetter: keyGetter,
  keysGetter: keysGetter
}
