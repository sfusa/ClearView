const fs = require('fs');
const User = require('../models/user')
const jwt = require('jsonwebtoken');
const {getValueForNextSequence} = require('./countersController')
const {sendMail}= require('../tools/nodemailer') 
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');
const cashBalance = require('../models/cashBalance');

const signUpUser= async (req, res) => { 
    const email = fixEmail(req.body.email)
    try {
        const token = uuidv4();
        const newUserId = await getValueForNextSequence("userId");
        const newUser = new User({
            userId: newUserId,
            email,
            password: req.body.password,
            l_name: req.body.l_name,
            f_name: req.body.f_name,
            address: req.body.address,
            phone: req.body.phone,
            default_bank_acct_num: req.body.default_bank_acct_num,
            token: token
        })
        const savedUser = await newUser.save()
        sendMail(req.body.email,token,'new');
        res.status(201).json({user: 'OK'})
    } catch (err) {
        const errors = handleSignUpErrors(err)
        fs.appendFileSync('errorFile.txt', "\n usersController.signUpUser " + err.message)
        res.status(400).json({errors})
    }
}


const fixEmail = (email) => { 
	email = email.toLowerCase();   
	var arr = email.split("@");      
	var prefix = arr[0];      
	var domain = arr[1];      
	if (domain == "gmail.com") {       
		prefix = prefix.replace(/\./g, "");
		return prefix + "@" + domain;     
	}     
	return email;   
}

const loginUser= async (req, res) => { 
    const {email, password} = req.body
    const fixedEmail = fixEmail(email)
    try {
        const user = await User.login(fixedEmail, password);  // Checks active status
        const jwtToken = createJWTToken(user.userId, user.f_name, user.member_type);
        res.cookie('jwt', jwtToken, {httpOnly: true});  // Needs ms
        res.status(200).json({userId: user.userId, memberType: user.member_type})
     } catch (err) {  
            let errors = handleLoginErrors(err);
            fs.appendFileSync('errorFile.txt', "\n usersController.signUpUser " + err.message)
            res.status(400).json({errors})
    }
}


const getProfile = async (req, res) => {
    const userId = res.locals.userId;
    try {
        const user = await User.findByUserId(userId);
        return res.json(user);
    } catch (err) {
        console.log('Error:', err.code + err.message)
        fs.appendFileSync('errorFile.txt', "\n usersController.getProfile " + err.message)
    }
}


// Only save changed fields
const updateProfile= async (req, res) => { 
    const userId = res.locals.userId;
    try {
        const user = await User.findByUserId(userId);
        //user.email = req.body.email
        console.log('in updateProfile at Object.keys')
        var somethingChanged = false;
        const fieldsArray = Object.keys(req.body);
        fieldsArray.forEach(key =>{
            if (user[key] == req.body[key]) return  // no change
            // Works for password but maybe better on seperate screen
            //if ((key=='password') && (req.body[key]=='')) return  // No need because save pre hook checks if modified
            else {  // Only set changed fields
                user[key]=req.body[key]
                //console.log(key, ' ', req.body[key])
                somethingChanged = true
            }
        })
        if (somethingChanged) {
            await user.save();
        }
        return res.json({Message: 'ok'});
    } catch (err) {
        console.log('Error:', err.code + err.message)
        fs.appendFileSync('errorFile.txt', "\n usersController.updateProfile " + err.message)
    }
}

// Activate and create cash row with 0 balance
const activateUser = async (req, res) => {         
    const { email, token} = req.body
    const fixedEmail = email
    //console.log(fixedEmail)
    //console.log(token)
    try {
        const user = await User.activate(fixedEmail, token); 
        console.log(user)
        if (user) {
            var userCash = await cashBalance.findOne({userId:user.userId})
            if (!userCash) {
                const newCash = new cashBalance({userId:user.userId, balance: 0});
                userCash = await newCash.save()
            }
            if (userCash) {
                res.status(200).json({userFirstName: user.f_name})
            } else {
                res.status(400).json({Message: 'Could not instantiate customer cash.'})
            }
        } else {
            res.status(400).json({Message: 'Could not activate customer.'})
        }
     } catch (err) {
            let errors = { Error: err.message} 
            console.log(errors)
            fs.appendFileSync('errorFile.txt', "\n usersController.activateUser " + err.message)
            res.status(400).json({errors})
    }
}

const changePassword = async (req, res) => {
    const userId = res.locals.userId;
    try {
        const user = await User.findByUserId(userId)
        if (user) {
            const auth = await bcrypt.compare(req.body.pswdCurrent, user.password)
            if (auth) { 
                user.password = req.body.pswdNew;  // pre save hook will encrypt it
                await user.save();     
                res.status(201).json({Message:'Password changed successfully.'})
            } else {
                res.status(400).json({Message: 'Incorrect current password.'})
            }
        } else {
            res.status(400).json({Message: 'Could not find user.'})
        }
    } catch (error) {
        fs.appendFileSync('errorFile.txt', "\n usersController.changePassword " + error.message)
        res.status(400).json({Error: 'Could not change password. ' + error.message})
    }
}


const forgotPassword = async (req, res) => {
    const email = req.body.email;
    const fixedEmail = fixEmail(email)
    try {
        const user = await User.updateToken(fixedEmail);
        if (user) {
            res.status(201).json({Message:'Please respond to our verification email.'})
        }    
    } catch (error) {
        fs.appendFileSync('errorFile.txt', "\n usersController.forgotPassword " + error.message)
        res.status(400).json({Error: error.message})
    }
}

const resetPassword = async (req, res) => {
    console.log("in resetPassword in controller")
    const email = req.body.email;
    const fixedEmail = fixEmail(email)
    const token = req.body.token;
    const pswdNew = req.body.pswdNew;
    try {
        const user = await User.findOne({email:fixedEmail})
        if (user) {
            if (user.token == token) {
                user.password = pswdNew;  // pre save hook will encrypt it
                await user.save();     
                res.status(201).json({Message:'Password reset successfully.'})
            } else {
                res.status(400).json({Message: 'Incorrect token. Contact customer service.'})  
            }
        }
        else {
            res.status(400).json({Message: 'Could not find user.'})
        }
    } catch (error) {
        fs.appendFileSync('errorFile.txt', "\n usersController.resetPassword " + error.message)
        res.status(400).json({Error: 'Could not reset password. ' + error.message})
    }
}


const upgradeUser = async (req, res) => {
    console.log('In upgradeUser')
    const userId = res.locals.userId;
    const updateAmt = Number(-29.95)  // This number only appears once on front-end and once on back-end
    const userBalance = await cashBalance.getBalance(userId)

    if (userBalance >= -updateAmt) {
        const userType = await User.getMemberType(userId)
        if (userType == 'Basic') {
            await User.upgrade(userId)
            await cashBalance.updateCash(userId, updateAmt);
            res.status(201).json({Message: 'Congrats, you have been successfully upgraded.'})
        } else if (userType == 'Member') {
            res.status(400).json({Message: 'No need to update. You are already a member.'})
        }
    } else {
        res.status(400).json({Message: 'Not enough funds to upgrade.'})
    }
}


const logoutUser = (req, res) => { 
    res.cookie('jwt', '', {maxAge: 1})
    res.redirect('/')
}


// json web tokens
const maxAge = 3 * 24 * 60 * 60;  // 3 days in seconds
const createJWTToken = (userId, fName, memberType) => {
    return jwt.sign({userId, fName, memberType}, process.env.JWT_SECRET, {expiresIn: maxAge})
}


// Handle SignUp Errors
const handleSignUpErrors = (err) => {
    //console.log(err.message, err.code);
    let errors = { email: "\u00A0", password: '', f_name: '', l_name: '', address: '', phone: '', default_bank_acct_num: ''}
// duplicate error code
if (err.code === 11000) {
    errors.email = 'This email is already registered.';
    return errors;
}
// validation errors
    if (err.message.includes('User validation failed')) {
        Object.values(err.errors).forEach(({properties}) => {
            errors[properties.path] = properties.message;
        })
    }
    return errors;
}

// Handle Login Errors
const handleLoginErrors = (err) => {
    //console.log(err.message);
    let error;
    if (err.message.includes('Incorrect')) {
        error = {login: 'This email and password combination is not registered.'}
    } else if (err.message.includes('Inactive')) {   // Haven't activated yet
        error = {login: 'Please respond to our registration verification email.'}
    } else if (err.message.includes('Activation Failure')) {  // Email was sent over 30 days ago
        error = {login: 'Your previous email invitation has expired. Please check your email for our updated invitation.'}
    } else {
        error = {login: err.message}
    }
    return error;
}



module.exports = {signUpUser, activateUser, loginUser, logoutUser, getProfile, updateProfile, 
                    changePassword, forgotPassword, resetPassword, upgradeUser }
