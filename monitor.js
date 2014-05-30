var fs = require('fs');
var utils = require('./utils.js');

var pid = process.argv[2];
var mem, startTimeU, startTimeS,
      endTimeU, endTimeS, cpuUsage, cpuSys, cpuUser;

setInterval(function () {
  startTimeU = utils.getUserUsage(pid);
  startTimeS = utils.getSysUsage();

  setTimeout(function () {
    mem = utils.getProcMem(pid);
    endTimeU = utils.getUserUsage(pid);
    endTimeS = utils.getSysUsage();

    cpuSys = endTimeS - startTimeS;
    cpuUser = endTimeU - startTimeU;

    cpuUsage = 100 * (cpuUser / cpuSys);
    console.log('CPU: ' + cpuUsage);
    console.log('Memoria: ' + mem);
    fs.appendFileSync('monitor_data.csv', cpuUsage + ', ' + mem + '\n');
  }, 1000);
}, 10000);

