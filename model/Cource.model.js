const mongoose = require('mongoose');

const Schema = mongoose.Schema;



const subjectsShema = new Schema({
    subject_id: String,
    subject: String,
    subjectImg: String,
    CreatedOn: {
        type: Date,
        default: Date.now
    },
    UpdatedOn: {
        type: Date,
        default: Date.now
    }
});


const courseCollection = new Schema({
    course: String,
    course_id: String,
    courseImg: String,
    CreatedOn: {
        type: Date,
        default: Date.now
    },
    UpdatedOn: {
        type: Date,
        default: Date.now
    },
    subjects: [subjectsShema]
});



module.exports = mongoose.model('course_collection', courseCollection);
   