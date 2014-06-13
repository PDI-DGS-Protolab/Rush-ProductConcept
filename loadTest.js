var loadtest = require('loadtest');
var utils = require('./utils');

var body = '';

var method = process.argv[3];
var ip = process.argv[5];
var port = process.argv[7];
var payload = process.argv[9];
var nReq = process.argv[11];
var interval = process.argv[13];

for(var i=0; i < payload * 1024; i++){
  body += 'a';
}

var url = method + '://' + ip + ':' + port;

var options = {
    url: url,
    maxRequests: nReq,
    contentType : 'application/octet-stream',
    requestsPerSecond : 1 / interval,
    method : 'POST',
    body : payload
};

var logInterval = setInterval(function(){
  //var mem = utils.getProcMem(process.pid);
  var userTicks = utils.getUserUsage(process.pid);
  /*startTimeS = utils.getSysUsage();*/

  console.log('User ticks: ' + userTicks);
  //console.log(mem);
}, 3000);


loadtest.loadTest(options, function(error, result)
{
    if (error)
    {
        return console.error('Got an error: %s', error);
    }
    console.log(result);

    setTimeout(function(){
      clearInterval(logInterval);
    }, 5 * 1000);
});


