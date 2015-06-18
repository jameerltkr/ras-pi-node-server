/* User model */
var mongoose = require('mongoose');
var crypto = require('crypto');
var user_schema = mongoose.Schema({
	id:Number,
	name:String
});

var User = mongoose.model('User', user_schema);

module.exports = {
  User: User
 };