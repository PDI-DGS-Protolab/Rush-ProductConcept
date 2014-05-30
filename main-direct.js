var http = require('http');
var fs = require('fs');
var config = require('./config');
var monitor = require('./monitor.js');

var convert = require('./convertImage');

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

  stream.pipe(post_req);


};

var startTest = function(){
    var sendInterval = setInterval(
      function(){
        numberSent++;
        var thisImage = availableImages[currentImage];
        currentImage = (currentImage + 1) % availableImages.length;

        var fd = fs.createReadStream(__dirname + '/img/' + thisImage);

        request(fd, function(){
          numberReceived++;
          var performance = 100 / (numberSent - numberReceived + 1);
          //console.log("Performance: "  + performance + "%");
        });

        var mem = monitor.getProcMem(process.pid);
        if(mem >= 40 * 1024) clearInterval(sendInterval);

        return;

      },
      200);
};

var thisInterval = setInterval(function(){
  global.gc();
  var mem = monitor.getProcMem(process.pid);
  console.log(numberSent + " - " + numberReceived + " - " + mem);
  fs.appendFileSync('mem_data.csv', numberSent + ',' + numberReceived + ',' + mem + '\n');
  if(numberReceived >= numberSent && mem < 10 * 1024) clearInterval(thisInterval);
}, 4000);

var currentImage = 0;
var availableImages = [];


fs.readdir(__dirname + '/img', function(err, files){
    availableImages = files;
    startTest();
});




