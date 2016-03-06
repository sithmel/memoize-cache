var assert = require('chai').assert;
var Cache = require('..');

describe('cache', function () {

  it('must configure cache: default key', function (done) {
    var cache = new Cache();
    cache.push([], 'result');
    cache.query({}, function (err, res) {
      assert.equal(res.cached, true);
      assert.equal(res.key, '_default');
      assert.equal(res.hit, 'result');
      done();
    });
  });

  it('must return a size', function () {
    var cache = new Cache();
    cache.push([], 'result');
    assert.equal(cache.size(true), '28B');
  });

  describe('simple key', function () {
    var cache;

    beforeEach(function () {
      cache = new Cache({key: function (data) {
        return data.test;
      }});
      cache.push([{test: '1'}], 'result1');
      cache.push([{test: '2'}], 'result2');
    });

    it('must configure cache: string key 1', function (done) {
      cache.query([{test: '1'}], function (err, res1) {
        assert.equal(res1.cached, true);
        assert.equal(res1.key, '1');
        assert.equal(res1.hit, 'result1');
        done();
      });
    });

    it('must configure cache: string key 2', function (done) {
      cache.query([{test: '2'}], function (err, res2) {
        assert.equal(res2.cached, true);
        assert.equal(res2.key, '2');
        assert.equal(res2.hit, 'result2');
        done();
      });
    });

    it('must configure cache: string key 3', function (done) {
      cache.query([{test: '3'}], function (err, res3) {
        assert.equal(res3.cached, false);
        assert.equal(res3.key, '3');
        assert.isUndefined(res3.hit);
        done();
      });
    });
  });

  it('must configure cache: string key/object', function (done) {
    var cache = new Cache({key: function (data) {
      return data.test;
    }});
    cache.push([{test: [1, 2]}], 'result1');
    cache.push([{test: [3, 4]}], 'result2');

    cache.query([{test: [1, 2]}], function (err, res1) {
      assert.equal(res1.cached, true);
      assert.equal(res1.key, '[1,2]');
      assert.equal(res1.hit, 'result1');
      done();
    });
  });

  it('must configure cache: array key', function (done) {
    var cache = new Cache({key: function (data) {
      return data.test[0];
    }});
    cache.push([{test: [1, 2]}], 'result1');

    cache.query([{test: [1, 'x']}], function (err, res1) {
      assert.equal(res1.cached, true);
      assert.equal(res1.key, '1');
      assert.equal(res1.hit, 'result1');
      done();
    });
  });

  it('must configure cache: array key/object', function (done) {
    var cache = new Cache({key: function (data) {
      return data.test;
    }});
    cache.push([{test: [1, 2]}], 'result1');

    cache.query([{test: [1, 2]}], function (err, res1) {
      assert.equal(res1.cached, true);
      assert.equal(res1.key, '[1,2]');
      assert.equal(res1.hit, 'result1');
      done();
    });
  });

  it('must configure cache: func', function (done) {
    var cache = new Cache({key: function (config) {
      return config.test * 2;
    }});
    cache.push([{test: 4}], 'result1');

    cache.query([{test: 4}], function (err, res1) {
      assert.equal(res1.cached, true);
      assert.equal(res1.key, '8');
      assert.equal(res1.hit, 'result1');
      done();
    });
  });

  describe('maxLen', function () {
    var cache;

    beforeEach(function () {
      cache = new Cache({key: function (data) {
        return data.test;
      }, maxLen: 2});
      cache.push([{test: 1}], 'result1');
      cache.push([{test: 2}], 'result2');
      cache.push([{test: 3}], 'result3');
    });

    it('must be right size', function () {
      assert.equal(cache.len(), 2);
    });

    it('must not be cached (purged)', function (done) {
      cache.query([{test: 1}], function (err, res1) {
        assert.equal(res1.cached, false);
        done();
      });
    });

    it('must not be cached 1', function (done) {
      cache.query([{test: 2}], function (err, res2) {
        assert.equal(res2.cached, true);
        assert.equal(res2.key, '2');
        assert.equal(res2.hit, 'result2');
        done();
      });
    });

    it('must not be cached 2', function (done) {
      cache.query([{test: 3}], function (err, res3) {
        assert.equal(res3.cached, true);
        assert.equal(res3.key, '3');
        assert.equal(res3.hit, 'result3');
        done();
      });
    });
  });

  describe('maxAge', function () {
    var cache;

    beforeEach(function () {
      cache = new Cache({key: function (data) {
        return data.test;
      }, maxAge: 30});
      cache.push([{test: 1}], 'result1');
    });

    it('must be cached', function (done) {
      cache.query([{test: 1}], function (err, res1) {
        assert.equal(res1.cached, true);
        assert.equal(res1.key, '1');
        assert.equal(res1.hit, 'result1');
        done();
      });
    });

    it('must be cached after a bit', function (done) {
      setTimeout(function () {
        cache.query([{test: 1}], function (err, res1) {
          assert.equal(res1.cached, true);
          assert.equal(res1.key, '1');
          assert.equal(res1.hit, 'result1');
          done();
        });
      }, 10);
    });

    it('must be expired after a while', function (done) {
      setTimeout(function () {
        cache.query([{test: 1}], function (err, res1) {
          assert.equal(res1.cached, false);
          assert.equal(res1.key, '1');
          assert.isUndefined(res1.hit);
          done();
        });
      }, 40);
    });
  });

  it('must reset/switch off cache', function () {
    var cache = new Cache({key: function (data) {
      return data.test;
    }});
    cache.push([{test: 1}], 'result1');

    cache.reset();
    assert.equal(cache.len(), 0);
  });
});
