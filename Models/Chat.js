const mongoose=require('mongoose');
const Schema = mongoose.Schema;

const chatSchema=new Schema({
  gameId:{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Game',
    required: true
  },
  ownerId:{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  particpantId:{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
});

const Chat = mongoose.model('Chat', chatSchema);
module.exports = Chat;