const mongoose=require('mongoose');
const Schema = mongoose.Schema;
const bcrypt = require('bcrypt');
const validator=require('validator');
const questionSchema=new Schema({
    question:{
        type:String,
        required:[true,'A question must be there'],
        minlength:[2,'Question  must be min of 2 charecters'],
        unique:true,
        //validator:validator.isAlpha,
    },
    optionA: {
    type: String,
    required: [true,"please enter option A"],
    //unique: true,
    minlength:[1,'Options must be min of 1 charecter'],
  },
  optionB: {
    type: String,
    required: [true,"please enter option B"],
    minlength:[1,'Options must be min of 1 charecter'],
  },
  optionC: {
    type: String,
    required: [true,"please enter option C"],
    minlength:[1,'Options must be min of 1 charecter'],
  },
  optionD: {
    type: String,
    required: [true,"please enter option D"],
    minlength:[1,'Options must be min of 1 charecter'],
  },
  correctOption:{
    type:String,
    enum:['optionA','optionB','optionC','optionD'],
    default:'optionB',
  },
  createdBy:{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
});
const Question = mongoose.model('Question', questionSchema);
module.exports = Question;

