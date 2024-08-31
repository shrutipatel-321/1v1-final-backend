const mongoose=require('mongoose');
const Schema = mongoose.Schema;
const validator=require('validator');
const question=require('./question');
const groupSchema=new Schema({
 game_id:{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Game',
    required: true
 },
 status:{
        type: String,
        enum: ['waiting', 'active', 'completed'],
        required: true,
        default:'waiting',
  },
 QuestionArr:[
    {
      type:mongoose.Schema.Types.ObjectId,
      ref:'Question',
    }
    ],
  winner:{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },correctAns:[
    {
      type:String,
    }
  ],
  participants:[
    {
     type:mongoose.Schema.Types.ObjectId,
     ref: 'User',
    }
  ],
  score:{
    type:Number,
    default:-1,
  },
});
groupSchema.pre('save', async function(next) {
    const num=5;
    try{
    const randomQuestions = await question.aggregate([{ $sample: { size: num } }]);
    const questionIds=randomQuestions.map((q)=>q._id);
    this.QuestionArr=questionIds;
    //this.participanst=[this.owner];
    this.status='active';
    this.winner=this.participants[0];
    this.correctAns=randomQuestions.map((q)=>q.correctOption);
    next();
    }
    catch(err){
      next(err);
    }
});

  const Group = mongoose.model('Group', groupSchema);
  module.exports = Group;