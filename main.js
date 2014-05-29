var http = require('http');
var fs = require('fs');
var config = require('./config');

var convert = require('./convertImage');

function request(data, callback) {

  // An object of options to indicate where to post to
  var post_options = {
      host: config.rushHost || '192.168.1.84',
      port: config.rushUnsecPort || 5001,
      method: 'POST',
      headers: {
          'Content-Type': 'application/json',
          'X-relayer-host' : config.endpoint + ':' +  config.endpointPort
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

  post_req.write(JSON.stringify({image : data}));
  post_req.end();

};

var currentImage = 0;
var availableImages = [];

var numberSent = 0;
var numberReceived = 0;

fs.readdir(__dirname + '/img', function(err, files){
    availableImages = files;
    startTest();
});

function startTest(){
  var sendInterval = setInterval(
    function(){

      numberSent++;
      var thisImage = availableImages[currentImage];
      currentImage = (currentImage + 1) % availableImages.length;
      var toB64 = convert.encode(__dirname + '/img/' + thisImage);

      //console.log("Succesfuly converted: " + thisImage);

      request(toB64, function(){
        numberReceived++;
        var performance = 100 / (numberSent - numberReceived + 1);
        console.log("Performance: "  + performance + "%");
      });

      console.log(numberSent + " - " + numberReceived);

    },
    config.captureInterval);
};







