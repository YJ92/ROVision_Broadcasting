var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var fs = require('fs');
var https = require('https');
var http = require('http');

var routes = require('./routes/index');
var users = require('./routes/users');


var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);

app.use('/users', users);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;

// https
var options = {
    key: fs.readFileSync('/cert/ssl.key'),
    cert: fs.readFileSync('/cert/ssl.crt'),
    ca : fs.readFileSync('/cert/sub.class1.server.ca.pem')
};

var server = https.createServer(options, app).listen('443', function(){
  console.log("Secure Express server listening on port 443");
});
//var server = http.createServer(app).listen(80,function(){
//	console.log("Server is running");
//});

// Socket io

var broadcasting_rooms = [];

var io = require('socket.io').listen(server);

io.on('connection',function(socket){

    socket.on('makeRoom',function(data){
        socket.join(data);
        //socket.broadcast.to(data).emit('makeRoom',data);
        broadcasting_rooms.push(data);
        io.sockets.in(data).emit('makeRoom',data);
        io.sockets.in("Index_user").emit('NewRoom',data);
        var clients = io.sockets.adapter.rooms[data];
        console.log(clients);
    });

    socket.on('Index_user',function(data){
      socket.emit('Update_rooms',broadcasting_rooms);
      socket.join(data);
    });

   socket.on('Message',function(data){
    io.sockets.in(data.local_id).emit('Message',data);
   });

   socket.on('dis_connect',function(data){
      var delete_room = FindDeletingId(data);
      if(delete_room != null){
          broadcasting_rooms.splice(delete_room,1);
          io.sockets.in(data).emit("Message","stop");
          io.sockets.in("Index_user").emit("Delete_room",data);
      }
   });

   socket.on('remote_user',function(data){
      socket.join(data.local_id);
      var clients = io.sockets.adapter.rooms[data.local_id];
        console.log(clients);
   });

   function FindDeletingId(id){
      for(i=0;i<broadcasting_rooms.length;i++){
        if(broadcasting_rooms[i] == id)
          return i;
      }
      return null;
    }
});
