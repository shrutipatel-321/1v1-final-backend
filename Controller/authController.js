const User=require('../Models/user');
const jwt=require('jsonwebtoken');
const { promisify } = require('util');
const catchAsync=require('../utils/catchAsync');
const AppError = require('../utils/error');

const signToken=id=>{
    const expiresInMilliseconds = Number(process.env.JWT_EXPIRES_IN) * 24 * 60 * 60 * 1000;

    const token=jwt.sign({id},process.env.JWT_SECRET,{
        expiresIn:expiresInMilliseconds,
    });
    return token;
};
const createToken=(user,statusCode,res)=>{
    
    const token=signToken(user._id);
    user.password=undefined;
    res.status(statusCode).json({
        status:'sucess',
        token,
        data:{
            user
        }
    });
}
const signUp=catchAsync(async(req,res,next)=>{


    //console.log(req.body);
    const newUser=await User.create({
    username:req.body.username,
    email:req.body.email,
    password:req.body.password,
    passwordConfirm:req.body.passwordConfirm
    });
    //console.log("New user created successfully:", newUser);
    
    return createToken(newUser,200,res);
    
    next();
})

const login=catchAsync(async(req,res,next)=>{
    const {email,password}=req.body;
    
    //check if email exits
    if(!email ||!password)
        return next("Please provide email and password") ;
    //check if password is correct
    

    const user=await User.findOne({email}).select('+password');
    //console.log(user);
    if(!user || !(await user.correctPassword(password,user.password))){
        //console.log(user);
      return next(new AppError("Incorrect email or password",500));
    }
    //if everyrthing is ok
    //console.log(user._id);
    return createToken(user,200,res);


})
const protect=catchAsync(async(req,res,next)=>{
    let token;
//1)get token
//console.log(req.headers,req.headers.authorization,typeof req.headers.authorization);
if(req.headers.authorization && req.headers.authorization.startsWith('Bearer')){
    token=req.headers.authorization.split(' ')[1];
}
//console.log(token);
if(!token){
    return next(new AppError("You are logged out",401));
}
//console.log(token);
//2)verify token;
const decoded = jwt.verify(token, process.env.JWT_SECRET);
//console.log(decoded);
if(!decoded){
    return next(new AppError("JWT token invalid",402));
}
//3)check if user exist
const freshUser=await User.findById(decoded.id);
if(!freshUser){
    return next(new AppError("The user no longer exist",401));
}
//4)user change password or not

//console.log(freshUser,decoded.id);
req.body.user=decoded.id;
next()
})
// {
//     "username":"Ramkrishna",
//     "email":"1234@gmail.com",
//     "password":"pasword",
//     "passwordConfirm":
// }
// {
//     "question":"abcdef",
//     "optionA":"1",
//     "optionB":"2",
//     "optionC":"3",
//     "optionD":"4"
   
    
// }
module.exports={
  signUp,
  login,
  protect
}
// eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY2NzY3ZmQwNzg4NGJhY2RmMWVkYzc0OCIsImlhdCI6MTcxOTA0MjAwMCwiZXhwIjoxNzI2ODE4MDAwfQ.RTSyGMsblJDtkRd2QB1O3J3olDjAvjCz8opP5x0xeNw