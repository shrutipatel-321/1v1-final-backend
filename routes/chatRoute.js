const express=require('express');
const chatController=require('../Controller/chatController');
const { protect } = require('../Controller/authController');
const router=express.Router();

router.get('/getnotifications/:ownerId',protect,chatController.getAllChat);


module.exports=router;