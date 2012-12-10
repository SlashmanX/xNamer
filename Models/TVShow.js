var	mongoose	=	require('mongoose');
var	Schema		=	mongoose.Schema;

var	tvShowSchema = new Schema({
    fileName: {type: String, unique: true},
    actualName: {type: String},
    id: Number
});

module.exports = mongoose.model('TVShow', tvShowSchema);
