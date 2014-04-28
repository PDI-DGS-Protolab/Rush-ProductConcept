var http = require('http');
var config = require('./config');
var fs = require('fs');

var serverListener = function(connectedCallback, dataCallback, port) {
  'use strict';

  var srv = http.createServer(function(req, res) {
    var content = '', headers = req.headers, method = req.method, url = req.url;

    var path = __dirname + '/' + Math.random();

    var fd = fs.createWriteStream(path);

    req.on('data', function(chunk) {
      content += chunk;
      fd.write(chunk);
    });

    req.on('end', function() {

      fd.end();
      fs.unlink(path);

      res.writeHead(200, headers);
      res.end('OK');
      dataCallback(method, headers, url, content);
    });

    req.on('error', function(err){
      console.log(err);
    });

    //srv.on('close', function () {
    //    console.log('Server closed...');
    //});
  }).listen(port || config.targetServer.port, connectedCallback);

  srv.on('error', function() {
    dataCallback(null);
  });

  return srv;

};

serverListener(function() {
  console.log('conectado');
}, function() {}, 9000);
