//initializing packages which are required in this project----------
 var express = require("express");
 var app = express();
 var http=require('http').Server(app);
 var socket=require('socket.io')(http);
 var fs=require('fs');
 var multer  = require('multer');
 var path = require('path');
 var bodyParser = require('body-parser');
 var session = require('client-sessions');
 var mongoose = require('mongoose');
 var port = process.env.PORT || 3000;

 var config=require('./app/db/config');     //calling configuration file
 //initializing database user file
 var user=require('./app/db/user');

 //database
 mongoose.connect(config.database,function(){
    //mongoose.connection.db.dropDatabase();        drop database
 });     //connect to database
 app.set('superSecret', config.secret); // secret variable

 //setting the views 
 app.set('views', path.join(__dirname, '/app/server/views'));
 app.set('view engine', 'jade');

 //setting public path where js and css will be kept
 app.use(require('stylus').middleware(path.join(__dirname, '/app/public')));
 app.use(express.static(path.join(__dirname, '/app/public')));

 //use body parser for getting the parameter values
 app.use( bodyParser.json() );       // to support JSON-encoded bodies
 app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
   extended: true
 })); 

 //setting session
 app.use(session({
  cookieName: 'session',
  secret: 'ras_pi_node_server_session',
  duration: 30 * 60 * 1000,
  activeDuration: 5 * 60 * 1000,
}));

 // requiring multer_upload.js file which is used to get the posted file from the client
 //require('./upload/multer_upload')(app,multer);

 // implementing routing api through which client can request and upload the file
 require('./routes/index')(app,user,socket,multer);

 // starting the server for listening on PORT whatever
 http.listen(port, function() {
   console.log("Server is listening on " + port);
 });