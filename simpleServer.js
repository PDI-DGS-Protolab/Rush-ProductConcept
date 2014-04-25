var http = require('http');
var config = require('./config');

var serverListener = function(connectedCallback, dataCallback, port) {
  'use strict';

  var srv = http.createServer(function(req, res) {
    var content = '', headers = req.headers, method = req.method, url = req.url;

    var payload = 'blblblblblblblblblblbblblblblblblblblblblbblblblblblblblblblblbblblblblblblblblblblbblblblblblblblblblblbblblblblblblblblblblbblblblblblblblblblblbblblblblblblblblblblbblblblblblblblblblblbblblblblblblblblblblb'

    content += payload;
    req.on('data', function(chunk) {
      content += chunk;
    });

    req.on('end', function() {
      setTimeout(function(){
        res.writeHead(200, headers);
        res.end(content);
        dataCallback(method, headers, url, content);
      }, 200);
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
