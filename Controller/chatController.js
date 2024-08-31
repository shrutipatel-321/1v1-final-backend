const Chat=require('../Models/Chat.js');
const Game=require('../Models/game.js');
const User=require('../Models/user.js');
const mongoose=require('mongoose');
const catchAsync = require('../utils/catchAsync.js');
exports.createChat=async({ownerId,userId,gameId})=>{
    if (!mongoose.Types.ObjectId.isValid(gameId)) {
        console.log("game");
        return {};
        
      }
    
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      console.log("userId",userId);
        return {};
        
      }

    if (!mongoose.Types.ObjectId.isValid(ownerId)) {
      console.log("ownerId");
        return {};
        
      }
      //console.log("Nooooo");
    try{
       const gid = new mongoose.Types.ObjectId(gameId);
       const uid = new mongoose.Types.ObjectId(ownerId);
       const pid= new mongoose.Types.ObjectId(userId);
       const newChat=new Chat({
        gameId:gid,
        ownerId:uid,
        particpantId:pid
       });
       //console.log("YES",newChat);
       await newChat.save()
       const nameg=await Game.findById(gid).select('name -_id');
       const namep=await User.findById(pid).select('username -_id');
       //console.log(name);
       if(!newChat)
        throw new Error('Chat not created');
     return {status:'success',nameg,namep};
    }catch(err){
        //console.log(err);
       return {};
    }
}
exports.getAllChat=catchAsync(async(req,res,next)=>{
   const {ownerId}=req.params;
   //console.log(ownerId);
   const matchingChats = await Chat.aggregate([
    {
      $lookup: {
        from: 'games',
        localField: 'gameId',
        foreignField: '_id',
        as: 'gameDetails'
      }
    },
    {
      $unwind: '$gameDetails'
    },
    {
      $match: {
        ownerId: new mongoose.Types.ObjectId(ownerId),
        'gameDetails.status':"waiting",
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: 'particpantId',
        foreignField: '_id',
        as: 'userDetails'
      }
    },
    {
      $unwind: '$userDetails'
    },
    {
      $project: {
        ownerId: 1,
        particpantId: 1,
        gameId: 1,
       // message: 1,
        //'gameDetails.status': 1,
        nameg:'$gameDetails.name',
        namep: '$userDetails.username' // Project game status to verify
      }
    }
  ]);
  //console.log(matchingChats);
  res.status(200).json({
    status:'success',
    matchingChats
  });
})
exports.joinGame=async({toUserId,userId,gameId})=>{
    

  if (!mongoose.Types.ObjectId.isValid(gameId)) {
     //console.log("gameId");
      return {};
      
    }
  
  //.log("Yes");
    // Convert to ObjectId
    try{
    const gid = new mongoose.Types.ObjectId(gameId);
   
   
    const game = await Game.findById(gid);
    //console.log(game);
    //console.log("No",updatedGame);
    if (!game) {
      return {};
    }
    const participantsAsString = game.participanst.map(id => id.toString());
    //console.log(participantsAsString);
    return {status:'success',participanst:participantsAsString};
  }catch(err){
      return {};
  }
  
}
