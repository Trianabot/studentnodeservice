const mongoose=require('mongoose');

const Schema=mongoose.Schema;

const sujectData=new Schema({
   VideoId:String,
   Video: String,
   OwnerId:String,
   Type:String,
    CreatedOn: {
        type: Date,
        default: Date.now
    },
    UpdatedOn: {
        type: Date,
        default: Date.now
    },    
});



module.exports=mongoose.model('subject',sujectData);
