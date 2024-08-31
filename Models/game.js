const mongoose=require('mongoose');
const Schema = mongoose.Schema;
const validator=require('validator');
const question=require('./question');
const gameSchema=new Schema({
    owner:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status:{
        type: String,
        enum: ['waiting', 'active', 'completed'],
        required: true,
        default:'waiting',
    },
    
  participanst:[
    {
      type:mongoose.Schema.Types.ObjectId,
      ref:'User',
    }
  ],
  name:{
    type:String,
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true // This option will automatically add `createdAt` and `updatedAt` fields
});
//document method

//instance method

const Game = mongoose.model('Game', gameSchema);
module.exports = Game;


//owner-667bc800f30999af19ab15fa  id-667be9e713e595fb94ca422d