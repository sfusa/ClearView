const mongoose = require('mongoose')
const bcrypt = require('bcrypt');
const { isEmail } = require('validator');

const {sendMail}= require('../tools/nodemailer')  
const { v4: uuidv4 } = require('uuid');

const userSchema = new mongoose.Schema({
    userId: {
        type: Number,
        required: true
    },
    email: {
        type: String,
        required: [true, "Email is required."],
        lowercase: true,
        validate: [isEmail, "Invalid email."],
        unique: true
    },
    password: {
        type: String,
        minlength: [6, "Minimum password length is 6 characters."],
        required: [true, "Password is required."],
        validate(value) {  // at least one number, one lowercase and one uppercase letter
            var regex = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,}/;
            if (regex.test(value)) return true; 
            else throw new Error('Password must contain at least one number, one lowercase and one uppercase letter')
        }
    },
    l_name:{
        type: String,
        minlength: [2, "Minimum last name length is 2 characters."],
        required: [true, "Last Name is required."]
    },
    f_name:{
        type: String,
        minlength: [1, "Please enter first name."],
        required: [true, "First Name is required."]
    },    
    address:{
        type: String,
        minlength: [5, "Minimum address length is 5 characters."],
        required: [true, "Address is required."]
    }, 
    phone:{
        type: String,
        minlength: [10, "Minimum phone number is 10 digits."],
        required: [true, "Phone Number is required."],
        validate: [/\d+$/, "Invalid phone number. Please enter only digits."]
    }, 
    default_bank_acct_num:{
        type: String,
        minlength: [6, "Minimum bank account length is 6 characters."],
        required: [true, "A bank account number is required."]
    }, 
    active:{
        type: Boolean,
        default: 0
    },
    member_type:{
        type: String,
        enum: ['Basic','Member'],
        default: 'Basic'
    },
    token:{
        type: String
    },    
    last_login_date: {
        type: Date,
        default: null
    }
}
 , {timestamps: true} 
)


userSchema.pre('save', async function(next){   // No arrow function, changes scope of this
    if (this.isModified('password')) {
        const salt = await bcrypt.genSalt();
        this.password = await bcrypt.hash(this.password, salt)
    }
    next()
})

// static method to login user
userSchema.statics.login = async function(email, password){
        const user = await this.findOne({email})   // this refers to User 
        if (user) {
            console.log('found user')
            const auth = await bcrypt.compare(password, user.password)
            console.log(auth);
            if (auth) {
                // Check if user has activated his account
                if (!(user.active)) {
                    // If he has not activated for 30 days, send new email with new token
                    if (! await this.validToken(user.updatedAt)) {
                        await this.updateToken(email);
                        throw Error('Activation Failure - Sending new verification email.')
                    }  // User hasn't activated his account
                    throw Error('Inactive - Please respond to our registration verification email.')
                } else {  // active, can login
                    // Update Login Date
                    const resp = await this.findOneAndUpdate({email},{last_login_date:Date.now()}, {useFindAndModify: false});
                    //  use new: true,  if want the new date. Better not because can show last login to user.
                    return user;
                }
            }
            throw Error('Incorrect password');
        }
        throw Error('Incorrect email');
}


// static method to activate user
userSchema.statics.activate = async function(email, token){
    console.log('In models - userSchema.statics.activate');
    const user = await this.findOne({email})
    if (user) {
        // Check that Token is less than 30 days old
        if (! await this.validToken(user.updatedAt))  {
            await this.updateToken(email)
            throw Error('Activation Failure - Sending new email')
        }
        if (user.token == token) {
            const updatedUser = await this.findOneAndUpdate({email, token},{active:true, updatedAt:Date.now()}, {new: true, useFindAndModify: false});
            if (updatedUser) {
                console.log('Activated User')
                return updatedUser;
            }
        }

        throw Error('Error: Could not find user and token match to activate');
    }        
    throw Error('Error: Could not find user to activate');
}


//static method to send new token
userSchema.statics.updateToken = async function(email){
    console.log('In models - userSchema.statics.updateToken');
    const token = uuidv4();
    const user = await this.findOneAndUpdate({email},{token, updatedAt:Date.now()}, {new: true, useFindAndModify: false});
    if (user) {
        //console.log('Updated Token')
        sendMail(email,token,'verify')
        return user;
    }        
    throw Error('Error: Could not find that email.');
}



// Check token sent less then 30 days ago.
userSchema.statics.validToken = function(updateDate){
    if ((Math.floor((Date.now() - updateDate)/(1000*60*60*24))) > 30) {
        return false;
    }
    return true;
}


userSchema.statics.findByUserId = async function(userId){
    const user = await this.findOne({userId})   // this refers to User
    if (user) {
        return user;
    } else {
        throw Error('Can not find user.');
    }
}


// static method to activate user
userSchema.statics.upgrade = async function(userId){
    console.log('In models - userSchema.statics.upgrade');
    const upgradedUser = await this.findOneAndUpdate({userId, member_type:'Basic'},{member_type:'Member', updatedAt:Date.now()}, {new: true, useFindAndModify: false});
    if (upgradedUser) {
        console.log('Upgraded User')
            return upgradedUser;
        }
    throw Error('Error: Could not upgrade user.')
}


userSchema.statics.getMemberType = async function(userId){
    const user = await this.findOne({userId})   // this refers to User
    if (user) {
        return user.member_type;
    } else {
        throw Error('Can not find user.');
    }
}

module.exports = mongoose.model('User', userSchema)
