const express=require('express');
const router=express.Router();
const gameContoller=require('../Controller/gameController');
const { protect } = require('../Controller/authController');

router.post('/create-game',protect,gameContoller.createGame);
router.get('/all-game/:id',protect,gameContoller.getGame);
//router.post('/join-game',protect,gameContoller.joinGame);
router.get('/get-next/:index/:game_id/:user_id',protect,gameContoller.getQusetions);
router.post('/check-ans/:index/:game_id',protect,gameContoller.checkans);
router.post('/finishgame/:userId',protect,gameContoller.finishgame);
router.get('/getPlayed/:userId',protect,gameContoller.getplayedgames);
//router.get('/joinLobby/:game_id/:user_id',protect,gameContoller.joinLobby);
router.get('/getGame/:game_id',protect,gameContoller.getGameid);
router.get('/formGroup/:game_id',protect,gameContoller.formGroup);
router.get('/leaderboard',protect,gameContoller.leaderBoard);
module.exports=router;
