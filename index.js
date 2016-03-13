var ramCache = require('./ram-cache');
var cache = require('./cache');
var keyGetter = require('./key-getter');

module.exports = {
  ramCache: ramCache,
  cache: cache,
  keyGetter: keyGetter,
};
