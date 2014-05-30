var fs = require('fs');
var http = require('http');

Array.prototype.contains = function(element) {
  'use strict';
  for (var i = 0; i < this.length; i++) {
    if (this[i] == element) {
      return true;
    }
  }
};

var getUserUsage = function (pid) {
  var data = fs.readFileSync('/proc/' + pid + '/stat');

  var elems = data.toString().split(' ');
  var utime = parseInt(elems[13]);
  var stime = parseInt(elems[14]);

  return utime + stime;
}

var getSysUsage = function () {
  var data = fs.readFileSync('/proc/stat');

  var elems = data.toString().split(' ');

  return parseInt(elems[2]) + parseInt(elems[3]) + parseInt(elems[4]) + parseInt(elems[5]);
};

var getProcMem = function (pid) {
  'use strict';
  var data = fs.readFileSync('/proc/' + pid + '/status');

  var elems = data.toString().split('\n');
  elems = elems[15].split('\t');
  elems = elems[1].split(' ');

  return elems[elems.length - 2];
};


var makeRequest = function(options, content, cb) {
  'use strict';
  var data = '';


  var req = http.request(options, function(res) {

    var o; //returned object from request
    res.setEncoding('utf8');
    res.on('data', function(chunk) {
      data += chunk;
    });
    res.on('end', function() {
      /*if (res.headers['content-type'].split(';').contains('application/json')) {
        data = JSON.parse(data);
      }*/
      cb(null, res, data);
    });
  });

  req.on('error', function(e) {
    cb(e, null, null);
  });
  if (options.method === 'POST' || options.method === 'PUT') {
    if (options.headers &&
        options.headers['content-type'] === 'application/json') {
      content = JSON.stringify(content);
    }
    req.write(content);
  }

  req.end();

};

exports.makeRequest = makeRequest;
exports.getUserUsage = getUserUsage;
exports.getSysUsage = getSysUsage;
exports.getProcMem = getProcMem;
