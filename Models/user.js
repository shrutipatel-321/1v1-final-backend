const mongoose=require('mongoose');
const Schema = mongoose.Schema;
const bcrypt = require('bcrypt');
const validator=require('validator');
const userSchema=new Schema({
    username:{
        type:String,
        required:[true,'A user must have username'],
        minlength:[2,'Username must be min of 2 charecters'],
        validator:validator.isAlpha,
    },
    email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    validate:[validator.isEmail,'Please provide a valid email']
      
  },
  photo:String,
  password: {
    type: String,
    required: true,
    minlength:8,
  },
  passwordConfirm:{
    type:String,
    required:[true,'Please Enter Confirm the password'],
    validate:{
        //work only for save/create
        validator:function(el){
            return el===this.password;
        },
        message:'Password doesnot match'
    }
  },
  won: {
    type: Number,
    default: 0,
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
userSchema.pre('save', async function(next) {
    //if password modeifies
    console.log("Yes");
    if (this.isModified('password') || this.isNew) {
      try {
        const salt = await bcrypt.genSalt(10); // Generate salt
        this.password = await bcrypt.hash(this.password, salt);
        console.log(this.passwordConfirm);
        this.passwordConfirm=undefined; // Hash the password with the salt
        next();
      } catch (error) {
        //console.log(error);
        next(error);
      }
    } else {
      return next();
    }
});
//instance method
userSchema.methods.correctPassword=async function(candidatePassword,userPassword){
    //this.password is not available in output
    console.log("No");
    return await bcrypt.compare(candidatePassword,userPassword);
}


const User = mongoose.model('User', userSchema);
module.exports = User;