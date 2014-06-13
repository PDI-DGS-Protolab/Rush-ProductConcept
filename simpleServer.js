var http = require('http');

http.createServer(function(request,response){

 var data = "";
 response.writeHead(200);

 request.on('data',function(chunk){
  data +=chunk;
 });


 request.on('end', function(){
  response.end();
 });

}).listen(80);
