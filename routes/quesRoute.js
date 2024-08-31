const express=require('express');
const router=express.Router();
const questionController=require('../Controller/questionController');
const authController=require("../Controller/authController");

//console.log(authController);
router.post('/add',authController.protect,questionController.enterQuestion);
router.get('/getquestion',authController.protect,questionController.getAllQuestions);
router.post('/updatequestion/:id',authController.protect,questionController.updateQuestions);
router.delete('/deletequestion/:id/:index',authController.protect,questionController.deleteQuestion);
router.get('/getq/:id',authController.protect,questionController.getQuestion);
module.exports=router;