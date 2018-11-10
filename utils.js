function onlyStringAllowed (value) {
  if (typeof value !== 'string') throw new Error('This environment does not support ES2015 Map/Set. Only string allowed!')
}

function FakeSet (arr) {
  this.data = {}
  this.size = 0
  arr = arr || []
  for (var i = 0, len = arr.length; i < len; i++) {
    this.add(arr[i])
  }
}

FakeSet.prototype.has = function (value) {
  onlyStringAllowed(value)
  return value in this.data
}

FakeSet.prototype.add = function (value) {
  onlyStringAllowed(value)
  this.size++
  this.data[value] = true
}

FakeSet.prototype.delete = function (value) {
  onlyStringAllowed(value)
  this.size--
  delete this.data[value]
}

function FakeMap () {
  this.size = 0
  this.data = {}
}

FakeMap.prototype.has = function (key) {
  onlyStringAllowed(key)
  return key in this.data
}

FakeMap.prototype.get = function (key) {
  onlyStringAllowed(key)
  return this.data[key]
}

FakeMap.prototype.set = function (key, value) {
  onlyStringAllowed(key)
  this.size++
  this.data[key] = value
}

FakeMap.prototype.delete = function (key, value) {
  onlyStringAllowed(key)
  this.size--
  delete this.data[key]
}

function getSet (items, forceLegacy) {
  try {
    if (forceLegacy) throw new Error('Use fakeSet')
    return new Set(items)
  } catch (e) {
    return new FakeSet(items)
  }
}

function getMap (forceLegacy) {
  try {
    if (forceLegacy) throw new Error('Use fakeMap')
    return new Map()
  } catch (e) {
    return new FakeMap()
  }
}

function setToArray (set) {
  if (set instanceof FakeSet) {
    return Object.keys(set.data)
  }
  return Array.from(set)
}

module.exports = {
  getSet,
  getMap,
  setToArray
}
