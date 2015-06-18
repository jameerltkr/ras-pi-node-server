/* Recording model */
var mongoose = require('mongoose');
var crypto = require('crypto');
var recording_schema = mongoose.Schema({
	video_name:String,
	device_id:String,
	uploaded_on:String,
	video_file_path:String,
	//video_length:String,
	recorded_by:String,
	file_size:String
});

var Recording = mongoose.model('Recording', recording_schema);

module.exports = {
  Recording: Recording
 };