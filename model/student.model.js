const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const Schema = mongoose.Schema;

let userRegistrationSchema = new Schema({
    userId: {
        type: String,
        required: true
    },
    userName: {
        type: String,
        required: true
    },
    emailId : {
        type: String,
        required: true,
        unique: true
    },
    isProfileImage:{
        type:Boolean,
        default:false,
        required:false
    },
    gender: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    city: {
        type: String,
        required: true
    },
    ProfileImage:{
        type:String,
    },
    isVerified:{
        type: Boolean,
        default: false
    },
    isActive:{
        type: Boolean,
        required: false
    }, 
    isAdmin:{
        type: Boolean,
        required: false
    },
    isBlocked:{
        type: Boolean,
        required: false
    },   
    isDeleted:{
        type: Boolean,
        required: false,
        default: false
    },  
    sysCreatedBy: {
        type: String,
        required: false
    },
    sysUpdatedBy: {
        type: String,
        required: false
    },
    sysCreatedDate: {
        type: Number,
        required: false
    },
    sysUpdatedDate: {
        type: Number,
        required: false
    },
});

userRegistrationSchema.plugin(uniqueValidator);
module.exports = mongoose.model('student_info',userRegistrationSchema);