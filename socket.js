const { Server } = require('socket.io');
const chatController=require("./Controller/chatController");
//const gameContoller=require('./Controller/gameController');
const User=require('./Models/user');
const Game=require('./Models/game');
const { Mongoose } = require('mongoose');
const { ObjectId } = require('mongodb');
const mongoose = require('mongoose');
let io;
const users = {};

module.exports = function(server = {}) {
    
    if (!io) {
        //console.log("Yes",io);
        if (Object.keys(server).length === 0 && server.constructor === Object) {
            console.log('Server is an empty object.');
        }
        else {
            console.log('Server has properties.');
        }
        //console.log(process.env.REACT_FRONT_END_URL);
        io = new Server(server, {
            cors: {
                origin: true,
                methods: ["GET", "POST"],
            },
        });
        //console.log("YES",Server);
        io.on("connection", async (socket) => {
           
            
             
            let userId = socket.handshake.query.userId;
            let token= socket.handshake.query.token;
            if (!userId || !token) {
                console.log('User ID or token is missing');
                socket.disconnect(true);
                return;
            }
            // console.log('Received connection:');
            // console.log('User ID:', userId);
            // //console.log('Token:', token);
            // console.log('Socket ID:', socket.id);
                //console.log("Io coonected succesfully",socket.id,userId);
      
                if(userId){
                    socket.join(userId);
                    //users[userId]=socket.id;
                }
    
            
            socket.on('req-join', async ({ toUserId,gameId, message }) => {
                toUserId = toUserId.replace(/^"|"$/g, '');
                gameId = gameId.replace(/^"|"$/g, '');
                //userId = userId.replace(/^"|"$/g, '');
               // console.log(userId);
                //const toSocketId = users[toUserId];
                

                try {
                    if(!userId)
                        throw new Error("UserId is NULL");
                    //console.log(userId,socket.id," req-join");
                    const result = await chatController.createChat({ ownerId: toUserId, userId: userId, gameId: gameId });

                    if (!result || result.status !== 'success') {
                        throw new Error('Could not join group');
                    }
                    const room = io.sockets.adapter.rooms.get(toUserId);
                    //console.log(room.size);
                    io.to(toUserId).emit('res-join', {
                        particpantId: userId,
                        gameId: gameId,
                        nameg: result.nameg.name,
                        namep: result.namep.username,
                        message: 'success'
                    });
                } catch (err) {
                   // console.log(err);
                    io.to(toUserId).emit('res-join', {
                        particpantId: userId,
                        gameId: gameId,
                        name: '',
                        message: 'failure'
                    });
                }
            });
            socket.on('join_lobby',async({user_id,game_id})=>{
                //console.log("NOOOOOOOO");
                game_id = game_id.replace(/^"|"$/g, '');
                socket.join(game_id);
                //console.log(socket);
                //console.log(game_id,user_id);
                const gameId=new mongoose.Types.ObjectId(game_id);
                const uid=new mongoose.Types.ObjectId(user_id);
            try{
                
                const username=await User.findById(uid).select('username');
                //console.log(u)
                const user=await User.findById(uid);
                //console.log(uid ,user,"NOO");
                const updatedGame = await Game.findOneAndUpdate(
                    { _id: gameId}, 
                    { $push: {participanst: uid}}, 
                    { new: true } // Return the updated document
                );
                //console.log(username,username.username,username.id);
                if(!updatedGame)
                    throw new Error('Cannot join Lobby');
                
                //console.log(updatedGame);
                io.to(game_id).emit('lobby-joining',{
                    message:'success',
                    id:username._id,
                    name:username.username
                });
                //io.to().emit('')
             }catch(err){
               // console.log(err);
                io.to(game_id).emit('lobby-joining',{
                    message:'faliure',
                });
             }
            });
            socket.on('access-granted',(data)=>{
                let user_id=data.user_id;
                let gameId=data.game_id;
                //socket.join(gameId);
                //userId=userId.replace(/^"|"$/g, '');
                //console.log("YES",data);
                //console.log(users);
                io.to(user_id).emit('join_game_lobby',{
                    message:'success',
                    gameId:gameId,
                });
            });
            socket.on('join-grp', async ({gameId }) => {
                // const toSocketId = users[toUserId];
                // const ownerId = users[userId];
                
                try {
                    const result = await chatController.joinGame({gameId: gameId });

                    if (!result || result.status !== 'success')
                        throw new Error('Could not join grp');
                    //let {p1,p2}=result.participanst;
                    for(let i=0 ;i< result.participanst.length ;i++){
                    let p1=result.participanst[0];

                    p1=p1.replace(/^"|"$/g, '');
                    
                   // console.log(p1);
                    io.to(p1).emit('joining', { userId:p2, gameId: gameId, message: 'success' });
                    
                    }
                } catch (err) {
                    //console.log(err);
                    // io.to(toSocketId).emit('join-the-quizz', { fromUserId: userId, message: 'failure' });
                    // io.to(ownerId).emit('joining', { fromUserId: userId, message: 'failure' });
                }
            });

            socket.on('disconnect', () => {
                if (userId) {
                    delete userId;
                }
            });
        });
    }
    return { io, users };
};
