/* Device model */
var mongoose = require('mongoose');
var crypto = require('crypto');
var device_schema = mongoose.Schema({
	device_id:String,
	device_password:String,
	device_status:Boolean,
	device_playing:Boolean,
	device_test:Boolean,
	created_date:Date,
	last_modified:Date
});

var Device = mongoose.model('Device', device_schema);

module.exports = {
  Device: Device
 };