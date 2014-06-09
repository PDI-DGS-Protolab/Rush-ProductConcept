var loadtest = require('loadtest');
var utils = require('./utils');

var size = 500;
var body = "";
var interval = 0.8;

for(var i=0; i<size * 1024; i++){
  body += 'a';
}

var options = {
    url: 'http://ec2-54-199-108-216.ap-northeast-1.compute.amazonaws.com:80',
    maxRequests: 5000,
    contentType : 'application/octet-stream',
    requestsPerSecond : 1 / interval,
    method : 'POST',
    body : body
};

var logInterval = setInterval(function(){
  var mem = utils.getProcMem(process.pid);
  console.log(mem);
}, 4000);


loadtest.loadTest(options, function(error, result)
{
    if (error)
    {
        return console.error('Got an error: %s', error);
    }
    console.log(result);

    setTimeout(function(){
      clearInterval(logInterval);
    }, 60 * 1000);
});


