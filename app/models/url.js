var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var url = Schema({
    original: String,
    short: String
});

module.exports = mongoose.model('URL', url);
