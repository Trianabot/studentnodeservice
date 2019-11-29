const mongoose=require('mongoose');

const Schema=mongoose.Schema;

const categoryDatab=new Schema({
   type:String,
   discription:String, 
    CreatedOn: {
        type: Date,
        default: Date.now
    },
    UpdatedOn: {
        type: Date,
        default: Date.now
    },
    sub_type:String,
    topics:[],    
});



module.exports=mongoose.model('categoryData',categoryDatab);