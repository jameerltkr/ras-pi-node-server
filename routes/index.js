// routing file for api implementation
// client can request on this api to access the resources
var User = require('../app/db/user.js');    // user model
var uuid = require('node-uuid');   // for random user key generation
var fs = require("fs"); //Load the filesystem module
var jwt    = require('jsonwebtoken'); // used to create, sign, and verify tokens
var crypto = require('crypto');     // cryptography module to generate random number
var Device = require('../app/db/device_details');     //device model
var Recording = require('../app/db/recording_details');     // recording model
// initializing logger to write logs in file
var logger = require('../app/logs/logger');     // logger code
//initializing variables to be used in camera starting and stopping
// test variables
// initialized for testing purpose
var status='';
var playing='';
var cam_id='';
var user_id='';
// --------------End of testing variables----------
// below function is calling from app.js file
module.exports=function(app,user,socket,multer){

/* serves main page */
 app.get("/", function(req, res) {

    logger.info('GET request for home page');
    logger.info('Rendering index.jade page on browser.');
    res.render('index.jade',{title:'Raspberry PI app'});
 });
 //getting post request from user
 app.post('/',function(req,res){
    logger.info('POST request for home page.');
 	//getting host header value
	//var host = req.headers['host']; 
 	//console.log('Hello');
 	//getting name from user
    logger.info('Getting "name" from POST request');
 	var username=req.body.name;
 	//console.log('Name:'+username);
 	if(username=='test'){
 		//var collection=new User.User({
 		//	id:1,
 		//	name:username
 		//});
 		//collection.save(function(err){
 		//	if(err) return err;
 		//	console.log('Saved');
 		//})
 		User.User.findOne({
 			name:'test'
 		},function(err,user){
 			console.log('User:'+user);
 		});
 		//res.location('start-camera',{user:username})
 		req.session.user=username;
 		var userid = uuid.v4();
 		req.session.userid=userid;
 		user_id=userid;
 		//console.log('Userid:'+userid);
 		res.redirect('/start-camera/');
 	}
 	else{
 		res.send(200,'You are not authorized');
 	}
 	//console.log(host+'/start-camera');
 });
 //GET start camera page
 // page for start-camera
 app.get('/start-camera',function(req,res){ 
    logger.info('--GET request for start-camera page--');
    logger.info('Checking session for null');
 	if(req.session.user==null){
        logger.info('Session is null. redirecting to index page.');
 		res.redirect('/');
 	}
 	else
 	{
        logger.info('Session is not null. Checking for devices in database');
        Device.Device.find(function(err,device){
            if(err)
            {
                logger.info('Error:'+err);
              res.send('Error occurred during getting list of devices');  
            }
            else{
                logger.info('Devices found. Rendering start-camera page with list of devices');
                res.render('start-camera',{
                    title:'Start your camera',
                    user:req.session.user,
                    devices:device
                });
            }
        });
 	}
 });

//check_camera GET
app.get('/check_camera',function(req,res){
    logger.info('--GET request for check-camera--');
	//res.send(200,req.param('location'));
    logger.info('Getting value of location from parameter');
	var location=req.param('location');
	if(location=='Select'){
		res.send(200,'Please select a location');
	}else{
		res.send(200,'ok');
	}

});

// checking whether camera is started or not
app.get('/manage_camera',function(req,res){
    logger.log('--GET request for manage_camera page--');
    logger.info('Finding all the list of devices from database');
    Device.Device.find(function(err,device){
        logger.info('Devices found and sending to view page');
        res.send({
            status:true,
            data:device
        });
    });
});

// function for starting a camera
// function to start camera
app.get('/start_camera',function(req,res){
    logger.info('--GET request for start_camera page--');
    logger.info('Getting device id from parameters');
	//console.log('Device Id:'+req.param('device_id'));
    var device_id=req.param('device_id');
    logger.info('Device ID is: '+device_id);
    logger.info('Finding devices based on '+device_id);
    Device.Device.findOne({
        device_id:device_id
    },function(err,device){
        if(err)
        { 
            logger.info('Error occurred during finding devices. '+err);
            //console.log(err);
            res.send({
            status:false,
            message:err
            });
        } else if(device.device_status==true){
            logger.info('Finding device list of which has device_status true');
            logger.info('If found then Camera is in running mode.');
            res.send({
                status:false,
                message:'Your camera is already running'
            });
        }
            else{
                logger.info('Finding list of devices which has not device_status =true');
                //
                //console.log(device);
                logger.info('Starting the camera');
                logger.info('Updating database values');
                //================
                device.device_status=true;
                device.device_playing=false;
                device.device_test=false;
                device.last_modified=Date();
                logger.info('Saving database changes');
                //console.log(Date());
                device.save(function(err){
                    if(err)
                    {
                        logger.info('Error: '+err);
                        res.send({
                        status:false,
                        message:err
                    });
                    }
                        else{
                            logger.info('Database updated and now camera is starting...');
                            res.send({
                                status:true,
                                message:'Your camera is now started!'
                            });
                        }
                });
            }
    });
    //res.send({
     //   status:'Your camera is now started!',
     //   device_id:req.param('device_id')
    //});
});
//function for stopping the camera
app.get('/stop_camera',function(req,res){
    logger.info('--GET request for stop camera--');
    logger.info('Getting device_id from parameters');
    var device_id=req.param('device_id');
    logger.info('Device id is: '+device_id)
    // checking in database
    logger.info('Finding devices in database based on '+device_id);
    Device.Device.findOne({
        device_id:device_id
    },function(err,device){
        if(err){
            logger.info('Error: '+err);
            res.send({
                status:false,
                message:err
            });
        } else if(device){
            if(device.device_status==false){
                logger.info('Device found. Checking device_status==false');
                logger.info('If found then it means Camera is already stopped.');
                res.send({
                    status:false,
                    message:'camera is already stopped.'
                });
            }else{
                logger.info('Device found on device_status=true');
                logger.info('Stopping camera');
                device.device_status=false;
                device.device_test=false;
                //device.device_playing=false;
                device.last_modified=Date();
                logger.info('Updating and saving database values');
                device.save(function(err){
                    if(err){
                        logger.info('Error: '+err);
                        res.send({
                            status:false,
                            message:'Could not update database due to: '+err
                        });
                    } else{
                        logger.info('Database saved with updated device values. camera is stopping...');
                        res.send({
                            status:true,
                            message:'Your camera is now stopped!'
                        });
                    }
                });
            }
        }
    });
});
 

 //========================================//
 //========Registering new device==========//
 // making api for register new device and 
 //generating GUID and random number for the device

 app.get('/register_new_device',function(req,res){
    logger.info('--GET request for register_new_device--');
    //console.log(Date());
 	//creating GUID for the new device
 	//GUID will be used as userid for the device
    logger.info('Generating GUID for device_id');
 	var device_id = uuid.v4();
 	//generating random number for the device
 	//random number will be used as password for the device
    logger.info('Generating random number for device password');
 	var device_password=randomNumber();
 	//store device_guid and device_password in database
    logger.info('Inserting values in model');
 	var device_collection=new Device.Device({
 		device_id:device_id,
 		device_password:device_password,
        device_status:false,
        device_playing:false,
        device_test:false,
        created_date:Date(),
        last_modified:Date()
 	});
    logger.info('Saving model in database');
 	device_collection.save(function(err){
 		if(err)
        {
            logger.info('Error: '+err);
            res.send('device_id or device_password generation failed. Please try again.');
        }
 		else{
            logger.info('Database saved with updated values');
 			res.send({
 				device_id:device_id,
 				device_password:device_password
 			});
 		}
 	});
 	//Device.Device.find(function(err,data){
 	//	res.send(data);
 	//});
 	//res.json('Register new device   '+device_password+' userid: '+device_guid);
 });

 // Auth_API for the device authentication
 // in this, device will get a different 
 //and unique Token for every authentication
 app.post('/authentication',function(req,res){
    logger.info('--POST request for authentication page--');
    logger.info('Finding device in database which has device id '+req.body.device_id);
 	Device.Device.findOne({
        device_id:req.body.device_id
    },function(err,device){
        if(err) {
            logger.info('Error: '+err);
            res.send({
                success:false,
                message:err
            });
        }
        if(!device){
            logger.info('Device not found in database');
            res.json({success:false,message:'Authentication failed. Device not found.'});
        }
        else if(device){
            logger.info('Device found in database with device id '+device.device_id);
            logger.info('Matching device_password in database');
            if(device.device_password!=req.body.device_password){
                logger.info('Password does not match');
                logger.info('Sending false response to device.');
                res.json({ success: false, message: 'Authentication failed. Wrong password.' });
            }
            else{
                logger.info('Password matched and device found');
                // if device is found and password is right
                // create a token
                logger.info('Creating jSonWebToken');
                //////var token = jwt.sign({device.device_id:device.device_id}, app.get('superSecret'));
                var token = jwt.sign({device:device.device_id}, app.get('superSecret'), {
                //expiresInMinutes: 1 // expires in 1 minute  # Enable if testing
                expiresInMinutes: 1440 // expires in 24 hours
                });
                logger.info('JSONWEBTOKEN created. Sending to the client');
                //=======================================
                // Refreshing the view page to reload the new device_id
                // New device is added. so have to refresh the web page
                // so that user can see the new device on view page.
                logger.info('Reloading view page so that user can aware of new device');
                socket.emit('reload','New device added');
                //=======================================
                // return the information including token as JSON
                res.json({
                    success: true,
                    token: token
                });
            }
        }
    });
 });

 // authentication token which is received by client
 app.use(function(req,res,next){
    logger.info('Authenticating device with given token');
    var token=req.body.token||req.query.token||req.headers['x-access-token'];
    if(token){
        logger.info('Token found and verifying...');
        //setTimeout(function(){
            jwt.verify(token,app.get('superSecret'),function(err,decoded){
            if(err) {
                logger.info('Error occurred: '+err);
                //console.log(err.message);
                return res.json({
                    success:false,
                    token:err.message
                });
            }
            else{
                // token verified

                //var token_exp = decoded.exp;
                //var now = moment().unix().valueOf();
                //if((token_exp - now) <10) {
                //       var newToken = jwt.sign({device:decoded.device.device_id}, app.get('superSecret'), {
                //        //expiresInMinutes: 1 // expires in 1 minute  # Enable if testing
                //        expiresInMinutes: 1440 // expires in 24 hours
                //    });
                //    if(newToken) {
                //        res.send({
                //            status:false,

                //        })
                //    }
                //    else{

                 //   }
                //}else{
                    logger.info('Token verified. Now client can access the information');
                    req.decode=decoded;
                    next();
                //}



                /*  Saving the time of each request in session devicewise
                for checking that 
                request is arriving in every 5 seconds.
                If not, then make sure that device is now working properly
                and change the value of variables of device in database.
                (That is stop the camera.)
                  */
                 
                  // code to store the device id in session
                  // match the device id and timespan with previous.
                  // if timespan is morethan 10 second and device id is same then
                  // it means that device had stopped working for 5 sec
                  // and sholud be disabled.
                //   ---End
                
            }
        });
        //},1*60);
    }
    else{
        logger.info('No token provided in GET');
        return res.status(403).send({
            success:false,
            message:'no token provided'
        });
    }
 });

 // function to get random number
 function randomNumber(strong) {
   var gen = (strong ? crypto.randomBytes : crypto.pseudoRandomBytes);
   return gen(4).readUInt32BE(0, true);
 }



 // api for GET request from client
 //getting ID from client on GET
 app.get("/:id", function(req, res) { 
    logger.info('--GET request for home API--');
 	//checking for new device
    logger.info('Getting device_id');
    var device_id=req.param('id');
    logger.info('Finding device in database with device id ' + device_id);
    Device.Device.findOne({
        device_id:device_id
    },function(err,device){
        if(err){
            logger.info('Error: '+err);
            res.send({
                status:false,
                message:err
            });
        } else if(device){
            logger.info('Device found.');
            //printing values which are sending to client
            console.log('===========================================');
            console.log(Date());
            console.log('device_id: '+device.device_id);
            console.log('device_status: '+device.device_status);
            console.log('device_playing: '+device.device_playing);
            console.log('device_test: '+device.device_test);
            console.log('===========================================');
            //end of sending values
            logger.info('Sending data to client');
            res.send({
                device_id:device.device_id,
                device_status:device.device_status,
                device_playing:device.device_playing,
                device_test:device.device_test
            });
        }
    });
 });
// API for changing device_playing from False to True.
// When client request for this API then change the playing of device
// to True
app.post('/change_device_playing',function(req,res){
    logger.info('--POST request for change_device_playing--');
    logger.info('Getting device_id from POST headers');
    // getting device_id
    var device_id=req.body.device_id;
    //getting device_playing
    logger.info('Getting device_playing value from POST header');
    var device_playing=req.body.device_playing;
    // finding device based on device_id
    logger.info('Searching for device in database based on device__id');
    Device.Device.findOne({
        device_id:device_id
    },function(err,device){
        if(err){
            logger.info(err);
            res.send({
                status:false,
                message:'Error'
            });
        } else if(device){
            logger.info('Device found in database');
            logger.info('Changing the status of device id');
            // checkng for True or False 
            logger.info('Checking whether device_playing is True or False');
            //console.log(device_playing);
            if(device_playing=='False'){
                logger.info('Device playing found False. Make it True.');
                device.device_playing=true;
                logger.info('Updating database');
                device.save(function(err){
                    if(err){
                        logger.info('Error occurred while updating database');
                        res.send({
                            status:false,
                            message:'Could not update'
                        });
                    }else{
                        logger.info('Database updated');
                        res.send({
                            status:true,
                            message:'Updated'
                        });
                    }
                });
            }
        }
    });
});
//calling API for closing all the status
// disabling all the variable on client request
app.post('/close_device',function(req,res){
    //console.log('Close_device request');
    logger.info('--POST request for close_device--');
    logger.info('Getting device_id from POST headers');
    // getting device_id
    var device_id=req.body.device_id;
    //getting close_device
    //logger.info('Getting device_playing from POST headers');
    //var device_playing=req.body.device_playing;
    // finding device based on device_id
    logger.info('Searching for device in database based on device_id');
    Device.Device.findOne({
        device_id:device_id
    },function(err,device){
        if(err){
            logger.info(err);
            res.send({
                status:false,
                message:'Error'
            });
        } else if(device){
            logger.info('Device found in database');
            logger.info('Changing the status of all the variables to False.');
			logger.info('Stopping the camera');
            // checkng for True or False 
            //logger.info('Checking whether device_playing is True or False');
            //console.log(device_playing);
            //if(device_playing=='True'){
                //logger.info('device_playing found True. Make it False.');
                // disabling all the variable
                // make sure that camera is topped 
                // and variables value should be false
                logger.info('Modifying all the variables in database');
                logger.info('Making all the variables disable');
				device.device_status=false;
                device.device_status=false;
                device.device_test=false;
                device.device_playing=false;
                device.last_modified=Date();
                logger.info('Save the database');
                device.save(function(err){
                    if(err){
                        logger.info('Error while updating database');
                        res.send({
                            status:false,
                            message:'Cound not update'
                        });
                    } else {
                        //firing event to view page to reload the page
                        // emitting socket event----------
                        socket.emit('reload','Camera stopped from device.');
                        //-----------End of socket emitting event
                        logger.info('Database updated.');
                        res.send({
                            status:true,
                            message:'Updated'
                        });
                    }
                });
            //} 
        }
    });
})
// starting to upload file
// API for upload the video file from client to server in POST
app.post('/upload_file',multer({ dest: './files/',
    rename: function (fieldname, filename, req, res) {
        logger.info('upload_file API called from device');
        //----------------------------------------
        // extracting date month and year
        var d=new Date();
        var month = new Array();
        month[0] = "January";
        month[1] = "February";
        month[2] = "March";
        month[3] = "April";
        month[4] = "May";
        month[5] = "June";
        month[6] = "July";
        month[7] = "August";
        month[8] = "September";
        month[9] = "October";
        month[10] = "November";
        month[11] = "December";
        var n = month[d.getMonth()];
        var date = d.getDate() +''+ n +''+d.getFullYear();
        //===============end of extraction date
        var device_id=req.param('device_id');

        var renamed_file_name = device_id+'_'+date + '_' + d.getTime();

        //logger.info(renamed_file_name + ' is starting to upload...');
        //var user_id=req.body.user_id || req.query.user_id;
        logger.info('Renaming the file from '+filename + ' to ' + renamed_file_name);
        return renamed_file_name;
    },
    onFileUploadStart: function (file) {
        logger.info(file.fieldname + ' is starting to upload...');
        //var renamed_file_name=
    },
    onFileUploadData: function(file, data, req, res) {
        var device_id=req.param('device_id');
        //console.log('Uploading the file.');
        //---------------
        var msg='Please do not start the camera which has camera_id "' + device_id + '" because video is uploading to the server. It will take some moments...';
        // Calling socket method so that user can know about status of uploading
        socket.emit('file is uploading',msg);
    },
    onFileUploadComplete: function (file, req, res) {
        //initializing database model
        logger.info('Initializing database model to store the information of uploaded video in database');
        // store the video name in database along with device_id
        // getting device_id from POST request
        logger.info('Getting device_id');
        var device_id=req.param('device_id');
        var msg = 'Video is uploaded for device_id "'+ device_id + '"';
        socket.emit('video uploaded',msg);
        //logger.info('Device id is: '+device_id);
        //logger.info('Finding device in database based on '+device_id);

        // getting file size
        var stats = fs.statSync(file.path);
        var fileSizeInBytes = stats["size"]
        //Convert the file size to megabytes (optional)
        var fileSizeInMegabytes = fileSizeInBytes / 1048576 + ' MB';
        //console.log(fileSizeInMegabytes);

        var collection=new Recording.Recording({
            video_name:file.name,
            device_id:device_id,
            uploaded_on:Date(),
            video_file_path:file.path,
            //recorded_by:
            file_size:fileSizeInMegabytes
        });
        // updating device variables in database
        // saving name of video in database along with device id
        logger.info('Saving ' + file.name + ' in database along with device_id');

        collection.save(function(err){
            if(err){
                logger.info(err);
            }else{
                logger.info('Database updated.');
            }
        });

        logger.info(file.fieldname + ' uploaded to ' + file.path);
        done=true;
    },
    onError : function(err, next) {
        // emiiting error event so that user can know that
        // error is occurred while uploading the file
        socket.emit('file uploading error',err);
        res.send('Error while uploading the file');
        next(err);
    }
}),function(req,res){
    res.send('File uploaded successfully');
});



};  


//end of module.exports


//===============================================//
//=================End of Code===================//
//===============================================//