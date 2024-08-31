const express=require('express');
const app=express();
const http = require('http');
const server = http.createServer(app);
const {io,users}=require('./socket')(server);
const ratelimit=require('express-rate-limit');
require('dotenv').config();
const mongoose = require('mongoose');
const helmet=require('helmet');
const xss=require('xss-clean');
const cors = require('cors');
const Pusher = require('pusher');
const mongoSanatize=require('express-mongo-sanitize');
//const User=require('./Models/user');
const bodyParser = require('body-parser');

const {createChat}=require('./Controller/chatController');
const cookieParser = require('cookie-parser');
const authRoute=require('./routes/authRoute');
const quesRoute=require("./routes/quesRoute");
const gameRoute=require("./routes/gameRoute");
const chatRoute=require("./routes/chatRoute");
const chatController=require("./Controller/chatController");
const AppError=require('./utils/error');
const User=require('./Models/user');
const Game=require('./Models/game');
const globalErrorController=require('./Controller/errController');
const gameContoller=require('./Controller/gameController');
const pusher=require('./pusherConfig');
const Chat=require('./Models/Chat');
app.use(cors());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
//sequirity http headers
app.use(helmet());
//limit ammount of data
app.use(express.json({limit:'20Mb'}));
app.use(bodyParser.json());
console.log(users);
// const io = new Server(server,{
//   cors: {
//       origin:"http://localhost:3000",
//       methods:["GET","POST"],
//   },
// });
// //console.log(users);
// const users={};
// io.on( "connection" , async ( socket ) =>{
//   console.log('io connected sucessfully');
  
//   var userId=socket.handshake.query.userId;
//   userId = userId.replace(/^"|"$/g, '');
//   //userId=new mongoose.Types.ObjectId(socket.handshake.query.userId);
//   users[userId]=socket.id;
//   //console.log(socket.handshake.query.userId,users,userId);
  
//   socket.on('req-join', async ({ toUserId, gameId, message }) => {
//    // Clean up userId and gameId
//    toUserId = toUserId.replace(/^"|"$/g, '');
//    gameId = gameId.replace(/^"|"$/g, '');
 
//    const toSocketId = users[toUserId];
 
//    try {
//      const result = await chatController.createChat({ ownerId: toUserId, userId: userId, gameId: gameId });
 
//      if (!result || result.status !== 'success') {
//        throw new Error('Could not join group');
//      }
 
//      //console.log(toUserId, toSocketId, users);
//      //console.log(result, result.status);
 
//      io.to(toSocketId).emit('res-join', {
//        participantId: userId,
//        gameId: gameId,
//        nameg: result.nameg.name,
//        namep: result.namep.username,
//        message: 'success'
//      });
 
//      // console.log('res-join event emitted:', {
//      //   participantId: userId,
//      //   gameId: gameId,
//      //   nameg: result.nameg.name,
//      //   namep: result.namep.username,
//      //   message: 'success'
//      // });
//    } catch (err) {
//      io.to(toSocketId).emit('res-join', {
//        participantId: userId,
//        gameId: gameId,
//        name: '',
//        message: 'failure'
//      });
 
//      //console.error('Error in req-join handler:', err);
//    }
//  });
const deleteAllGames = async (req, res) => {
  try {
      const result = await User.deleteMany({});
      res.status(200).json({
          message: `${result.deletedCount} games deleted.`,
      });
  } catch (error) {
      res.status(500).json({
          message: 'An error occurred while deleting games.',
          error: error.message,
      });
  }
};
 app.delete('/del',deleteAllGames);
//   socket.on('join-grp',async ({toUserId,gameId,message})=>{
//    // toUserId = toUserId.replace(/^"|"$/g, '');
//    // gameId = gameId.replace(/^"|"$/g, '');
//    const toSocketId = users[toUserId];
//    const ownerId=users[userId];
//    //console.log(ownerId,toSocketId,toUserId,userId,"NOO");
//    try{
//      const result=await gameContoller.joinGame({userId:toUserId,toUserId:userId,gameId:gameId});
//      //console.log("result",result);
//      if(!result || result.status!=='success')
//        throw new Error('Couldnot join grp');
     
   
//      io.to(toSocketId).emit('join-the-quizz', { fromUserId: userId, gameId: gameId, message: 'success' });
//      io.to(ownerId).emit('joining',{fromUserId:toUserId,gameId:gameId,message:'success'});
//      //socket.broadcast.emit('remove',{gameId:gameId});
//    }catch(err){
//      io.to(toSocketId).emit('join-the-quizz',{fromUserId:userId,message:'failure'});
//      io.to(ownerId).emit('joining',{fromUserId:userId,message:'failure'});
//    }
   
   
//    //console.log('join-grp');
//   });
 
 
//   socket.on('disconnect', () => {
//    if (userId) {
//        delete users[userId];
//        //console.log(`User ${userId} disconnected`);
//    }
//    });
//  });
//console.log(process.env.MONGOURL);
mongoose
  .connect(process.env.MONGOURL,{
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("connection sucessful to database"))
  .catch((err) => console.log(err));

//rate limiter
// const limiter=ratelimit({
//   max:5000,
//   windowMs:60*60*1000,
//   message:'Too many request from this Ip'

// });
//app.use('/api',limiter);

//data sanatization against nosql query injection
app.use(mongoSanatize());//remove $ sign
 
//remove malcious html code
app.use(xss());

app.post('/messages', (req, res) => {
  const { sender, receiver, message } = req.body;
  
  const channel = `private-${receiver}`;
  //console.log(channel);
  pusher.trigger(channel, 'message', { sender, message });
  //console.log(req.body);
  res.status(200).send('Message sent');
});

app.post('/pusher/auth', (req, res) => {
  const socketId = req.body.socket_id;
  const channel = req.body.channel_name;
  //console.log('HELLO',req.body);
  const auth = pusher.authenticate(socketId, channel);
  res.send(auth);
});

//body-parser
app.use("/api/auth",authRoute);
app.use("/api/question",quesRoute);
app.use("/api/game",gameRoute);
app.use("/api/chat",chatRoute);

app.all('*',(req,res,next)=>{

next(new AppError('Cannot find this Url',404));
});

app.use(globalErrorController);

server.listen(7000,()=>console.log("server is listening"));
//module.exports= {io,users};