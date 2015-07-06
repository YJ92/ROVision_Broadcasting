var http = require('http');
var fs = require('fs');

var server = http.createServer(function(req,res){
	fs.readFile('index.html',function(err,data){
		res.writeHead(200,{'Content-Type':'text/html'});
		res.end(data);
	});
});

server.listen(52273,function(){
	console.log('Server is running');
});