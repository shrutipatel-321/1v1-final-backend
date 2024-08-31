const catchAsync = require("../utils/catchAsync");
const AppError = require('../utils/error');
const Game=require('../Models/game');
const { ObjectId } = require('mongodb');
const mongoose = require('mongoose');
const pusher =require('../pusherConfig');
const User=require('../Models/user.js');
const Group=require('../Models/Group');
const socketSetup = require('../socket.js');
const { io, users } = socketSetup();
exports.createGame=catchAsync(async(req,res,next)=>{

    let {user_id,gamename}=req.body;
    let userId=new mongoose.Types.ObjectId(user_id);
    user_id = user_id.replace(/^"|"$/g, '');
    //console.log(req.body);
    const newGame=new Game({
        owner:userId,
        //participants:userId,
        name:gamename,
    });
    //console.log(userId);
    
    const username = await User.findById(userId).select('username -_id');
    console.log(username);
    
    await newGame.save();
    //console.log(newGame);
    //console.log("Yes");
    const game={
      _id:newGame._id,
      owner:newGame.owner,
      name:newGame.name,
      ownerName:username.username
    };
    //console.log("YES");
    //pusher.trigger('public-game-channel', 'new-game', { game });
    console.log(!io);
    io.emit('game-created',{
     game:game,
     owner:user_id,
    });
    //console.log(newGame);
    res.status(200).json({
        status:'sucess',
        data:{
           game: newGame,
        }
    });
    //next();
    
});
// exports.joinLobby=async (game_id,user_id)=>{
//     //let{game_id,user_id}=req.params;
//     const gid=new mongoose.Types.ObjectId(game_id);
//     const uid=new mongoose.Types.ObjectId(user_id);
    
    
//     if(!updatedGame){
//       res.status(200).json({
//         status:'faliure',
//       });
//     }
    
    
//     res.status(200).json({
//       status:'success',
//     });
// };
exports.joinGame=async({toUserId,userId,gameId})=>{
    

    if (!mongoose.Types.ObjectId.isValid(gameId)) {
       console.log("gameId");
        return {};
        
      }
    
    //.log("Yes");
      // Convert to ObjectId
      try{
      const gid = new mongoose.Types.ObjectId(gameId);
     
     
      const game = await Game.findById(gid);
      //console.log("No",updatedGame);
      if (!game) {
        return {};
      }
      const participantsAsString = game.participanst.map(id => id.toString());
      return {status:'success',participanst:participantsAsString};
    }catch(err){
        return {};
    }
    
}
exports.getGame=catchAsync(async(req,res,next)=>{ 
    let gid=req.params.id;
    
    gid=new mongoose.Types.ObjectId(gid);
    console.log(gid);
    //console.log(gid);
    //const game=await Game.find({status: 'waiting',owner:{$ne:gid}}).select('_id owner');
    const gameAvailable= await Game.aggregate([
      { $match: { status: 'waiting'} },
      {
        $lookup: {
          from: 'users',
          localField: 'owner',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $project: {
          _id: 1,
          owner: 1,
          status: 1,
          name:1,
          ownerName: '$user.username'
        }
      }
    ]);
    if(!gameAvailable)
        next(new AppError('No game available',404));
    //console.log(gameAvailable,"NOOOOO");
    res.status(200).json({
        status:'sucess',
        game:gameAvailable,

    });

});
exports.getQusetions=catchAsync(async(req,res,next)=>{

    const {index,game_id,user_id}=req.params;
    
    //var score=0;
    console.log(index,game_id);
    const question=await Group.findById(game_id,"QuestionArr").populate("QuestionArr");
    console.log(question);

    if(!question)
        return next(new AppError("Game id invalid",400));

    if(!index ||index>=question.length||index<0)
        return next(new AppError("Invalid index",400));

    const curr=question.QuestionArr[index];
    console.log(question.length);
    // const room = io.sockets.adapter.rooms.get(user_id);
    // console.log(room.size && "NO");
    // io.to(user_id).emit('get-question',{
    //   //question:{
    //     question:curr.question,
    //     option:[curr.optionA,curr.optionB,curr.optionC,curr.optionD],
    //   //}
    // });

    res.status(200).json({
        status:"sucess",
        question:{
        question:curr.question,
        option:[curr.optionA,curr.optionB,curr.optionC,curr.optionD],
      }
    })
});
function shuffleArrayfunction(array) {
  for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}
async function name(id){
  id= new mongoose.Types.ObjectId(id);
  const username=await User.findById(id).select('username -_id').lean();
  return username.username;
}
exports.formGroup=catchAsync(async(req,res,next)=>{
     
  
    const { game_id } = req.params;
    const result = await Game.findById(game_id).select('participanst -_id').lean();
    const response=await Game.updateOne(
      {_id :game_id},
      {$set: {status:'active'}}
    );
    const participanst = result.participanst;

    if (!participanst || participanst.length === 0) {
      return next(new AppError("Group cannot be formed", 400));
    }

    const shuffledArray = shuffleArrayfunction(participanst);

    let arrayName = shuffledArray.map((id) => name(id));
    arrayName = await Promise.all(arrayName);

    //console.log(shuffledArray, arrayName, "NOO");

    for (let i = 0; i < shuffledArray.length; i += 2) {
      const newGroup = new Group({
        game_id: game_id,
        participants: [shuffledArray[i], shuffledArray[i + 1]],
      });

      await newGroup.save();

      let p1 = shuffledArray[i].toString();
      let p2 = (i + 1 < shuffledArray.length) ? shuffledArray[i + 1].toString() : '';
      p1 = p1.replace(/^"|"$/g, '');
      p2 = p2.replace(/^"|"$/g, '');
      
      //console.log(p1,users,users[p1]);
      // const room = io.sockets.adapter.rooms.get(p1);
      //   console.log(room.size);
      if (p1) {
        io.to(p1).emit('start-game', {
          id: newGroup._id,
          userId: p2,
          username: arrayName[i + 1],
        });
      }
     
      if (p2) {
        io.to(p2).emit('start-game', {
          id: newGroup._id,
          userId: p1,
          username: arrayName[i],
        });
      }
    }
    
    res.status(200).json({
      status:'success',
    });
});
exports.checkans=catchAsync(async(req,res,next)=>{
 
    const {index,game_id}=req.params;
    let {userId,correct}=req.body;
    var score=0;
    //console.log(index,game_id);
    let gid=new mongoose.Types.ObjectId(game_id);
    const correctAns=await Group.findById(gid,"correctAns");
    //console.log(correctAns,gid);
    if(!correctAns)
        return next(new AppError("game-id invalid",404));

    if(!index ||index>=correctAns.length||index<0)
        return next(new AppError("Invalid index",404));
    
    //console.log(correct,correctAns.correctAns[index],correctAns,correct===correctAns.correctAns[index]);
    if(correct===correctAns.correctAns[index])
        score+=5;
    
    //const toSocketId = users[userId];
    //console.log(toSocketId,users,userId);
    userId=userId.replace(/^"|"$/g, '');
    io.to(userId).emit('check-ans',{
       score:score,
    });

    // pusher.trigger(`private-user-${userId}`, 'check-ans', {
    //   score,
    // });
    
    return res.status(200).json({
        status:"success",
        
    });
});
exports.finishgame=catchAsync(async(req,res,next)=>{
    let{ gameId ,newScore}=req.body;
    
    let userId=req.params.userId;
    gameId=new mongoose.Types.ObjectId(gameId);
    userId=new mongoose.Types.ObjectId(userId);
    newScore=Number(newScore);
    const game=await Group.findById(gameId);
    let wonnerId=userId;
    if(game.score!==-1 && game.score >newScore){
        wonnerId=game.winner;
    }
    // const par=await User.findById(wonnerId);
    // console.log(par);
    const won='won';
    if(game.score!==-1){
    const updatedUser = await User.findByIdAndUpdate(
      wonnerId,
      { $inc: { [won]: 1 } },
      { new: true }
    );
  }
    //console.log(userId,gameId,newScore);
    const updatedGame = await Group.findOneAndUpdate(
        { _id: gameId },
        [
          {
          $set: {
              winner: {
                $cond: {
                  if: { $eq: ['$score', -1] },
                  then: userId,
                  else: {
                    $cond: {
                      if: { $lt: ['$score', newScore] },
                      then: userId,
                      else: '$winner',
                    },
                  },
                },
              },
              status: {
                $cond: {
                  if: { $eq: ['$score', -1] }, 
                  then: '$status',
                  else: 'completed',
                },
              },
              score: {
                $cond: {
                  if: { $eq: ['$score', -1] },
                  then: newScore,
                  else: {
                    $cond: {
                      if: { $lt: ['$score', newScore] },
                      then: newScore,
                      else: '$score',
                    },
                  },
                },
              },
            },
          },
        ],
        { new: true }
  );
  if(!updatedGame)
    return next(new AppError("Invalid Game",404));
  //console.log(updatedGame);
  //console.log("finsihgame",updatedGame.status,updatedGame.score);
  //console.log(updatedGame,userId,"submission done");
  res.status(200).json({
    status:'sucess',
    game:updatedGame,
  });
       
});
exports.getplayedgames=catchAsync(async(req,res,next)=>{
  let {userId}=req.params;
  
  userId=userId.replace(/^"|"$/g, '');


  userId=new mongoose.Types.ObjectId(userId);
  //console.log(userId);
  // console.log(userId,req.params);
  // let game= await Group.find({ participants: userId });
  // //console.log("YES",game);

  // game= await Group.find({ participants: userId });
  
  //console.log(response);
  const games = await Group.aggregate([
    { $match: { participants: userId } },
    {
      $lookup: {
        from: 'users',
        localField: 'participants',
        foreignField: '_id',
        as: 'participanst_info'
      }
    },
    {
      $lookup: {
        from: 'games',
        localField: 'game_id',
        foreignField: '_id',
        as: 'game_info'
      }
    },
  
    // Unwind the game_info array
    { $unwind: '$game_info' },
    {
      $lookup: {
        from: 'users',
        localField: 'game_info.owner',
        foreignField: '_id',
        as: 'owner_info'
      }
    },
    {
      $lookup: {
        from: 'users',
        let: { winnerId: '$winner' },
        pipeline: [
          { $match: { $expr: { $eq: ['$_id', '$$winnerId'] } } },
          { $project: { _id: 0, username: 1 } }
        ],
        as: 'winner_info'
      }
    },
    {
      $addFields: {
        winner_info: {
          $cond: {
            if: { $eq: ['$score', -1] },
            then: '$owner_info',
            else: '$winner_info'
          }
        }
      }
    },
    {
      $project: {
        _id: 1,
        status: 1,
        name:'$game_info.name',
        participants: '$participanst_info.username',
        winner: { $arrayElemAt: ['$winner_info.username', 0] },
        owner: { $arrayElemAt: ['$owner_info.username', 0] }
      }
    }
  ]);
  //console.log(games,"Hi");
  res.status(200).json({
    status:'sucess',
    games:games
  });
});
exports.getGameid=catchAsync(async(req,res,next)=>{
  //console.log("Yes");
   let { game_id}=req.params;
   game_id= new mongoose.Types.ObjectId(game_id);
   //console.log(game_id);
   const game=await Game.aggregate([
    { $match: { _id: game_id } },
    {
      $lookup: {
        from: 'users',
        localField: 'participanst',
        foreignField: '_id',
        as: 'participanst'
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: 'owner',
        foreignField: '_id',
        as: 'owner'
      }
    },
    {
      $project: {
        _id: 1,
        status: 1,
        name:1,
        participants: '$participanst.username',
        //winner: '$winner.username',
        owner: {
        id: { $arrayElemAt: ['$owner._id', 0] },
        username: { $arrayElemAt: ['$owner.username', 0] }
        }
      }
    }

   ]);
  // console.log("YES",game);
   if(!game)
    next(new AppError('Game donot exits',404));
   res.status(200).json({
    status:'success',
    game :game[0],
   });
});
exports.leaderBoard=catchAsync(async(req,res,next)=>{
    //console.log("YES");
    const won='won';
    const users=await User.find({}).sort({ [won]: -1 });
    //console.log(users);
    res.status(200).json({
     status:'success',
     users
    });
});

// module.exports={
//     joinGame,
// }
// user_id:66730da1051b7ad63de47f5f
//owner_id:667bc800f30999af19ab15fa
//game-id:667db135f2e16194f9075e35