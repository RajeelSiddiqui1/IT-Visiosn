import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
    {
            post:{
                type:mongoose.Schema.Types.ObjectId,
                ref:"Post",
                required:true
            },

            user:{
                type:mongoose.Schema.Types.ObjectId,
                ref:"User",
                required:true
            },
            
            text:{
                type:String,
                required:false
            },

            parent:{
                type:mongoose.Schema.Types.ObjectId,
                ref:"Comment",
                default:null
           },

           likes:[
            {
                type:mongoose.Schema.Types.ObjectId,
                ref:"User",
            }
           ]
    },
    {
        timestamps:true
    }
)

const Comment = mongoose.model("Comment", commentSchema);

export default Comment;