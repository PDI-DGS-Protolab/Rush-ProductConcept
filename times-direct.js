var http = require('http');
var fs = require('fs');
var config = require('./config');
var monitor = require('./monitor.js');

var numberSent = 0;
var numberRequested = 0;
var numberReceived = 0;

function request(stream, callback) {

  // An object of options to indicate where to post to
  var post_options = {
      host: config.endpoint,
      port: config.endpointPort || 80,
      method: 'POST',
      headers: {
          'Content-Type': 'application/octet-stream'
      }
  };

  // Set up the request
  var post_req = http.request(post_options, function(res) {

    res.on('data', function(data){
    });

    res.on('end', function(){
      callback();
    });

  });

  post_req.on('error', function(e) {
    console.log('problem with request: ' + e.message);
  });

  stream.on('data', function(data){
    post_req.write(data);
  });

  stream.on('end', function(){
    post_req.end();
  });

};


var startTest = function(number){

  numberSent = 0;
  numberReceived = 0;

  var sendInterval = setInterval(
      function(){
        numberSent++;

        var fd = fs.createReadStream(__dirname + '/sizes/' + number);

        request(fd, function(){
          numberReceived++;
          var performance = 100 / (numberSent - numberReceived + 1);
          //console.log("Performance: "  + performance + "%");
        });

        console.log(number + ": " + numberSent + " - " + numberReceived);
      },
      config.captureInterval);
  return sendInterval;
};


var number = 0;

var thisInterval;

function makeRound(){

  console.log("CAMBIO DE RONDA: " + number);

  var first = true;

  var waitInterval = setInterval(function(){

    if(first){
      first = false;
      var mem = monitor.getProcMem(process.pid);
      fs.appendFileSync('mem_data.csv', mem + '\n');
    }

    clearInterval(thisInterval);

    console.log(numberSent,numberReceived);
    if(numberSent != numberReceived) return;

    clearInterval(waitInterval);
    thisInterval = startTest(number);
    number++;

    if(number > 14) return;

    setTimeout(makeRound, 3 * 60 * 1000);
  },1*1000);

}

makeRound();





