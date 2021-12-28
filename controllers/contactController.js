const fs = require('fs');
const {sendMail, sendContactUsMail}= require('../tools/nodemailer') 

const sendContactInfo = async (req, res) => { 

    try {
        const name = req.body.name
        const email = req.body.email
        const topic = req.body.topic
        const msgText = req.body.message

        sendMail(req.body.email,"",'contact');  // Send confirmation to user
        sendContactUsMail(name,email,topic,msgText)  // Send email to company

        res.status(200).json({message: 'OK'})
    } catch (err) {
        console.log(err.message)
        fs.appendFileSync('errorFile.txt', "\n contactController.sendContactInfo " + err.message)
        res.json(err.message)
    }
}

module.exports = { sendContactInfo }
