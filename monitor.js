var fs = require('fs');


var pid = process.argv[2];
var mem, startTimeU, startTimeS,
      endTimeU, endTimeS, cpuUsage, cpuSys, cpuUser;

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

/*setInterval(function() {
  'use strict';
  mem = getProcMem(pid);
  console.log('Memoria: ' + mem);
  fs.appendFileSync('mem_data.csv', mem + '\n')
}, 1000);*/

exports.getProcMem = getProcMem;
