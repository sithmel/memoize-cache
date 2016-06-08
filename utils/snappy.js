var snappy = require('snappy');

var compress = function (obj, cb) {
  snappy.compress(JSON.stringify(obj), function (err, buf) {
    cb(err, buf.toString());
  });
};

var decompress = function (str, cb) {
  var buf = Buffer.from(str);
  snappy.uncompress(buf, { asBuffer: false }, function (err, uncompressed) {
    var obj;
    if (err) {
      cb(err);
    }
    else {
      try {
        obj = JSON.parse(uncompressed);
      }
      catch (e) {
        return cb(e);
      }
      cb(null, obj);
    }
  });
};

module.exports = {
  compress: compress,
  decompress: decompress
};
