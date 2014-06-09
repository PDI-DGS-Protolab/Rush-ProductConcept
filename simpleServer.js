var express = require('express');
var fs = require('fs');
var app = express();

app.post('/', function(req, res){
    console.log('POST /');
    res.end(200);
});

port = 9000;
app.listen(port);
console.log('Listening at http://localhost:' + port)