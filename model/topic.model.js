const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const topicCollection = new Schema({
    //subject:String,
    subject_id:String,
    topic: String,
    topic_id: String,
    topicImg:String,
    CreatedOn: {
        type: Date,
        default: Date.now
    },
    UpdatedOn: {
        type: Date,
        default: Date.now
    }
});



module.exports = mongoose.model('topic_collection', topicCollection);