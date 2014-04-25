var http = require('http');
var fs = require('fs');
var config = require('./config');

var convert = require('./converImage');

function request(data, callback) {

  // An object of options to indicate where to post to
  var post_options = {
      host: config.host || 192.168.1.84,
      port: config.port || 5001,
      method: 'POST',
      headers: {
          'Content-Type': 'application/json',
          'X-relayer-host' : config.endpoint
      }
  };

  // Set up the request
  var post_req = http.request(post_options, function(res) {

    res.on('end', function(){
      callback();
    });

  });

  post_req.on('error', function(e) {
    console.log('problem with request: ' + e.message);
  });

  post_req.write({image : data});
  post_req.end();

};

var currentImage = 0;
var availableImages = config.images;

var numberSent = 0;
var numberReceived = 0;

var sendInterval = setInterval(
  function(){

    var thisImage = availableImages[currentImage];
    currentImage = (currentImage + 1) % availableImages.length;
    convertImage(__dirname + thisImage);
  },
  config.interval);






