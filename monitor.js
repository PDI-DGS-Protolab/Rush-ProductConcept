var fs = require('fs');

var pid = process.argv[2];
var mem = 0;

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


