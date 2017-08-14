function Bucket(arr) {
  arr = arr || [];
  this.data = {};
  this.len = 0;
  for (var i = 0, len = arr.length; i < len; i++) {
    this.add(arr[i]);
  }
};

Bucket.prototype.has = function (key) {
  return key in this.data;
};

Bucket.prototype.add = function (key) {
  this.len++;
  this.data[key] = true;
};

Bucket.prototype.del = function (key) {
  if (this.has(key)) {
    delete this.data[key];
    this.len--;
  }
};

Bucket.prototype.toArray = function () {
  return Object.keys(this.data);
};

function Tags() {
  this.keysToTags = {};
  this.tagsToKeys = {};
}

Tags.prototype.add = function (key, tags) {
  tags = tags || [];
  var tag;
  this.keysToTags[key] = new Bucket(tags);
  for (var i = 0; i < tags.length; i++) {
    tag = tags[i];
    if (!(tag in this.tagsToKeys)) {
      this.tagsToKeys[tag] = new Bucket();
    }
    this.tagsToKeys[tag].add(key);
  }
};

Tags.prototype.getTags = function (key) {
  if (key in this.keysToTags) {
    return this.keysToTags[key].toArray();
  }
};

Tags.prototype.getKeys = function (tag) {
  if (tag in this.tagsToKeys) {
    return this.tagsToKeys[tag].toArray();
  }
};

Tags.prototype.removeKey = function (key) {
  if (!(key in this.keysToTags)) return;

  var tags = this.keysToTags[key].toArray();
  for (var i = 0; i < tags.length; i++) {
    this.tagsToKeys[tags[i]].del(key);
    if (this.tagsToKeys[tags[i]].len === 0) {
      delete this.tagsToKeys[tags[i]];
    }
  }

  delete this.keysToTags[key];
};

Tags.prototype.removeTag = function (tag) {
  if (!(tag in this.tagsToKeys)) return;

  var keys = this.tagsToKeys[tag].toArray();
  for (var i = 0; i < keys.length; i++) {
    this.keysToTags[keys[i]].del(tag);
    if (this.keysToTags[keys[i]].len === 0) {
      delete this.keysToTags[keys[i]];
    }
  }

  delete this.tagsToKeys[tag];
};

module.exports = Tags;
