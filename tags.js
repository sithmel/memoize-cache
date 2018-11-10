var utils = require('./utils')

var getSet = utils.getSet
var getMap = utils.getMap
var setToArray = utils.setToArray

function Tags (forceLegacy) {
  this.forceLegacy = forceLegacy
  this.keysToTags = getMap(forceLegacy)
  this.tagsToKeys = getMap(forceLegacy)
}

Tags.prototype.add = function (key, tags) {
  tags = tags || []
  var tag
  this.keysToTags.set(key, getSet(tags, this.forceLegacy))
  for (var i = 0; i < tags.length; i++) {
    tag = tags[i]
    if (!this.tagsToKeys.has(tag)) {
      this.tagsToKeys.set(tag, getSet(undefined, this.forceLegacy))
    }
    this.tagsToKeys.get(tag).add(key)
  }
}

Tags.prototype.getTags = function (key) {
  return this.keysToTags.has(key) ? setToArray(this.keysToTags.get(key)) : []
}

Tags.prototype.getKeys = function (tag) {
  return this.tagsToKeys.has(tag) ? setToArray(this.tagsToKeys.get(tag)) : []
}

Tags.prototype.removeKey = function (key) {
  var tags = this.getTags(key)
  for (var i = 0; i < tags.length; i++) {
    this.tagsToKeys.get(tags[i]).delete(key)
    if (this.tagsToKeys.get(tags[i]).size === 0) {
      this.tagsToKeys.delete(tags[i])
    }
  }
  this.keysToTags.delete(key)
}

Tags.prototype.removeTag = function (tag) {
  var keys = this.getKeys(tag)
  for (var i = 0; i < keys.length; i++) {
    this.keysToTags.get(keys[i]).delete(tag)
    if (this.keysToTags.get(keys[i]).size === 0) {
      this.keysToTags.delete(keys[i])
    }
  }
  this.tagsToKeys.delete(tag)
}

module.exports = Tags
