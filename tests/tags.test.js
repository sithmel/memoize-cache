var assert = require('chai').assert;
var Tags = require('../tags');

describe('tags', function () {
  it('must add a key', function () {
    var tags = new Tags;
    tags.add('key');
    assert.ok(tags.keysToTags['key']);
    assert.deepEqual(tags.getTags('key'), []);
    assert.equal(Object.keys(tags.tagsToKeys).length, 0);
  });

  it('must add a key with tags', function () {
    var tags = new Tags;
    tags.add('key', ['1', '2']);
    assert.ok(tags.keysToTags['key']);
    assert.deepEqual(tags.getTags('key'), ['1', '2']);
    assert.ok(tags.tagsToKeys['1']);
    assert.ok(tags.tagsToKeys['2']);
    assert.deepEqual(tags.getKeys('1'), ['key']);
    assert.deepEqual(tags.getKeys('2'), ['key']);
  });

  it('must add a 2 keys with tags', function () {
    var tags = new Tags;
    tags.add('key1', ['1', '2']);
    tags.add('key2', ['1', '3']);
    assert.ok(tags.keysToTags['key1']);
    assert.ok(tags.keysToTags['key2']);
    assert.deepEqual(tags.getTags('key1'), ['1', '2']);
    assert.deepEqual(tags.getTags('key2'), ['1', '3']);
    assert.ok(tags.tagsToKeys['1']);
    assert.ok(tags.tagsToKeys['2']);
    assert.ok(tags.tagsToKeys['3']);
    assert.deepEqual(tags.getKeys('1'), ['key1', 'key2']);
    assert.deepEqual(tags.getKeys('2'), ['key1']);
    assert.deepEqual(tags.getKeys('3'), ['key2']);
  });

  it('must remove a key', function () {
    var tags = new Tags;
    tags.add('key1', ['1', '2']);
    tags.add('key2', ['1', '3']);
    tags.removeKey('key2');
    assert.ok(tags.keysToTags['key1']);
    assert.isUndefined(tags.keysToTags['key2']);
    assert.deepEqual(tags.getTags('key1'), ['1', '2']);
    assert.deepEqual(tags.getTags('key2'), []);
    assert.ok(tags.tagsToKeys['1']);
    assert.ok(tags.tagsToKeys['2']);
    assert.isUndefined(tags.tagsToKeys['3']);
    assert.deepEqual(tags.getKeys('1'), ['key1']);
    assert.deepEqual(tags.getKeys('2'), ['key1']);
    assert.deepEqual(tags.getKeys('3'), []);
  });

  it('must remove a tag', function () {
    var tags = new Tags;
    tags.add('key1', ['1', '2']);
    tags.add('key2', ['1', '3']);
    tags.removeTag('1');
    assert.ok(tags.keysToTags['key1']);
    assert.ok(tags.keysToTags['key2']);
    assert.deepEqual(tags.getTags('key1'), ['2']);
    assert.deepEqual(tags.getTags('key2'), ['3']);
    assert.isUndefined(tags.tagsToKeys['1']);
    assert.ok(tags.tagsToKeys['2']);
    assert.ok(tags.tagsToKeys['3']);
    assert.deepEqual(tags.getKeys('1'), []);
    assert.deepEqual(tags.getKeys('2'), ['key1']);
    assert.deepEqual(tags.getKeys('3'), ['key2']);
  });
});
