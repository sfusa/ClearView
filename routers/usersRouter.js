var express = require('express');
var router = express.Router();
const { requireAuth } = require("../middlewares/authMiddleware");
const authController = require('../controllers/usersController') 


router.get('/signup', async (req,res) => {
    res.render('signUp', {title: 'Sign Up'});
});

router.post("/signup", authController.signUpUser)

//-----------------------------
router.get('/login', async (req,res) => {
    res.render('login', {title: 'Login'});
});

router.post("/login", authController.loginUser)

//-----------------------------
router.get('/profile', requireAuth, async (req,res) => {
    res.render('profile', {title: 'Profile'});
});

// Populates user profile data
router.get('/profile/view', requireAuth, authController.getProfile);

router.put("/profile", requireAuth, authController.updateProfile)

//------------------------------

router.get('/congratulations', (req,res) => {
    res.render('congratulations', {title: 'Welcome'});
});

//------------------------------
router.get('/activation', async (req,res) => {
    res.render('activation', {title: 'Welcome'});
});

router.put('/activation', authController.activateUser);

//------------------------------
router.get('/pswdChange', requireAuth, async (req,res) => {
    res.render('pswdChange', {title: 'Update Password'});
});

router.put('/pswdChange', requireAuth, authController.changePassword)

//------------------------------
router.get('/pswdForgot', async (req,res) => {
    res.render('pswdForgot', {title: 'Update Password'});
});

router.put('/pswdForgot', authController.forgotPassword)

//------------------------------
router.get('/pswdReset', async (req,res) => {
    res.render('pswdReset', {title: 'Update Password'});
});

router.put('/pswdReset', authController.resetPassword)

//------------------------------
router.get('/upgrade', requireAuth, async (req,res) => {
    res.render('upgrade', {title: 'Become a Member'});
});

router.get('/upgradeUser', requireAuth, authController.upgradeUser)

//------------------------------

router.get('/verify', (req,res) => {
    res.render('verify', {title: 'Verify'});
});

router.get("/logout", authController.logoutUser)


module.exports = router
